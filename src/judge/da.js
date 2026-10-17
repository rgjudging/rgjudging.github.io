import { mount, footer, range, t, uid } from './core.js';
import { icon } from './icons.js';
import { limitsFor } from './settings.js';

const BASES = {
  rope: { 2: ['circle', 'rings', 'arrowUR', 'x', 'dotLine', 'dotLineArrow', 'barDotArrow', 'arrowR'], 3: ['zigzag', 'arch', 'loopArrow', 'arrowD', 'throughBar'] },
  hoop: { 2: ['coilBase', 'circle', 'hoopBase', 'rings', 'throughBar', 'arrowR', 'arrowUR'], 3: ['coil', 'circleSlash', 'circleBar', 'arrowD'] },
  ball: { 2: ['vee', 'rings', 'arrowR', 'arrowUR'], 3: ['catchDown', 'bounceArrow', 'coil', 'arrowD'] },
  clubs: { 2: ['ringsBig', 'lineDots', 'rings', 'arrowR', 'arrowUR'], 3: ['coil', 'catchDown', 'x', 'arrowRR', 'arrowURR', 'arrowDD', 'arrowD'] },
  ribbon: { 2: ['arrowUR', 'rings', 'throughBar', 'arrowR', 'loopArrow'], 3: ['snake', 'coil', 'spiralSingle+spiralDouble', 'zigzagV', 'curveArrow', 'arrowD'], 4: ['snake'] },
};


const ENSEMBLE_TABS = [
  { id: 'cc', label: 'CC', color: '#4c9aff' },
  { id: 'multipleThrow', label: 'C↗', color: '#ff9f1c' },
  { id: 'multipleCatch', label: 'C↓', color: '#ff5fa2' },
  { id: 'cr', label: 'CR', color: '#19c37d' },
];


const entryTotal = (entry) => entry.value + (entry.combi ? 1 : 0);

function individualView(s, r) {
  const bases = BASES[r.apparatus];
  const valid = s.entries.filter((entry) => entry.valid);
  const limit = limitsFor(r).da;
  const counted = s.entries.slice(0, limit).filter((entry) => entry.valid);
  const overflow = s.entries.slice(limit).filter((entry) => entry.valid).length;
  const countedIds = new Set(counted.map((entry) => entry.id));
  const total = counted.reduce((sum, entry) => sum + entryTotal(entry), 0);
  const last = [...valid].pop();
  const chips = s.entries.map((entry) => `<button class="chip ${entry.valid ? '' : 'off'} ${countedIds.has(entry.id) || !entry.valid ? '' : 'dim'}" style="--c:#a78bfa" data-act="toggle" data-id="${entry.id}"><span>${icon(entry.glyph)}</span>${t(entryTotal(entry))}</button>`).join('');
  const panels = Object.entries(bases).map(([tenths, glyphs]) => {
    const columns = glyphs.length > 1 ? 2 : 1;
    return `<div class="da-panel" style="flex:${columns}"><label>0.${tenths}</label><div class="da-grid" style="--cols:${columns}">${glyphs.map((glyph) => `<button class="tile glyph" data-act="add" data-v="${tenths}" data-g="${glyph}">${icon(glyph)}</button>`).join('')}</div></div>`;
  }).join('');

  return `
    <section class="hist">
      <div class="hist-head"><span>MY TIMELINE</span><span>${counted.length} / ${limit}</span></div>
      <div class="chips">${chips || '<em class="empty">Add elements…</em>'}</div>
    </section>
    <section class="da-board">${panels}<button class="tile combi" data-act="combi" ${last && !last.combi ? '' : 'disabled'}><b>+0.1</b><small>COMBI</small></button></section>
    ${footer((s.undo || []).length > 0, `<div class="foot-note">${overflow ? `${overflow} over the limit, not counted` : ''}</div><div class="foot-total"><small>TOTAL</small><strong>${t(total)}</strong></div>`)}`;
}

function ensembleScore(s, r) {
  const { maxCollab, minPerType } = limitsFor(r);
  const limits = { maximum: maxCollab, minimum: minPerType };
  const counted = s.entries.filter((entry) => entry.value > 0).slice(0, limits.maximum).filter((entry) => entry.valid);
  const countedIds = new Set(counted.map((entry) => entry.id));
  const count = (ids) => counted.filter((entry) => ids.includes(entry.cat)).length;
  const types = { CC: count(['cc']), CR: count(['cr']), Multiple: count(['multipleThrow', 'multipleCatch']) };
  const missing = Object.values(types).reduce((sum, value) => sum + Math.max(0, limits.minimum - value), 0);
  const gross = counted.reduce((sum, entry) => sum + entry.value, 0);
  return { counted, countedIds, types, missing, penalty: missing * 3, total: Math.max(0, gross - missing * 3), limits };
}

function ensembleView(s, r) {
  const tab = ENSEMBLE_TABS.find((item) => item.id === s.tab) || ENSEMBLE_TABS[0];
  const result = ensembleScore(s, r);
  const labelOf = (id) => ENSEMBLE_TABS.find((item) => item.id === id).label;
  const chips = s.entries.map((entry) => `<button class="chip ${entry.valid ? '' : 'off'} ${result.countedIds.has(entry.id) || !entry.valid || entry.value === 0 ? '' : 'dim'}" style="--c:#a78bfa" data-act="toggle" data-id="${entry.id}"><span>${labelOf(entry.cat)}</span>${t(entry.value)}</button>`).join('');
  const typeNote = Object.entries(result.types).map(([name, value]) => `${name} ${value}/${result.limits.minimum}`).join(' · ');

  return `
    <section class="hist">
      <div class="hist-head"><span>MY TIMELINE</span><span>${result.counted.length} / ${result.limits.maximum}</span></div>
      <div class="chips">${chips || '<em class="empty">Add elements…</em>'}</div>
    </section>
    <nav class="tabs" style="--n:4">${ENSEMBLE_TABS.map((item) => `<button class="tab ${item.id === tab.id ? 'active' : ''}" style="--c:${item.color}" data-act="tab" data-id="${item.id}">${item.label}</button>`).join('')}</nav>
    <section class="values" style="--cols:5">${range(0, 9).map((value) => `<button class="tile" data-act="add" data-v="${value}">${t(value)}</button>`).join('')}</section>
    ${footer((s.undo || []).length > 0, `<div class="foot-note">${typeNote}${result.penalty ? ` · Missing −${t(result.penalty)}` : ''}</div><div class="foot-total"><small>TOTAL</small><strong>${t(result.total)}</strong></div>`)}`;
}

export default function (r) {
  mount(r, {
    initial: { tab: 'cc', entries: [], undo: [] },
    view: (s) => (r.discipline === 'ensemble' ? ensembleView(s, r) : individualView(s, r)),
    actions: {
      tab: (s, d) => { s.tab = d.id; return false; },
      add: (s, d) => {
        const entry = { id: uid(), value: Number(d.v), valid: true };
        if (r.discipline === 'ensemble') entry.cat = s.tab;
        else entry.glyph = d.g;
        s.entries.push(entry);
      },
      combi: (s) => {
        const last = [...s.entries].reverse().find((entry) => entry.valid);
        if (!last || last.combi) return false;
        last.combi = true;
      },
      toggle: (s, d) => { const entry = s.entries.find((item) => item.id === d.id); if (entry) entry.valid = !entry.valid; },
    },
  });
}
