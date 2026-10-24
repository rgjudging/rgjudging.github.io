import { mount, t, uid } from './core.js';

const COMMON_TABS = [
  { id: 'generalities', label: 'Generalities', color: '#4c9aff' },
  { id: 'basic', label: 'Basic technique', color: '#22c55e' },
  { id: 'jumps', label: 'Jumps & leaps', color: '#f97316' },
  { id: 'balances', label: 'Balances', color: '#a855f7' },
  { id: 'rotations', label: 'Rotations', color: '#ec4899' },
  { id: 'acro', label: 'Pre-acrobatics', color: '#06b6d4' },
  { id: 'apparatus', label: 'Apparatus', color: '#facc15' },
  { id: 'technique', label: 'Apparatus technique', color: '#14b8a6' },
  { id: 'catch', label: 'Trajectories & catches', color: '#fb7185' },
  { id: 'loss', label: 'Loss of apparatus', color: '#ef4444' },
];

const FAULTS = {
  generalities: [
    ['Small amplitude in a body wave', 1],
    ['Small amplitude in pre-acrobatics', 1],
    ['Incorrect body alignment', 1],
    ['Gymnast remains static', 3],
  ],
  basic: [
    ['Incorrectly held body segment', 1],
    ['Balance without travel', 1],
    ['Balance with travel', 3],
    ['Balance with support', 5],
    ['Fall with total loss', 7],
  ],
  jumps: [
    ['Jump shape — small deviation', 1],
    ['Jump shape — medium deviation', 3],
    ['Jump shape — large deviation', 5],
    ['Incorrect swing technique', 1],
    ['Heavy landing', 1],
    ['Incorrect landing', 3],
  ],
  balances: [
    ['Balance shape — small deviation', 1],
    ['Balance shape — medium deviation', 3],
    ['Balance shape — large deviation', 5],
    ['Balance not held for one second', 3],
  ],
  rotations: [
    ['Rotation shape — small deviation', 1],
    ['Rotation shape — medium deviation', 3],
    ['Rotation shape — large deviation', 5],
    ['Support on heel', 1],
    ['Sliding during rotation', 1],
  ],
  acro: [
    ['Heavy landing', 1],
    ['Unauthorized technique', 3],
    ['Steps while in handstand', 3],
  ],
  rope: [
    ['Incorrect rope handling', 1],
    ['Rope touches body or floor', 1],
    ['Knot without interruption', 1],
    ['Wrapping without interruption', 3],
    ['One rope end is lost', 3],
    ['Feet caught in rope', 3],
    ['Wrapping with interruption', 5],
    ['Knot with interruption', 5],
  ],
  hoop: [
    ['Incorrect hoop handling', 1],
    ['Hoop contacts body', 3],
    ['Catch on forearm', 1],
    ['Catch on arm', 3],
    ['Incomplete roll', 1],
    ['Roll with a bounce', 1],
    ['Hoop slides along arm', 1],
    ['Feet caught in hoop', 3],
  ],
  ball: [
    ['Incorrect ball handling', 1],
    ['Ball contacts body', 3],
    ['Incomplete roll', 1],
    ['Roll with a bounce', 1],
    ['Catch with two hands', 1],
  ],
  clubs: [
    ['Incorrect club handling', 1],
    ['Clubs lose synchronization', 1],
    ['Imprecise club work planes', 1],
  ],
  ribbon: [
    ['Incorrect ribbon handling', 1],
    ['Ribbon pattern is altered', 1],
    ['Ribbon contacts body', 1],
    ['Wrapping without interruption', 3],
    ['Wrapping with interruption', 5],
    ['Small knot', 1],
    ['Medium or large knot', 5],
    ['Ribbon end touches floor', 1],
  ],
  technique: [
    ['Apparatus remains static', 3],
  ],
  catch: [
    ['Imprecise catch — 1–2 steps', 1],
    ['Imprecise catch — 3–4 steps', 3],
    ['Imprecise catch — 5 or more steps', 5],
    ['Incorrect catch', 1],
    ['Incorrect catch with body contact', 3],
  ],
  loss: [
    ['Loss without travelling', 5],
    ['Loss — 1–2 steps', 7],
    ['Loss — 3 or more steps', 10],
    ['Loss outside the floor area', 10],
    ['Loss requiring a replacement apparatus', 10],
    ['Loss at the end of the exercise', 10],
  ],
};

