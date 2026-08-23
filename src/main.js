const categories = [
  { id: 'jumps', label: 'Jumps', icon: '↗', accent: 'mint' },
  { id: 'balances', label: 'Balances', icon: '◒', accent: 'yellow' },
  { id: 'rotations', label: 'Rotations', icon: '⟳', accent: 'coral' },
  { id: 'risks', label: 'Risks / R', icon: 'R', accent: 'blue' },
];

const ensembleCategories = [
  { id: 'jumps', label: 'Jumps', icon: '↗', accent: 'mint', group: 'jumps' },
  { id: 'balances', label: 'Balances', icon: '◒', accent: 'yellow', group: 'balances' },
  { id: 'rotations', label: 'Rotations', icon: '⟳', accent: 'coral', group: 'rotations' },
  { id: 'mixed', label: 'DB Mixed', icon: 'M', accent: 'orange', entryCategory: 'mixed' },
  { id: 'de', label: 'DE', icon: 'E', accent: 'purple', entryCategory: 'de' },
  { id: 'risks', label: 'Risks / R', icon: 'R', accent: 'blue' },
];

const ensembleDaCategories = [
  { id: 'cc', label: 'CC', icon: 'CC', accent: 'mint' },
  { id: 'cr', label: 'CR', icon: 'CR', accent: 'yellow' },
  { id: 'multipleThrow', label: 'Multiple Throw', icon: 'C↗', accent: 'coral' },
  { id: 'multipleCatch', label: 'Multiple Catch', icon: 'C↘', accent: 'coral' },
];

const artisticPenalties = [
  { id: 'guidance', label: 'Guiding Idea and Character', values: [0.3, 0.6, 1.0], color: 'purple' },
  { id: 'body', label: 'Body Expression', values: [0.3, 0.6], color: 'mint' },
  { id: 'facial', label: 'Facial Expression', values: [0.3], color: 'orange' },
  { id: 'space', label: 'Floor Area', values: [0.3], color: 'blue' },
  { id: 'intro', label: 'Musical Introduction', values: [0.3], color: 'purple' },
  { id: 'end', label: 'Music Movement at end of exercise', values: [0.3], color: 'mint' },
  { id: 'music', label: 'Music Norms', values: [0.3], color: 'blue' },
];

const ensembleArtisticPenalties = [
  ...artisticPenalties.slice(0, 3),
  { id: 'design', label: 'Formations: Design', values: [0.3], color: 'blue' },
  { id: 'amplitude', label: 'Formations: Amplitude', values: [0.3], color: 'blue' },
  ...artisticPenalties.slice(4),
];

const state = {
  discipline: 'individual',
  mode: 'db',
  level: 'senior',
  category: 'jumps',
  entries: [],
  validated: false,
  artisticStage: 1,
  connectionCount: 0,
  rhythmCount: 0,
  interruptionUsed: false,
  danceSteps: 0,
  dynamicChanges: 0,
  contactUsed: false,
  collectiveWorks: {
    synchro: false,
    canon: false,
    choral: false,
    contrast: false,
  },
  artisticHistory: [],
  artisticPenalties: {},
};

const app = document.querySelector('#app');
const format = (value) => value.toFixed(1);

function getLimits() {
  return state.level === 'senior' ? { db: 8, risks: 4, da: 15 } : { db: 6, risks: 3, da: 12 };
}

function getScore() {
  if (state.discipline === 'ensemble') return getEnsembleDbScore();
  const limits = getLimits();
  const dbEntries = state.entries.filter((entry) => entry.category !== 'risks');
  const validDbEntries = dbEntries.filter((entry) => entry.value > 0);
  const countedDb = [...validDbEntries].sort((a, b) => b.value - a.value).slice(0, limits.db);
  const risksInChronologicalOrder = state.entries.filter((entry) => entry.category === 'risks');
  const countedRisks = risksInChronologicalOrder.slice(0, limits.risks);
  const missingGroups = categories
    .filter((category) => category.id !== 'risks')
    .filter((category) => !dbEntries.some((entry) => entry.category === category.id)).length;
  const penalty = missingGroups * 0.3;
  return {
    db: countedDb.reduce((total, entry) => total + entry.value, 0),
    risks: countedRisks.reduce((total, entry) => total + entry.value, 0),
    penalty,
    missingGroups,
    countedDb,
    countedRisks,
  };
}

