import { route, SIMPLE_MODES } from './judge/core.js';
import { renderSettings } from './judge/settings.js';

const panels = [
  ['db', 'DB', 'Body Difficulty', 'Jumps, balances, rotations, risks'],
  ['da', 'DA', 'Apparatus Difficulty', 'Bases, combinations, timeline'],
  ['artistic', 'A', 'Artistry', 'Character, dance steps, dynamics'],
  ['execution', 'E', 'Execution', 'Deductions by element, loss / fall'],
  ['line', 'L', 'Line', 'Apparatus and gymnast off area'],
  ['timing', 'T', 'Timing', 'Preparation and performance'],
];

const choice = { discipline: 'individual', level: 'junior', view: 'standard' };
try { Object.assign(choice, JSON.parse(localStorage.getItem('rg-home-choice') || '{}')); } catch { /* ignore */ }
const remember = () => localStorage.setItem('rg-home-choice', JSON.stringify(choice));
const app = document.querySelector('#app');

const segment = (name, options) => `<div class="segment">${options.map(([id, label]) => `<button class="${choice[name] === id ? 'selected' : ''}" data-${name}="${id}">${label}</button>`).join('')}</div>`;

function renderHome() {
  app.innerHTML = `<main class="home">
    <p class="home-brand">RG JUDGE</p>
    <h1>Choose a panel</h1>
    <div class="home-controls">
      ${segment('discipline', [['individual', 'Individual'], ['ensemble', 'Group']])}
      ${segment('level', [['junior', 'Juniors'], ['senior', 'Seniors'], ['custom', 'Custom']])}
      ${segment('view', [['standard', 'Standard'], ['simple', 'Simple']])}
    </div>
    ${choice.level === 'custom' ? `<a class="home-link" href="#/settings/${choice.discipline}">⚙ Edit custom settings</a>` : ''}
    <div class="home-grid">${panels.map(([mode, code, title, text]) => `<a class="home-card" href="#/${mode}/${choice.discipline}/${choice.level}${choice.view === 'simple' && SIMPLE_MODES.includes(mode) ? '/-/simple' : ''}"><span class="home-code">${code}</span><span><strong>${title}</strong><small>${text}</small></span></a>`).join('')}</div>
    <a class="home-link" href="./platform.html">Competition platform →</a>
  </main>`;
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { choice.discipline = button.dataset.discipline; remember(); renderHome(); }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { choice.level = button.dataset.level; remember(); renderHome(); }));
  app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { choice.view = button.dataset.view; remember(); renderHome(); }));
}

window.addEventListener('hashchange', () => location.reload());

const settingsRoute = location.hash.match(/^#\/settings\/?(individual|ensemble)?/);
if (settingsRoute) renderSettings(app, settingsRoute[1] || choice.discipline);
else if (route()) import('./judge/index.js');
else renderHome();
