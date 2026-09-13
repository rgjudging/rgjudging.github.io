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
  artisticValidated: false,
  executionPenalties: [],
  executionValidated: false,
  daFloorPenalties: 0,
  linePenalties: 0,
  manualPenalties: [],
  routineSeconds: 0,
  timerStartedAt: null,
  timerRunning: false,
  penaltiesValidated: false,
  tabStates: {},
  scoreSummaryVisible: false,
  settingsOpen: false,
  settingsReturnMode: 'db',
  customSettings: {
    individual: { db: 8, risks: 4, da: 15, danceSteps: 2, dynamicChanges: 2, minDbPerGroup: 1, timeMin: 75, timeMax: 90 },
    ensemble: { db: 4, de: 4, risks: 1, maxCollaborations: 14, minPerType: 3, danceSteps: 2, dynamicChanges: 4, timeMin: 135, timeMax: 150 },
  },
};

const app = document.querySelector('#app');
const format = (value) => value.toFixed(1);

function captureTabState() {
  return {
    category: state.category,
    entries: state.entries,
    validated: state.validated,
    artisticStage: state.artisticStage,
    connectionCount: state.connectionCount,
    rhythmCount: state.rhythmCount,
    interruptionUsed: state.interruptionUsed,
    danceSteps: state.danceSteps,
    dynamicChanges: state.dynamicChanges,
    contactUsed: state.contactUsed,
    collectiveWorks: state.collectiveWorks,
    artisticHistory: state.artisticHistory,
    artisticPenalties: state.artisticPenalties,
    artisticValidated: state.artisticValidated,
    executionPenalties: state.executionPenalties,
    executionValidated: state.executionValidated,
    daFloorPenalties: state.daFloorPenalties,
    linePenalties: state.linePenalties,
    manualPenalties: state.manualPenalties,
    routineSeconds: state.routineSeconds,
    timerStartedAt: state.timerStartedAt,
    timerRunning: state.timerRunning,
    penaltiesValidated: state.penaltiesValidated,
  };
}

function restoreTabState(tabState) {
  const defaults = {
    category: state.mode === 'da' && state.discipline === 'ensemble' ? 'cc' : 'jumps',
    entries: [], validated: false, artisticStage: 1, connectionCount: 0,
    rhythmCount: 0, interruptionUsed: false, danceSteps: 0, dynamicChanges: 0,
    contactUsed: false, collectiveWorks: { synchro: false, canon: false, choral: false, contrast: false },
    artisticHistory: [], artisticPenalties: {}, artisticValidated: false,
    executionPenalties: [], executionValidated: false,
    linePenalties: 0, manualPenalties: [], routineSeconds: 0, timerStartedAt: null, timerRunning: false, penaltiesValidated: false, daFloorPenalties: 0,
  };
  const next = { ...defaults, ...tabState };
  Object.assign(state, next);
}

function switchTab(mode, discipline = state.discipline) {
  state.tabStates[`${state.discipline}:${state.mode}`] = captureTabState();
  state.mode = mode;
  state.discipline = discipline;
  restoreTabState(state.tabStates[`${discipline}:${mode}`]);
}

function getPenaltyScore() {
  const personalizedSettings = state.level === 'personalized' ? (state.discipline === 'ensemble' ? state.customSettings.ensemble : state.customSettings.individual) : null;
  const lowerLimit = personalizedSettings ? personalizedSettings.timeMin : state.discipline === 'ensemble' ? 135 : 75;
  const upperLimit = personalizedSettings ? personalizedSettings.timeMax : state.discipline === 'ensemble' ? 150 : 90;
  const timePenalty = state.routineSeconds < lowerLimit
    ? (lowerLimit - state.routineSeconds) * 0.05
    : state.routineSeconds > upperLimit ? (state.routineSeconds - upperLimit) * 0.05 : 0;
  const line = state.linePenalties * 0.3;
  const manual = state.manualPenalties.reduce((total, value) => total + value, 0);
  return { line, manual, time: timePenalty, total: line + manual + timePenalty, lowerLimit, upperLimit };
}

function getOverallSummary() {
  const current = captureTabState();
  const currentMode = state.mode;
  const currentDiscipline = state.discipline;
  const summary = { db: 0, da: 0, artistry: 10, execution: 10, penalties: 0 };
  ['db', 'da', 'artistic', 'execution', 'penalties'].forEach((mode) => {
    const tabState = mode === currentMode && currentDiscipline === state.discipline
      ? current
      : state.tabStates[`${currentDiscipline}:${mode}`];
    if (!tabState) return;
    restoreTabState(tabState);
    if (mode === 'db') {
      const score = getScore();
      summary.db = Math.max(0, score.db + (score.de || 0) + score.risks - score.penalty);
    } else if (mode === 'da') {
      const score = getDaScore();
      summary.da = Math.max(0, score.da - (state.discipline === 'ensemble' ? score.penalty : 0));
    } else if (mode === 'artistic') {
          summary.artistry = Math.max(0, 10 - getArtisticDeduction());
    } else if (mode === 'penalties') {
      summary.penalties = getPenaltyScore().total;
    } else {
      summary.execution = Math.max(0, 10 - state.executionPenalties.reduce((total, penalty) => total + penalty, 0));
    }
  });
  state.mode = currentMode;
  state.discipline = currentDiscipline;
  restoreTabState(current);
  summary.difficulty = summary.db + summary.da;
  summary.total = Math.max(0, summary.difficulty + summary.artistry + summary.execution - summary.penalties);
  return summary;
}

