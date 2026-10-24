import { mount, t, t2 } from './core.js';

const SIDES = [['gymnast', 'GYMNAST OFF AREA', '#9333ea'], ['apparatus', 'APPARATUS OFF AREA', '#06b6d4']];
const total = (s) => (s.apparatus + s.gymnast) * 3;

const side = (s, [key, text, color]) => `<div class="line-side">
  <button class="line-big" style="--k:${color}" data-act="inc" data-k="${key}"><span>${text}</span><b>${s[key]}</b><em>${s[key] ? '−' : ''}${t(s[key] * 3)}</em></button>
  <button class="line-dec" data-act="dec" data-k="${key}" ${s[key] ? '' : 'disabled'}>−</button>
</div>`;

function view(s) {
  return `
    <section class="line-split">
      ${side(s, SIDES[0])}
      <div class="center-col">
        <div class="total-card"><small>TOTAL</small><strong class="warn">${total(s) ? '−' : ''}${t2(total(s))}</strong><span>−0.3 each</span></div>
        <button class="foot-btn primary send-big" data-act="send">Send</button>
        <div class="mini-actions"><button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button><button class="foot-btn" data-act="reset">Reset</button></div>
      </div>
      ${side(s, SIDES[1])}
    </section>`;
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