import { mount, t } from './core.js';
import { limitsFor } from './settings.js';

const SINGLES = [
  ['body', 'BODY', [3, 6]], ['face', 'FACE', [3]], ['space', 'SPACE', [3]],
  ['end', 'END', [3]], ['music', 'MUSIC', [3]], ['intro', 'INTRO', [3]],
];
const GROUP_SINGLES = [['patterns', 'Patterns', [3]], ['amplitude', 'Amplitude', [3]], ['noapp', 'No app. 5s+', [3]], ['startend', 'Start/end pos.', [6]]];
const COLLECTIVE = [['choral', 'Choral'], ['synch', 'Synch'], ['canon', 'Canon'], ['contr', 'Contr']];

function timelineFor(s) {
  if (Array.isArray(s.timeline) && (s.timeline.length || !(s.entries?.length || s.historyMarks?.length))) return s.timeline;
  const fromState = (state) => [
    ...(state.entries || []).map((entry, index) => ({ type: 'entry', index })),
    ...(state.historyMarks || []).map((mark, index) => ({ type: 'mark', index })),
  ];
  const snapshots = (s.undo || []).map((snapshot) => JSON.parse(snapshot));
  if (!snapshots.length) return fromState(s);

  const first = snapshots[0];
  const timeline = Array.isArray(first.timeline) ? [...first.timeline] : fromState(first);
  let entryCount = first.entries?.length || 0;
  let markCount = first.historyMarks?.length || 0;
  snapshots.slice(1).concat(s).forEach((state) => {
    for (let index = entryCount; index < (state.entries?.length || 0); index += 1) {
      timeline.push({ type: 'entry', index });
    }
    for (let index = markCount; index < (state.historyMarks?.length || 0); index += 1) {
      timeline.push({ type: 'mark', index });
    }
    entryCount = state.entries?.length || 0;
    markCount = state.historyMarks?.length || 0;
  });
  return timeline;
}

function ensureTimeline(s) {
  s.timeline = timelineFor(s);
}

function addEntry(s, entry) {
  ensureTimeline(s);
  const index = s.entries.length;
  s.entries.push(entry);
  s.timeline.push({ type: 'entry', index });
}

function addHistoryMark(s, type, value) {
  ensureTimeline(s);
  if (!Array.isArray(s.historyMarks)) s.historyMarks = [];
  const index = s.historyMarks.length;
  s.historyMarks.push({ type, value });
  s.timeline.push({ type: 'mark', index });
}

