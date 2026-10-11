import { route, SIMPLE_MODES } from './judge/core.js';

const panels = [
  ['db', 'DB', 'Body Difficulty', 'Jumps, balances, rotations, risks'],
  ['da', 'DA', 'Apparatus Difficulty', 'Bases, combinations, timeline'],
  ['artistic', 'A', 'Artistry', 'Character, dance steps, dynamics'],
  ['execution', 'E', 'Execution', 'Deductions by element, loss / fall'],
  ['line', 'L', 'Line', 'Apparatus and gymnast off area'],
  ['timing', 'T', 'Timing', 'Preparation and performance'],
];

const choice = { discipline: 'individual', level: 'junior', view: 'standard' };
const app = document.querySelector('#app');

const segment = (name, options) => `<div class="segment">${options.map(([id, label]) => `<button class="${choice[name] === id ? 'selected' : ''}" data-${name}="${id}">${label}</button>`).join('')}</div>`;

function renderHome() {
  app.innerHTML = `<main class="home">
    <p class="home-brand">RG JUDGE</p>
    <h1>Choose a panel</h1>
    <div class="home-controls">
      ${segment('discipline', [['individual', 'Individual'], ['ensemble', 'Group']])}
      ${segment('level', [['junior', 'Juniors'], ['senior', 'Seniors']])}
      ${segment('view', [['standard', 'Standard'], ['simple', 'Simple']])}
    </div>
    <div class="home-grid">${panels.map(([mode, code, title, text]) => `<a class="home-card" href="#/${mode}/${choice.discipline}/${choice.level}${choice.view === 'simple' && SIMPLE_MODES.includes(mode) ? '/-/simple' : ''}"><span class="home-code">${code}</span><span><strong>${title}</strong><small>${text}</small></span></a>`).join('')}</div>
    <a class="home-link" href="./platform.html">Competition platform →</a>
  </main>`;
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { choice.discipline = button.dataset.discipline; renderHome(); }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { choice.level = button.dataset.level; renderHome(); }));
  app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { choice.view = button.dataset.view; renderHome(); }));
}

window.addEventListener('hashchange', () => location.reload());

if (route()) import('./judge/index.js');
else renderHome();
