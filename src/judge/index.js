import { route } from './core.js';

const screens = {
  db: () => import('./db.js'),
  'db-expert': () => import('./db-expert.js'),
  da: () => import('./da.js'),
  'da-expert': () => import('./da-expert.js'),
  artistic: () => import('./artistic.js'),
  execution: () => import('./execution.js'),
  'execution-expert': () => import('./execution-expert.js'),
  line: () => import('./line.js'),
  timing: () => import('./timing.js'),
};

const r = route();
if (r) (r.simple ? import('./simple.js') : r.expert ? screens[`${r.mode}-expert`]() : screens[r.mode]()).then((module) => module.default(r));