// Groups consecutive presses by 3; a dance step of 8 s or more is a part on its own.
function analyse(entries) {
  const units = [];
  let pending = [];
  let kind = null;
  const flush = () => { pending.forEach((item) => units.push({ items: [item] })); pending = []; kind = null; };
  let withParts = 0;
  let withoutParts = 0;

  entries.forEach((entry, idx) => {
    if (entry.invalid) {
      units.push({ invalid: true, items: [{ kind: 'with', step: true, dur: entry.dur, idx }] });
      return;
    }
    if (entry.t === 'step' && entry.dur >= 8) {
      flush();
      units.push({ part: true, kind: 'with', items: [{ kind: 'with', step: true, dur: entry.dur, idx }] });
      withParts += 1;
      return;
    }
    const current = entry.t === 'without' ? 'without' : 'with';
    const item = { kind: current, step: entry.t === 'step', dur: entry.dur, symbol: entry.symbol, idx };
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

  const steps = s.entries.filter((entry) => entry.t === 'step' && entry.dur >= 8 && !entry.invalid).length;
  const requiredSteps = limitsFor(r).danceSteps;
  const requiredDynamics = limitsFor(r).dynamics;
  const rhythm = Math.min(20, s.rhythm);
  const connections = Math.min(20, s.connections);
  const singles = Object.values(s.singles).reduce((sum, value) => sum + value, 0);
  const missingCollective = group ? COLLECTIVE.filter(([id]) => !s.collective[id]).length : 0;

  const rows = [
    [`Idea: ${withParts} with / ${withoutParts} without character${s.variety ? '' : ' Â· no variety'}`, character],
    [`Dance steps (${steps}/${requiredSteps})`, Math.max(0, requiredSteps - steps) * 3],
    [`Dynamics (${s.dynamics}/${requiredDynamics})`, Math.max(0, requiredDynamics - s.dynamics) * 3],
    ['Connections', connections],
    ['Rhythm', rhythm],
    ['Interruption', s.longInterruption ? 6 : 0],
    ['Single deductions', singles],
  ];
  if (group) {
    rows.push(['Collective works', missingCollective * 3], ['Contact', s.contact ? 3 : 0], ['Raised constructions', s.construction ? 3 : 0]);
  }
  const deduction = rows.reduce((sum, row) => sum + row[1], 0);
  return { units, withParts, withoutParts, rows, deduction, score: Math.max(0, 100 - deduction) };
}

function history(units, entries, marks, timeline) {
  const dot = (item, dead) => {
    const symbol = item.step ? 'S' : '';
    const duration = item.step ? `${item.dur >= 8 ? Math.round(item.dur) : item.dur.toFixed(1)}s` : '';
    return `<i class="dot ${item.kind === 'with' ? 'full' : 'hollow'} ${item.step ? 'step' : ''} ${dead ? 'invalid' : ''}" ${item.step ? `data-act="invalidate" data-idx="${item.idx}" title="${dead ? 'Restore' : 'Invalidate'} dance step Â· ${duration}"` : ''}>${symbol}</i>`;
  };
  const entryUnits = new Map();
  units.forEach((unit) => unit.items.forEach((item, index) => entryUnits.set(item.idx, { unit, item, index })));
  const renderEntry = (index) => {
    const visual = entryUnits.get(index);
    if (!visual || !entries[index]) return '';
    const { unit, item, index: itemIndex } = visual;
    const tone = unit.part ? (unit.kind === 'with' ? 'good' : 'bad') : '';
    const segment = unit.part ? `part-segment ${itemIndex === 0 ? 'first' : ''} ${itemIndex === unit.items.length - 1 ? 'last' : ''}` : '';
    return `<span class="art-timeline-entry ${tone} ${segment}">${dot(item, unit.invalid)}</span>`;
  };
  const renderMark = (index) => {
    const mark = marks[index];
    if (!mark) return '';
    if (['dynamics', 'dynamic-change'].includes(mark.type)) return '<span class="art-history-mark dynamics">Dynamic changes</span>';
    if (mark.type === 'effect') return '<span class="art-history-mark effect">Effect</span>';
    if (mark.type === 'connections') return '<span class="art-history-mark connections">Connection</span>';
    if (mark.type === 'rhythm') return '<span class="art-history-mark rhythm">Rhythm</span>';
    return `<span class="art-history-mark ${mark.type}">Interruption</span>`;
  };
  const columns = timeline.map((event) => `<div class="art-timeline-column">
    <div class="art-timeline-lane character-lane">${event.type === 'entry' ? renderEntry(event.index) : ''}</div>
    <div class="art-timeline-lane deduction-lane">${event.type === 'mark' ? renderMark(event.index) : ''}</div>
  </div>`).join('');
  const empty = timeline.length ? '' : `<div class="art-timeline-column">
    <div class="art-timeline-lane character-lane"><em class="empty">(empty)</em></div>
    <div class="art-timeline-lane deduction-lane"><em class="empty">(empty)</em></div>
  </div>`;
  return `<div class="art-timeline">
    <div class="art-timeline-labels"><span>CHARACTER</span><span>DEDUCTIONS</span></div>
    <div class="art-timeline-scroll"><div class="art-timeline-grid">${columns || empty}</div></div>
  </div>`;
}

const scoreBar = (c, extra) => `<footer class="foot">
  <div class="foot-total wide"><strong class="warn">âˆ’${t(c.deduction)}</strong><strong class="score-blue">${t(c.score)}</strong></div>${extra}
</footer>`;

function stageOne(s, r) {
  const c = compute(s, r);
  const group = r.discipline === 'ensemble';
  return `
    <section class="hist">
      <div class="hist-head"><span>HISTORY Â· parts <b class="good-text">${c.withParts}</b> / <b class="bad-text">${c.withoutParts}</b></span><span>${c.rows[0][1] ? `Idea âˆ’${t(c.rows[0][1])}` : 'Idea OK'}</span></div>
      ${history(c.units, s.entries, s.historyMarks || [], timelineFor(s))}
    </section>
    <section class="art-board ${group ? 'is-group' : ''}">
      <div class="art-col">
        <button class="art good" data-act="with">WITH CHARACTER</button>
        <button class="art bad" data-act="without">WITHOUT CHARACTER</button>
      </div>
      <div class="art-col">
        <button class="art dark art-step-button ${s.stepStart ? 'running' : ''}" data-act="step"><span>DANCE STEPS</span><b>${s.entries.filter((e) => e.t === 'step' && e.dur >= 8 && !e.invalid).length}</b><small data-live="step"></small></button>
        <div class="art-dynamics-row">
          <button class="art art-standard-dynamics" data-act="dynamicChange"><span>DYNAMIC CHANGES</span><b>${s.dynamics}</b></button>
          <button class="art art-standard-effect" data-act="effect"><span>EFFECT</span></button>
        </div>
        <button class="art dark ${s.intStart ? 'running' : ''}" data-act="interruption"><span>INTERRUPTION${s.longInterruption ? ' âœ“' : ''}</span>${s.longInterruption ? '<small>âˆ’0.6 taken</small>' : ''}<small data-live="int"></small></button>
      </div>
      <div class="art-col">
        <button class="art bad art-compact-button" data-act="connections" ><span>CONNECTIONS</span><b>${t(Math.min(20, s.connections))}</b></button>
        <button class="art bad art-compact-button" data-act="rhythm" ><span>RHYTHM</span><b>${t(Math.min(20, s.rhythm))}</b></button>
        ${group ? `<div class="collective"><span>COLLECTIVE</span><div>${COLLECTIVE.map(([id, text]) => `<button class="mini ${s.collective[id] ? 'on' : ''}" data-act="collective" data-k="${id}">${text}</button>`).join('')}</div></div>
        <div class="art-row"><button class="art bad small ${s.contact ? 'chosen' : ''}" data-act="flag" data-k="contact">CONTACT<small>âˆ’0.3</small></button><button class="art bad small ${s.construction ? 'chosen' : ''}" data-act="flag" data-k="construction">RAISED CONSTRUCTIONS<small>âˆ’0.3</small></button></div>` : ''}
      </div>
    </section>
    ${scoreBar(c, `<button class="foot-btn" data-act="undo" ${(s.undo || []).length ? '' : 'disabled'}>â†¶ Undo</button><button class="foot-btn" data-act="reset">Reset</button><button class="foot-btn primary" data-act="next">NEXT â†’</button>`)}`;
}

function stageTwo(s, r) {
  const c = compute(s, r);
  const group = r.discipline === 'ensemble';
  const singleButton = ([id, text, values]) => `<div class="single"><span>${text}</span><div>${values.map((v) => `<button class="mini ${s.singles[id] === v ? 'on bad-on' : ''}" data-act="single" data-k="${id}" data-v="${v}">${t(v)}</button>`).join('')}</div></div>`;
  return `
    <section class="check">
      <div class="check-top"><div><small>Deduction</small><strong class="warn">âˆ’${t(c.deduction)}</strong></div><div><small>Score</small><strong class="score-blue">${t(c.score)}</strong></div>
        <button class="variety ${s.variety ? 'on' : ''}" data-act="variety">${s.variety ? 'âœ“ ' : ''}Variety in character</button></div>
      <h4>Single deductions</h4>
      <div class="singles">${SINGLES.map(singleButton).join('')}</div>
      ${group ? `<h4>Group deductions</h4><div class="singles">${GROUP_SINGLES.map(singleButton).join('')}</div>` : ''}
      <h4>Counted on the panel</h4>
      <div class="recap">${c.rows.map(([name, value]) => `<div><span>${name}</span><b class="${value ? 'bad-text' : 'good-text'}">${value ? 'âˆ’' : ''}${t(value)}</b></div>`).join('')}</div>
    </section>
    <footer class="foot"><button class="foot-btn big" data-act="back">Back</button><button class="foot-btn primary big-send" data-act="send">Send score</button></footer>`;
}

function live(s) {
  const seconds = (from) => (from ? `â— ${((Date.now() - from) / 1000).toFixed(1)} s` : '');
  return { step: seconds(s.stepStart), int: seconds(s.intStart) };
}

function createTimelineFollower() {
  let previousTimelineLength = -1;
  let timelineScrollLeft = 0;
  return (s, root) => {
    const scroll = root.querySelector('.art-timeline-scroll');
    if (!scroll) return;

    const length = timelineFor(s).length;
    if (length > previousTimelineLength) {
      scroll.scrollLeft = scroll.scrollWidth;
      timelineScrollLeft = scroll.scrollLeft;
    } else {
      scroll.scrollLeft = timelineScrollLeft;
    }
    previousTimelineLength = length;
    scroll.addEventListener('scroll', () => {
      timelineScrollLeft = scroll.scrollLeft;
    }, { passive: true });
  };
}

export default function (r) {
  const followTimeline = createTimelineFollower();
  mount(r, {
    initial: {
      stage: 1, entries: [], dynamics: 0, connections: 0, rhythm: 0, historyMarks: [], timeline: [], stepStart: null, intStart: null,
      longInterruption: false, collective: {}, contact: false, construction: false, variety: false, singles: {}, undo: [],
    },
    view: (s) => (s.stage === 1 ? stageOne(s, r) : stageTwo(s, r)),
    live,
    afterDraw: followTimeline,
    actions: {
      with: (s) => { addEntry(s, { t: 'with' }); },
      without: (s) => { addEntry(s, { t: 'without' }); },
      dynamicChange: (s) => { s.dynamics += 1; addHistoryMark(s, 'dynamic-change', 1); },
      effect: (s) => { s.dynamics += 1; addHistoryMark(s, 'effect', 1); },
      step: (s) => {
        if (!s.stepStart) { s.stepStart = Date.now(); return; }
        addEntry(s, { t: 'step', dur: (Date.now() - s.stepStart) / 1000 });
        s.stepStart = null;
      },
      invalidate: (s, d) => { const e = s.entries[Number(d.idx)]; if (e) e.invalid = !e.invalid; },
      interruption: (s) => {
        if (!s.intStart) { s.intStart = Date.now(); return; }
        const seconds = (Date.now() - s.intStart) / 1000;
        s.intStart = null;
        if (s.longInterruption || seconds < 4) {
          const value = Math.max(1, Math.ceil(seconds));
          s.rhythm += value;
          addHistoryMark(s, 'rhythm', value);
        }
        else {
          s.longInterruption = true;
          addHistoryMark(s, 'interruption', 6);
        }
      },
      connections: (s) => {
        if (s.connections >= 20) return false;
        s.connections += 1;
        addHistoryMark(s, 'connections', 1);
      },
      rhythm: (s) => {
        if (s.rhythm >= 20) return false;
        s.rhythm += 1;
        addHistoryMark(s, 'rhythm', 1);
      },
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
