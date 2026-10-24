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

const ROW_COLORS = { db: '#3b82f6', da: '#22c55e', artistic: '#a855f7', execution: '#06b6d4', line: '#f59e0b', timing: '#ec4899' };

function renderHome() {
  const suffix = choice.discipline === 'ensemble' ? 'Group' : 'Individual';
  const tile = (mode, code, kind) => `<a class="hp-tile" style="--k:${ROW_COLORS[mode]}" href="#/${mode}/${choice.discipline}/${choice.level}${kind === 'standard' ? '' : `/-/${kind}`}"><b>${code}</b><small>${kind === 'simple' ? 'Simple' : kind === 'expert' ? 'Expert' : 'Standard'} · ${suffix}</small></a>`;
  app.innerHTML = `<main class="hp">
    <header class="hp-head">
      <div><h1>JUDGE PANEL SELECTION</h1><p>Select a mode and open the required panel</p></div>
      <div class="hp-controls">
        ${segment('discipline', [['individual', 'Individual'], ['ensemble', 'Group']])}
        ${segment('level', [['junior', 'Juniors'], ['senior', 'Seniors'], ['custom', 'Custom']])}
      </div>
    </header>
    ${panels.map(([mode, code, title, text]) => `<section class="hp-row" style="--k:${ROW_COLORS[mode]}">
      <div class="hp-label"><strong>${code}</strong><span>${title}</span><small>${text}</small></div>
      <div class="hp-tiles">${tile(mode, code, 'standard')}${SIMPLE_MODES.includes(mode) ? tile(mode, code, 'simple') : ''}${['db', 'execution'].includes(mode) || mode === 'da' && choice.discipline === 'individual' ? tile(mode, code, 'expert') : ''}</div>
    </section>`).join('')}
    <footer class="hp-foot">
      ${choice.level === 'custom' ? `<a class="home-link" href="#/settings/${choice.discipline}">⚙ Edit custom settings</a>` : '<span></span>'}
      <a class="home-link" href="./platform.html">Competition platform →</a>
    </footer>
  </main>`;
  app.querySelectorAll('[data-discipline]').forEach((button) => button.addEventListener('click', () => { choice.discipline = button.dataset.discipline; remember(); renderHome(); }));
  app.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => { choice.level = button.dataset.level; remember(); renderHome(); }));
}

window.addEventListener('hashchange', () => location.reload());

const settingsRoute = location.hash.match(/^#\/settings\/?(individual|ensemble)?/);
if (settingsRoute) renderSettings(app, settingsRoute[1] || choice.discipline);
else if (route()) import('./judge/index.js');
else renderHome();
