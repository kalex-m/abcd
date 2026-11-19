import { CONFIG } from '../config';
import { clamp, smoothstep, DEG } from '../util/math';

/**
 * Plume shape vs ambient pressure. Over-expanded at sea level (contracting jet with Mach diamonds),
 * under-expanded at altitude (wide bell whose half-angle grows with log of the pressure ratio).
 */
export interface PlumeShape {
  /** exit / ambient pressure ratio */
  pr: number;
  /** visible length of the merged plume (m) */
  length: number;
  /** half-angle of the outer boundary (rad, negative = contracting) */
  expansion: number;
  /** spacing of shock diamonds (m) */
  diamondSpacing: number;
  /** 0..1 visibility of diamonds */
  diamonds: number;
  /** relative emitted radiance of the core (0..1+) */
  coreBrightness: number;
  /** strength of the orange afterburning periphery 0..1 */
  afterburn: number;
  /** 0..1 how much the plume has become a diffuse vacuum fan */
  vacuum: number;
}

/**
 * @param pAmb ambient pressure (Pa)
 * @param throttle 0..1
 * @param vac true for RVac nozzles
 */
export function plumeShape(pAmb: number, throttle: number, vac = false): PlumeShape {
  const pc = CONFIG.plume;
  const pExit = vac ? pc.pExitVac : pc.pExit;
  const pr = pExit / Math.max(pAmb, 0.05);
  const lnPr = Math.log(pr);
  const maxExp = pc.maxExpansionDeg * DEG;
  const expansion = pr < 1 ? -0.05 * (1 - pr) : Math.min(maxExp, 0.105 * lnPr);
  const vacuum = smoothstep(1.5, 7.5, lnPr);
  const d = vac ? CONFIG.engines.rvacExitDiameter : CONFIG.engines.bellExitDiameter;
  const diamondSpacing = 1.2 * d * Math.sqrt(pc.mExit * pc.mExit - 1);
  const diamonds = clamp(1 - smoothstep(0.8, 2.5, pr), 0, 1);
  const length = (pc.lengthSL + (pc.lengthVac - pc.lengthSL) * vacuum) * (0.55 + 0.45 * throttle);
  const pRel = pAmb / 101325;
  const afterburn = smoothstep(0.002, 0.25, pRel);
  const coreBrightness = throttle * (0.55 + 0.45 * smoothstep(0.0, 0.3, pRel));
  return { pr, length, expansion, diamondSpacing, diamonds, coreBrightness, afterburn, vacuum };
}
