import { mount, t, uid } from './core.js';
import { icon } from './icons.js';
import { limitsFor } from './settings.js';
import { BASES, basePanels } from './da.js';

const CRITERION_COUNT = 7;
const ROPE_CRITERION_COUNT = 10;
const DA_SYMBOL_BASE = import.meta.env
  ? `${import.meta.env.BASE_URL}da-criteria/`
  : new URL('../../public/da-criteria/', import.meta.url).href;

const criterionSrc = (number) => `${DA_SYMBOL_BASE}${String(number).padStart(2, '0')}.png`;

function result(s, r) {
  const limit = limitsFor(r).da;
  const counted = s.entries.slice(0, limit).filter((entry) => entry.valid);
  return {
    counted,
    countedIds: new Set(counted.map((entry) => entry.id)),
    limit,
    total: counted.reduce((sum, entry) => sum + entry.value, 0),
    overflow: s.entries.slice(limit).filter((entry) => entry.valid).length,
  };
}

function history(s, scored) {
  const chips = s.entries.map((entry) => {
    const criteria = entry.criteria || [];
    const criteriaLabel = criteria.map((number) => `criterion ${number}`).join(' and ');
    const classes = [
      'chip',
      'expert-chip',
      'da-expert-chip',
      entry.valid ? '' : 'off',
      scored.countedIds.has(entry.id) || !entry.valid ? '' : 'dim',
    ].join(' ');
    const baseGlyph = entry.secondGlyph ? `${entry.glyph}+${entry.secondGlyph}` : entry.glyph;
    const doubleBaseLabel = entry.secondGlyph ? ' · double base' : '';
    return `<button class="${classes}" style="--c:#a78bfa" data-act="toggle" data-id="${entry.id}" title="Tap to ${entry.valid ? 'invalidate' : 'restore'} DA ${t(entry.value)}${doubleBaseLabel} · ${criteriaLabel}" aria-label="${entry.valid ? 'Invalidate' : 'Restore'} DA ${t(entry.value)}${doubleBaseLabel}, ${criteriaLabel}">
      <span class="da-expert-entry-glyph">${icon(baseGlyph)}</span>
      ${criteria.map((number) => `<img src="${criterionSrc(number)}" alt="Criterion ${number}">`).join('')}
      <strong>${t(entry.value)}</strong>
    </button>`;
  }).join('');

  return `<section class="hist">
    <div class="hist-head"><span>HISTORY · ${scored.counted.length} / ${scored.limit}</span></div>
    <div class="chips">${chips || '<em class="empty">No elements</em>'}</div>
  </section>`;
}

function basePicker(r) {
  const bases = BASES[r.apparatus] || {};
  return `<div class="da-board da-expert-board">${basePanels(bases, 'select-base')}</div>`;
}

function baseTypePicker(s) {
  return `<div class="da-expert-picker">
    <div class="da-expert-draft">
      <div><span class="expert-label">Choose how to score this base</span><strong>Base ${icon(s.draft.glyph)}</strong></div>
    </div>
    <div class="da-expert-base-options">
      <button class="da-expert-base-option" data-act="select-single-base">Single base · 2 criteria</button>
      <button class="da-expert-base-option" data-act="select-double-base">Double base · choose a second base and 1 criterion</button>
    </div>
    <button class="da-expert-cancel" data-act="cancel-draft">Back to bases</button>
  </div>`;
}

function secondBasePicker(s, r) {
  const bases = Object.fromEntries(Object.entries(BASES[r.apparatus] || {}).map(([value, glyphs]) => [
    value,
    glyphs.filter((glyph) => glyph !== s.draft.glyph),
  ]).filter(([, glyphs]) => glyphs.length));
  return `<div class="da-expert-picker">
    <div class="da-expert-draft">
      <div><span class="expert-label">Choose a second base</span><strong>DA ${t(s.draft.value)}</strong></div>
      <span class="da-expert-draft-glyph">${icon(s.draft.glyph)}</span>
    </div>
    <div class="da-board da-expert-board">${basePanels(bases, 'select-second-base')}</div>
    <button class="da-expert-cancel" data-act="cancel-draft">Back to bases</button>
  </div>`;
}