function getEnsembleDbScore() {
  const minimumDb = state.level === 'senior' ? 4 : 0;
  const minimumDe = 4;
  const maximum = state.level === 'senior' ? 9 : 10;
  const dbEntries = state.entries.filter((entry) => entry.category === 'db' || entry.category === 'mixed');
  const deEntries = state.entries.filter((entry) => entry.category === 'de');
  const risks = state.entries.filter((entry) => entry.category === 'risks');
  const countedRoutine = state.entries.filter((entry) => ['db', 'mixed', 'de'].includes(entry.category)).slice(0, maximum);
  const countedDb = countedRoutine.filter((entry) => ['db', 'mixed'].includes(entry.category));
  const countedDe = countedRoutine.filter((entry) => entry.category === 'de');
  const countedRisks = risks.slice(0, 1);
  const missingGroups = ['jumps', 'balances', 'rotations'].filter((group) => !dbEntries.some((entry) => entry.group === group)).length;
  const missingDb = Math.max(0, minimumDb - dbEntries.length) > 0 ? 0.3 : 0;
  const missingDe = deEntries.length < minimumDe ? 0.3 : 0;
  return {
    db: countedDb.reduce((total, entry) => total + entry.value, 0),
    de: countedDe.reduce((total, entry) => total + entry.value, 0),
    risks: countedRisks.reduce((total, entry) => total + entry.value, 0),
    penalty: missingGroups * 0.3 + missingDb + missingDe,
    missingGroups,
    countedDb,
    countedDe,
    countedRisks,
    totalCounted: countedRoutine.length,
  };
}

function getDaScore() {
  if (state.discipline === 'ensemble') return getEnsembleDaScore();
  const limits = getLimits();
  const countedDa = state.entries.slice(0, limits.da);
  const countedAcrobatics = countedDa.filter((entry) => entry.acrobatic).slice(0, 3);
  return {
    da: countedDa.reduce((total, entry) => total + (entry.acrobatic && !countedAcrobatics.includes(entry) ? 0 : entry.value), 0),
    countedAcrobatics,
    countedDa,
  };
}

function getEnsembleDaScore() {
  const maximum = state.level === 'senior' ? 14 : 10;
  const minimumPerType = state.level === 'senior' ? 3 : 2;
  const countedDa = state.entries.filter((entry) => ['cc', 'cr', 'multipleThrow', 'multipleCatch'].includes(entry.category)).slice(0, maximum);
  const countedByType = ['cc', 'cr', 'multiple'].reduce((result, type) => {
    result[type] = countedDa.filter((entry) => entry.category === type);
    if (type === 'multiple') {
      result[type] = countedDa.filter((entry) => ['multipleThrow', 'multipleCatch'].includes(entry.category));
    }
    return result;
  }, {});
  const missingTypes = Object.values(countedByType).reduce((total, entries) => total + (entries.length < minimumPerType ? 1 : 0), 0);
  return {
    da: countedDa.reduce((total, entry) => total + entry.value, 0),
    countedDa,
    countedByType,
    penalty: missingTypes * 0.3,
    missingTypes,
    maximum,
  };
}

function getArtisticDeduction() {
  let total = 0;
  
  // Stage 1 deductions
  total += state.connectionCount * 0.1;
  total += state.rhythmCount * 0.1;
  if (state.interruptionUsed) total += 0.6;
  
  // Missing dance steps penalty
  if (state.danceSteps < 2) {
    total += (2 - state.danceSteps) * 0.3;
  }
  
  // Missing dynamic changes penalty
  const requiredDynamicChanges = state.discipline === 'ensemble' ? 4 : 2;
  if (state.dynamicChanges < requiredDynamicChanges) {
    total += (requiredDynamicChanges - state.dynamicChanges) * 0.3;
  }
  if (state.discipline === 'ensemble') {
    total += state.contactUsed ? 0.3 : 0;
    total += Object.values(state.collectiveWorks).filter((complete) => !complete).length * 0.3;
  }
  
  // Stage 2 deductions
  Object.values(state.artisticPenalties).forEach(value => {
    if (value) total += value;
  });
  
  return Math.min(total, 10); // Cap at 10
}

