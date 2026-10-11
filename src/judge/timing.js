import { mount, clock } from './core.js';
import { limitsFor } from './settings.js';

const timeLimits = (r) => { const l = limitsFor(r); return { min: l.timeMin, max: l.timeMax }; };
const elapsed = (timer) => timer.acc + (timer.start ? Date.now() - timer.start : 0);
const mmss = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function penalties(s, r) {
  const limits = timeLimits(r);
  const prepMs = elapsed(s.prep);
  const perfMs = elapsed(s.perf);
  const seconds = Math.floor(perfMs / 1000);
  const prep = prepMs > 30000 ? 0.5 : 0;
  const early = !s.perf.start && seconds < limits.min ? limits.min - seconds : 0;
  const late = seconds > limits.max ? seconds - limits.max : 0;
  const perf = perfMs === 0 || (s.perf.start && seconds <= limits.max) ? 0 : (early + late) * 0.05;
  return { prep, perf, total: prep + perf };
}

function live(s, r) {
  const p = penalties(s, r);
  return {
    prep: clock(elapsed(s.prep)),
    perf: clock(elapsed(s.perf)),
    prepPenalty: p.prep.toFixed(2),
    perfPenalty: p.perf.toFixed(2),
    total: `${p.total > 0 ? "−" : ""}${p.total.toFixed(2)}`,
  };
}

function panel(s, id, title, hint) {
  const running = Boolean(s[id].start);
  return `<div class="timer">
    <h3>⏱ ${title}</h3>
    <p class="hint">${hint}</p>
    <div class="timer-face" data-live="${id}">0:00.0</div>
    <div class="timer-actions">
      <button class="foot-btn big" data-act="clear" data-k="${id}">↺ Reset</button>
      <button class="foot-btn big primary" data-act="toggle" data-k="${id}">${running ? '■ Stop' : '▶ Start'}</button>
    </div>
    <div class="timer-pen"><span>Deduction</span><strong data-live="${id}Penalty">0.00</strong></div>
  </div>`;
}

export default function (r) {
  const limits = timeLimits(r);
  mount(r, {
    initial: { prep: { acc: 0, start: null }, perf: { acc: 0, start: null }, undo: [] },
    view: (s) => `
      <section class="timers">
        ${panel(s, 'prep', 'PREPARATION', 'Limit: up to 0:30 (0.5 deduction if exceeded)')}
        ${panel(s, 'perf', 'PERFORMANCE', `Limit: ${mmss(limits.min)} – ${mmss(limits.max)} (0.05 / sec deduction)`)}
      </section>
      <footer class="foot">
        <div class="foot-total wide"><small>TOTAL</small><strong class="warn" data-live="total">0.00</strong></div>
        <button class="foot-btn primary big-send" data-act="send">Send</button>
      </footer>`,
    live,
    actions: {
      toggle: (s, d) => {
        const timer = s[d.k];
        if (timer.start) { timer.acc += Date.now() - timer.start; timer.start = null; } else { timer.start = Date.now(); }
        return false;
      },
      clear: (s, d) => { s[d.k] = { acc: 0, start: null }; return false; },
      send: (s, d, ctx) => {
        const p = penalties(s, r);
        ctx.send({ panel: 'timing', prepSeconds: elapsed(s.prep) / 1000, performanceSeconds: elapsed(s.perf) / 1000, deduction: p.total });
        return false;
      },
    },
  });
}
