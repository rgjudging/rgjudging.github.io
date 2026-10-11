import { mount, footer, t, t2, uid } from './core.js';

const key =  (cls, act, v, label, extra = '') => `<button class="skey ${cls}" data-act="${act}" data-v="${v}" ${extra}>${label}</button>`;
const column = (title, keys) => `<div class="scol"><span class="scol-title">${title}</span>${keys.join('')}</div>`;
const center = (rows) => `<div class="scenter">${rows.map(([label, value, cls = '']) => `<span class="scenter-label">${label}</span><strong class="${cls}">${value}</strong>`).join('')}</div>`;
const history = (s, chip) => `<section class="hist"><div class="chips">${s.entries.map((e) => `<button class="chip ${e.valid ? '' : 'off'}" style="--c:${e.color}" data-act="toggle" data-id="${e.id}">${chip(e)}</button>`).join('') || '<em class="empty">Tap the keys — values appear here</em>'}</div></section>`;
const body = (left, mid, right) => `<section class="simple">${left}${mid}${right}</section>`;
const valid = (s) => s.entries.filter((e) => e.valid);
const sum = (s) => valid(s).reduce((total, e) => total + e.v, 0);
const dbTotal = (s) => sum(s);
const countedDa = (s) => valid(s).filter((e) => !e.penalty && e.v > 0);
const daTotal = (s) => Math.max(0, sum(s));
const add = (color, extra = {}) => (s, d) => { s.entries.push({ id: uid(), v: Number(d.v), valid: true, color, ...extra }); };
const toggle = (s, d) => { const e = s.entries.find((item) => item.id === d.id); if (e) e.valid = !e.valid; };
const bonus = (s, d) => {
  const last = [...s.entries].reverse().find((e) => e.valid && !e.penalty);
  if (!last) return false;
  last.v += Number(d.v);
  last.bonus = (last.bonus || 0) + Number(d.v);
};

const panels = {
  db: {
    view: (s) => `${history(s, (e) => t(e.v))}${body(
      column('Value', [0, 1, 2].map((v) => key('', 'add', v, t(v)))),
      center([['DB total', t(dbTotal(s))], ['Elements', valid(s).length]]),
      column('Value', [3, 4].map((v) => key('', 'add', v, t(v))).concat(key('accent', 'bonus', 1, '+0.1')))
    )}`,
    actions: { add: add('#4c9aff'), bonus },
    send: (s) => ({ panel: 'db', score: dbTotal(s) / 10 }),
  },
  da: {
    view: (s, r) => {
      const group = r.discipline === 'ensemble';
      const left = column('Element value', [0, 2].map((v) => key('', 'add', v, v ? t(v) : '0')));
      const right = column('Element value', [3, 4].map((v) => key('', 'add', v, t(v))).concat(group ? [key('accent', 'bonus', 1, '+0.1')] : []));
      const mid = center([['DA score', t2(daTotal(s))], ['Elements', countedDa(s).length]]);
      const penalty = group ? `<button class="skey danger wide" data-act="penalty" data-v="3">−0.3 deduction</button>` : '';
      return `${history(s, (e) => (e.penalty ? `−${t(-e.v)}` : t(e.v)))}${body(left, mid, right)}${penalty}`;
    },
    actions: { add: add('#facc15'), bonus, penalty: (s, d) => { s.entries.push({ id: uid(), v: -Number(d.v), valid: true, penalty: true, color: '#ef4444' }); } },
    send: (s) => ({ panel: 'da', score: daTotal(s) / 10 }),
  },
  artistic: {
    view: (s) => `${history(s, (e) => `−${t(e.v)}`)}${body(
      column('Deductions', [1, 3].map((v) => key('danger', 'add', v, `−${t(v)}`))),
      center([['Score', t2(Math.max(0, 100 - sum(s)))], ['Deduction', `−${t2(sum(s))}`, 'warn']]),
      column('Deductions', [6, 10].map((v) => key('danger', 'add', v, `−${t(v)}`)))
    )}`,
    actions: { add: add('#ef4444') },
    send: (s) => ({ panel: 'artistic', deduction: sum(s) / 10, score: Math.max(0, 100 - sum(s)) / 10 }),
  },
  execution: {
    view: (s) => `${history(s, (e) => `${e.loss ? 'L/F ' : ''}−${t(e.v)}`)}${body(
      column('Loss / fall', [5, 7, 10].map((v) => key('danger', 'loss', v, `−${t(v)}`))),
      center([['Score', t2(Math.max(0, 100 - sum(s)))], ['Deduction', `−${t2(sum(s))}`, 'warn']]),
      column('Deductions', [1, 3, 5].map((v) => key('danger', 'add', v, `−${t(v)}`)))
    )}`,
    actions: { add: add('#fb923c'), loss: add('#ef4444', { loss: true }) },
    send: (s) => ({ panel: 'execution', deduction: sum(s) / 10, score: Math.max(0, 100 - sum(s)) / 10 }),
  },
};

export default function (r) {
  const panel = panels[r.mode];
  mount(r, {
    initial: { entries: [], undo: [] },
    view: (s) => `${panel.view(s, r)}${footer((s.undo || []).length > 0, '', '<button class="foot-btn primary" data-act="send">Send</button>')}`,
    actions: {
      ...panel.actions,
      toggle,
      send: (s, d, ctx) => { ctx.send(panel.send(s)); return false; },
    },
  });
}