function showOverallScore() {
  state.scoreSummaryVisible = true;
}

function renderScoreSummary() {
  if (!state.scoreSummaryVisible) return '';
  const summary = getOverallSummary();
  return `<section class="overall-summary" aria-label="Overall score summary">
    <div class="overall-summary-heading"><span>OVERALL SCORE</span><strong>${format(summary.total)}</strong></div>
    <div class="overall-summary-grid">
      <div><span>DIFFICULTY</span><strong>${format(summary.difficulty)}</strong><small>DB ${format(summary.db)} + DA ${format(summary.da)}</small></div>
      <div><span>ARTISTRY</span><strong>${format(summary.artistry)}</strong><small>10.0 − deductions</small></div>
      <div><span>EXECUTION</span><strong>${format(summary.execution)}</strong><small>10.0 − deductions</small></div>
      <div><span>PENALTIES</span><strong>-${format(summary.penalties)}</strong><small>Lines, manual, time</small></div>
    </div>
  </section>`;
}

function renderSettings() {
  const settings = state.discipline === 'ensemble' ? state.customSettings.ensemble : state.customSettings.individual;
  const groupSettings = state.discipline === 'ensemble';
  if (!state.settingsOpen) {
    app.innerHTML = `<main class="shell"><header class="topbar"><div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div><div class="session-meta"><span class="live-dot"></span><span>PERSONALIZED</span><span class="divider"></span><span>SESSION 04</span></div><div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div></header><section class="workspace"><aside class="sidebar"><div class="sidebar-heading"><span>LEVEL</span><span class="small-index">SETUP</span></div><div class="mode-switch"><button class="mode-button" data-mode="db">DB</button><button class="mode-button" data-mode="da">DA</button><button class="mode-button" data-mode="artistic">A</button><button class="mode-button" data-mode="execution">E</button><button class="mode-button" data-mode="penalties">P</button></div><div class="discipline-switch"><button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button><button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button></div></aside><section class="content settings-content"><div class="content-head"><div><p class="eyebrow">05 / 05 <span>/</span> PERSONALIZED</p><h1>Personalized<span class="heading-slash">/</span><span class="heading-muted">Scoring profile</span></h1></div><div class="level-switch"><button class="level-button" data-level="junior">Junior</button><button class="level-button" data-level="senior">Senior</button><button class="level-button selected" data-level="personalized">Personalized</button></div></div><p class="settings-intro">Choose a custom scoring profile for ${groupSettings ? 'Groups' : 'Individuals'}, then open Settings to edit its limits.</p><button class="validate-button" data-action="open-settings">Settings <span>→</span></button></section></section></main>`;
    bindPersonalizedEvents();
    return;
  }
  app.innerHTML = `
    <main class="shell">
      <header class="topbar"><div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div><div class="session-meta"><span class="live-dot"></span><span>SETTINGS</span><span class="divider"></span><span>SESSION 04</span></div><div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div></header>
      <section class="workspace"><aside class="sidebar"><div class="sidebar-heading"><span>LEVEL</span><span class="small-index">SETUP</span></div><div class="mode-switch" aria-label="Judge screen"><button class="mode-button" data-mode="db">DB</button><button class="mode-button" data-mode="da">DA</button><button class="mode-button" data-mode="artistic">A</button><button class="mode-button" data-mode="execution">E</button><button class="mode-button" data-mode="penalties">P</button></div><div class="discipline-switch" aria-label="Routine type"><button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button><button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button></div><div class="sidebar-foot"><span class="rule"></span><span>CODE 2025—2028</span></div></aside>
        <section class="content settings-content"><div class="content-head"><div><p class="eyebrow">05 / 05 <span>/</span> CUSTOM PARAMETERS</p><h1>Settings<span class="heading-slash">/</span><span class="heading-muted">${groupSettings ? 'Group limits' : 'Individual limits'}</span></h1></div><div class="level-switch"><button class="level-button" data-level="junior">Junior</button><button class="level-button" data-level="senior">Senior</button><button class="level-button selected" data-level="settings">Settings</button></div></div><p class="settings-intro">${groupSettings ? 'Configure DB, DE, R and collaboration requirements for Groups. Execution remains unchanged.' : 'Configure DB, R, DA and Artistic requirements for Individuals. Execution remains unchanged.'}</p><section class="settings-panel"><div class="settings-section"><span class="eyebrow">DIFFICULTY</span><div class="settings-grid">${groupSettings ? `<label>Number of DB<input type="number" min="0" max="99" value="${settings.db}" data-setting="db" /></label><label>Number of DE<input type="number" min="0" max="99" value="${settings.de}" data-setting="de" /></label><label>Number of R<input type="number" min="0" max="99" value="${settings.risks}" data-setting="risks" /></label><label>Max collaborations<input type="number" min="0" max="99" value="${settings.maxCollaborations}" data-setting="maxCollaborations" /></label><label>Minimum per type<input type="number" min="0" max="99" value="${settings.minPerType}" data-setting="minPerType" /></label>` : `<label>Number of DB<input type="number" min="0" max="99" value="${settings.db}" data-setting="db" /></label><label>Number of R<input type="number" min="0" max="99" value="${settings.risks}" data-setting="risks" /></label><label>Number of DA<input type="number" min="0" max="99" value="${settings.da}" data-setting="da" /></label><label>Minimum DB per body group<input type="number" min="0" max="99" value="${settings.minDbPerGroup}" data-setting="minDbPerGroup" /></label>`}</div></div><div class="settings-section"><span class="eyebrow">ARTISTRY</span><div class="settings-grid"><label>Dance steps<input type="number" min="0" max="99" value="${settings.danceSteps}" data-setting="danceSteps" /></label><label>Dynamic changes<input type="number" min="0" max="99" value="${settings.dynamicChanges}" data-setting="dynamicChanges" /></label></div></div><div class="settings-section"><span class="eyebrow">TIMING</span><div class="settings-grid"><label>Minimum time (seconds)<input type="number" min="0" max="999" value="${settings.timeMin}" data-setting="timeMin" /></label><label>Maximum time (seconds)<input type="number" min="0" max="999" value="${settings.timeMax}" data-setting="timeMax" /></label></div></div><div class="settings-actions"><button class="reset-button" data-action="reset-settings">Reset parameters</button><button class="validate-button" data-action="apply-settings">Apply settings <span>→</span></button></div></section></section></section>
    </main>`;
  const editorLevelButton = app.querySelector('[data-level="settings"]');
  if (editorLevelButton) {
    editorLevelButton.dataset.level = 'personalized';
    editorLevelButton.textContent = 'Personalized';
  }
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.mode; render(); }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { state.discipline = button.dataset.discipline; renderSettings(); }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { state.level = button.dataset.level; state.mode = button.dataset.level === 'personalized' ? 'personalized' : 'db'; state.settingsOpen = false; render(); }));
  app.querySelector('[data-action="apply-settings"]')?.addEventListener('click', () => { const target = state.discipline === 'ensemble' ? state.customSettings.ensemble : state.customSettings.individual; app.querySelectorAll('[data-setting]').forEach((input) => { target[input.dataset.setting] = Math.max(0, Number(input.value) || 0); }); state.mode = state.settingsReturnMode; state.settingsOpen = false; render(); });
  app.querySelector('[data-action="reset-settings"]')?.addEventListener('click', () => { state.customSettings = { individual: { db: 8, risks: 4, da: 15, danceSteps: 2, dynamicChanges: 2, minDbPerGroup: 1, timeMin: 75, timeMax: 90 }, ensemble: { db: 4, de: 4, risks: 1, maxCollaborations: 14, minPerType: 3, danceSteps: 2, dynamicChanges: 4, timeMin: 135, timeMax: 150 } }; renderSettings(); });
}

