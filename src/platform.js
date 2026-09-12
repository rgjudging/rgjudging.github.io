import { getSession, isProductionConfigured, loadCompetition, signIn, signOut } from './supabase.js';

const STORAGE_KEY = 'rg-competition-platform-demo';

const seed = {
  competition: {
    name: 'European Cup · Lyon 2026',
    status: 'Live',
    date: '24 August 2026',
    venue: 'Palais des Sports, Lyon',
    discipline: 'Senior Groups',
  },
  categories: ['Groups', 'Senior', 'Qualification'],
  participants: [
    { id: 'fr-01', rank: 1, name: 'France', club: 'INSEP Paris', status: 'Scored', total: 28.45, apparatus: '5 ribbons' },
    { id: 'it-02', rank: 2, name: 'Italy', club: 'P. Ginnastica', status: 'Scored', total: 27.90, apparatus: '5 ribbons' },
    { id: 'es-03', rank: 3, name: 'Spain', club: 'Club Mabel', status: 'Judging', total: 0, apparatus: '5 ribbons' },
    { id: 'de-04', rank: 4, name: 'Germany', club: 'TSV Bayer', status: 'Waiting', total: 0, apparatus: '5 ribbons' },
    { id: 'bg-05', rank: 5, name: 'Bulgaria', club: 'Levski Sofia', status: 'Waiting', total: 0, apparatus: '5 ribbons' },
  ],
  judges: [
    { name: 'S. Martin', role: 'DB / DA', state: 'Online' },
    { name: 'A. Rossi', role: 'Artistry', state: 'Online' },
    { name: 'M. Weber', role: 'Execution', state: 'Review' },
  ],
};

const app = document.querySelector('#platform-app');
const getData = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(seed));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return JSON.parse(JSON.stringify(seed));
  }
};
const saveData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const format = (value) => Number(value).toFixed(2);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

let data = getData();
let activeView = 'overview';
let toast = '';
let session = null;
let productionError = '';
let authError = '';

function render() {
  if (isProductionConfigured && !session) {
    renderAuth();
    return;
  }
  const scored = data.participants.filter((participant) => participant.status === 'Scored');
  const completed = data.participants.filter((participant) => participant.status === 'Scored').length;
  const average = scored.length ? scored.reduce((total, participant) => total + participant.total, 0) / scored.length : 0;

  app.innerHTML = `
    <main class="platform-shell">
      <header class="platform-topbar">
        <a class="brand" href="./index.html" aria-label="Open judge demo"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></a>
        <div class="platform-title"><span class="live-dot"></span><span>COMPETITION CONTROL</span><span class="divider"></span><span>${isProductionConfigured ? 'CONNECTED WORKSPACE' : 'DEMO WORKSPACE'}</span></div>
        <div class="top-actions">${session ? `<button class="ghost-button" data-action="sign-out">Sign out</button>` : ''}${!isProductionConfigured ? '<button class="ghost-button" data-action="reset-demo">Reset demo</button>' : ''}<a class="demo-button" href="./index.html">Open judge demo <span>-></span></a></div>
      </header>
      <div class="platform-layout">
        <aside class="platform-sidebar">
          <div class="event-card">
            <span class="eyebrow">ACTIVE EVENT</span>
            <h1>${escapeHtml(data.competition.name)}</h1>
            <div class="event-meta"><span class="status-pill">${escapeHtml(data.competition.status)}</span><span>${escapeHtml(data.competition.date)}</span></div>
            <p>${escapeHtml(data.competition.venue)}</p>
          </div>
          <nav class="platform-nav" aria-label="Platform views">
            ${[['overview', 'Overview'], ['start-list', 'Start list'], ['results', 'Results'], ['publish', 'Publish']].map(([id, label]) => `<button class="platform-nav-button ${activeView === id ? 'active' : ''}" data-view="${id}"><span class="nav-index">0${['overview', 'start-list', 'results', 'publish'].indexOf(id) + 1}</span>${label}<span class="nav-arrow">-></span></button>`).join('')}
          </nav>
          <div class="sidebar-footer"><span class="rule"></span><span>${isProductionConfigured ? 'SUPABASE DATA' : 'LOCAL DEMO DATA'}</span></div>
        </aside>
        <section class="platform-main">
          ${renderView({ completed, average })}
        </section>
      </div>
      ${toast ? `<div class="toast" role="status">${escapeHtml(toast)}</div>` : ''}
    </main>
  `;
  bindEvents();
}

function renderAuth() {
  app.innerHTML = `<main class="platform-shell auth-shell"><section class="auth-card"><a class="brand" href="./index.html"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></a><span class="eyebrow">CONNECTED WORKSPACE</span><h1>Sign in to competition control.</h1><p>Use an assigned account to access competitions, judging panels and official results.</p><form data-auth-form><label>Email<input type="email" name="email" autocomplete="email" required /></label><label>Password<input type="password" name="password" autocomplete="current-password" required /></label>${authError ? `<div class="auth-error">${escapeHtml(authError)}</div>` : ''}<button class="demo-button" type="submit">Sign in <span>-></span></button></form><a class="back-link" href="./index.html">Open local judge demo</a></section></main>`;
  app.querySelector('[data-auth-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      authError = '';
      session = await signIn(formData.get('email'), formData.get('password'));
      render();
    } catch (error) {
      authError = error.message;
      renderAuth();
    }
  });
}

