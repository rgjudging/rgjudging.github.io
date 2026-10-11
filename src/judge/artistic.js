import { mount, t, t2 } from './core.js';

const SINGLES = [
  ['body', 'BODY', [3, 6]], ['face', 'FACE', [3]], ['space', 'SPACE', [3]],
  ['end', 'END', [3]], ['music', 'MUSIC', [3]], ['intro', 'INTRO', [3]],
];
const GROUP_SINGLES = [['patterns', 'Patterns', [3]], ['amplitude', 'Amplitude', [3]], ['noapp', 'No app. 5s+', [3]], ['startend', 'Start/end pos.', [6]]];
const COLLECTIVE = [['choral', 'Choral'], ['synch', 'Synch'], ['canon', 'Canon'], ['contr', 'Contr']];

// Groups consecutive presses by 3; a dance step of 8 s or more is a part on its own.
function analyse(entries) {
  const units = [];
  let pending = [];
  let kind = null;
  const flush = () => { pending.forEach((item) => units.push({ items: [item] })); pending = []; kind = null; };
  let withParts = 0;
  let withoutParts = 0;

  entries.forEach((entry) => {
    if (entry.t === 'step' && entry.dur >= 8) {
      flush();
      units.push({ part: true, kind: 'with', items: [{ kind: 'with', step: true, dur: entry.dur }] });
      withParts += 1;
      return;
    }
    const current = entry.t === 'without' ? 'without' : 'with';
    const item = { kind: current, step: entry.t === 'step', dur: entry.dur };
    if (kind !== current) { flush(); kind = current; }
    pending.push(item);
    if (pending.length === 3) {
      units.push({ part: true, kind: current, items: pending });
      if (current === 'with') withParts += 1; else withoutParts += 1;
      pending = [];
      kind = null;
    }
  });
  flush();
  return { units, withParts, withoutParts };
}

function compute(s, r) {
  const group = r.discipline === 'ensemble';
  const { units, withParts, withoutParts } = analyse(s.entries);
  const majority = withParts > withoutParts;
  let character = withParts < 4 ? 10 : !majority ? 6 : withoutParts === 0 ? 0 : 3;
  if (!s.variety) character = Math.max(character, 6);

  const steps = s.entries.filter((entry) => entry.t === 'step').length;
  const requiredSteps = 2;
  const requiredDynamics = group ? 4 : 2;
  const rhythm = Math.min(20, s.rhythm);
  const connections = Math.min(20, s.connections);
  const singles = Object.values(s.singles).reduce((sum, value) => sum + value, 0);
  const missingCollective = group ? COLLECTIVE.filter(([id]) => !s.collective[id]).length : 0;

  const rows = [
    [`Idea: ${withParts} with / ${withoutParts} without character${s.variety ? '' : ' · no variety'}`, character],
    [`Dance steps (${steps}/${requiredSteps})`, Math.max(0, requiredSteps - steps) * 3],
    [`Dynamics (${s.dynamics}/${requiredDynamics})`, Math.max(0, requiredDynamics - s.dynamics) * 3],
    ['Connections', connections],
    ['Rhythm', rhythm],
    ['Interruption / loss', s.longInterruption ? 6 : 0],
    ['Single deductions', singles],
  ];
  if (group) {
    rows.push(['Collective works', missingCollective * 3], ['Contact', s.contact ? 3 : 0], ['Raised constructions', s.construction ? 3 : 0]);
  }
  const deduction = rows.reduce((sum, row) => sum + row[1], 0);
  return { units, withParts, withoutParts, rows, deduction, score: Math.max(0, 100 - deduction) };
}

function history(units) {
  const dot = (item) => `<i class="dot ${item.kind === 'with' ? 'full' : 'hollow'} ${item.step ? 'step' : ''}">${item.step && item.dur >= 8 ? `${Math.round(item.dur)}s` : item.step ? 'S' : ''}</i>`;
  return units.map((unit) => unit.part
    ? `<span class="part ${unit.kind === 'with' ? 'good' : 'bad'}">${unit.items.map(dot).join('')}</span>`
    : dot(unit.items[0])).join('') || '<em class="empty">(empty)</em>';
}

const scoreBar = (c, extra) => `<footer class="foot">
  <div class="foot-total wide"><strong class="warn">−${t2(c.deduction)}</strong><strong class="score-blue">${t2(c.score)}</strong></div>${extra}
</footer>`;