function bindPersonalizedEvents() {
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.mode; render(); }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { state.discipline = button.dataset.discipline; renderSettings(); }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { state.level = button.dataset.level; state.mode = button.dataset.level === 'personalized' ? 'personalized' : state.mode; render(); }));
  app.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => { state.settingsReturnMode = 'db'; state.settingsOpen = true; state.mode = 'settings'; renderSettings(); });
}

function getLimits() {
  if (state.level === 'personalized') return state.discipline === 'ensemble' ? state.customSettings.ensemble : state.customSettings.individual;
  return state.level === 'senior' ? { db: 8, risks: 4, da: 15 } : { db: 6, risks: 3, da: 12 };
}

function getArtisticLimits() {
  if (state.level === 'personalized') {
    const settings = state.discipline === 'ensemble' ? state.customSettings.ensemble : state.customSettings.individual;
    return { danceSteps: settings.danceSteps, dynamicChanges: settings.dynamicChanges };
  }
  return { danceSteps: 2, dynamicChanges: state.discipline === 'ensemble' ? 4 : 2 };
}

function getScore() {
  if (state.discipline === 'ensemble') return getEnsembleDbScore();
  const limits = getLimits();
  const dbEntries = state.entries.filter((entry) => entry.category !== 'risks');
  const validDbEntries = dbEntries.filter((entry) => entry.value > 0);
  const countedDb = [...validDbEntries].sort((a, b) => b.value - a.value).slice(0, limits.db);
  const risksInChronologicalOrder = state.entries.filter((entry) => entry.category === 'risks');
  const countedRisks = risksInChronologicalOrder.slice(0, limits.risks);
  const minimumPerGroup = state.level === 'personalized' ? getLimits().minDbPerGroup : 1;
  const missingGroups = categories
    .filter((category) => category.id !== 'risks')
    .filter((category) => dbEntries.filter((entry) => entry.category === category.id && entry.value > 0).length < minimumPerGroup).length;
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
  const groupSettings = state.level === 'personalized' ? state.customSettings.ensemble : null;
  const minimumDb = groupSettings ? groupSettings.db : state.level === 'senior' ? 4 : 0;
  const minimumDe = groupSettings ? groupSettings.de : 4;
  const maximum = groupSettings ? groupSettings.maxCollaborations : state.level === 'senior' ? 9 : 10;
  const dbCategories = ['jumps', 'balances', 'rotations', 'mixed'];
  const dbEntries = state.entries.filter((entry) => dbCategories.includes(entry.category));
  const deEntries = state.entries.filter((entry) => entry.category === 'de');
  const risks = state.entries.filter((entry) => entry.category === 'risks');
  const countedRoutine = state.entries.filter((entry) => dbCategories.includes(entry.category) || entry.category === 'de').slice(0, maximum);
  const countedDb = countedRoutine.filter((entry) => dbCategories.includes(entry.category));
  const countedDe = countedRoutine.filter((entry) => entry.category === 'de');
  const countedRisks = risks.slice(0, 1);
  const risksLimit = groupSettings ? groupSettings.risks : 1;
  const minimumPerGroup = groupSettings ? groupSettings.minDbPerGroup || 1 : 1;
  const missingGroups = ['jumps', 'balances', 'rotations'].filter((group) => dbEntries.filter((entry) => entry.group === group && entry.value > 0).length < minimumPerGroup).length;
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
    maximum,
    risksLimit,
  };
}

