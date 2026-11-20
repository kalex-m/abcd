import { CONFIG } from '../config';

/**
 * Engine positions (vehicle-local x/z, metres) seen from below. Booster: 3 centre (gimballing, triangle,
 * circumradius 0.95 m), 10 inner (gimballing, r 2.35 m, one at 90 deg), 20 outer (fixed, r 3.75 m).
 * Ship: 3 sea-level (r 0.95 m) and 3 vacuum engines (r 2.3 m, 120 deg spacing, offset 60 deg).
 */
export type EngineGroup = 'center' | 'inner' | 'outer' | 'sl' | 'vac';
export interface EngineSlot {
  index: number;
  x: number;
  z: number;
  gimbal: boolean;
  group: EngineGroup;
  /** bell exit diameter used for this slot (m) */
  exitDiameter: number;
}

const DEG = Math.PI / 180;

function ring(n: number, r: number, startDeg: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (startDeg + (i * 360) / n) * DEG;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

export function boosterLayout(): EngineSlot[] {
  const e = CONFIG.engines;
  const slots: EngineSlot[] = [];
  ring(e.centerCount, e.centerRadius, 90).forEach(([x, z]) => slots.push({ index: slots.length, x, z, gimbal: true, group: 'center', exitDiameter: e.bellExitDiameter }));
  ring(e.innerCount, e.innerRadius, 90).forEach(([x, z]) => slots.push({ index: slots.length, x, z, gimbal: true, group: 'inner', exitDiameter: e.bellExitDiameter }));
  // outer ring: 20 fixed engines; spacing (1.18 m) is below the 1.3 m bell, so these use 1.15 m bells
  ring(e.outerCount, e.outerRadius, 90 + 9).forEach(([x, z]) => slots.push({ index: slots.length, x, z, gimbal: false, group: 'outer', exitDiameter: 1.15 }));
  return slots;
}

export function shipLayout(): EngineSlot[] {
  const e = CONFIG.engines;
  const slots: EngineSlot[] = [];
  ring(3, e.shipSLRadius, 90).forEach(([x, z]) => slots.push({ index: slots.length, x, z, gimbal: true, group: 'sl', exitDiameter: e.bellExitDiameter }));
  ring(3, e.shipVacRadius, 90 + 60).forEach(([x, z]) => slots.push({ index: slots.length, x, z, gimbal: false, group: 'vac', exitDiameter: e.rvacExitDiameter }));
  return slots;
}

/** Counts used by the tests. */
export function layoutCounts(): { booster: number; boosterGimbal: number; ship: number; shipVac: number } {
  const b = boosterLayout();
  const s = shipLayout();
  return { booster: b.length, boosterGimbal: b.filter((x) => x.gimbal).length, ship: s.length, shipVac: s.filter((x) => x.group === 'vac').length };
}