const APPARATUS_GROUPS = {
  hoop: ['hoop'],
  ball: ['ball'],
  clubs: ['clubs'],
  ribbon: ['ribbon'],
  rope: ['rope'],
  '5-balls': ['ball'],
  '5-hoops': ['hoop'],
  '5-ribbons': ['ribbon'],
  '3-hoops-4-clubs': ['hoop', 'clubs'],
};

const total = (s) => s.entries
  .filter((entry) => entry.valid)
  .reduce((sum, entry) => sum + entry.value, 0);

const activeApparatus = (r) => APPARATUS_GROUPS[r.apparatus] || [];

function categories(r) {
  const equipment = activeApparatus(r);
  const firstName = equipment[0] ? equipment[0][0].toUpperCase() + equipment[0].slice(1) : 'Apparatus';
  const label = equipment.length > 1 ? `${firstName} + Clubs` : firstName;
  return COMMON_TABS.map((item) => item.id === 'apparatus' ? { ...item, label } : item);
}

function view(s, r) {
  const tabs = categories(r);
  const selectedTab = tabs.some((item) => item.id === s.tab) ? s.tab : tabs[0].id;
  const selected = tabs.find((item) => item.id === selectedTab);
  const entries = FAULTS[selectedTab] || equipmentFaults(r);
  const deduction = total(s);
  const tabCounts = Object.fromEntries(tabs.map(({ id }) => [
    id,
    s.entries.filter((entry) => entry.valid && entry.category === id).length,
  ]));
  const history = s.entries.map((entry) => {
    const category = tabs.find((item) => item.id === entry.category);
    return `<button class="chip exec-expert-chip ${entry.valid ? '' : 'off'}" style="--c:${category?.color || '#fb923c'}" data-act="toggle" data-id="${entry.id}" title="Tap to ${entry.valid ? 'invalidate' : 'restore'}">
      <span>${category?.label || entry.category}</span>${entry.label} <strong>−${t(entry.value)}</strong>
    </button>`;
  }).join('');
  const faultButtons = entries.map(([label, value]) => `<button class="exec-expert-fault" data-act="add" data-label="${label}" data-value="${value}">
    <span>${label}</span><strong>−${t(value)}</strong>
  </button>`).join('');

  return `<section class="hist">
    <div class="hist-head"><span>FAULTS · ${s.entries.filter((entry) => entry.valid).length} recorded</span></div>
    <div class="chips">${history || '<em class="empty">No deductions</em>'}</div>
  </section>
  <section class="exec-expert-layout">
    <nav class="tabs exec-expert-tabs">${tabs.map((item) => `<button class="tab ${item.id === selectedTab ? 'active' : ''}" style="--c:${item.color}" data-act="tab" data-id="${item.id}" aria-pressed="${item.id === selectedTab}">${item.label}${tabCounts[item.id] ? `<small>${tabCounts[item.id]}</small>` : ''}</button>`).join('')}</nav>
    <div class="center-col">
      <div class="total-card"><small>TOTAL DEDUCTION</small><strong class="warn">${t(deduction)}</strong><span>E SCORE · ${t(Math.max(0, 100 - deduction))}</span></div>
      <button class="foot-btn primary send-big" data-act="send">Send</button>
      <div class="mini-actions"><button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button><button class="foot-btn" data-act="reset">Reset</button></div>
    </div>
    <section class="exec-expert-faults" aria-label="${selected.label} faults">${faultButtons}</section>
  </section>`;
}

function equipmentFaults(r) {
  return activeApparatus(r).flatMap((apparatus) => FAULTS[apparatus] || []);
}

export default function (r) {
  mount(r, {
    initial: { tab: 'generalities', entries: [], undo: [] },
    view,
    actions: {
      tab: (s, d) => {
        if (!COMMON_TABS.some((item) => item.id === d.id)) return false;
        s.tab = d.id;
        return false;
      },
      add: (s, d, ctx) => {
        const tab = categories(ctx.r).find((item) => item.id === s.tab);
        const value = Number(d.value);
        const fault = (FAULTS[s.tab] || equipmentFaults(ctx.r)).find(([label, amount]) => label === d.label && amount === value);
        if (!tab || !fault) return false;
        s.entries.push({ id: uid(), category: s.tab, label: fault[0], value, valid: true });
      },
      toggle: (s, d) => {
        const entry = s.entries.find((item) => item.id === d.id);
        if (entry) entry.valid = !entry.valid;
      },
      send: (s, d, ctx) => {
        const deduction = total(s);
        ctx.send({ panel: 'execution', deduction: deduction / 10, score: Math.max(0, 100 - deduction) / 10 });
        return false;
      },
    },
  });
}