function getDaScore() {
  if (state.discipline === 'ensemble') return getEnsembleDaScore();
  const limits = getLimits();
  const countedDa = state.entries.slice(0, limits.da);
  const countedAcrobatics = countedDa.filter((entry) => entry.acrobatic).slice(0, 3);
  return {
    da: Math.max(0, countedDa.reduce((total, entry) => total + (entry.acrobatic && !countedAcrobatics.includes(entry) ? 0 : entry.value), 0) - state.daFloorPenalties * 0.3),
    countedAcrobatics,
    countedDa,
    floorPenalty: state.daFloorPenalties * 0.3,
  };
}

function getEnsembleDaScore() {
  const groupSettings = state.level === 'personalized' ? state.customSettings.ensemble : null;
  const maximum = groupSettings ? groupSettings.maxCollaborations : state.level === 'senior' ? 14 : 10;
  const minimumPerType = groupSettings ? groupSettings.minPerType : state.level === 'senior' ? 3 : 2;
  const countedDa = state.entries.filter((entry) => ['cc', 'cr', 'multipleThrow', 'multipleCatch'].includes(entry.category) && entry.value > 0).slice(0, maximum);
  const countedByType = ['cc', 'cr', 'multiple'].reduce((result, type) => {
    result[type] = countedDa.filter((entry) => entry.category === type);
    if (type === 'multiple') {
      result[type] = countedDa.filter((entry) => ['multipleThrow', 'multipleCatch'].includes(entry.category));
    }
    return result;
  }, {});
  const missingEntries = ['cc', 'cr', 'multiple'].reduce((total, type) => total + Math.max(0, minimumPerType - countedByType[type].length), 0);
  return {
    da: countedDa.reduce((total, entry) => total + entry.value, 0),
    countedDa,
    countedAcrobatics: [],
    countedByType,
    penalty: missingEntries * 0.3,
    missingEntries,
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
  const limits = getArtisticLimits();
  if (state.danceSteps < limits.danceSteps) {
    total += (limits.danceSteps - state.danceSteps) * 0.3;
  }
  
  // Missing dynamic changes penalty
  const requiredDynamicChanges = limits.dynamicChanges;
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
        <div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div>
      </header>

      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>ARTISTIC</span><span class="small-index">03 / 05 · STAGE 1 / 2</span></div>
          <div class="mode-switch" aria-label="Difficulty type">
            <button class="mode-button ${state.mode === 'db' ? 'selected' : ''}" data-mode="db">DB</button>
            <button class="mode-button ${state.mode === 'da' ? 'selected' : ''}" data-mode="da">DA</button>
            <button class="mode-button ${state.mode === 'artistic' ? 'selected' : ''}" data-mode="artistic">A</button>
            <button class="mode-button ${state.mode === 'execution' ? 'selected' : ''}" data-mode="execution">E</button>
            <button class="mode-button ${state.mode === 'penalties' ? 'selected' : ''}" data-mode="penalties">P</button>
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
          <div class="artistic-level-controls"><div class="level-switch" aria-label="Competition level"><button class="level-button ${state.level === 'junior' ? 'selected' : ''}" data-level="junior">Junior</button><button class="level-button ${state.level === 'senior' ? 'selected' : ''}" data-level="senior">Senior</button><button class="level-button ${state.level === 'personalized' ? 'selected' : ''}" data-level="personalized">Personalized</button></div>${state.level === 'personalized' ? `<button class="settings-link" data-action="open-settings">Settings <span>→</span></button>` : ''}</div>
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
              <button class="reset-button" data-action="reset-artistic">Reset score</button>
              <button class="finish-routine-btn" data-action="finish-routine">
                Finish Routine <span>→</span>
              </button>
            </div>

            <div class="artistic-history">
              <h3>Action History</h3>
              <div class="history-items">
                ${state.artisticHistory.length ? [...state.artisticHistory].reverse().map((item, idx) => `
                  <div class="history-item">
                    <span class="history-idx">${idx + 1}</span>
                    <span class="history-action">${item.action}</span>
                    <span class="history-value">${item.value}</span>
                  </div>
                `).join('') : '<div class="empty-history"><span>—</span> No actions yet</div>'}
              </div>
            </div>
          </div>
          <button class="summary-toggle" data-action="show-score-summary">${state.scoreSummaryVisible ? 'Score summary visible' : 'Show total score'} <span>→</span></button>
          ${renderScoreSummary()}
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
        <div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div>
      </header>

      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>ARTISTIC</span><span class="small-index">03 / 05 · STAGE 2 / 2</span></div>
          <div class="mode-switch" aria-label="Difficulty type">
            <button class="mode-button ${state.mode === 'db' ? 'selected' : ''}" data-mode="db">DB</button>
            <button class="mode-button ${state.mode === 'da' ? 'selected' : ''}" data-mode="da">DA</button>
            <button class="mode-button ${state.mode === 'artistic' ? 'selected' : ''}" data-mode="artistic">A</button>
            <button class="mode-button ${state.mode === 'execution' ? 'selected' : ''}" data-mode="execution">E</button>
            <button class="mode-button ${state.mode === 'penalties' ? 'selected' : ''}" data-mode="penalties">P</button>
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
          <div class="artistic-level-controls"><div class="level-switch" aria-label="Competition level"><button class="level-button ${state.level === 'junior' ? 'selected' : ''}" data-level="junior">Junior</button><button class="level-button ${state.level === 'senior' ? 'selected' : ''}" data-level="senior">Senior</button><button class="level-button ${state.level === 'personalized' ? 'selected' : ''}" data-level="personalized">Personalized</button></div>${state.level === 'personalized' ? `<button class="settings-link" data-action="open-settings">Settings <span>→</span></button>` : ''}</div>
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
                Validate score <span>✓</span>
              </button>
              <button class="reset-button" data-action="reset-artistic">Reset score</button>
            </div>
          </div>
          <button class="summary-toggle" data-action="show-score-summary">${state.scoreSummaryVisible ? 'Score summary visible' : 'Show total score'} <span>→</span></button>
          ${renderScoreSummary()}
        </section>
      </section>
    </main>
  `;
}

function render() {
  if (state.mode === 'settings') {
    renderSettings();
    return;
  }
  if (state.mode === 'penalties') {
    renderPenalties();
    return;
  }
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
  const limitedDbCategory = state.mode === 'db' && ['jumps', 'balances'].includes(activeCategory.id);
  const ensembleDaMax = state.discipline === 'ensemble' && state.mode === 'da' && state.category === 'cr' ? 0.9 : 0.4;
  const values = state.mode === 'da' && state.discipline === 'ensemble' ? Array.from({ length: Math.round(ensembleDaMax * 10) + 1 }, (_, index) => index / 10) : state.mode === 'da' ? [0, 0.2, 0.3, 0.4] : Array.from({ length: limitedDbCategory ? 9 : 26 }, (_, index) => index / 10);
  const valueMaximum = state.mode === 'da' && state.discipline === 'ensemble' ? ensembleDaMax.toFixed(1) : state.mode === 'da' ? '0.4' : limitedDbCategory ? '0.8' : '2.5';
  const panelType = state.mode === 'da' ? (state.discipline === 'ensemble' ? activeCategory.label : 'DA') : activeCategory.id === 'risks' ? 'R' : activeCategory.label;
  const displayScore = state.mode === 'da' ? Math.max(0, daScore.da - (state.discipline === 'ensemble' ? daScore.penalty : 0)) : Math.max(0, score.db + (score.de || 0) + score.risks - score.penalty);

  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div>
        <div class="session-meta"><span class="live-dot"></span><span>${state.mode === 'da' ? 'APPARATUS DIFFICULTY' : 'BODY DIFFICULTY'}</span><span class="divider"></span><span>SESSION 04</span></div>
        <div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div>
      </header>

      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>DIFFICULTY</span><span class="small-index">${state.mode === 'da' ? '02 / 05' : '01 / 05'}</span></div>
          <div class="mode-switch" aria-label="Difficulty type">
            <button class="mode-button ${state.mode === 'db' ? 'selected' : ''}" data-mode="db">DB</button>
            <button class="mode-button ${state.mode === 'da' ? 'selected' : ''}" data-mode="da">DA</button>
            <button class="mode-button ${state.mode === 'artistic' ? 'selected' : ''}" data-mode="artistic">A</button>
            <button class="mode-button ${state.mode === 'execution' ? 'selected' : ''}" data-mode="execution">E</button>
            <button class="mode-button ${state.mode === 'penalties' ? 'selected' : ''}" data-mode="penalties">P</button>
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
              <button class="level-button ${state.level === 'personalized' ? 'selected' : ''}" data-level="personalized">Personalized</button>
              ${state.level === 'personalized' ? `<button class="level-button" data-action="open-settings">Settings</button>` : ''}
            </div>
          </div>

          <div class="score-stage">
            <div class="score-label">CURRENT SCORE <span class="score-line"></span></div>
            <div class="score ${state.validated ? 'validated-score' : ''}">${format(displayScore)}</div>
            ${state.mode === 'da' ? `<div class="score-breakdown"><span>DA TOTAL <b>${format(daScore.da)}</b></span><span class="break-divider">−</span><span>PENALTY <b class="penalty-value">${format(state.discipline === 'ensemble' ? daScore.penalty : daScore.floorPenalty)}</b></span></div><div class="capacity-note">${daScore.countedDa.length}/${state.discipline === 'ensemble' ? daScore.maximum : limits.da} DA COUNTED</div>` : `<div class="score-breakdown"><span>DB <b>${format(score.db)}</b></span>${state.discipline === 'ensemble' ? `<span class="break-divider">+</span><span>DE <b>${format(score.de)}</b></span>` : ''}<span class="break-divider">+</span><span>R <b>${format(score.risks)}</b></span><span class="break-divider">−</span><span>PENALTY <b class="penalty-value">${format(score.penalty)}</b></span></div><div class="capacity-note">${state.discipline === 'ensemble' ? `${score.totalCounted}/${score.maximum} DB + DE counted · ${score.countedRisks.length}/${score.risksLimit} R counted` : `${score.countedDb.length}/${limits.db} DB · ${score.countedRisks.length}/${limits.risks} R counted`}</div>`}
          </div>
          <div class="input-panel">
            <div class="panel-topline"><span>SELECT ${panelType} VALUE</span><span class="value-range">0.0 <span class="range-line"></span> ${valueMaximum}</span></div>
            <div class="value-grid ${state.mode === 'da' ? 'da-grid' : 'db-grid'}">
              ${values.map((value) => `<button class="value-button ${value === 0 ? 'invalid' : ''}" data-value="${value.toFixed(1)}">${value.toFixed(1)}</button>`).join('')}
            </div>
            <div class="panel-footer"><span class="status-mark">+</span><span>Tap a value to add ${panelType} to the routine</span>${state.mode === 'da' ? `<button class="acrobatics-button ${state.entries.at(-1) && !state.entries.at(-1).acrobatic ? 'is-ready' : ''}" data-action="acrobatics" ${state.entries.length && !state.entries.at(-1).acrobatic ? '' : 'disabled'}><strong>A</strong><small>ACROBATICS</small></button>${state.discipline === 'individual' ? `<button class="penalty-counter-btn da-floor-penalty-btn" data-action="da-floor-penalty"><strong>0.3</strong><small>DA FLOOR PENALTY ×${state.daFloorPenalties}</small></button>` : ''}` : ''}<button class="undo-button" ${state.entries.length ? '' : 'disabled'} data-action="undo"><span>↶</span> Undo</button></div>
          </div>
          <button class="summary-toggle" data-action="show-score-summary">${state.scoreSummaryVisible ? 'Score summary visible' : 'Show total score'} <span>→</span></button>
          ${renderScoreSummary()}

          <div class="score-actions">
            <div class="validation-state ${state.validated ? 'is-validated' : ''}"><span class="validation-dot"></span>${state.validated ? 'SCORE VALIDATED' : 'SCORE NOT VALIDATED'}</div>
            <div class="action-buttons"><button class="reset-button" data-action="reset">Reset score</button><button class="validate-button" data-action="validate" ${state.entries.length ? '' : 'disabled'}>${state.validated ? 'Validated' : 'Validate score'} <span>→</span></button></div>
          </div>

          <section class="history">
            <div class="history-head"><div><p class="eyebrow">${panelType} ROUTINE LOG</p><h2>${panelType} history</h2></div><span class="entry-total">${state.entries.length.toString().padStart(2, '0')} ENTRIES</span></div>
            ${state.entries.length ? `<div class="history-list">${[...state.entries].reverse().map((entry, reverseIndex) => {
              const counted = state.mode === 'da' ? daScore.countedDa.includes(entry) && (!entry.acrobatic || daScore.countedAcrobatics.includes(entry)) : (entry.category === 'risks' ? score.countedRisks.includes(entry) : state.discipline === 'ensemble' ? score.countedDb.includes(entry) || score.countedDe.includes(entry) : score.countedDb.includes(entry));
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

  app.querySelector('[data-action="show-score-summary"]')?.addEventListener('click', () => { showOverallScore(); render(); });
  app.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; render(); }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => {
    state.discipline = button.dataset.discipline;
    state.entries = [];
    state.category = state.discipline === 'ensemble' ? (state.mode === 'da' ? 'cc' : 'jumps') : 'jumps';
    state.validated = false;
    render();
  }));
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { 
    switchTab(button.dataset.mode);
    render();
  }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { state.level = button.dataset.level; state.mode = state.mode === 'settings' ? 'db' : state.mode; state.settingsOpen = false; render(); }));
  app.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => { state.settingsReturnMode = state.mode; state.settingsOpen = true; state.mode = 'settings'; renderSettings(); });
  app.querySelectorAll('[data-value]').forEach((button) => button.addEventListener('click', () => {
    const category = state.mode === 'da' && state.discipline === 'ensemble' ? state.category : state.mode === 'da' ? 'da' : (navCategories.find((item) => item.id === state.category)?.entryCategory || state.category);
    state.entries.push({ category, value: Number(button.dataset.value), acrobatic: false, group: activeCategory.group });
    state.validated = false;
    render();
  }));
  app.querySelector('[data-action="acrobatics"]')?.addEventListener('click', () => { const lastEntry = state.entries.at(-1); if (lastEntry) { lastEntry.acrobatic = true; state.validated = false; render(); } });
  app.querySelector('[data-action="da-floor-penalty"]')?.addEventListener('click', () => { state.daFloorPenalties++; state.validated = false; render(); });
  app.querySelector('[data-action="undo"]')?.addEventListener('click', () => { state.entries.pop(); render(); });
  app.querySelector('[data-action="validate"]')?.addEventListener('click', () => { state.validated = true; showOverallScore(); render(); });
  app.querySelector('[data-action="reset"]')?.addEventListener('click', () => { state.entries = []; state.daFloorPenalties = 0; state.validated = false; render(); });
}