function renderArtisticStage1() {
  const deduction = getArtisticDeduction();
  
  return `
    <main class="shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div>
        <div class="session-meta"><span class="live-dot"></span><span>ARTISTRY</span><span class="divider"></span><span>SESSION 04</span></div>
        <div class="judge-label">JUDGE <strong>01</strong></div>
      </header>

      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>ARTISTIC</span><span class="small-index">STAGE 1 / 2</span></div>
          <div class="mode-switch" aria-label="Difficulty type">
            <button class="mode-button ${state.mode === 'db' ? 'selected' : ''}" data-mode="db">DB</button>
            <button class="mode-button ${state.mode === 'da' ? 'selected' : ''}" data-mode="da">DA</button>
            <button class="mode-button ${state.mode === 'artistic' ? 'selected' : ''}" data-mode="artistic">A</button>
            <button class="mode-button ${state.mode === 'execution' ? 'selected' : ''}" data-mode="execution">E</button>
          </div>
          <div class="discipline-switch" aria-label="Routine type"><button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button><button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button></div>
          <div class="sidebar-foot"><span class="rule"></span><span>CODE 2025—2028</span></div>
        </aside>

        <section class="content artistic-content">
          <div class="artistic-header">
            <h1>Artistry<span class="heading-slash">/</span><span class="heading-muted">During Routine</span></h1>
            <div class="artistic-score-display">
              <div class="score-label">CURRENT DEDUCTION</div>
              <div class="score">${format(deduction)}</div>
            </div>
          </div>

          <div class="artistic-stage1-panel">
            <div class="penalty-button-grid">
              <div class="penalty-group">
                <button class="penalty-counter-btn connection-btn" data-action="connection" title="Click to penalize connection">
                  <span class="label">CONNECTION</span>
                  <span class="value">${format(state.connectionCount * 0.1)}</span>
                </button>
                <span class="counter-info">${state.connectionCount} × 0.1 (max 2.0)</span>
              </div>

              <div class="penalty-group">
                <button class="penalty-counter-btn rhythm-btn" data-action="rhythm" title="Click to penalize rhythm">
                  <span class="label">RHYTHM</span>
                  <span class="value">${format(state.rhythmCount * 0.1)}</span>
                </button>
                <span class="counter-info">${state.rhythmCount} × 0.1 (max 2.0)</span>
              </div>

              <div class="penalty-group">
                <button class="penalty-counter-btn interruption-btn ${state.interruptionUsed ? 'used' : ''}" data-action="interruption" ${state.interruptionUsed ? 'disabled' : ''} title="Click to penalize interruption (once only)">
                  <span class="label">INTERRUPTION</span>
                  <span class="value">${state.interruptionUsed ? '0.6' : '0.0'}</span>
                </button>
                <span class="counter-info">${state.interruptionUsed ? 'Used' : 'Not used'}</span>
              </div>

              <div class="penalty-group">
                <button class="counter-btn dance-btn" data-action="dance-step" title="Click to count a dance step">
                  <span class="label">DANCE STEPS</span>
                  <span class="value">${state.danceSteps}</span>
                </button>
                <span class="counter-info">Required: 2 (penalty: 0.3 per missing)</span>
              </div>

              <div class="penalty-group">
                <button class="counter-btn dynamic-btn" data-action="dynamic-change" title="Click to count a dynamic change">
                  <span class="label">DYNAMIC CHANGES</span>
                  <span class="value">${state.dynamicChanges}</span>
                </button>
                <span class="counter-info">Required: ${state.discipline === 'ensemble' ? 4 : 2} (penalty: 0.3 per missing)</span>
              </div>
              ${state.discipline === 'ensemble' ? `
              <div class="penalty-group"><button class="penalty-counter-btn contact-btn ${state.contactUsed ? 'used' : ''}" data-action="contact" ${state.contactUsed ? 'disabled' : ''}><span class="label">CONTACT</span><span class="value">${state.contactUsed ? '0.3' : '0.0'}</span></button><span class="counter-info">One penalty per routine</span></div>
              ${[['synchro', 'SYNCHRONIZATION'], ['canon', 'CANON / RAPID SUCCESSION'], ['choral', 'CHORAL'], ['contrast', 'CONTRAST']].map(([id, label]) => `<div class="penalty-group"><button class="counter-btn collective-btn ${state.collectiveWorks[id] ? 'complete' : ''}" data-action="collective" data-collective="${id}"><span class="label">${label}</span><span class="value">${state.collectiveWorks[id] ? '✓' : '0.0'}</span></button><span class="counter-info">Required collective work</span></div>`).join('')}
              ` : ''}
            </div>

            <div class="action-row">
              <button class="undo-button" data-action="undo-artistic" ${state.artisticHistory.length ? '' : 'disabled'}>
                <span>↶</span> Undo
              </button>
              <button class="finish-routine-btn" data-action="finish-routine">
                Finish Routine <span>→</span>
              </button>
            </div>

            <div class="artistic-history">
              <h3>Action History</h3>
              <div class="history-items">
                ${state.artisticHistory.length ? state.artisticHistory.map((item, idx) => `
                  <div class="history-item">
                    <span class="history-idx">${idx + 1}</span>
                    <span class="history-action">${item.action}</span>
                    <span class="history-value">${item.value}</span>
                  </div>
                `).join('') : '<div class="empty-history"><span>—</span> No actions yet</div>'}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  `;
}

