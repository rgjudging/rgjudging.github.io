import { mount, range, t, uid } from './core.js';
import { icon } from './icons.js';
import { entryValue, score } from './db.js';

const DB_TABS = {
  jumps: { label: 'Λ', name: 'Jumps', color: '#4c9aff', values: range(1, 8) },
  balances: { label: '⊤', name: 'Balances', color: '#ff9f1c', values: range(1, 6) },
  rotations: { label: '⫰', name: 'Rotations', color: '#ff5fa2', values: range(1, 5) },
  risks: { label: 'R', name: 'Risks', color: '#19c37d', values: range(2, 13) },
  de: { label: 'DE', name: 'DE', color: '#2dd4bf', values: range(2, 13) },
};
const SYMBOL_COUNTS = {
  jumps: { 1: 10, 2: 11, 3: 17, 4: 12, 5: 18, 6: 9, 7: 4, 8: 1 },
  balances: { 1: 7, 2: 5, 3: 11, 4: 8, 5: 4, 6: 6 },
  rotations: { 1: 5, 2: 3, 3: 11, 4: 5, 5: 12 },
};
const ORDER = {
  individual: ['jumps', 'balances', 'rotations', 'risks'],
  ensemble: ['jumps', 'balances', 'rotations', 'risks', 'de'],
};

const R_CRITERIA = [
  { id: 'outside-visual-field', label: 'Outside the visual field (throw or catch)', group: 'During the throw and catch', maxCount: 2, icon: 3 },
  { id: 'without-hands', label: 'Without the help of the hands (throw or catch)', group: 'During the throw and catch', detail: 'Not for a direct catch in rotation on the straight arm', maxCount: 2, icon: 4 },
  { id: 'throw-after-roll', label: 'Throw after rolling on the floor', group: 'During the throw', requires: 'without-hands', icon: 5 },
  { id: 'throw-through-rope', label: 'Passing through the Rope during the throw', group: 'During the throw', apparatus: ['rope'], detail: 'Minimum 2 large body segments', icon: 7 },
  { id: 'throw-open-rope-end', label: 'High throw of open, stretched Rope held by the end', group: 'During the throw', apparatus: ['rope'], icon: 8 },
  { id: 'throw-open-rope-middle', label: 'High throw of open, stretched Rope held by the middle', group: 'During the throw', apparatus: ['rope'], icon: 9 },
  { id: 'throw-clubs', label: 'Cascade / throw of 2 unlocked Clubs', group: 'During the throw', apparatus: ['clubs'], detail: 'Simultaneous, asymmetric or cascade; awarded once', icon: 6 },
  { id: 'rotation-change', label: 'Change of rotation axis or change of level', group: 'During the rotations', icon: 1 },
  { id: 'series', label: 'Series S', group: 'During the rotations', value: 2, detail: '3 identical pre-acrobatic elements under the flight, or 3 turning leap DB with throw and catch', icon: 2 },
  { id: 'catch-through-hoop', label: 'Passing through the Hoop during the catch', group: 'During the catch', apparatus: ['hoop'], detail: 'Minimum 2 large body segments', icon: 7 },
  { id: 'catch-rebound', label: 'Direct rebound on the body', group: 'During the catch', detail: 'No stops, no arm(s) or hand(s)', icon: 5 },
  { id: 'catch-roll', label: 'Direct catch rolling over the body', group: 'During the catch', detail: 'Over a minimum of 2 large body segments', icon: 10 },
  { id: 'catch-hoop-roll', label: 'Direct catch of the Hoop rotating around another body part', group: 'During the catch', apparatus: ['hoop'], detail: 'Without hands; not on the straight arm', icon: 13 },
  { id: 'catch-ball-one-hand', label: 'Catch of the Ball with 1 hand', group: 'During the catch', apparatus: ['ball'], detail: 'No support from the body or the other hand', icon: 12 },
  { id: 'catch-clubs', label: 'Simultaneous catch of 2 unlocked Clubs', group: 'During the catch', apparatus: ['clubs'], icon: 11 },
  { id: 'catch-rope-ends', label: 'Catch of the Rope with 1 end in each hand', group: 'During the catch', apparatus: ['rope'], icon: 14 },
];
const DB_SYMBOL_BASE = import.meta.env
  ? `${import.meta.env.BASE_URL}db-symbols/`
  : new URL('../../public/db-symbols/', import.meta.url).href;
