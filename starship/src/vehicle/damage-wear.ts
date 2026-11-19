import { CONFIG } from '../config';
import { hash12 } from '../site/terrain';

/**
 * Wear model shared by the CPU tile placement and the GPU tile shell: deterministic per-cell hashes
 * decide missing, chipped and scorched tiles, plus GLSL helpers for scuffs at the catch pins and grid
 * fin bolts. Fractions come from CONFIG.vehicle.tiles.
 */
export interface TileWear {
  missing: boolean;
  chipped: number; // 0/1
  scorched: number; // 0..1
  shade: number; // albedo multiplier
  seed: number;
}

export function tileWear(col: number, row: number): TileWear {
  const t = CONFIG.vehicle.tiles;
  const h1 = hash12(col * 1.7 + 0.31, row * 2.3 + 0.77);
  const h2 = hash12(col * 3.1 + 5.0, row * 1.3 + 9.0);
  const h3 = hash12(col * 0.7 + 11.0, row * 4.1 + 2.0);
  return {
    missing: h1 < t.missingFraction,
    chipped: h2 < t.chippedFraction ? 1 : 0,
    scorched: h3 < t.scorchedFraction ? 0.5 + h3 / t.scorchedFraction * 0.5 : 0,
    shade: 0.86 + 0.28 * hash12(col + 101.0, row + 7.0),
    seed: hash12(col * 7.0 + 3.0, row * 11.0 + 1.0),
  };
}

/** GLSL twin of the missing-tile test (hash12 must be in scope). */
export const TILE_WEAR_GLSL = /* glsl */ `
bool tileMissing(float col, float row) { return hash12(vec2(col * 1.7 + 0.31, row * 2.3 + 0.77)) < ${CONFIG.vehicle.tiles.missingFraction.toFixed(4)}; }
`;

/** Scuff marks around a local point (e.g. catch pins), darkening and roughening the steel. */
export const SCUFF_GLSL = /* glsl */ `
float scuff(vec3 p, vec3 c, float r) {
  float d = length(p - c) / r;
  float n = gnoise3(p * 9.0) * 0.5 + 0.5;
  return smoothstep(1.0, 0.3, d + n * 0.4);
}
`;
