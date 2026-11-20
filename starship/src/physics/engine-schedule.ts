import { CONFIG } from '../config';
import { smootherstep, clamp } from '../util/math';

/**
 * Per-engine on/off envelopes for the booster (33) and ship (6). The integrator sums them for thrust;
 * the visuals read them per engine for plumes, glow and gimbal. Indices:
 *  booster 0..2 center, 3..12 inner ring, 13..32 outer ring. Ship 0..2 sea-level, 3..5 vacuum.
 */

export const BOOSTER_CENTER = [0, 1, 2];
export const BOOSTER_INNER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const BOOSTER_OUTER = Array.from({ length: 20 }, (_, i) => 13 + i);
export const BOOSTER_13 = [...BOOSTER_CENTER, ...BOOSTER_INNER];

export interface BurnWindow {
  /** engine indices */
  engines: number[];
  /** per-engine start times (s) */
  on: number[];
  /** per-engine stop times (s) */
  off: number[];
}

/** Return-phase event times produced by the booster guidance (filled after integration). */
export interface ReturnEvents {
  boostbackStart: number;
  boostbackEnd: number;
  boostback13to3: number;
  entryStart: number;
  entryEnd: number;
  landingStart: number;
  landing13to3: number;
  catchT: number;
}

export const IGNITION = {
  center: -8.2, // s
  inner: -7.5, // s
  innerStagger: 0.06, // s
  outer: -6.5, // s
  outerStagger: 0.04, // s
  fullThrust: -4.0, // s
};

/** Engine start/stop table for the booster ascent (independent of the guidance). */
export function boosterAscentWindows(): { on: number[]; off: number[] } {
  const p = CONFIG.physics;
  const on: number[] = new Array(33).fill(0);
  const off: number[] = new Array(33).fill(0);
  BOOSTER_CENTER.forEach((e) => (on[e] = IGNITION.center));
  BOOSTER_INNER.forEach((e, i) => (on[e] = IGNITION.inner + i * IGNITION.innerStagger));
  BOOSTER_OUTER.forEach((e, i) => (on[e] = IGNITION.outer + i * IGNITION.outerStagger));
  // MECO: outer 20 off staggered over 0.8 s, inner 10 0.3 s after, centre 3 run through hot staging +0.5 s.
  BOOSTER_OUTER.forEach((e, i) => (off[e] = p.mecoT + (i / 19) * 0.8));
  BOOSTER_INNER.forEach((e) => (off[e] = p.mecoT + 0.8 + 0.3));
  BOOSTER_CENTER.forEach((e) => (off[e] = p.hotStageT + 0.5));
  for (const eo of CONFIG.engines.engineOuts) if (eo.id >= 0 && eo.id < 33) off[eo.id] = Math.min(off[eo.id], eo.t);
  return { on, off };
}

const ASCENT = boosterAscentWindows();

/** Smooth on/off envelope with start ramp (1.2 s) and shutdown ramp (0.4 s). */
export function envelope(t: number, on: number, off: number): number {
  if (t < on || t > off + CONFIG.engines.throttleDownRamp) return 0;
  const up = smootherstep(0, CONFIG.engines.startRamp, t - on);
  const down = 1 - smootherstep(0, CONFIG.engines.throttleDownRamp, t - off);
  return clamp(Math.min(up, down), 0, 1);
}

/**
 * Booster engine envelope (0..1, before throttle) for engine `e` at mission time t.
 * `ret` supplies the guidance-derived relight windows (may be undefined during integration of the ascent).
 */
export function boosterEngineEnvelope(e: number, t: number, ret?: ReturnEvents): number {
  let v = envelope(t, ASCENT.on[e], ASCENT.off[e]);
  if (!ret) return v;
  const is13 = e < 13;
  const isCenter = e < 3;
  if (is13) {
    // boostback: 13 engines, inner 10 shut down for the final trim on 3
    const stagger = (e % 13) * 0.08;
    const bbOff = isCenter ? ret.boostbackEnd : ret.boostback13to3;
    v = Math.max(v, envelope(t, ret.boostbackStart + stagger, bbOff));
    v = Math.max(v, envelope(t, ret.entryStart + stagger * 0.5, ret.entryEnd));
    const landOff = isCenter ? ret.catchT : ret.landing13to3;
    v = Math.max(v, envelope(t, ret.landingStart + stagger * 0.5, landOff));
  }
  return v;
}

/** Number of booster engines considered "running" (envelope > 0.5). */
export function boosterEnginesRunning(t: number, ret?: ReturnEvents): number {
  let n = 0;
  for (let e = 0; e < 33; e++) if (boosterEngineEnvelope(e, t, ret) > 0.5) n++;
  return n;
}

/** Ship engine envelope. Ship engines light at hot staging and run until SECO. */
export function shipEngineEnvelope(e: number, t: number, secoT: number): number {
  const start = CONFIG.physics.hotStageT + (e % 3) * 0.05 + (e >= 3 ? 0.12 : 0);
  return envelope(t, start - 0.4, secoT);
}

/** Pressure-compensated thrust of one Raptor sea-level engine (N) at ambient pressure p (Pa). */
export function raptorSLThrust(p: number): number {
  const ph = CONFIG.physics;
  const aExit = Math.PI * Math.pow(CONFIG.engines.bellExitDiameter / 2, 2);
  const fVac = ph.raptorSLThrust + 101325 * aExit;
  return Math.max(0, fVac - p * aExit);
}

/** Mass flow of one Raptor SL at full throttle (kg/s). */
export function raptorSLMdot(): number {
  return CONFIG.physics.raptorSLThrust / (CONFIG.physics.raptorSLIsp * CONFIG.planet.g0);
}

/** Pressure-compensated thrust of one Raptor Vacuum (N) at ambient p (Pa). Flow separation ignored. */
export function rvacThrust(p: number): number {
  const aExit = Math.PI * Math.pow(CONFIG.physics.rvacExitDiameter / 2, 2);
  return Math.max(0, CONFIG.physics.rvacThrust - p * aExit);
}

export function rvacMdot(): number {
  return CONFIG.physics.rvacThrust / (CONFIG.physics.rvacIsp * CONFIG.planet.g0);
}
