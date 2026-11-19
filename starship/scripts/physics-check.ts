/**
 * Plausibility acceptance test for the ascent model (Section 5.3). Exits non-zero when out of range.
 * Usage: npm run physics-check
 */
import { simulateMission } from '../src/physics/staging';

const t0 = performance.now();
const traj = simulateMission();
const ms = performance.now() - t0;
const at = (t: number) => traj.booster.at(t);
const s62 = at(62);
const meco = at(156);
const ev = traj.events;
const rows: [string, number, number, number, string][] = [
  ['alt@T+62 (km)', s62.alt / 1000, 11, 14, 'km'],
  ['Mach@T+62', s62.mach, 1.1, 1.6, ''],
  ['max q (kPa)', ev.maxQValue / 1000, 28, 36, 'kPa'],
  ['alt@MECO (km)', meco.alt / 1000, 62, 72, 'km'],
  ['v@MECO (m/s)', meco.speed, 1400, 1800, 'm/s'],
];
let ok = true;
console.log(`simulateMission: ${ms.toFixed(0)} ms`);
for (const [name, v, lo, hi] of rows) {
  const pass = v >= lo && v <= hi;
  ok = ok && pass;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(16)} ${v.toFixed(2).padStart(9)}   [${lo} .. ${hi}]`);
}
const fmt = (n: number) => (n > 1e8 ? 'n/a' : n.toFixed(1));
console.log('\nEvents (s):', Object.entries(ev).map(([k, v]) => `${k}=${fmt(v as number)}`).join('  '));
for (const t of [0, 4, 8, 12, 20, 30, 35, 45, 55, 62, 75, 100, 130, 150, 159]) {
  const s = at(t);
  console.log(`T+${String(t).padStart(3)}  alt ${(s.alt / 1000).toFixed(2).padStart(6)} km  dr ${(s.downrange / 1000).toFixed(1).padStart(6)} km  v ${s.speed.toFixed(0).padStart(5)}  M ${s.mach.toFixed(2)}  q ${(s.q / 1000).toFixed(1).padStart(5)} kPa  a ${s.accelG.toFixed(2)} g  thr ${s.throttle.toFixed(2)}  m ${(s.m / 1000).toFixed(0)} t  prop ${(s.prop * 100).toFixed(0)}%  fpa ${(s.fpa * 57.3).toFixed(1)}  n ${s.engines}`);
}
console.log('--- booster return');
for (let t = 160; t <= Math.min(traj.booster.t1, ev.catchT + 5); t += 15) {
  const s = at(t);
  console.log(`T+${t.toFixed(0).padStart(3)}  alt ${(s.alt / 1000).toFixed(2).padStart(6)} km  dr ${(s.downrange / 1000).toFixed(2).padStart(7)} km  v ${s.speed.toFixed(0).padStart(5)}  thr ${s.throttle.toFixed(2)}  m ${(s.m / 1000).toFixed(0)} t  prop ${(s.prop * 100).toFixed(1)}%`);
}
const c = at(ev.catchT);
console.log(`catch: T+${ev.catchT.toFixed(1)} alt ${c.alt.toFixed(2)} m  dr ${c.downrange.toFixed(2)} m  v ${c.speed.toFixed(2)}  miss-before-align ${ev.catchMissBeforeAlign.toFixed(0)} m`);
console.log('--- ship');
for (const t of [160, 200, 250, 300, 350, 400, 450, 500]) {
  const s = traj.ship.at(t);
  console.log(`T+${t}  alt ${(s.alt / 1000).toFixed(1).padStart(6)} km  dr ${(s.downrange / 1000).toFixed(0).padStart(5)} km  v ${s.speed.toFixed(0).padStart(5)}  a ${s.accelG.toFixed(2)} g  prop ${(s.prop * 100).toFixed(0)}%`);
}
process.exit(ok ? 0 : 1);
