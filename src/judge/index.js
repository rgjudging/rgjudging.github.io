import { route } from './core.js';

const screens = {
  db: () => import('./db.js'),
  da: () => import('./da.js'),
  artistic: () => import('./artistic.js'),
  execution: () => import('./execution.js'),
  line: () => import('./line.js'),
  timing: () => import('./timing.js'),
};

const r = route();
if (r) (r.simple ? import('./simple.js') : screens[r.mode]()).then((module) => module.default(r));