function renderView({ completed, average }) {
  if (activeView === 'start-list') return renderStartList();
  if (activeView === 'results') return renderResults({ completed, average });
  if (activeView === 'publish') return renderPublish({ completed });
  return renderOverview({ completed, average });
}

function viewHeader(kicker, title, description) {
  return `<div class="view-header"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p class="view-description">${description}</p></div><span class="view-date">${escapeHtml(data.competition.date)}</span></div>`;
}

function renderOverview({ completed, average }) {
  return `${viewHeader('01 / OVERVIEW', 'The competition, at a glance.', 'A single operational view for the secretariat, judges and live results desk.')}
    <div class="metric-grid">
      <article class="metric-card metric-primary"><span class="eyebrow">ROUTINES SCORED</span><strong>${completed}<small>/ ${data.participants.length}</small></strong><span class="metric-note">${data.participants.length - completed} still on the floor</span></article>
      <article class="metric-card"><span class="eyebrow">LIVE AVERAGE</span><strong>${format(average)}</strong><span class="metric-note">Scored routines only</span></article>
      <article class="metric-card"><span class="eyebrow">JUDGES ONLINE</span><strong>${data.judges.filter((judge) => judge.state === 'Online').length}<small>/ ${data.judges.length}</small></strong><span class="metric-note">One review pending</span></article>
    </div>
    <div class="content-grid">
      <section class="panel spotlight-panel"><div class="panel-heading"><div><span class="eyebrow">NOW JUDGING</span><h3>Spain</h3></div><span class="status-pill status-warm">In progress</span></div><div class="routine-meta"><span>Start no. 03</span><span>5 ribbons</span><span>Senior Groups</span></div><div class="progress-track"><span style="width: 62%"></span></div><div class="panel-footer"><span>Judges are entering scores</span><button class="text-button" data-view="results">View board <span>-></span></button></div></section>
      <section class="panel activity-panel"><div class="panel-heading"><div><span class="eyebrow">JUDGE ACTIVITY</span><h3>Desk status</h3></div><span class="live-label"><span class="live-dot"></span>LIVE</span></div>${data.judges.map((judge) => `<div class="judge-row"><span class="avatar">${judge.name.slice(0, 1)}</span><div><strong>${escapeHtml(judge.name)}</strong><small>${escapeHtml(judge.role)}</small></div><span class="judge-state ${judge.state === 'Review' ? 'review' : ''}">${escapeHtml(judge.state)}</span></div>`).join('')}</section>
    </div>
    <section class="panel next-panel"><div class="panel-heading"><div><span class="eyebrow">UP NEXT</span><h3>Start list</h3></div><button class="text-button" data-view="start-list">Open full list <span>-></span></button></div>${data.participants.slice(2, 5).map((participant) => `<div class="compact-row"><span class="row-number">${String(participant.rank).padStart(2, '0')}</span><strong>${escapeHtml(participant.name)}</strong><span>${escapeHtml(participant.club)}</span><span class="row-status">${escapeHtml(participant.status)}</span></div>`).join('')}</section>`;
}

