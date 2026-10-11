import { mount, footer, t, t2 } from './core.js';

const ROWS = [['apparatus', 'APPARATUS OFF AREA'], ['gymnast', 'GYMNAST OFF AREA']];
const total = (s) => (s.apparatus + s.gymnast) * 3;

function view(s) {
  return `
    <section class="line-board">
      ${ROWS.map(([key, text]) => `<div class="line-row">
        <div class="line-label"><strong>${text}</strong><small>−0.3 each</small></div>
        <button class="line-minus" data-act="dec" data-k="${key}" ${s[key] ? '' : 'disabled'}>−</button>
        <div class="line-count">${s[key]}</div>
        <button class="line-plus" data-act="inc" data-k="${key}">+</button>
        <div class="line-value">${s[key] ? "−" : ""}${t(s[key] * 3)}</div>
      </div>`).join('')}
    </section>
    ${footer((s.undo || []).length > 0, `<div class="foot-total wide"><small>TOTAL</small><strong class="warn">${total(s) ? "−" : ""}${t2(total(s))}</strong></div>`, '<button class="foot-btn primary" data-act="send">Send</button>')}`;
}

export default function (r) {
  mount(r, {
    initial: { apparatus: 0, gymnast: 0, undo: [] },
    view,
    actions: {
      inc: (s, d) => { s[d.k] += 1; },
      dec: (s, d) => { if (s[d.k] > 0) s[d.k] -= 1; },
      send: (s, d, ctx) => { ctx.send({ panel: 'line', deduction: total(s) / 10 }); return false; },
    },
  });
}
