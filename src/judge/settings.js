const BASE = { minDbPerGroup: 1, danceSteps: 2 };

export const PRESETS = {
  individual: {
    junior: { ...BASE, db: 6, risks: 3, da: 12, dynamics: 2, timeMin: 75, timeMax: 90 },
    senior: { ...BASE, db: 8, risks: 4, da: 15, dynamics: 2, timeMin: 75, timeMax: 90 },
  },
  ensemble: {
    junior: { ...BASE, routine: 10, db: 0, de: 4, risks: 1, maxCollab: 10, minPerType: 2, dynamics: 4, timeMin: 135, timeMax: 150 },
    senior: { ...BASE, routine: 9, db: 4, de: 4, risks: 1, maxCollab: 14, minPerType: 3, dynamics: 4, timeMin: 135, timeMax: 150 },
  },
};

export const SECTIONS = {
  individual: [
    ['Difficulty', [['db', 'Number of DB counted'], ['risks', 'Number of R counted'], ['da', 'Number of DA counted'], ['minDbPerGroup', 'Minimum DB per body group']]],
    ['Artistry', [['danceSteps', 'Dance steps'], ['dynamics', 'Dynamic changes']]],
    ['Timing', [['timeMin', 'Minimum time (seconds)'], ['timeMax', 'Maximum time (seconds)']]],
  ],
  ensemble: [
    ['Difficulty', [['routine', 'Max DB + DE counted'], ['db', 'Minimum DB'], ['de', 'Minimum DE'], ['risks', 'Number of R counted'], ['minDbPerGroup', 'Minimum DB per body group']]],
    ['Collaborations', [['maxCollab', 'Max collaborations counted'], ['minPerType', 'Minimum per type']]],
    ['Artistry', [['danceSteps', 'Dance steps'], ['dynamics', 'Dynamic changes']]],
    ['Timing', [['timeMin', 'Minimum time (seconds)'], ['timeMax', 'Maximum time (seconds)']]],
  ],
};

const STORAGE = 'rg-judge:custom-settings';
const stored = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; }
};

export const customSettings = (discipline) => ({ ...PRESETS[discipline].senior, ...(stored()[discipline] || {}) });

export function saveSettings(discipline, values) {
  localStorage.setItem(STORAGE, JSON.stringify({ ...stored(), [discipline]: values }));
}

export function resetSettings(discipline) {
  const { [discipline]: removed, ...rest } = stored();
  localStorage.setItem(STORAGE, JSON.stringify(rest));
}

export const limitsFor = (r) => (r.level === 'custom' ? customSettings(r.discipline) : PRESETS[r.discipline][r.level]);

export function renderSettings(root, discipline) {
  const values = customSettings(discipline);
  const group = discipline === 'ensemble';
  root.innerHTML = `<main class="home settings">
    <p class="home-brand">RG JUDGE</p>
    <h1>Custom settings</h1>
    <div class="home-controls"><div class="segment">
      <button class="${group ? '' : 'selected'}" data-d="individual">Individual</button>
      <button class="${group ? 'selected' : ''}" data-d="ensemble">Group</button>
    </div></div>
    <form class="settings-form">
      ${SECTIONS[discipline].map(([title, fields]) => `<section class="settings-block"><h2>${title}</h2><div class="settings-grid">${fields.map(([id, label]) => `<label>${label}<input type="number" inputmode="numeric" min="0" max="999" name="${id}" value="${values[id]}"></label>`).join('')}</div></section>`).join('')}
      <div class="settings-actions">
        <button type="button" class="foot-btn" data-reset>Reset</button>
        <button type="submit" class="foot-btn primary">Save</button>
      </div>
    </form>
    <a class="home-link" href="#">← Menu</a>
  </main>`;

  root.querySelectorAll('[data-d]').forEach((button) => button.addEventListener('click', () => { location.hash = `#/settings/${button.dataset.d}`; }));
  root.querySelector('[data-reset]').addEventListener('click', () => { resetSettings(discipline); renderSettings(root, discipline); });
  root.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const next = {};
    new FormData(event.target).forEach((value, key) => { next[key] = Math.max(0, Math.round(Number(value)) || 0); });
    saveSettings(discipline, next);
    localStorage.setItem('rg-home-choice', JSON.stringify({ ...JSON.parse(localStorage.getItem('rg-home-choice') || '{}'), level: 'custom', discipline }));
    location.hash = '';
  });
}
