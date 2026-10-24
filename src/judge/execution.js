import { mount, footer, t, t2, uid } from './core.js';

const TABS = {
  individual: [['db', 'DB', '#4c9aff'], ['da', 'DA', '#facc15'], ['r', 'R', '#c084fc'], ['s', 'S', '#fb923c']],
  ensemble: [['db', 'DB', '#4c9aff'], ['de', 'DE', '#2dd4bf'], ['dc', 'DC', '#facc15'], ['r', 'R', '#c084fc'], ['s', 'S', '#fb923c']],
};

const label = (r, id) => TABS[r.discipline].find(([key]) => key === id)?.[1] ?? id;
const sum = (s) => s.entries.filter((entry) => entry.valid).reduce((total, entry) => total + entry.v, 0);

function view(s, r) {
  const tabs = TABS[r.discipline];
  const tab = tabs.some(([id]) => id === s.tab) ? s.tab : tabs[0][0];
  const deduction = sum(s);
  const chips = s.entries.map((entry) => `<button class="chip ${entry.valid ? '' : 'off'}" style="--c:${entry.loss ? '#ef4444' : '#fb923c'}" data-act="toggle" data-id="${entry.id}"><span>${entry.loss ? 'Loss/Fall' : label(r, entry.tab)}</span>−${t(entry.v)}</button>`).join('');

  return `
    <section class="hist">
      <div class="hist-head"><span>DEDUCTIONS</span><span>${s.entries.filter((entry) => entry.valid).length} recorded</span></div>
      <div class="chips">${chips || '<em class="empty">No deductions</em>'}</div>
    </section>
    <section class="split split-exec">
      <nav class="side-tabs"><div class="tabcol">${tabs.map(([id, text, color]) => `<button class="tab ${id === tab ? 'active' : ''}" style="--c:${color}" data-act="tab" data-id="${id}">${text}</button>`).join('')}</div></nav>
      <div class="center-col">
        <div class="total-card"><small>DEDUCTION</small><strong class="warn">${t2(deduction)}</strong><span>Total ${t2(Math.max(0, 100 - deduction))}</span></div>
        <button class="foot-btn primary send-big" data-act="send">Send</button>
        <div class="mini-actions"><button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button><button class="foot-btn" data-act="reset">Reset</button></div>
      </div>
      <div class="vals-col two">
        <div class="vcol"><div class="section-label danger">Loss / Fall</div><section class="values loss" style="--cols:1">${[5, 7, 10].map((v) => `<button class="tile danger" data-act="loss" data-v="${v}">−${t(v)}</button>`).join('')}</section></div>
        <div class="vcol"><div class="section-label">Deductions</div><section class="values exec" style="--cols:1">${[1, 3, 5].map((v) => `<button class="tile" data-act="add" data-v="${v}">−${t(v)}</button>`).join('')}</section></div>
      </div>
    </section>`;
}

export default function (r) {
  mount(r, {
    initial: { tab: TABS[r.discipline][0][0], entries: [], undo: [] },
    view,
    actions: {
      tab: (s, d) => { s.tab = d.id; return false; },
      add: (s, d) => { s.entries.push({ id: uid(), tab: s.tab, v: Number(d.v), valid: true }); },
      loss: (s, d) => { s.entries.push({ id: uid(), tab: 'loss', loss: true, v: Number(d.v), valid: true }); },
      toggle: (s, d) => { const entry = s.entries.find((item) => item.id === d.id); if (entry) entry.valid = !entry.valid; },
      send: (s, d, ctx) => { ctx.send({ panel: 'execution', deduction: sum(s) / 10, score: Math.max(0, 100 - sum(s)) / 10 }); return false; },
    },
  });
}