function renderArtisticStage2() {
  const deduction = getArtisticDeduction();
  
  return `
    <main class="shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div>
        <div class="session-meta"><span class="live-dot"></span><span>ARTISTRY</span><span class="divider"></span><span>SESSION 04</span></div>
        <div class="judge-label">JUDGE <strong>01</strong></div>
      </header>

      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>ARTISTIC</span><span class="small-index">STAGE 2 / 2</span></div>
          <div class="mode-switch" aria-label="Difficulty type">
            <button class="mode-button ${state.mode === 'db' ? 'selected' : ''}" data-mode="db">DB</button>
            <button class="mode-button ${state.mode === 'da' ? 'selected' : ''}" data-mode="da">DA</button>
            <button class="mode-button ${state.mode === 'artistic' ? 'selected' : ''}" data-mode="artistic">A</button>
            <button class="mode-button ${state.mode === 'execution' ? 'selected' : ''}" data-mode="execution">E</button>
          </div>
          <div class="discipline-switch" aria-label="Routine type"><button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button><button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button></div>
          <div class="sidebar-foot"><span class="rule"></span><span>CODE 2025—2028</span></div>
        </aside>

        <section class="content artistic-content">
          <div class="artistic-header">
            <h1>Artistry<span class="heading-slash">/</span><span class="heading-muted">After Routine</span></h1>
            <div class="artistic-score-display">
              <div class="score-label">CURRENT DEDUCTION</div>
              <div class="score">${format(deduction)}</div>
            </div>
          </div>

          <div class="artistic-stage2-panel">
            ${(state.discipline === 'ensemble' ? ensembleArtisticPenalties : artisticPenalties).map(penalty => `
              <div class="penalty-row">
                <div class="penalty-label">${penalty.label}</div>
                <div class="penalty-options">
                  ${penalty.values.map(value => `
                    <button class="penalty-option-btn penalty-${penalty.color}${state.artisticPenalties[penalty.id] === value ? ' selected' : ''}" data-penalty="${penalty.id}" data-value="${value}">
                      ${value.toFixed(1)}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}

            <div class="action-row stage2">
              <button class="cancel-btn" data-action="cancel-artistic">
                <span>←</span> Back
              </button>
              <button class="undo-button stage2" data-action="undo-stage2" ${Object.keys(state.artisticPenalties).length ? '' : 'disabled'}>
                <span>↶</span> Undo
              </button>
              <button class="finish-btn" data-action="finish-artistic">
                Finish <span>✓</span>
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  `;
}

function render() {
  if (state.mode === 'execution') {
    renderExecution();
    return;
  }
  if (state.mode === 'artistic') {
    app.innerHTML = state.artisticStage === 1 ? renderArtisticStage1() : renderArtisticStage2();
    attachArtisticEventListeners();
    return;
  }

  const score = getScore();
  const daScore = getDaScore();
  const limits = getLimits();
  const navCategories = state.mode === 'da'
    ? (state.discipline === 'ensemble' ? ensembleDaCategories : [])
    : (state.discipline === 'ensemble' ? ensembleCategories : categories);
  const activeCategory = navCategories.find((category) => category.id === state.category) || categories.find((category) => category.id === state.category) || { id: 'da', label: 'Apparatus', icon: 'D', accent: 'blue' };
  const activeEntries = state.entries.filter((entry) => entry.category === state.category);
  const values = state.mode === 'da' && state.discipline === 'ensemble' ? Array.from({ length: 10 }, (_, index) => index / 10) : state.mode === 'da' ? [0, 0.2, 0.3, 0.4] : Array.from({ length: 26 }, (_, index) => index / 10);
  const valueMaximum = state.mode === 'da' && state.discipline === 'ensemble' ? '0.9' : state.mode === 'da' ? '0.4' : '2.5';
  const panelType = state.mode === 'da' ? (state.discipline === 'ensemble' ? activeCategory.label : 'DA') : activeCategory.id === 'risks' ? 'R' : activeCategory.label;
  const displayScore = state.mode === 'da' ? Math.max(0, daScore.da - (state.discipline === 'ensemble' ? daScore.penalty : 0)) : Math.max(0, score.db + (score.de || 0) + score.risks - score.penalty);

  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div>
        <div class="session-meta"><span class="live-dot"></span><span>${state.mode === 'da' ? 'APPARATUS DIFFICULTY' : 'BODY DIFFICULTY'}</span><span class="divider"></span><span>SESSION 04</span></div>
        <div class="judge-label">JUDGE <strong>01</strong></div>
      </header>

      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>DIFFICULTY</span><span class="small-index">${state.mode === 'artistic' ? '03 / 04' : (state.mode === 'da' ? '02 / 04' : '01 / 04')}</span></div>
          <div class="mode-switch" aria-label="Difficulty type">
            <button class="mode-button ${state.mode === 'db' ? 'selected' : ''}" data-mode="db">DB</button>
            <button class="mode-button ${state.mode === 'da' ? 'selected' : ''}" data-mode="da">DA</button>
            <button class="mode-button ${state.mode === 'artistic' ? 'selected' : ''}" data-mode="artistic">A</button>
            <button class="mode-button ${state.mode === 'execution' ? 'selected' : ''}" data-mode="execution">E</button>
          </div>
          <div class="discipline-switch" aria-label="Routine type">
            <button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button>
            <button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button>
          </div>
          ${state.mode === 'artistic' ? '' : `
          <nav class="category-nav" aria-label="Difficulty categories">
            ${navCategories.map((category) => `
              <button class="category-tab ${state.category === category.id ? 'active' : ''}" data-category="${category.id}">
                <span class="category-icon ${category.accent}">${category.icon}</span>
                <span>${category.label}</span>
                <span class="tab-count">${state.entries.filter((entry) => entry.category === (category.entryCategory || category.id)).length || '—'}</span>
              </button>
            `).join('')}
          </nav>
          `}
          <div class="sidebar-foot"><span class="rule"></span><span>CODE 2025—2028</span></div>
        </aside>

        <section class="content">
          <div class="content-head">
            <div>
              <p class="eyebrow">${state.mode === 'da' ? 'APPARATUS DIFFICULTY' : (activeCategory.id === 'risks' || activeCategory.id === 'de' ? 'DIFFICULTY' : 'BODY DIFFICULTY')} <span>/</span> ${panelType.toUpperCase()}</p>
              <h1>${state.mode === 'da' ? 'Apparatus' : activeCategory.label}<span class="heading-slash">/</span><span class="heading-muted">${state.mode === 'da' ? 'DA' : (activeCategory.id === 'risks' ? 'R' : 'DB')}</span></h1>
            </div>
            <div class="level-switch" aria-label="Competition level">
              <button class="level-button ${state.level === 'junior' ? 'selected' : ''}" data-level="junior">Junior</button>
              <button class="level-button ${state.level === 'senior' ? 'selected' : ''}" data-level="senior">Senior</button>
            </div>
          </div>

          <div class="score-stage">
            <div class="score-label">CURRENT SCORE <span class="score-line"></span></div>
            <div class="score ${state.validated ? 'validated-score' : ''}">${format(displayScore)}</div>
            ${state.mode === 'da' ? `<div class="score-breakdown"><span>DA TOTAL <b>${format(daScore.da)}</b></span><span class="break-divider">−</span><span>PENALTY <b class="penalty-value">${format(state.discipline === 'ensemble' ? daScore.penalty : 0)}</b></span></div><div class="capacity-note">${daScore.countedDa.length}/${state.discipline === 'ensemble' ? daScore.maximum : limits.da} DA COUNTED</div>` : `<div class="score-breakdown"><span>DB <b>${format(score.db)}</b></span>${state.discipline === 'ensemble' ? `<span class="break-divider">+</span><span>DE <b>${format(score.de)}</b></span>` : ''}<span class="break-divider">+</span><span>R <b>${format(score.risks)}</b></span><span class="break-divider">−</span><span>PENALTY <b class="penalty-value">${format(score.penalty)}</b></span></div><div class="capacity-note">${state.discipline === 'ensemble' ? `${score.totalCounted}/9 DB + DE counted · ${score.countedRisks.length}/1 R counted` : `${score.countedDb.length}/${limits.db} DB · ${score.countedRisks.length}/${limits.risks} R counted`}</div>`}
          </div>

          <div class="input-panel">
            <div class="panel-topline"><span>SELECT ${panelType} VALUE</span><span class="value-range">0.0 <span class="range-line"></span> ${valueMaximum}</span></div>
            <div class="value-grid ${state.mode === 'da' ? 'da-grid' : 'db-grid'}">
              ${values.map((value) => `<button class="value-button ${value === 0 ? 'invalid' : ''}" data-value="${value.toFixed(1)}">${value.toFixed(1)}</button>`).join('')}
            </div>
            <div class="panel-footer"><span class="status-mark">+</span><span>Tap a value to add ${panelType} to the routine</span>${state.mode === 'da' ? `<button class="acrobatics-button ${state.entries.at(-1) && !state.entries.at(-1).acrobatic ? 'is-ready' : ''}" data-action="acrobatics" ${state.entries.length && !state.entries.at(-1).acrobatic ? '' : 'disabled'}><strong>A</strong><small>ACROBATICS</small></button>` : ''}<button class="undo-button" ${state.entries.length ? '' : 'disabled'} data-action="undo"><span>↶</span> Undo</button></div>
          </div>

          <div class="score-actions">
            <div class="validation-state ${state.validated ? 'is-validated' : ''}"><span class="validation-dot"></span>${state.validated ? 'SCORE VALIDATED' : 'SCORE NOT VALIDATED'}</div>
            <div class="action-buttons"><button class="reset-button" data-action="reset">Reset score</button><button class="validate-button" data-action="validate" ${state.entries.length ? '' : 'disabled'}>${state.validated ? 'Validated' : 'Validate score'} <span>→</span></button></div>
          </div>

          <section class="history">
            <div class="history-head"><div><p class="eyebrow">${panelType} ROUTINE LOG</p><h2>${panelType} history</h2></div><span class="entry-total">${state.entries.length.toString().padStart(2, '0')} ENTRIES</span></div>
            ${state.entries.length ? `<div class="history-list">${[...state.entries].reverse().map((entry, reverseIndex) => {
              const counted = state.mode === 'da' ? daScore.countedDa.includes(entry) : (entry.category === 'risks' ? score.countedRisks.includes(entry) : state.discipline === 'ensemble' ? score.countedDb.includes(entry) || score.countedDe.includes(entry) : score.countedDb.includes(entry));
              const category = (state.discipline === 'ensemble' ? ensembleCategories : categories).find((item) => (item.entryCategory || item.id) === entry.category);
              const entryState = entry.value === 0 ? 'INVALID' : counted ? 'COUNTED' : 'OVER LIMIT';
              const displayedValue = state.mode === 'da' && entry.acrobatic && !counted ? 0 : entry.value;
              return `<div class="history-row ${counted ? '' : 'excluded'}"><span class="history-number">${String(state.entries.length - reverseIndex).padStart(2, '0')}</span><span class="history-category">${state.mode === 'da' ? `<i class="mini-icon blue">${entry.category.toUpperCase()}</i>${entry.category.toUpperCase()}` : `<i class="mini-icon ${category.accent}">${category.icon}</i>${category.label}`}</span><strong>${format(displayedValue)}</strong><span class="history-state">${entryState}</span></div>`;
            }).join('')}</div>` : `<div class="empty-history"><span>—</span><p>Your routine log is empty.<br />Add a difficulty to begin.</p></div>`}
          </section>
        </section>
      </section>
    </main>
  `;

  app.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; render(); }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => {
    state.discipline = button.dataset.discipline;
    state.entries = [];
    state.category = state.discipline === 'ensemble' ? (state.mode === 'da' ? 'cc' : 'jumps') : 'jumps';
    state.validated = false;
    render();
  }));
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { 
    state.mode = button.dataset.mode;
    state.category = state.discipline === 'ensemble' && state.mode === 'da' ? 'cc' : 'jumps';
    state.entries = [];
    state.validated = false;
    state.artisticStage = 1;
    state.connectionCount = 0;
    state.rhythmCount = 0;
    state.interruptionUsed = false;
    state.danceSteps = 0;
    state.dynamicChanges = 0;
    state.artisticHistory = [];
    state.artisticPenalties = {};
    state.contactUsed = false;
    state.collectiveWorks = { synchro: false, canon: false, choral: false, contrast: false };
    render();
  }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { state.level = button.dataset.level; render(); }));
  app.querySelectorAll('[data-value]').forEach((button) => button.addEventListener('click', () => {
    const category = state.mode === 'da' && state.discipline === 'ensemble' ? state.category : state.mode === 'da' ? 'da' : (navCategories.find((item) => item.id === state.category)?.entryCategory || state.category);
    state.entries.push({ category, value: Number(button.dataset.value), acrobatic: false, group: activeCategory.group });
    state.validated = false;
    render();
  }));
  app.querySelector('[data-action="acrobatics"]')?.addEventListener('click', () => { const lastEntry = state.entries.at(-1); if (lastEntry) { lastEntry.acrobatic = true; state.validated = false; render(); } });
  app.querySelector('[data-action="undo"]')?.addEventListener('click', () => { state.entries.pop(); render(); });
  app.querySelector('[data-action="validate"]')?.addEventListener('click', () => { state.validated = true; render(); });
  app.querySelector('[data-action="reset"]')?.addEventListener('click', () => { state.entries = []; state.validated = false; render(); });
}

function attachArtisticEventListeners() {
  // Mode switch
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { 
    state.mode = button.dataset.mode;
    state.entries = [];
    state.validated = false;
    state.artisticStage = 1;
    state.connectionCount = 0;
    state.rhythmCount = 0;
    state.interruptionUsed = false;
    state.danceSteps = 0;
    state.dynamicChanges = 0;
    state.artisticHistory = [];
    state.artisticPenalties = {};
    state.contactUsed = false;
    state.collectiveWorks = { synchro: false, canon: false, choral: false, contrast: false };
    render();
  }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => {
    state.discipline = button.dataset.discipline;
    state.contactUsed = false;
    state.collectiveWorks = { synchro: false, canon: false, choral: false, contrast: false };
    state.artisticHistory = [];
    state.artisticPenalties = {};
    render();
  }));

  if (state.artisticStage === 1) {
    // Stage 1 event listeners
    app.querySelector('[data-action="connection"]')?.addEventListener('click', () => {
      if (state.connectionCount < 20) { // Max 2.0 / 0.1 = 20
        state.connectionCount++;
        state.artisticHistory.push({ action: 'Connection', value: '-0.1' });
        render();
      }
    });

    app.querySelector('[data-action="rhythm"]')?.addEventListener('click', () => {
      if (state.rhythmCount < 20) { // Max 2.0 / 0.1 = 20
        state.rhythmCount++;
        state.artisticHistory.push({ action: 'Rhythm', value: '-0.1' });
        render();
      }
    });

    app.querySelector('[data-action="interruption"]')?.addEventListener('click', () => {
      if (!state.interruptionUsed) {
        state.interruptionUsed = true;
        state.artisticHistory.push({ action: 'Interruption', value: '-0.6' });
        render();
      }
    });

    app.querySelector('[data-action="dance-step"]')?.addEventListener('click', () => {
      state.danceSteps++;
      state.artisticHistory.push({ action: 'Dance Step', value: `+1 (${state.danceSteps})` });
      render();
    });

    app.querySelector('[data-action="dynamic-change"]')?.addEventListener('click', () => {
      state.dynamicChanges++;
      state.artisticHistory.push({ action: 'Dynamic Change', value: `+1 (${state.dynamicChanges})` });
      render();
    });

    app.querySelector('[data-action="contact"]')?.addEventListener('click', () => {
      state.contactUsed = true;
      state.artisticHistory.push({ action: 'Contact', value: '-0.3' });
      render();
    });
    app.querySelectorAll('[data-action="collective"]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.collective;
      state.collectiveWorks[id] = !state.collectiveWorks[id];
      state.artisticHistory.push({ action: id, value: state.collectiveWorks[id] ? 'Seen' : 'Removed' });
      render();
    }));

    app.querySelector('[data-action="undo-artistic"]')?.addEventListener('click', () => {
      if (state.artisticHistory.length > 0) {
        const lastAction = state.artisticHistory.pop();
        
        if (lastAction.action === 'Connection') {
          state.connectionCount = Math.max(0, state.connectionCount - 1);
        } else if (lastAction.action === 'Rhythm') {
          state.rhythmCount = Math.max(0, state.rhythmCount - 1);
        } else if (lastAction.action === 'Interruption') {
          state.interruptionUsed = false;
        } else if (lastAction.action === 'Dance Step') {
          state.danceSteps = Math.max(0, state.danceSteps - 1);
        } else if (lastAction.action === 'Dynamic Change') {
          state.dynamicChanges = Math.max(0, state.dynamicChanges - 1);
        } else if (lastAction.action === 'Contact') {
          state.contactUsed = false;
        } else {
          const collective = Object.keys(state.collectiveWorks).find((id) => lastAction.action === id);
          if (collective) state.collectiveWorks[collective] = false;
        }
        
        render();
      }
    });

    app.querySelector('[data-action="finish-routine"]')?.addEventListener('click', () => {
      state.artisticStage = 2;
      render();
    });
  } else {
    // Stage 2 event listeners
    app.querySelectorAll('[data-penalty]').forEach((button) => {
      button.addEventListener('click', () => {
        const penaltyId = button.dataset.penalty;
        const value = parseFloat(button.dataset.value);
        
        state.artisticPenalties[penaltyId] = state.artisticPenalties[penaltyId] === value ? 0 : value;
        render();
      });
    });

    app.querySelector('[data-action="undo-stage2"]')?.addEventListener('click', () => {
      const keys = Object.keys(state.artisticPenalties);
      if (keys.length > 0) {
        const lastKey = keys[keys.length - 1];
        state.artisticPenalties[lastKey] = 0;
        render();
      }
    });

    app.querySelector('[data-action="cancel-artistic"]')?.addEventListener('click', () => {
      state.artisticStage = 1;
      render();
    });

    app.querySelector('[data-action="finish-artistic"]')?.addEventListener('click', () => {
      // Final score is calculated, can save or finalize
      alert(`Artistic Deduction: ${getArtisticDeduction().toFixed(1)}`);
      // Reset for next routine
      state.artisticStage = 1;
      state.connectionCount = 0;
      state.rhythmCount = 0;
      state.interruptionUsed = false;
      state.danceSteps = 0;
      state.dynamicChanges = 0;
      state.artisticHistory = [];
      state.artisticPenalties = {};
      state.contactUsed = false;
      state.collectiveWorks = { synchro: false, canon: false, choral: false, contrast: false };
      render();
    });
  }
}

const executionPenalties = [
  { value: 0.1, className: 'penalty-green' },
  { value: 0.3, className: 'penalty-lime' },
  { value: 0.5, className: 'penalty-blue' },
  { value: 0.7, className: 'penalty-amber' },
  { value: 1.0, className: 'penalty-red' },
];
state.executionPenalties = [];
state.executionValidated = false;

function renderExecution() {
  const total = state.executionPenalties.reduce((sum, penalty) => sum + penalty, 0);
  app.innerHTML = `
    <main class="shell execution-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div>
        <div class="session-meta"><span class="live-dot"></span><span>EXECUTION</span><span class="divider"></span><span>SESSION 04</span></div>
        <div class="judge-label">JUDGE <strong>01</strong></div>
      </header>
      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>EXECUTION</span><span class="small-index">04 / 04</span></div>
          <div class="mode-switch" aria-label="Judge screen">
            <button class="mode-button" data-mode="db">DB</button>
            <button class="mode-button" data-mode="da">DA</button>
            <button class="mode-button" data-mode="artistic">A</button>
            <button class="mode-button selected" data-mode="execution">E</button>
          </div>
          <div class="discipline-switch" aria-label="Routine type"><button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button><button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button></div>
          <div class="sidebar-foot"><span class="rule"></span><span>CODE 2025—2028</span></div>
        </aside>
        <section class="content execution-content">
          <div class="execution-kicker">CODE 2025—2028 <span>/</span> E</div>
          <div class="execution-heading">
            <div><p class="eyebrow">RHYTHMIC GYMNASTICS <span>/</span> EXECUTION</p><h1>Execution<span class="heading-slash">/</span><span class="heading-muted">Deductions</span></h1></div>
            <div class="validation-state ${state.executionValidated ? 'is-validated' : ''}"><span class="validation-dot"></span>${state.executionValidated ? 'TOTAL VALIDATED' : 'READY TO JUDGE'}</div>
          </div>
          <section class="execution-board" aria-label="Execution deductions">
          <div class="total-panel"><div class="score-label"><span class="score-line"></span>TOTAL PENALTY<span class="score-line"></span></div><div class="score ${state.executionValidated ? 'validated-score' : ''}">${format(total)}</div><div class="total-caption">${state.executionPenalties.length} ${state.executionPenalties.length === 1 ? 'deduction' : 'deductions'} recorded</div></div>
          <div class="penalty-grid">${executionPenalties.map(({ value, className }) => `<button class="execution-penalty ${className}" data-execution-penalty="${value}" ${state.executionValidated ? 'disabled' : ''}>${value.toFixed(1)}</button>`).join('')}</div>
          <div class="execution-actions"><button class="execution-secondary" data-execution-action="undo" ${state.executionPenalties.length && !state.executionValidated ? '' : 'disabled'}>↶ <span>Undo</span></button><button class="execution-secondary" data-execution-action="reset" ${state.executionPenalties.length && !state.executionValidated ? '' : 'disabled'}>Reset</button><button class="validate-button execution-validate" data-execution-action="validate" ${state.executionPenalties.length && !state.executionValidated ? '' : 'disabled'}>${state.executionValidated ? 'Validated' : 'Validate'} <span>✓</span></button></div>
          <div class="execution-log"><span class="log-label">LAST DEDUCTIONS</span><div class="log-values">${state.executionPenalties.length ? state.executionPenalties.slice(-8).reverse().map((penalty) => `<span>−${format(penalty)}</span>`).join('') : '<span class="log-empty">No deductions recorded</span>'}</div></div>
        </section>
      </section>
    </main>`;

  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.mode; render(); }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { state.discipline = button.dataset.discipline; state.executionPenalties = []; state.executionValidated = false; renderExecution(); }));
  app.querySelectorAll('[data-execution-penalty]').forEach((button) => button.addEventListener('click', () => { state.executionPenalties.push(Number(button.dataset.executionPenalty)); renderExecution(); }));
  app.querySelector('[data-execution-action="undo"]')?.addEventListener('click', () => { state.executionPenalties.pop(); renderExecution(); });
  app.querySelector('[data-execution-action="reset"]')?.addEventListener('click', () => { state.executionPenalties = []; renderExecution(); });
  app.querySelector('[data-execution-action="validate"]')?.addEventListener('click', () => { state.executionValidated = true; renderExecution(); });
}

render();
