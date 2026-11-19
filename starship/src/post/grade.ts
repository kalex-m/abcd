import * as THREE from 'three';
import { CONFIG } from '../config';
import { clamp, smoothstep } from '../util/math';

/**
 * Tone mapping (AgX after Troy Sobotka / three.js polynomial fit, or ACES fitted by Stephen Hill) and a
 * procedurally generated 33^3 creative LUT: warm highlights / teal shadows split-tone, S-curve contrast,
 * mild shadow desaturation and a lifted black point.
 */
export const TONEMAP_GLSL = /* glsl */ `
vec3 agxDefaultContrastApprox(vec3 x) {
  vec3 x2 = x * x; vec3 x4 = x2 * x2;
  return + 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}
vec3 agx(vec3 color) {
  const mat3 AgXInsetMatrix = mat3(
    vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
    vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
    vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
  const mat3 AgXOutsetMatrix = mat3(
    vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
    vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
    vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
  const float AgxMinEv = -12.47393;
  const float AgxMaxEv = 4.026069;
  color = AgXInsetMatrix * max(color, 0.0);
  color = max(color, 1e-10);
  color = log2(color);
  color = (color - AgxMinEv) / (AgxMaxEv - AgxMinEv);
  color = clamp(color, 0.0, 1.0);
  color = agxDefaultContrastApprox(color);
  color = AgXOutsetMatrix * color;
  color = pow(max(vec3(0.0), color), vec3(2.2));
  return clamp(color, 0.0, 1.0);
}
vec3 acesFitted(vec3 color) {
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color = ACESInputMat * color;
  vec3 a = color * (color + 0.0245786) - 0.000090537;
  vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
  color = ACESOutputMat * (a / b);
  return clamp(color, 0.0, 1.0);
}
vec3 linearToSRGB(vec3 c) {
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}
`;

/**
 * Build the creative grade LUT (linear in -> linear out over the tone-mapped [0,1] cube).
 * @param twilight 0..1 amount of bluish twilight shadow lift
 */
export function buildGradeLut(twilight = 0): THREE.Data3DTexture {
  const n = CONFIG.post.lutSize;
  const data = new Uint8Array(n * n * n * 4);
  const lift = CONFIG.post.shadowLift;
  let i = 0;
  for (let b = 0; b < n; b++) {
    for (let g = 0; g < n; g++) {
      for (let r = 0; r < n; r++) {
        let R = r / (n - 1), G = g / (n - 1), B = b / (n - 1);
        // to a perceptual-ish domain for the grade
        let pr = Math.pow(R, 1 / 2.2), pg = Math.pow(G, 1 / 2.2), pb = Math.pow(B, 1 / 2.2);
        const luma = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
        // gentle S-curve around mid grey
        const s = (x: number) => { const k = 1.22; const y = 0.5 + (x - 0.5) * k; return clamp(y - 0.06 * Math.sin((x - 0.5) * Math.PI * 2) * 0.25, 0, 1); };
        pr = s(pr); pg = s(pg); pb = s(pb);
        // split tone: teal shadows, warm golden highlights
        const sh = 1 - smoothstep(0.0, 0.45, luma);
        const hi = smoothstep(0.55, 1.0, luma);
        pr += -0.018 * sh + 0.035 * hi;
        pg += 0.006 * sh + 0.014 * hi;
        pb += 0.022 * sh - 0.03 * hi;
        // twilight: bluish shadow lift
        pb += 0.025 * sh * twilight;
        pr -= 0.008 * sh * twilight;
        // shadow desaturation
        const l2 = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
        const desat = 0.22 * sh;
        pr = pr + (l2 - pr) * desat; pg = pg + (l2 - pg) * desat; pb = pb + (l2 - pb) * desat;
        // saturation boost in the mids (AgX base is deliberately desaturated)
        const l3 = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
        const sat = 1.18;
        pr = l3 + (pr - l3) * sat; pg = l3 + (pg - l3) * sat; pb = l3 + (pb - l3) * sat;
        // lifted black point with a toe falloff (avoid pure black without milky shadows)
        const liftP = Math.pow(lift, 1 / 2.2);
        const toe = (x: number) => x + liftP * Math.pow(1 - clamp(x, 0, 1), 6);
        pr = toe(pr); pg = toe(pg); pb = toe(pb);
        R = Math.pow(clamp(pr, 0, 1), 2.2); G = Math.pow(clamp(pg, 0, 1), 2.2); B = Math.pow(clamp(pb, 0, 1), 2.2);
        data[i++] = Math.round(Math.pow(R, 1 / 2.2) * 255);
        data[i++] = Math.round(Math.pow(G, 1 / 2.2) * 255);
        data[i++] = Math.round(Math.pow(B, 1 / 2.2) * 255);
        data[i++] = 255;
      }
    }
  }
  const tex = new THREE.Data3DTexture(data, n, n, n);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.ClampToEdgeWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}
