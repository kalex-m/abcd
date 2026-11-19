/**
 * Heat haze (Section 9.6) is distributed over three producers that all render into the composer's
 * quarter-resolution heat buffer (R = heat, consumed by the combine pass as a gradient offset with
 * animated noise, strength CONFIG.post.heatHazeStrength):
 *  - plume.ts: the plume bounding volume writes exp-decaying heat around the exhaust,
 *  - shockwave.ts: the acoustic ring and the compression halo,
 *  - camera poses: per-shot `heat` multipliers (strong in the long-lens shot 4).
 * This module exposes the shared tuning so all producers agree.
 */
import { CONFIG } from '../config';

export const HEAT = {
  /** UV offset scale applied in the combine pass */
  strength: CONFIG.post.heatHazeStrength,
  /** distance (m) beyond which plume heat fades out */
  fadeDistance: 3000,
};
