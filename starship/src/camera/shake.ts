import { CONFIG } from '../config';
import { hash1 } from '../util/rng';

/**
 * Layered procedural shake (Section 11.4): low-frequency rumble (0.5-8 Hz) scaled by delayed thrust,
 * high-frequency vibration (20-60 Hz) for close cameras, and damped-sine impulses (ignition, liftoff,
 * staging). Deterministic: noise is a pure function of cinematic time.
 */
function n1(t: number, seed: number): number {
  // smooth 1D value noise
  const i = Math.floor(t), f = t - i;
  const a = hash1(i * 7919 + seed) * 2 - 1, b = hash1((i + 1) * 7919 + seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

function band(t: number, f0: number, f1: number, seed: number): number {
  let s = 0, w = 0;
  const n = 4;
  for (let k = 0; k < n; k++) {
    const f = f0 * Math.pow(f1 / f0, k / (n - 1));
    const a = 1 / (1 + k * 0.6);
    s += a * n1(t * f, seed + k * 131);
    w += a;
  }
  return s / w;
}

export interface ShakeOut {
  yaw: number; pitch: number; roll: number; // rad
  dx: number; dy: number; dz: number; // m
}

/** Attenuation of ground/air vibration with distance d (m). */
export function shakeAttenuation(d: number): number {
  const s = CONFIG.camera.shake;
  return 1 / (1 + Math.pow(d / s.attenuationRef, s.attenuationExp));
}

/**
 * @param t cinematic time (noise clock)
 * @param thrustNorm delayed normalised thrust 0..1+
 * @param d distance to the source (m)
 * @param impulses list of [age s] of impulsive events as heard at the camera
 * @param handheld true for handheld cameras (positional shake, pivot behind the sensor)
 * @param close 0..1 weight of high-frequency vibration
 */
export function computeShake(t: number, thrustNorm: number, d: number, impulses: number[], handheld: boolean, close: number, gain: number): ShakeOut {
  const s = CONFIG.camera.shake;
  const att = shakeAttenuation(d);
  const low = s.lowAmp * thrustNorm * att * gain * 4;
  const hi = s.highAmp * thrustNorm * att * close * gain * 4;
  let imp = 0;
  for (const age of impulses) {
    if (age < 0 || age > 3) continue;
    imp += Math.exp(-age / s.impulseDecay) * Math.sin(age * 2 * Math.PI * 9) * att * gain * 0.02;
  }
  const yaw = low * band(t, 0.5, 8, 11) + hi * band(t, 20, 60, 13) + imp * 0.6;
  const pitch = low * band(t, 0.6, 7, 17) + hi * band(t, 22, 55, 19) + imp;
  const roll = low * 0.4 * band(t, 0.4, 5, 23);
  const handAmp = handheld ? 1 : 0;
  // gentle handheld breathing even without thrust
  const breath = handheld ? 0.0012 * gain : 0;
  return {
    yaw: yaw + breath * band(t, 0.15, 0.8, 29),
    pitch: pitch + breath * band(t, 0.12, 0.7, 31),
    roll: roll + breath * 0.5 * band(t, 0.1, 0.5, 37),
    dx: handAmp * (s.lowPos * thrustNorm * att * gain * 4 * band(t, 0.7, 6, 41) + 0.004 * gain * band(t, 0.2, 1, 43)),
    dy: handAmp * (s.lowPos * thrustNorm * att * gain * 4 * band(t, 0.8, 7, 47) + 0.003 * gain * band(t, 0.2, 1, 53)),
    dz: handAmp * 0.002 * gain * band(t, 0.2, 1, 59),
  };
}