const ROTATION_SYMBOL = `${DB_SYMBOL_BASE}rotations/01/01.png`;
const R_CRITERION_ALIASES = {
  'axis-change': 'rotation-change',
  'level-change': 'rotation-change',
  'throw-outside': 'outside-visual-field',
  'catch-outside': 'outside-visual-field',
  'throw-hands-free': 'without-hands',
  'catch-hands-free': 'without-hands',
};
const normalizeRiskCriteria = (criteria = []) => {
  const normalized = criteria.map((id) => R_CRITERION_ALIASES[id] || id);
  return normalized.filter((id, index) => id !== 'rotation-change' || normalized.indexOf(id) === index);
};
const criterionSymbol = (criterion) => criterion.icon
  ? `${DB_SYMBOL_BASE}r-criteria/${String(criterion.icon).padStart(2, '0')}.png`
  : '';

const symbolSrc = (category, value, index) =>
  `${DB_SYMBOL_BASE}${category}/${String(value).padStart(2, '0')}/${String(index).padStart(2, '0')}.png`;

function history(s, result) {
  const chips = s.entries.map((entry) => {
    const category = DB_TABS[entry.cat];
    const classes = ['chip', 'expert-chip', entry.valid ? '' : 'off', result.counted.has(entry.id) || !entry.valid ? '' : 'dim'].join(' ');
    const name = `${category.name} ${t(entryValue(entry))}`;
    const symbol = entry.cat === 'risks'
      ? `<img src="${ROTATION_SYMBOL}" alt="">`
      : entry.symbolIndex
      ? `<img src="${symbolSrc(entry.cat, entry.value, entry.symbolIndex)}" alt="">`
      : '';
    const riskDetails = entry.cat === 'risks' ? ` · ${entry.rotations} turns · ${normalizeRiskCriteria(entry.criteria).map((id, index, criteria) => {
      const criterion = R_CRITERIA.find((item) => item.id === id);
      const repeated = criteria.indexOf(id) !== index;
      return repeated ? '' : `${criterion?.label || id}${criteria.filter((item) => item === id).length > 1 ? ` ×${criteria.filter((item) => item === id).length}` : ''}`;
    }).filter(Boolean).join(', ')}` : '';
    return `<button class="${classes}" style="--c:${category.color}" data-act="toggle" data-id="${entry.id}" title="Tap to ${entry.valid ? 'invalidate' : 'restore'} ${name}${riskDetails}">${symbol}<span>${category.label}</span>${t(entryValue(entry))}</button>`;
  }).join('');
  return `<section class="hist">
    <div class="hist-head"><span>HISTORY · ${result.headline}</span></div>
    <div class="chips">${chips || '<em class="empty">No elements</em>'}</div>
  </section>`;
}

function view(s, r) {
  if (!s.rDraft?.initialized && s.rDraft?.rotations === 0 && !s.rDraft.criteria?.length) {
    s.rDraft = { ...s.rDraft, rotations: 2, initialized: true };
  }
  const order = ORDER[r.discipline];
  const tab = order.includes(s.tab) ? s.tab : order[0];
  const config = DB_TABS[tab];
  const baseValues = SYMBOL_COUNTS[tab] ? config.values : [];
  const baseValue = baseValues.includes(s.baseValue) ? s.baseValue : baseValues[0];
  const result = score(s, r);
  const lastBalance = [...s.entries].reverse().find((entry) => entry.cat === 'balances' && entry.valid);
  const lastRotation = [...s.entries].reverse().find((entry) => entry.cat === 'rotations' && entry.valid);
  const tabs = order.map((id) => {
    const item = DB_TABS[id];
    const count = s.entries.filter((entry) => entry.cat === id && entry.valid).length;
    return `<button class="tab ${id === tab ? 'active' : ''}" data-act="tab" data-id="${id}" style="--c:${item.color}">${item.label}<small>${count}</small></button>`;
  }).join('');

  const symbolPicker = SYMBOL_COUNTS[tab]
    ? `<div class="expert-value-picker">
        <span class="expert-label">Base value</span>
        <div class="expert-values">${baseValues.map((value) => `<button class="expert-value ${value === baseValue ? 'active' : ''}" data-act="base" data-v="${value}">${t(value)}</button>`).join('')}</div>
      </div>
      <div class="expert-label">${config.name} · ${t(baseValue)} · Select a symbol</div>
      <div class="expert-symbols" style="--c:${config.color}">${range(1, SYMBOL_COUNTS[tab][baseValue] || 0).map((index) => `<button class="expert-symbol" data-act="add-symbol" data-v="${baseValue}" data-symbol="${index}" aria-label="Add ${config.name} difficulty ${t(baseValue)}, symbol ${index}"><img src="${symbolSrc(tab, baseValue, index)}" alt=""><small>${index}</small></button>`).join('')}</div>
      ${tab === 'rotations' ? `<div class="expert-modifiers"><span>Extra turn · last valid rotation</span><button class="expert-modifier rotation-extra rotation-extra-1" data-act="rotation-extra" data-v="1" ${lastRotation ? '' : 'disabled'}>+0.1 extra turn</button><button class="expert-modifier rotation-extra rotation-extra-2" data-act="rotation-extra" data-v="2" ${lastRotation ? '' : 'disabled'}>+0.2 extra turn</button></div>` : ''}
      ${tab === 'balances' ? `<div class="expert-modifiers"><span>Adjust last valid balance</span><button class="expert-modifier" data-act="flat-foot" ${lastBalance && !lastBalance.flatFoot && !lastBalance.slowTurn ? '' : 'disabled'}>Flat foot −0.1</button><button class="expert-modifier" data-act="slow-turn" data-v="${lastBalance && lastBalance.flatFoot ? 1 : 2}" ${lastBalance && !lastBalance.slowTurn ? '' : 'disabled'}>Slow turn +${lastBalance && lastBalance.flatFoot ? '0.1' : '0.2'}</button></div>` : ''}`
    : tab === 'risks'
      ? renderRiskBuilder(s, r)
      : `<div class="expert-values direct-values">${config.values.map((value) => `<button class="tile" data-act="add-direct" data-v="${value}">${t(value)}</button>`).join('')}</div>`;

  return `${history(s, result)}
    <section class="expert-layout">
      <nav class="side-tabs expert-side-tabs">${tabs}</nav>
      <div class="center-col">
        <div class="total-card"><small>TOTAL</small><strong>${t(result.total)}</strong><span>${result.headline}</span></div>
        <div class="notes">${result.notes.join(' · ') || 'No penalty'}</div>
        <div class="mini-actions"><button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button><button class="foot-btn" data-act="reset">Reset</button></div>
      </div>
      <section class="expert-entry-panel">${symbolPicker}</section>
    </section>`;
}

