export const MODES = [
  ['db', 'DB — Body Difficulty'],
  ['da', 'DA — Apparatus Difficulty'],
  ['artistic', 'A — Artistry'],
  ['execution', 'E — Execution'],
  ['line', 'Line'],
  ['timing', 'Timing'],
];

export const SIMPLE_MODES = ['db', 'da', 'artistic', 'execution'];

export const APPARATUS = {
  individual: [['hoop', 'Hoop'], ['ball', 'Ball'], ['clubs', 'Clubs'], ['ribbon', 'Ribbon'], ['rope', 'Rope']],
  ensemble: [['5-balls', '5 Balls'], ['5-hoops', '5 Hoops'], ['5-ribbons', '5 Ribbons'], ['3-hoops-4-clubs', '3 Hoops + 4 Clubs']],
};

export const t = (tenths) => (tenths / 10).toFixed(1);
export const t2 = (tenths) => (tenths / 10).toFixed(2);
export const range = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
export const uid = () => Math.random().toString(36).slice(2, 9);

export function clock(ms) {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor(total / 1000) % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${Math.floor(total / 100) % 10}`;
}

export function route() {
  const [mode, discipline, level, apparatus, variant] = location.hash.replace(/^#\//, '').split('/');
  if (!MODES.some(([id]) => id === mode)) return null;
  const safeDiscipline = discipline === 'ensemble' ? 'ensemble' : 'individual';
  const list = APPARATUS[safeDiscipline];
  return {
    mode,
    simple: variant === 'simple' && SIMPLE_MODES.includes(mode),
    discipline: safeDiscipline,
    level: level === 'senior' ? 'senior' : 'junior',
    apparatus: list.some(([id]) => id === apparatus) ? apparatus : list[0][0],
  };
}

export const routeHref = (r) => `#/${r.mode}/${r.discipline}/${r.level}/${r.apparatus}${r.simple ? '/simple' : ''}`;

export function flash(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 2200);
}

function sendResult(r, summary) {
  const results = JSON.parse(localStorage.getItem('rg-results') || '[]');
  results.push({ ...r, ...summary, sentAt: new Date().toISOString() });
  localStorage.setItem('rg-results', JSON.stringify(results));
  flash('Score sent');
}

const select = (name, options, current) => `<select data-nav="${name}" aria-label="${name}">${options.map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`).join('')}</select>`;

function shell(r, body) {
  return `<div class="screen">
    <header class="bar">
      <a class="bar-menu" href="#">← Menu</a>
      ${select('mode', MODES, r.mode)}
      ${select('discipline', [['individual', 'Individual'], ['ensemble', 'Group']], r.discipline)}
      ${select('apparatus', APPARATUS[r.discipline], r.apparatus)}
      ${select('level', [['junior', 'Juniors'], ['senior', 'Seniors']], r.level)}
      ${SIMPLE_MODES.includes(r.mode) ? select('simple', [['', 'Standard'], ['simple', 'Simple']], r.simple ? 'simple' : '') : ''}
    </header>
    ${body}
  </div>`;
}

export function mount(r, { initial, view, actions = {}, live }) {
  const key = `rg-judge:${r.mode}${r.simple ? '-simple' : ''}:${r.discipline}:${r.apparatus}`;
  let state;
  try {
    state = { ...structuredClone(initial), ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    state = structuredClone(initial);
  }
  const root = document.querySelector('#app');
  const persist = () => localStorage.setItem(key, JSON.stringify(state));
  const snapshot = () => {
    const { undo, ...rest } = state;
    return JSON.stringify(rest);
  };
  const tick = () => {
    if (!live) return;
    const values = live(state, r);
    root.querySelectorAll('[data-live]').forEach((node) => { node.textContent = values[node.dataset.live] ?? ''; });
  };
  const draw = () => {
    root.innerHTML = shell(r, view(state, r));
    tick();
  };
  const context = { r, send: (summary) => sendResult(r, summary) };

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-act]');
    if (!target || target.disabled) return;
    const name = target.dataset.act;
    if (name === 'undo') {
      const previous = (state.undo || []).pop();
      if (previous) state = { ...JSON.parse(previous), undo: state.undo };
    } else if (name === 'reset') {
      if (!confirm('Reset this panel?')) return;
      state = structuredClone(initial);
    } else if (actions[name]) {
      const before = snapshot();
      if (actions[name](state, { ...target.dataset }, context) !== false) {
        if (!state.undo) state.undo = [];
        state.undo.push(before);
        state.undo = state.undo.slice(-100);
      }
    } else {
      return;
    }
    persist();
    draw();
  });

  root.addEventListener('change', (event) => {
    if (!event.target.dataset.nav) return;
    const next = { ...r };
    root.querySelectorAll('[data-nav]').forEach((node) => { next[node.dataset.nav] = node.value; });
    next.simple = next.simple === 'simple';
    if (next.discipline !== r.discipline) next.apparatus = APPARATUS[next.discipline][0][0];
    location.hash = routeHref(next);
  });

  draw();
  setInterval(tick, 100);
}

export const footer = (undoable, middle, last = '') => `<footer class="foot">
  <button class="foot-btn" data-act="undo" ${undoable ? '' : 'disabled'}>↶ Undo</button>
  <button class="foot-btn" data-act="reset">Reset</button>
  ${middle}${last}
</footer>`;