function criterionPicker(s, r) {
  const draft = s.draft;
  const criteriaCount = r.apparatus === 'rope' ? ROPE_CRITERION_COUNT : CRITERION_COUNT;
  const required = draft.secondGlyph ? 1 : 2;
  const selected = draft.criteria || [];
  const criteria = Array.from({ length: criteriaCount }, (_, index) => index + 1).map((number) => {
    const active = selected.includes(number);
    return `<button class="da-expert-criterion ${active ? 'active' : ''}" data-act="select-criterion" data-id="${number}" aria-label="Criterion ${number}${active ? ', selected' : ''}" title="Criterion ${number}">
      <img src="${criterionSrc(number)}" alt="">
    </button>`;
  }).join('');

  return `<div class="da-expert-picker">
    <div class="da-expert-draft">
      <div>
        <span class="expert-label">Choose exactly ${required} ${required === 1 ? 'criterion' : 'criteria'} · ${selected.length} / ${required}</span>
        <strong>DA ${t(draft.value)}</strong>
      </div>
      <span class="da-expert-draft-glyph">${icon(draft.secondGlyph ? `${draft.glyph}+${draft.secondGlyph}` : draft.glyph)}</span>
    </div>
    <div class="da-expert-criteria">${criteria}</div>
    <button class="da-expert-cancel" data-act="cancel-draft">${draft.secondGlyph ? 'Back to second base' : 'Back to bases'}</button>
  </div>`;
}

function view(s, r) {
  const scored = result(s, r);
  const content = s.draft
    ? s.draft.doubleBase && !s.draft.secondGlyph ? secondBasePicker(s, r)
      : s.draft.chooseBaseType ? baseTypePicker(s) : criterionPicker(s, r)
    : basePicker(r);
  return `${history(s, scored)}
    <section class="da-expert-layout">
      <section class="expert-entry-panel da-expert-panel">${content}</section>
      <div class="center-col">
        <div class="total-card"><small>TOTAL DA</small><strong>${t(scored.total)}</strong><span>${scored.overflow ? `${scored.overflow} over the limit, not counted` : 'Difficulty of Apparatus'}</span></div>
        <div class="mini-actions">
          <button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button>
          <button class="foot-btn" data-act="reset">Reset</button>
        </div>
      </div>
    </section>`;
}

export default function (r) {
  mount(r, {
    initial: { entries: [], draft: null, undo: [] },
    view,
    actions: {
      'select-base': (s, d, ctx) => {
        const value = Number(d.v);
        if (!BASES[ctx.r.apparatus]?.[value]?.includes(d.g)) return false;
        const doubleBase = d.g === 'arrowD';
        s.draft = { value, glyph: d.g, chooseBaseType: doubleBase, criteria: [] };
      },
      'select-single-base': (s) => {
        if (!s.draft?.chooseBaseType) return false;
        delete s.draft.chooseBaseType;
      },
      'select-double-base': (s) => {
        if (!s.draft?.chooseBaseType) return false;
        s.draft.value = 4;
        s.draft.doubleBase = true;
        delete s.draft.chooseBaseType;
      },
      'select-second-base': (s, d, ctx) => {
        if (!s.draft?.doubleBase || s.draft.secondGlyph) return false;
        const value = Number(d.v);
        const bases = BASES[ctx.r.apparatus]?.[value];
        if (!bases?.includes(d.g) || d.g === s.draft.glyph) return false;
        s.draft.secondGlyph = d.g;
      },
      'select-criterion': (s, d, ctx) => {
        if (!s.draft || s.draft.chooseBaseType || (s.draft.doubleBase && !s.draft.secondGlyph)) return false;
        const number = Number(d.id);
        const maximum = ctx.r.apparatus === 'rope' ? ROPE_CRITERION_COUNT : CRITERION_COUNT;
        if (!Number.isInteger(number) || number < 1 || number > maximum) return false;

        const selected = s.draft.criteria || [];
        if (selected.includes(number)) {
          s.draft.criteria = selected.filter((item) => item !== number);
          return;
        }

        s.draft.criteria = [...selected, number];
        const required = s.draft.secondGlyph ? 1 : 2;
        if (s.draft.criteria.length === required) {
          s.entries.push({
            id: uid(),
            value: s.draft.value,
            glyph: s.draft.glyph,
            ...(s.draft.secondGlyph ? { secondGlyph: s.draft.secondGlyph } : {}),
            criteria: s.draft.criteria,
            valid: true,
          });
          s.draft = null;
        }
      },
      'cancel-draft': (s) => {
        if (s.draft?.secondGlyph) {
          delete s.draft.secondGlyph;
          s.draft.criteria = [];
          return false;
        }
        s.draft = null;
        return false;
      },
      toggle: (s, d) => {
        const entry = s.entries.find((item) => item.id === d.id);
        if (entry) entry.valid = !entry.valid;
      },
    },
  });
}
