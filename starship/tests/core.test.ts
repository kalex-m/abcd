import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateMission } from '../src/physics/staging';
import { Timeline } from '../src/timeline';
import { layoutCounts, boosterLayout, shipLayout } from '../src/vehicle/engines-layout';
import { puffBounds, windAt } from '../src/vfx/smoke-gpu';
import { CONFIG } from '../src/config';
import { atmosphere } from '../src/physics/atmosphere';

const traj = simulateMission();

test('physics acceptance (Section 5.3)', () => {
  const s62 = traj.booster.at(62);
  const meco = traj.booster.at(CONFIG.physics.mecoT);
  assert.ok(s62.alt > 11000 && s62.alt < 14000, `alt@62 ${s62.alt}`);
  assert.ok(s62.mach > 1.1 && s62.mach < 1.6, `mach@62 ${s62.mach}`);
  assert.ok(traj.events.maxQValue > 28000 && traj.events.maxQValue < 36000, `maxq ${traj.events.maxQValue}`);
  assert.ok(meco.alt > 62000 && meco.alt < 72000, `alt@meco ${meco.alt}`);
  assert.ok(meco.speed > 1400 && meco.speed < 1800, `v@meco ${meco.speed}`);
});

test('booster returns to the tower and is caught', () => {
  const ev = traj.events;
  assert.ok(ev.catchT > ev.landingStart && ev.landingStart > ev.entryEnd && ev.entryStart > ev.boostbackEnd);
  const c = traj.booster.at(ev.catchT);
  assert.ok(Math.abs(c.px) < 0.3, `catch horizontal error ${c.px}`);
});

test('US Standard Atmosphere 1976 anchors', () => {
  assert.ok(Math.abs(atmosphere(0).p - 101325) < 1);
  assert.ok(Math.abs(atmosphere(11000).T - 216.65) < 0.5);
  assert.ok(Math.abs(atmosphere(20000).p - 5529.3) < 5); // USSA76 table, 20 km geometric
});

test('timeline is monotonic and conflict-free', () => {
  const tl = new Timeline(traj.events);
  for (let i = 1; i < tl.events.length; i++) assert.ok(tl.events[i].t0 >= tl.events[i - 1].t0, 'sorted');
  for (const e of tl.events) assert.ok(e.t1 >= e.t0, `${e.id} has t1 >= t0`);
  const ids = new Set(tl.events.map((e) => e.id));
  assert.equal(ids.size, tl.events.length, 'unique ids');
  for (const t of [-90, -8, 0, 62, 158, 200, traj.events.catchT]) {
    const s = tl.at(t);
    for (const [k, v] of Object.entries(s)) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${k} finite at ${t}`);
  }
});

test('engine layout counts (33 + 6, 13 gimballing)', () => {
  const c = layoutCounts();
  assert.equal(c.booster, 33);
  assert.equal(c.boosterGimbal, 13);
  assert.equal(c.ship, 6);
  assert.equal(c.shipVac, 3);
  // no overlapping bells on the booster
  const b = boosterLayout();
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
    const d = Math.hypot(b[i].x - b[j].x, b[i].z - b[j].z);
    assert.ok(d >= (b[i].exitDiameter + b[j].exitDiameter) / 2 - 0.02, `bells ${i}/${j} overlap (${d.toFixed(2)})`);
  }
  assert.equal(shipLayout().filter((s) => s.group === 'sl').length, 3);
});

test('no NaN in the particle / puff fields over 20 s', () => {
  for (let t = -17; t <= 20; t += 0.5) {
    const b = puffBounds(t, 4096);
    for (const v of [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]) if (b.count) assert.ok(Number.isFinite(v), `puff bounds at ${t}`);
  }
  for (let h = 0; h < 20000; h += 500) for (const v of windAt(h)) assert.ok(Number.isFinite(v));
});

test('trajectory samples are finite', () => {
  for (let t = -10; t < 480; t += 1.7) {
    for (const tr of [traj.booster, traj.ship]) {
      const s = tr.at(t);
      for (const k of ['px', 'py', 'vx', 'vy', 'm', 'pitch', 'thrust'] as const) assert.ok(Number.isFinite(s[k]), `${k} at ${t}`);
    }
  }
});