function attachArtisticEventListeners() {
  app.querySelector('[data-action="show-score-summary"]')?.addEventListener('click', () => { showOverallScore(); render(); });
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { state.level = button.dataset.level; render(); }));
  app.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => { state.settingsReturnMode = 'artistic'; state.settingsOpen = true; state.mode = 'settings'; renderSettings(); });
  // Mode switch
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { 
    switchTab(button.dataset.mode);
    render();
  }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => {
    switchTab(state.mode, button.dataset.discipline);
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
    app.querySelector('[data-action="reset-artistic"]')?.addEventListener('click', () => {
      state.artisticStage = 1;
      state.connectionCount = 0;
      state.rhythmCount = 0;
      state.interruptionUsed = false;
      state.danceSteps = 0;
      state.dynamicChanges = 0;
      state.contactUsed = false;
      state.collectiveWorks = { synchro: false, canon: false, choral: false, contrast: false };
      state.artisticHistory = [];
      state.artisticPenalties = {};
      state.artisticValidated = false;
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
      state.artisticValidated = true;
      showOverallScore();
      render();
    });
    app.querySelector('[data-action="reset-artistic"]')?.addEventListener('click', () => {
      state.artisticStage = 1;
      state.connectionCount = 0;
      state.rhythmCount = 0;
      state.interruptionUsed = false;
      state.danceSteps = 0;
      state.dynamicChanges = 0;
      state.contactUsed = false;
      state.collectiveWorks = { synchro: false, canon: false, choral: false, contrast: false };
      state.artisticHistory = [];
      state.artisticPenalties = {};
      state.artisticValidated = false;
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

function formatDuration(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function renderPenalties() {
  const penalties = getPenaltyScore();
  const nowSeconds = state.timerRunning && state.timerStartedAt ? Math.floor((Date.now() - state.timerStartedAt) / 1000) : state.routineSeconds;
  const timeState = nowSeconds < penalties.lowerLimit ? 'Below minimum' : nowSeconds > penalties.upperLimit ? 'Above maximum' : 'Valid duration';
  app.innerHTML = `
    <main class="shell penalties-shell">
      <header class="topbar"><div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div><div class="session-meta"><span class="live-dot"></span><span>PENALTIES</span><span class="divider"></span><span>SESSION 04</span></div><div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div></header>
      <section class="workspace"><aside class="sidebar"><div class="sidebar-heading"><span>PENALTIES</span><span class="small-index">05 / 05</span></div><div class="mode-switch" aria-label="Judge screen"><button class="mode-button" data-mode="db">DB</button><button class="mode-button" data-mode="da">DA</button><button class="mode-button" data-mode="artistic">A</button><button class="mode-button" data-mode="execution">E</button><button class="mode-button selected" data-mode="penalties">P</button></div><div class="discipline-switch" aria-label="Routine type"><button class="level-button ${state.discipline === 'individual' ? 'selected' : ''}" data-discipline="individual">Individual</button><button class="level-button ${state.discipline === 'ensemble' ? 'selected' : ''}" data-discipline="ensemble">Groups</button></div><div class="sidebar-foot"><span class="rule"></span><span>CODE 2025—2028</span></div></aside>
        <section class="content penalties-content"><div class="content-head"><div><p class="eyebrow">CODE 2025—2028 <span>/</span> PENALTIES</p><h1>Penalties<span class="heading-slash">/</span><span class="heading-muted">${state.discipline === 'ensemble' ? 'Groups' : 'Individual'}</span></h1></div></div>
          <section class="penalties-board"><div class="penalties-grid"><div class="penalty-card line-penalty-card"><span class="eyebrow">LINE PENALTIES</span><button class="penalty-counter-btn" data-penalty-action="line"><span class="value">${state.linePenalties}</span><span class="label">-0.3 EACH</span></button><span class="counter-info">Click to add one line penalty</span></div><div class="penalty-card timer-card"><span class="eyebrow">ROUTINE TIMER</span><strong class="timer-display">${formatDuration(nowSeconds)}</strong><span class="timer-range">Allowed: ${formatDuration(penalties.lowerLimit)} - ${formatDuration(penalties.upperLimit)}</span><div class="timer-actions"><button class="validate-button" data-penalty-action="timer">${state.timerRunning ? 'Stop timer' : nowSeconds ? 'Resume timer' : 'Start timer'}</button><button class="reset-button" data-penalty-action="timer-reset">Reset timer</button></div><span class="counter-info ${timeState === 'Valid duration' ? 'valid-time' : 'invalid-time'}">${timeState} · ${format(penalties.time)} penalty</span></div><div class="penalty-card manual-card"><span class="eyebrow">MANUAL PENALTY</span><div class="manual-input-row"><input type="number" min="0" step="0.05" placeholder="0.30" data-manual-input /><button class="accent-button" data-penalty-action="manual">Add</button></div><span class="counter-info">Enter any additional penalty</span></div></div><div class="penalties-total"><span>TOTAL PENALTIES</span><strong>${format(penalties.total)}</strong><small>Line ${format(penalties.line)} + Manual ${format(penalties.manual)} + Time ${format(penalties.time)}</small></div><div class="penalties-history">${state.manualPenalties.length ? state.manualPenalties.slice().reverse().map((value, index) => `<div class="history-row"><span>${String(state.manualPenalties.length - index).padStart(2, '0')}</span><span>Manual penalty</span><strong>-${format(value)}</strong></div>`).join('') : '<div class="empty-history"><span>—</span><p>No manual penalties recorded.</p></div>'}</div><div class="penalty-actions"><button class="reset-button" data-penalty-action="reset">Reset penalties</button><button class="validate-button" data-penalty-action="validate">Validate score <span>→</span></button></div></section><button class="summary-toggle" data-action="show-score-summary">${state.scoreSummaryVisible ? 'Score summary visible' : 'Show total score'} <span>→</span></button>${renderScoreSummary()}</section></section>
    </main>`;
  if (state.timerRunning) setTimeout(renderPenalties, 1000);
  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { switchTab(button.dataset.mode); render(); }));
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { switchTab(state.mode, button.dataset.discipline); render(); }));
  app.querySelector('[data-action="show-score-summary"]')?.addEventListener('click', () => { showOverallScore(); renderPenalties(); });
  app.querySelector('[data-penalty-action="line"]')?.addEventListener('click', () => { state.linePenalties++; renderPenalties(); });
  app.querySelector('[data-penalty-action="timer"]')?.addEventListener('click', () => { if (state.timerRunning) { state.routineSeconds = Math.floor((Date.now() - state.timerStartedAt) / 1000); state.timerRunning = false; state.timerStartedAt = null; } else { state.timerStartedAt = Date.now() - state.routineSeconds * 1000; state.timerRunning = true; } renderPenalties(); });
  app.querySelector('[data-penalty-action="timer-reset"]')?.addEventListener('click', () => { state.routineSeconds = 0; state.timerStartedAt = null; state.timerRunning = false; renderPenalties(); });
  app.querySelector('[data-penalty-action="manual"]')?.addEventListener('click', () => { const value = Number(app.querySelector('[data-manual-input]').value); if (value > 0) { state.manualPenalties.push(value); renderPenalties(); } });
  app.querySelector('[data-penalty-action="reset"]')?.addEventListener('click', () => { state.linePenalties = 0; state.manualPenalties = []; state.routineSeconds = 0; state.timerStartedAt = null; state.timerRunning = false; state.penaltiesValidated = false; renderPenalties(); });
  app.querySelector('[data-penalty-action="validate"]')?.addEventListener('click', () => { state.penaltiesValidated = true; showOverallScore(); renderPenalties(); });
}

