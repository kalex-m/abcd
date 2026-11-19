import { CONFIG } from '../config';

/**
 * U.S. Standard Atmosphere 1976 up to 86 km (7 geopotential layers), then an exponential tail to 200 km.
 * All inputs are geometric altitude above mean sea level in metres.
 */

const R_AIR = 287.053; // J/(kg K)
const GAMMA = 1.4;
const R0 = 6_356_766; // m, effective Earth radius used by USSA76 for geopotential altitude
const G0 = 9.80665;

// Base geopotential heights (m), lapse rates (K/m)
const HB = [0, 11000, 20000, 32000, 47000, 51000, 71000, 84852];
const LB = [-0.0065, 0, 0.001, 0.0028, 0, -0.0028, -0.002, 0];
const TB: number[] = [288.15];
const PB: number[] = [101325];
for (let i = 1; i < HB.length; i++) {
  const dh = HB[i] - HB[i - 1];
  const t0 = TB[i - 1];
  const l = LB[i - 1];
  const t1 = t0 + l * dh;
  const p1 = l === 0 ? PB[i - 1] * Math.exp((-G0 * dh) / (R_AIR * t0)) : PB[i - 1] * Math.pow(t1 / t0, -G0 / (R_AIR * l));
  TB.push(t1);
  PB.push(p1);
}

export interface AtmosphereSample {
  /** Temperature (K) */
  T: number;
  /** Pressure (Pa) */
  p: number;
  /** Density (kg/m^3) */
  rho: number;
  /** Speed of sound (m/s) */
  a: number;
}

const tail86 = (() => {
  // values at 86 km geometric for the tail
  const s = layered(86000);
  return s;
})();

function layered(hGeom: number): AtmosphereSample {
  const h = (R0 * hGeom) / (R0 + hGeom); // geopotential
  let i = 0;
  while (i < HB.length - 1 && h >= HB[i + 1]) i++;
  const dh = h - HB[i];
  const l = LB[i];
  const T = TB[i] + l * dh;
  const p = l === 0 ? PB[i] * Math.exp((-G0 * dh) / (R_AIR * TB[i])) : PB[i] * Math.pow(T / TB[i], -G0 / (R_AIR * l));
  const rho = p / (R_AIR * T);
  return { T, p, rho, a: Math.sqrt(GAMMA * R_AIR * T) };
}

/** Atmospheric state at geometric altitude h (m, above MSL). Clamped below at -500 m. */
export function atmosphere(h: number): AtmosphereSample {
  const hh = Math.max(-500, h);
  if (hh <= 86000) return layered(hh);
  // Exponential tail: scale height grows with altitude to mimic thermospheric heating.
  const dz = Math.min(hh, 200000) - 86000;
  const H = 5600 + dz * 0.045; // m
  const factor = Math.exp(-dz / H);
  const T = Math.min(186.87 + dz * 0.004, 900);
  const p = tail86.p * factor;
  const rho = tail86.rho * factor * (186.87 / T) * 1.2;
  return { T, p, rho, a: Math.sqrt(GAMMA * R_AIR * T) };
}

/** Gravitational acceleration (m/s^2) at altitude h (m). */
export function gravity(h: number): number {
  const R = CONFIG.planet.radius;
  return CONFIG.planet.g0 * Math.pow(R / (R + h), 2);
}

/** Sea-level pressure, Pa. */
export const P0 = 101325;