function renderRiskBuilder(s, r) {
  const selected = normalizeRiskCriteria(s.rDraft?.criteria);
  const rotations = Math.max(0, Math.min(8, Number(s.rDraft?.rotations) || 0));
  const criteria = R_CRITERIA.filter((criterion) => !criterion.apparatus || criterion.apparatus.includes(r.apparatus));
  const value = rotations + criteria.reduce((sum, criterion) =>
    sum + selected.filter((id) => id === criterion.id).length * (criterion.value || 1), 0);
  const rotationGrid = `<section class="r-rotation">
    <div class="r-section-heading"><div><strong>Rotations</strong><small>2 minimum · +0.1 each · maximum 8</small></div><strong class="r-rotation-value">${rotations ? `R${rotations} · ${t(rotations)}` : 'R —'}</strong></div>
    <button class="r-rotation-add" data-act="r-rotation" ${rotations >= 8 ? 'disabled' : ''} aria-label="Add one 360 degree rotation, plus 0.1">
      ${icon('pivot')}<span>+0.1 rotation</span>
    </button>
    <button class="r-rotation-remove" data-act="r-rotation-remove" ${rotations ? '' : 'disabled'}>− Remove last rotation</button>
  </section>`;
  const criterionButtons = criteria.map((criterion) => {
    const count = selected.filter((id) => id === criterion.id).length;
    const active = count > 0;
    const blocked = Boolean(criterion.requires && !selected.includes(criterion.requires))
      || Boolean(criterion.maxCount && count >= criterion.maxCount);
    const icon = criterionSymbol(criterion) ? `<img src="${criterionSymbol(criterion)}" alt="">` : '';
    const valueLabel = t(criterion.value || 1);
    const accessibleLabel = [criterion.label, criterion.detail].filter(Boolean).join('. ');
    return `<button class="r-criterion ${active ? 'active' : ''}" data-act="r-criterion" data-id="${criterion.id}" aria-label="${accessibleLabel} +${valueLabel}${criterion.maxCount ? `, ${count} of ${criterion.maxCount} selected` : ''}" title="${accessibleLabel} +${valueLabel}${criterion.maxCount ? ` · ${count}/${criterion.maxCount}` : ''}" ${blocked ? 'disabled' : ''}>
      <span class="r-criterion-icon">${icon}${criterion.maxCount && count ? `<span class="r-criterion-count">×${count}</span>` : ''}</span>
    </button>`;
  }).join('');
  return `<div class="r-builder">
    ${rotationGrid}
    <div class="r-criteria-list">${criterionButtons}</div>
    <div class="r-add-row"><div><small>R value</small><strong>${t(value)}</strong></div><button class="r-add-button" data-act="add-risk" ${rotations < 2 ? 'disabled' : ''}>Add R${rotations || ''} · ${t(value)}</button></div>
  </div>`;
}