function stageOne(s, r) {
  const c = compute(s, r);
  const group = r.discipline === 'ensemble';
  return `
    <section class="hist">
      <div class="hist-head"><span>HISTORY · parts <b class="good-text">${c.withParts}</b> / <b class="bad-text">${c.withoutParts}</b></span><span>${c.rows[0][1] ? `Idea −${t(c.rows[0][1])}` : 'Idea OK'}</span></div>
      <div class="chips dots">${history(c.units)}</div>
    </section>
    <section class="art-board ${group ? 'is-group' : ''}">
      <div class="art-col">
        <button class="art good" data-act="with">WITH CHARACTER</button>
        <button class="art bad" data-act="without">WITHOUT CHARACTER</button>
      </div>
      <div class="art-col">
        <button class="art dark ${s.stepStart ? 'running' : ''}" data-act="step"><span>DANCE STEPS</span><b>${s.entries.filter((e) => e.t === 'step').length}</b><small data-live="step"></small></button>
        <button class="art dark" data-act="dynamics"><span>DYNAMICS</span><b>${s.dynamics}</b></button>
        <button class="art dark ${s.intStart ? 'running' : ''}" data-act="interruption"><span>INTERRUPTION / LOSS</span><small data-live="int"></small></button>
      </div>
      <div class="art-col">
        <button class="art bad" data-act="connections"><span>CONNECTIONS</span><b>${t(Math.min(20, s.connections))}</b></button>
        <button class="art bad" data-act="rhythm"><span>RHYTHM</span><b>${t(Math.min(20, s.rhythm))}</b></button>
        ${group ? `<div class="collective"><span>COLLECTIVE</span><div>${COLLECTIVE.map(([id, text]) => `<button class="mini ${s.collective[id] ? 'on' : ''}" data-act="collective" data-k="${id}">${text}</button>`).join('')}</div></div>
        <div class="art-row"><button class="art bad small ${s.contact ? 'chosen' : ''}" data-act="flag" data-k="contact">CONTACT<small>−0.3</small></button><button class="art bad small ${s.construction ? 'chosen' : ''}" data-act="flag" data-k="construction">RAISED CONSTRUCTIONS<small>−0.3</small></button></div>` : ''}
      </div>
    </section>
    ${scoreBar(c, `<button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>↶ Undo</button><button class="foot-btn" data-act="reset">Reset</button><button class="foot-btn primary" data-act="next">NEXT →</button>`)}`;
}

function stageTwo(s, r) {
  const c = compute(s, r);
  const group = r.discipline === 'ensemble';
  const singleButton = ([id, text, values]) => `<div class="single"><span>${text}</span><div>${values.map((v) => `<button class="mini ${s.singles[id] === v ? 'on bad-on' : ''}" data-act="single" data-k="${id}" data-v="${v}">${t(v)}</button>`).join('')}</div></div>`;
  return `
    <section class="check">
      <div class="check-top"><div><small>Deduction</small><strong class="warn">−${t2(c.deduction)}</strong></div><div><small>Score</small><strong class="score-blue">${t2(c.score)}</strong></div>
        <button class="variety ${s.variety ? 'on' : ''}" data-act="variety">${s.variety ? '✓ ' : ''}Variety in character</button></div>
      <h4>Single deductions</h4>
      <div class="singles">${SINGLES.map(singleButton).join('')}</div>
      ${group ? `<h4>Group deductions</h4><div class="singles">${GROUP_SINGLES.map(singleButton).join('')}</div>` : ''}
      <h4>Counted on the panel</h4>
      <div class="recap">${c.rows.map(([name, value]) => `<div><span>${name}</span><b class="${value ? 'bad-text' : 'good-text'}">${value ? '−' : ''}${t(value)}</b></div>`).join('')}</div>
    </section>
    <footer class="foot"><button class="foot-btn big" data-act="back">Back</button><button class="foot-btn primary big-send" data-act="send">Send score</button></footer>`;
}

function live(s) {
  const seconds = (from) => (from ? `● ${((Date.now() - from) / 1000).toFixed(1)} s` : '');
  return { step: seconds(s.stepStart), int: seconds(s.intStart) };
}

export default function (r) {
  mount(r, {
    initial: {
      stage: 1, entries: [], dynamics: 0, connections: 0, rhythm: 0, stepStart: null, intStart: null,
      longInterruption: false, collective: {}, contact: false, construction: false, variety: false, singles: {}, undo: [],
    },
    view: (s) => (s.stage === 1 ? stageOne(s, r) : stageTwo(s, r)),
    live,
    actions: {
      with: (s) => { s.entries.push({ t: 'with' }); },
      without: (s) => { s.entries.push({ t: 'without' }); },
      step: (s) => {
        if (!s.stepStart) { s.stepStart = Date.now(); return; }
        s.entries.push({ t: 'step', dur: (Date.now() - s.stepStart) / 1000 });
        s.stepStart = null;
      },
      dynamics: (s) => { s.dynamics += 1; },
      interruption: (s) => {
        if (!s.intStart) { s.intStart = Date.now(); return; }
        const seconds = (Date.now() - s.intStart) / 1000;
        s.intStart = null;
        if (seconds < 4) s.rhythm += Math.max(1, Math.ceil(seconds));
        else if (seconds > 8) s.longInterruption = true;
      },
      connections: (s) => { s.connections = Math.min(20, s.connections + 1); },
      rhythm: (s) => { s.rhythm = Math.min(20, s.rhythm + 1); },
      collective: (s, d) => { s.collective[d.k] = !s.collective[d.k]; },
      flag: (s, d) => { s[d.k] = !s[d.k]; },
      single: (s, d) => { s.singles[d.k] = s.singles[d.k] === Number(d.v) ? 0 : Number(d.v); },
      variety: (s) => { s.variety = !s.variety; },
      next: (s) => { s.stage = 2; return false; },
      back: (s) => { s.stage = 1; return false; },
      send: (s, d, ctx) => {
        const c = compute(s, r);
        ctx.send({ panel: 'artistry', deduction: c.deduction / 10, score: c.score / 10 });
        return false;
      },
    },
  });
}
