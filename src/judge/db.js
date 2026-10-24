import { mount, footer, range, t, uid } from './core.js';
import { limitsFor } from './settings.js';

const TABS = {
  jumps: { label: 'Λ', chip: 'Λ', color: '#4c9aff', values: range(1, 8) },
  balances: { label: '⊤', chip: '⊤', color: '#ff9f1c', values: range(1, 8) },
  rotations: { label: '⫰', chip: '⫰', color: '#ff5fa2', values: range(1, 8) },
  risks: { label: 'R', chip: 'R', color: '#19c37d', values: range(2, 13) },
  de: { label: 'DE', chip: 'DE', color: '#2dd4bf', values: range(2, 13) },
};
const ORDER = { individual: ['jumps', 'balances', 'rotations', 'risks'], ensemble: ['jumps', 'balances', 'rotations', 'risks', 'de'] };

const GROUPS = ['jumps', 'balances', 'rotations'];
const GROUP_NAMES = { jumps: 'Jumps', balances: 'Balances', rotations: 'Rotations' };

export const entryValue = (entry) => entry.value + (entry.extra || 0);

export function score(s, r) {
  const valid = s.entries.filter((entry) => entry.valid);
  const limits = limitsFor(r);
  const missing = GROUPS.filter((group) => valid.filter((entry) => entry.cat === group).length < limits.minDbPerGroup);
  const notes = missing.map((group) => (limits.minDbPerGroup > 1 ? `${GROUP_NAMES[group]} under ${limits.minDbPerGroup} −0.3` : `Missing ${GROUP_NAMES[group]} −0.3`));
  let penalty = missing.length * 3;
  let counted;
  let total;

  if (r.discipline === 'individual') {
    const db = valid.filter((entry) => entry.cat !== 'risks').sort((a, b) => entryValue(b) - entryValue(a)).slice(0, limits.db);
    const risks = s.entries.filter((entry) => entry.cat === 'risks').slice(0, limits.risks).filter((entry) => entry.valid);
    counted = new Set([...db, ...risks].map((entry) => entry.id));
    total = [...db, ...risks].reduce((sum, entry) => sum + entryValue(entry), 0);
    return { total: Math.max(0, total - penalty), counted, notes, headline: `DB ${db.length}/${limits.db} · R ${risks.length}/${limits.risks}` };
  }

  const routine = valid.filter((entry) => entry.cat !== 'risks').slice(0, limits.routine);
  const risks = s.entries.filter((entry) => entry.cat === 'risks').slice(0, limits.risks).filter((entry) => entry.valid);
  const dbCount = valid.filter((entry) => !['risks', 'de'].includes(entry.cat)).length;
  const deCount = valid.filter((entry) => entry.cat === 'de').length;
  if (dbCount < limits.db) { penalty += 3; notes.push('Not enough DB −0.3'); }
  if (deCount < limits.de) { penalty += 3; notes.push(`Fewer than ${limits.de} DE −0.3`); }
  counted = new Set([...routine, ...risks].map((entry) => entry.id));
  total = [...routine, ...risks].reduce((sum, entry) => sum + entryValue(entry), 0);
  return { total: Math.max(0, total - penalty), counted, notes, headline: `DB+DE ${routine.length}/${limits.routine} · R ${risks.length}/${limits.risks}` };
}

function view(s, r) {
  const order = ORDER[r.discipline];
  const tab = order.includes(s.tab) ? s.tab : order[0];
  const config = TABS[tab];
  const result = score(s, r);
  const columns = 4;
  const chips = s.entries.map((entry) => {
    const classes = ['chip', entry.valid ? '' : 'off', result.counted.has(entry.id) || !entry.valid ? '' : 'dim'].join(' ');
    return `<button class="${classes}" style="--c:${TABS[entry.cat].color}" data-act="toggle" data-id="${entry.id}" title="Tap to ${entry.valid ? 'invalidate' : 'restore'}"><span>${TABS[entry.cat].chip}</span>${t(entryValue(entry))}</button>`;
  }).join('');

  return `
    <section class="hist">
      <div class="hist-head"><span>HISTORY · ${result.headline}</span></div>
      <div class="chips">${chips || '<em class="empty">No elements</em>'}</div>
    </section>
    <section class="split split-db">
      <nav class="side-tabs">${[order.slice(0, 3), order.slice(3)].map((group) => `<div class="tabcol">${group.map((id) => {
        const count = id === 'risks' ? ` <small>${s.entries.filter((e) => e.cat === 'risks' && e.valid).length}/${limitsFor(r).risks}</small>` : '';
        return `<button class="tab ${id === tab ? 'active' : ''}" data-tab="${id}" style="--c:${TABS[id].color}" data-act="tab" data-id="${id}">${TABS[id].label}${count}</button>`;
      }).join('')}</div>`).join('')}</nav>
      <div class="center-col">
        <div class="total-card"><small>TOTAL</small><strong>${t(result.total)}</strong><span>${result.headline}</span></div>
        <div class="notes">${result.notes.join(' · ') || 'No penalty'}</div>
        <div class="mini-actions"><button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button><button class="foot-btn" data-act="reset">Reset</button></div>
      </div>
      <div class="vals-col">
        <section class="values" style="--cols:${columns}">${config.values.map((value) => `<button class="tile" data-act="add" data-v="${value}">${t(value)}</button>`).join('')}</section>
        ${tab === 'rotations' ? `<section class="extras"><button class="tile small rotation-extra rotation-extra-1" data-act="extra" data-v="1">+0.1 (extra turn)</button><button class="tile small rotation-extra rotation-extra-2" data-act="extra" data-v="2">+0.2 (extra turn)</button></section>` : ''}
      </div>
    </section>`;
}

export default function (r) {
  mount(r, {
    initial: { tab: 'jumps', entries: [], undo: [] },
    view,
    actions: {
      tab: (s, d) => { s.tab = d.id; return false; },
      add: (s, d) => { s.entries.push({ id: uid(), cat: s.tab, value: Number(d.v), extra: 0, valid: true }); },
      extra: (s, d) => {
        const last = [...s.entries].reverse().find((entry) => entry.cat === 'rotations' && entry.valid);
        if (!last) return false;
        last.extra = (last.extra || 0) + Number(d.v);
      },
      toggle: (s, d) => { const entry = s.entries.find((item) => item.id === d.id); if (entry) entry.valid = !entry.valid; },
    },
  });
}