export default function (r) {
  mount(r, {
    initial: { tab: 'jumps', baseValue: 1, entries: [], rDraft: { rotations: 2, criteria: [], initialized: true }, undo: [] },
    view,
    actions: {
      tab: (s, d) => {
        s.tab = d.id;
        if (SYMBOL_COUNTS[d.id] && !SYMBOL_COUNTS[d.id][s.baseValue]) s.baseValue = DB_TABS[d.id].values[0];
      },
      base: (s, d) => {
        const value = Number(d.v);
        if (!SYMBOL_COUNTS[s.tab]?.[value]) return false;
        s.baseValue = value;
      },
      'add-symbol': (s, d) => {
        s.entries.push({ id: uid(), cat: s.tab, value: Number(d.v), symbolIndex: Number(d.symbol), extra: 0, valid: true });
      },
      'add-direct': (s, d) => {
        if (!['risks', 'de'].includes(s.tab)) return false;
        if (s.tab === 'risks') return false;
        s.entries.push({ id: uid(), cat: s.tab, value: Number(d.v), extra: 0, valid: true });
      },
      'r-rotation': (s) => {
        const rotations = Number(s.rDraft?.rotations) || 0;
        if (rotations >= 8) return false;
        s.rDraft = { ...s.rDraft, rotations: rotations + 1, initialized: true };
      },
      'r-rotation-remove': (s) => {
        const rotations = Number(s.rDraft?.rotations) || 0;
        if (!rotations) return false;
        s.rDraft = { ...s.rDraft, rotations: rotations - 1, initialized: true };
      },
      'r-criterion': (s, d, ctx) => {
        const criterion = R_CRITERIA.find((item) => item.id === d.id);
        if (!criterion || (criterion.apparatus && !criterion.apparatus.includes(ctx.r.apparatus))) return false;
        const selected = normalizeRiskCriteria(s.rDraft?.criteria);
        if (criterion.requires && !selected.includes(criterion.requires)) return false;
        const count = selected.filter((id) => id === criterion.id).length;
        if (criterion.maxCount) {
          if (count >= criterion.maxCount) return false;
          selected.push(criterion.id);
        } else if (count) {
          selected.splice(selected.indexOf(criterion.id), 1);
          if (criterion.id === 'without-hands' && !selected.includes(criterion.id)) {
            const dependentIndex = selected.indexOf('throw-after-roll');
            if (dependentIndex >= 0) selected.splice(dependentIndex, 1);
          }
        } else {
          selected.push(criterion.id);
        }
        s.rDraft = { ...s.rDraft, criteria: selected, initialized: true };
      },
      'add-risk': (s) => {
        const rotations = Number(s.rDraft?.rotations) || 0;
        if (rotations < 2 || rotations > 8) return false;
        const criteria = normalizeRiskCriteria(s.rDraft?.criteria).filter((id) => {
          const criterion = R_CRITERIA.find((item) => item.id === id);
          return criterion && (!criterion.apparatus || criterion.apparatus.includes(r.apparatus));
        });
        const value = rotations + criteria.reduce((sum, id) => sum + (R_CRITERIA.find((item) => item.id === id)?.value || 1), 0);
        s.entries.push({ id: uid(), cat: 'risks', value, rotations, criteria, extra: 0, valid: true });
        s.rDraft = { rotations: 2, criteria: [], initialized: true };
      },
      'rotation-extra': (s, d) => {
        const last = [...s.entries].reverse().find((entry) => entry.cat === 'rotations' && entry.valid);
        if (!last) return false;
        last.extra = (last.extra || 0) + Number(d.v);
      },
      'flat-foot': (s) => {
        const last = [...s.entries].reverse().find((entry) => entry.cat === 'balances' && entry.valid);
        if (!last || last.flatFoot || last.slowTurn) return false;
        last.extra = (last.extra || 0) - 1;
        last.flatFoot = true;
      },
      'slow-turn': (s, d) => {
        const last = [...s.entries].reverse().find((entry) => entry.cat === 'balances' && entry.valid);
        if (!last || last.slowTurn) return false;
        last.extra = (last.extra || 0) + Number(d.v);
        last.slowTurn = true;
      },
      toggle: (s, d) => {
        const entry = s.entries.find((item) => item.id === d.id);
        if (entry) entry.valid = !entry.valid;
      },
    },
  });
}