state.executionPenalties = [];
state.executionValidated = false;

function renderExecution() {
  const total = state.executionPenalties.reduce((sum, penalty) => sum + penalty, 0);
  app.innerHTML = `
    <main class="shell execution-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></div>
        <div class="session-meta"><span class="live-dot"></span><span>EXECUTION</span><span class="divider"></span><span>SESSION 04</span></div>
        <div class="judge-label"><a href="./platform.html">PLATFORM</a> <strong>01</strong></div>
      </header>
      <section class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading"><span>EXECUTION</span><span class="small-index">04 / 05</span></div>
          <div class="mode-switch" aria-label="Judge screen">
            <button class="mode-button" data-mode="db">DB</button>
            <button class="mode-button" data-mode="da">DA</button>
            <button class="mode-button" data-mode="artistic">A</button>
            <button class="mode-button selected" data-mode="execution">E</button>
            <button class="mode-button" data-mode="penalties">P</button>
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
          <div class="execution-actions"><button class="execution-secondary" data-execution-action="undo" ${state.executionPenalties.length && !state.executionValidated ? '' : 'disabled'}>↶ <span>Undo</span></button><button class="execution-secondary" data-execution-action="reset" ${state.executionPenalties.length ? '' : 'disabled'}>Reset</button><button class="validate-button execution-validate" data-execution-action="validate" ${state.executionPenalties.length && !state.executionValidated ? '' : 'disabled'}>${state.executionValidated ? 'Validated' : 'Validate'} <span>✓</span></button></div>
          <div class="execution-log"><span class="log-label">DEDUCTION HISTORY</span><div class="log-values">${state.executionPenalties.length ? state.executionPenalties.slice().reverse().map((penalty, index) => `<span><strong>${String(state.executionPenalties.length - index).padStart(2, '0')}</strong> −${format(penalty)}</span>`).join('') : '<span class="log-empty">No deductions recorded</span>'}</div></div>
        </section>
        <button class="summary-toggle" data-action="show-score-summary">${state.scoreSummaryVisible ? 'Score summary visible' : 'Show total score'} <span>→</span></button>
        ${renderScoreSummary()}
      </section>
    </main>`;

  app.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { switchTab(button.dataset.mode); render(); }));
  app.querySelector('[data-action="show-score-summary"]')?.addEventListener('click', () => { showOverallScore(); render(); });
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { state.discipline = button.dataset.discipline; state.executionPenalties = []; state.executionValidated = false; renderExecution(); }));
  app.querySelectorAll('[data-execution-penalty]').forEach((button) => button.addEventListener('click', () => { state.executionPenalties.push(Number(button.dataset.executionPenalty)); renderExecution(); }));
  app.querySelector('[data-execution-action="undo"]')?.addEventListener('click', () => { state.executionPenalties.pop(); renderExecution(); });
  app.querySelector('[data-execution-action="reset"]')?.addEventListener('click', () => { state.executionPenalties = []; state.executionValidated = false; renderExecution(); });
  app.querySelector('[data-execution-action="validate"]')?.addEventListener('click', () => { state.executionValidated = true; showOverallScore(); renderExecution(); });
}

render();