function renderStartList() {
  return `${viewHeader('02 / START LIST', 'Every routine has a place.', 'Manage the order of passage and keep the floor moving.')}
    <section class="panel table-panel"><div class="panel-heading"><div><span class="eyebrow">${escapeHtml(data.competition.discipline)}</span><h3>${data.participants.length} entries</h3></div><button class="accent-button" data-action="add-participant">+ Add entry</button></div><div class="table-scroll"><table><thead><tr><th>Start</th><th>Country / group</th><th>Club</th><th>Apparatus</th><th>Status</th><th>Total</th></tr></thead><tbody>${data.participants.map((participant) => `<tr><td class="mono">${String(participant.rank).padStart(2, '0')}</td><td><strong>${escapeHtml(participant.name)}</strong></td><td>${escapeHtml(participant.club)}</td><td>${escapeHtml(participant.apparatus)}</td><td><span class="table-status ${participant.status.toLowerCase()}">${escapeHtml(participant.status)}</span></td><td class="mono">${participant.total ? format(participant.total) : '--'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderResults({ completed, average }) {
  return `${viewHeader('03 / RESULTS', 'Results desk.', 'Review provisional scores before making the ranking visible to the public.')}
    <div class="results-toolbar"><div class="filter-tabs"><button class="filter active">All groups</button><button class="filter">Scored only</button></div><span class="toolbar-note">Last update 14:42:08</span></div>
    <section class="panel results-panel"><div class="results-summary"><div><span class="eyebrow">PROVISIONAL RANKING</span><strong>${completed} / ${data.participants.length} <small>complete</small></strong></div><div><span class="eyebrow">CURRENT AVERAGE</span><strong>${format(average)}</strong></div><div class="results-callout"><span class="live-dot"></span>Updates are local in demo mode</div></div><div class="ranking-list">${data.participants.map((participant) => `<div class="ranking-row ${participant.status === 'Judging' ? 'current' : ''}"><span class="rank-badge">${String(participant.rank).padStart(2, '0')}</span><div class="rank-name"><strong>${escapeHtml(participant.name)}</strong><small>${escapeHtml(participant.club)}</small></div><span class="rank-status">${escapeHtml(participant.status)}</span><strong class="rank-total">${participant.total ? format(participant.total) : '--'}</strong><button class="row-action" data-action="score-participant" data-id="${participant.id}" title="Open judge demo">-></button></div>`).join('')}</div></section>`;
}

function renderPublish({ completed }) {
  const published = data.competition.status === 'Published';
  return `${viewHeader('04 / PUBLISH', 'Make the result public.', 'A deliberate release step keeps provisional scores separate from the official ranking.')}
    <section class="publish-layout"><div class="panel publish-card"><div class="publish-icon">${published ? 'OK' : '>>'}</div><span class="eyebrow">PUBLIC RESULTS PAGE</span><h3>${published ? 'Results are live.' : 'Ready when you are.'}</h3><p>${published ? 'The current ranking is marked as published in this demo workspace.' : 'Publish only after the secretariat has reviewed every completed routine.'}</p><button class="accent-button" data-action="toggle-publish">${published ? 'Unpublish results' : 'Publish results'} <span>-></span></button></div><div class="panel checklist"><div class="panel-heading"><div><span class="eyebrow">RELEASE CHECKLIST</span><h3>Before publishing</h3></div><span class="check-count">${completed}/${data.participants.length}</span></div>${[['All routines have a score', completed === data.participants.length], ['Judges have no pending review', false], ['Ranking has been checked', published]].map(([label, done]) => `<div class="check-row"><span class="check-mark ${done ? 'done' : ''}">${done ? 'OK' : '--'}</span><span>${label}</span></div>`).join('')}</div></section>`;
}

function bindEvents() {
  app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { activeView = button.dataset.view; render(); }));
  app.querySelector('[data-action="reset-demo"]')?.addEventListener('click', () => { data = JSON.parse(JSON.stringify(seed)); saveData(data); toast = 'Demo workspace reset'; render(); setTimeout(() => { toast = ''; render(); }, 2200); });
  app.querySelector('[data-action="add-participant"]')?.addEventListener('click', () => { data.participants.push({ id: `demo-${Date.now()}`, rank: data.participants.length + 1, name: 'New Group', club: 'Club to assign', status: 'Waiting', total: 0, apparatus: '5 ribbons' }); saveData(data); toast = 'New start-list entry added'; render(); });
  app.querySelector('[data-action="toggle-publish"]')?.addEventListener('click', () => { data.competition.status = data.competition.status === 'Published' ? 'Live' : 'Published'; saveData(data); render(); });
  app.querySelector('[data-action="sign-out"]')?.addEventListener('click', async () => { await signOut(); session = null; render(); });
  app.querySelectorAll('[data-action="score-participant"]').forEach((button) => button.addEventListener('click', () => { window.location.href = `./index.html?participant=${encodeURIComponent(button.dataset.id)}`; }));
}

async function boot() {
  if (isProductionConfigured) {
    try {
      session = await getSession();
      const competitionId = new URLSearchParams(window.location.search).get('competition');
      if (competitionId && session) {
        const productionData = await loadCompetition(competitionId);
        if (productionData) data = {
          competition: { name: productionData.name, status: productionData.status === 'published' ? 'Published' : productionData.status === 'live' ? 'Live' : productionData.status, date: productionData.date, venue: productionData.venue, discipline: productionData.discipline },
          categories: [],
          participants: (productionData.routines || []).map((routine) => ({ id: routine.participant_id, rank: routine.start_order, name: routine.participants?.name || 'Participant', club: routine.participants?.club || '', status: routine.status.charAt(0).toUpperCase() + routine.status.slice(1), total: routine.final_score || 0, apparatus: routine.participants?.apparatus || '' })),
          judges: (productionData.competition_judges || []).map((judge) => ({ name: judge.profiles?.display_name || 'Judge', role: judge.panel, state: 'Online' })),
        };
      }
    } catch (error) {
      productionError = error.message;
    }
  }
  try {
    render();
  } catch (error) {
    renderError(error);
  }
}

function renderError(error) {
  app.innerHTML = `<main class="platform-shell auth-shell"><section class="auth-card"><a class="brand" href="./index.html"><span class="brand-mark">RG</span><span>JUDGE<span class="brand-dot">.</span></span></a><span class="eyebrow">PLATFORM ERROR</span><h1>The platform could not load.</h1><p>${escapeHtml(error.message || 'Unknown error')}</p><a class="demo-button" href="./platform.html">Reload platform <span>-></span></a></section></main>`;
}

boot();
