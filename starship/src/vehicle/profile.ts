import { CONFIG } from '../config';

/**
 * Hull radius profiles (vehicle-local y, metres). Ship: aft skirt + tank cylinder, header-tank shoulder,
 * then a tangent ogive nose cone with a blunted cap.
 */
export const R = CONFIG.vehicle.diameter / 2;
export const SHIP_CYL_TOP = CONFIG.vehicle.shipHeight - CONFIG.vehicle.noseLength; // m
const SHOULDER_Y = SHIP_CYL_TOP - 1.2;

/** Tangent ogive radius at height x (0 at the ogive base) for base radius Rb and length L. */
export function ogive(x: number, Rb: number, L: number): number {
  const rho = (Rb * Rb + L * L) / (2 * Rb);
  const xx = Math.min(Math.max(x, 0), L);
  return Math.sqrt(Math.max(0, rho * rho - (L - xx) * (L - xx))) + Rb - rho;
}

/** Ship hull radius at local height y. */
export function shipRadius(y: number): number {
  const v = CONFIG.vehicle;
  if (y < SHOULDER_Y) return R;
  const Rs = R - v.headerShoulder;
  if (y < SHIP_CYL_TOP) {
    const u = (y - SHOULDER_Y) / (SHIP_CYL_TOP - SHOULDER_Y);
    return R + (Rs - R) * (u * u * (3 - 2 * u));
  }
  const x = y - SHIP_CYL_TOP;
  const L = v.noseLength;
  const r = ogive(x, Rs, L);
  // blunt nose cap (spherical) over the last 0.6 m
  const capR = 0.65;
  const tipY = L;
  if (x > tipY - capR) {
    const d = x - (tipY - capR);
    return Math.max(0, Math.min(r + 0.15, Math.sqrt(Math.max(0, capR * capR - d * d))));
  }
  return r;
}

/** Sampled ship profile (y, r, meridian arc length t, slope angle beta). */
export function shipProfileSamples(n = 220): { y: number; r: number; t: number; beta: number }[] {
  const out: { y: number; r: number; t: number; beta: number }[] = [];
  const H = CONFIG.vehicle.shipHeight;
  let t = 0;
  let prev: [number, number] | null = null;
  for (let i = 0; i <= n; i++) {
    // denser sampling on the nose
    const u = i / n;
    const y = u < 0.55 ? (u / 0.55) * SHIP_CYL_TOP : SHIP_CYL_TOP + ((u - 0.55) / 0.45) * (H - SHIP_CYL_TOP);
    const r = shipRadius(y);
    if (prev) t += Math.hypot(y - prev[0], r - prev[1]);
    const dy = 0.01;
    const beta = Math.atan2(-(shipRadius(y + dy) - shipRadius(Math.max(0, y - dy))), 2 * dy);
    out.push({ y, r, t, beta });
    prev = [y, r];
  }
  return out;
}
