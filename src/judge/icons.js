const coilPath = 'M4 32C4 14 13 14 13 32C13 14 22 14 22 32C22 14 31 14 31 32C31 14 40 14 40 32C40 14 44 14 44 32';
const arrowHead = (x, y, a) => `<path transform="rotate(${a} ${x} ${y})" d="M${x - 11} ${y - 10}L${x} ${y}L${x - 11} ${y + 10}"/>`;

const P = {
  coil: `<path d="${coilPath}" transform="translate(0 -2) scale(1 .8)"/>`,
  coilBase: `<path d="${coilPath}" transform="translate(0 -6) scale(1 .8)"/><path d="M4 36H44"/>`,
  circle: '<circle cx="24" cy="24" r="14"/>',
  circleBar: '<circle cx="24" cy="24" r="14"/><path d="M10 24H38"/>',
  hoopBase: '<circle cx="24" cy="22" r="14"/><path d="M24 8V36M8 36H40"/>',
  rings: '<circle cx="17" cy="24" r="11"/><circle cx="31" cy="24" r="11"/>',
  ringsBig: '<circle cx="19" cy="24" r="15"/><circle cx="29" cy="24" r="15"/>',
  throughBar: '<path d="M4 24H17M31 24H44"/><circle cx="24" cy="24" r="7"/>',
  arrowR: `<path d="M6 24H42"/>${arrowHead(42, 24, 0)}`,
  arrowUR: `<path d="M8 40L38 10"/>${arrowHead(38, 10, -45)}`,
  arrowD: `<path d="M24 6V42"/>${arrowHead(24, 42, 90)}`,
  arrowRR: `<path d="M4 24H40M4 24"/><path d="M20 12L32 24L20 36M30 12L42 24L30 36"/>`,
  arrowURR: `<path d="M6 36L30 12M14 44L38 20"/>${arrowHead(30, 12, -45)}${arrowHead(38, 20, -45)}`,
  arrowDD: '<path d="M24 6V38"/><path d="M12 24L24 36L36 24M12 12L24 24L36 12" transform="translate(0 4)"/>',
  x: '<path d="M10 10L38 38M38 10L10 38"/>',
  vee: '<path d="M8 10L24 38L40 10"/>',
  catchDown: '<path d="M24 6V28"/><path d="M10 26A14 14 0 0 0 38 26"/>',
  bounceArrow: `<path d="M12 8V32L36 12"/>${arrowHead(36, 12, -38)}`,
  circleSlash: `<circle cx="22" cy="28" r="13"/><path d="M12 38L38 12"/>${arrowHead(38, 12, -45)}`,
  dotLine: '<path d="M16 24H44"/><circle cx="12" cy="24" r="5" fill="currentColor"/>',
  dotLineArrow: '<path d="M18 20H44"/><circle cx="14" cy="20" r="5" fill="currentColor"/><path d="M10 38L14 28M10 33L10 38L15 36"/>',
  barDotArrow: '<path d="M4 20H44"/><circle cx="24" cy="20" r="5" fill="currentColor"/><path d="M18 40L23 29M18 34L18 40L23 38"/>',
  lineDots: '<path d="M4 24H42"/><circle cx="16" cy="24" r="4.5" fill="currentColor"/><circle cx="40" cy="24" r="4.5" fill="currentColor"/>',
  zigzag: '<path d="M4 30L12 18L20 30L28 18L36 30L44 18"/>',
  arch: '<path d="M4 38H12Q14 38 14 34V20A10 10 0 0 1 34 20V34Q34 38 36 38H44"/>',
  loopArrow: `<path d="M12 38C6 30 14 26 17 30C20 34 14 38 12 34C10 30 20 26 30 18"/>${arrowHead(31, 17, -40)}`,
  snake: '<path d="M10 34C18 36 36 30 38 22C40 14 28 12 28 20C28 26 38 28 42 22M10 34L14 26M10 34L18 36"/>',
  spiralDouble: '<path d="M10 6C4 10 18 12 12 16C6 20 18 22 12 26C6 30 18 32 12 36C6 40 16 42 12 44"/><path d="M30 6C24 10 38 12 32 16C26 20 38 22 32 26C26 30 38 32 32 36C26 40 36 42 32 44"/>',
  zigzagV: '<path d="M16 6L30 14L16 22L30 30L16 38"/>',
  curveArrow: `<path d="M8 38C16 40 34 34 36 16"/>${arrowHead(36, 14, -80)}`,
};

export const iconKeys = Object.keys(P);

const IMAGES = new Set(['coil', 'circleBar', 'circle', 'throughBar', 'coilBase', 'hoopBase', 'rings', 'arrowR', 'arrowUR', 'circleSlash', 'arrowD', 'catchDown', 'vee', 'bounceArrow', 'x', 'arrowRR', 'lineDots', 'arrowURR', 'arrowDD', 'spiralSingle', 'spiralDouble', 'zigzagV', 'snake', 'loopArrow', 'curveArrow', 'zigzag', 'arch', 'barDotArrow', 'dotLineArrow', 'dotLine']);

export function icon(key) {
  if (key.includes('+')) return key.split('+').map(icon).join('');
  if (IMAGES.has(key)) return `<img class="ico img" src="${import.meta.env.BASE_URL}icons/${key}.png" alt="" draggable="false">`;
  return P[key]
    ? `<svg class="ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[key]}</svg>`
    : key;
}
