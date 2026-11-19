import * as THREE from 'three';
import { CONFIG } from '../config';
import { GLSL_NOISE } from '../util/noise';
import type { HullMaps } from './procedural-tex';

/**
 * PBR materials (metal-rough). Stainless steel with anisotropic brushed grain driven by the generated
 * hull maps plus dynamic overlays: crystalline frost on the propellant belts, fractal soot on the aft
 * end that thickens during the burn, heat tint and blackbody glow near the engine bay and hot-stage
 * ring. Also copper/steel bells with heat banding, titanium grid fins, tiles, foil, soot interiors and
 * site materials.
 */
export interface SteelUniforms {
  uFrost: THREE.IUniform<number>;
  uSoot: THREE.IUniform<number>;
  uHeatGlow: THREE.IUniform<number>;
  uStageH: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  uWet: THREE.IUniform<number>;
}

export const BLACKBODY_GLSL = /* glsl */ `
// approximate blackbody colour (linear sRGB, max-normalised) for a temperature in Kelvin
vec3 blackbody(float k) {
  float t = k / 100.0;
  float r = t <= 66.0 ? 1.0 : clamp(1.292936 * pow(t - 60.0, -0.1332047), 0.0, 1.0);
  float g = t <= 66.0 ? clamp(0.390081 * log(t) - 0.631841, 0.0, 1.0) : clamp(1.129891 * pow(t - 60.0, -0.0755148), 0.0, 1.0);
  float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.543207 * log(t - 10.0) - 1.196254, 0.0, 1.0));
  vec3 c = pow(vec3(r, g, b), vec3(2.2));
  return c / max(max(c.r, c.g), max(c.b, 1e-4));
}
// relative radiance of a heated surface (Stefan-Boltzmann scaled; 800 K dull red .. 2000 K yellow-white)
float glowRadiance(float k) { return pow(max(k - 700.0, 0.0) / 1300.0, 4.0) * 30.0; }
`;

export function createSteelMaterial(maps: HullMaps, booster: boolean, stageH: number): { material: THREE.MeshPhysicalMaterial; uniforms: SteelUniforms } {
  const v = CONFIG.vehicle;
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: maps.albedo, roughnessMap: maps.orm, metalnessMap: maps.orm, aoMap: maps.orm, aoMapIntensity: 1,
    normalMap: maps.normal, normalScale: new THREE.Vector2(1, 1), metalness: 1, roughness: 1,
    anisotropy: v.steelAnisotropy, anisotropyRotation: 0, envMapIntensity: 1, clearcoat: 0,
  });
  const uniforms: SteelUniforms = {
    uFrost: { value: 0 }, uSoot: { value: 0 }, uHeatGlow: { value: 0 }, uStageH: { value: stageH }, uTime: { value: 0 }, uWet: { value: 0 },
  };
  const R = v.diameter / 2;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
${GLSL_NOISE}
${BLACKBODY_GLSL}
varying vec3 vLocal;
uniform float uFrost;
uniform float uSoot;
uniform float uHeatGlow;
uniform float uStageH;
uniform float uTime;
uniform float uWet;
float gFrost = 0.0;
float gSoot = 0.0;
float gHeatT = 0.0;
`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float hN = vLocal.y / uStageH;
  float arc = atan(vLocal.z, vLocal.x) * ${R.toFixed(3)};
  vec3 q = vec3(arc, vLocal.y, 0.0);
  ${booster ? `float belt = smoothstep(0.07, 0.15, hN) * (1.0 - smoothstep(${(v.frostTopFraction - 0.05).toFixed(3)}, ${(v.frostTopFraction + 0.02).toFixed(3)}, hN));
  belt *= 0.55 + 0.45 * smoothstep(0.12, 0.35, hN) * (1.0 - smoothstep(0.45, 0.6, hN));
  belt = max(belt, 0.6 * smoothstep(0.66, 0.7, hN) * (1.0 - smoothstep(0.86, 0.9, hN)));`
    : `float belt = smoothstep(0.13, 0.18, hN) * (1.0 - smoothstep(0.52, 0.58, hN));`}
  float fn = fbm3(q * 1.6 + vec3(0.0, uTime * 0.02, 0.0), 5) * 0.5 + 0.5;
  float drip = vnoise2(vec2(arc * 3.0, vLocal.y * 0.25));
  // patchy, vertically streaked frost: roughly half of the belt frosted, bare steel between
  float streakF = vnoise2(vec2(arc * 1.1, vLocal.y * 0.12));
  gFrost = smoothstep(0.55, 0.8, (fn * 0.62 + 0.3 * streakF + 0.1 * drip) * belt) * uFrost;
  vec3 frostCol = mix(vec3(0.80, 0.83, 0.87), vec3(0.93, 0.95, 0.97), fbm3(q * 9.0, 3) * 0.5 + 0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb, frostCol, gFrost);
  // soot: fractal, strongest at the aft end (height^2 mask), streaked upward by the flow
  float aft = 1.0 - clamp(hN / ${booster ? '0.34' : '0.16'}, 0.0, 1.0);
  float sn = fbm3(vec3(arc * 0.9, vLocal.y * 0.35, 3.0), 5) * 0.5 + 0.5;
  float streakS = vnoise2(vec2(arc * 2.5, vLocal.y * 0.06));
  gSoot = smoothstep(0.35, 0.75, sn * 0.7 + streakS * 0.5) * aft * aft * uSoot;
  ${booster ? 'gSoot = max(gSoot, smoothstep(0.93, 0.955, hN) * (0.5 + 0.5 * sn) * 0.5 * uSoot);' : ''}
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.03, 0.028), clamp(gSoot, 0.0, 0.92));
  // heat tint streaks near the engine bay and (booster) below the hot-stage ring
  float tintZone = (1.0 - smoothstep(0.0, ${booster ? '0.08' : '0.12'}, hN)) ${booster ? '+ smoothstep(0.92, 0.95, hN)' : ''};
  float tn = vnoise2(vec2(arc * 1.3, vLocal.y * 0.4));
  vec3 tint = mix(vec3(0.55, 0.38, 0.22), vec3(0.32, 0.36, 0.55), tn);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * tint * 1.6, clamp(tintZone, 0.0, 1.0) * 0.45 * (1.0 - gSoot));
  // heated metal temperature (blackbody emission): hot-stage ring top or ship aft at staging
  gHeatT = 700.0 + uHeatGlow * 1100.0 * ${booster ? 'smoothstep(0.955, 1.0, hN)' : '(1.0 - smoothstep(0.0, 0.06, hN))'} * (0.7 + 0.3 * tn);
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.85, gFrost);
roughnessFactor = mix(roughnessFactor, 0.92, clamp(gSoot, 0.0, 1.0));
roughnessFactor = mix(roughnessFactor, 0.12, uWet * 0.6 * (1.0 - gFrost));`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.0, gFrost);
metalnessFactor = mix(metalnessFactor, 0.15, clamp(gSoot, 0.0, 1.0));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += blackbody(gHeatT) * glowRadiance(gHeatT) * (1.0 - gSoot * 0.5);`);
  };
  m.customProgramCacheKey = () => `steel-${booster ? 'b' : 's'}-v2`;
  return { material: m, uniforms };
}

/** Engine bell: copper-bronze throat to dark steel exit, rainbow heat banding scaled by per-instance heat. */
export function createBellMaterial(bellLength: number): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.9, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aHeat;\nvarying float vHeat;\nvarying vec3 vBell;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = aHeat;\nvBell = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\n${BLACKBODY_GLSL}\nvarying float vHeat;\nvarying vec3 vBell;\nfloat gBellT = 0.0;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  // vBell.y: 0 at the throat, -L at the exit
  float x = clamp(-vBell.y / ${bellLength.toFixed(3)}, 0.0, 1.0);
  vec3 throat = vec3(0.35, 0.17, 0.10);
  vec3 exitc = vec3(0.18, 0.18, 0.20);
  vec3 c = mix(throat, exitc, smoothstep(0.0, 0.7, x));
  // regenerative cooling channels: fine vertical striations
  float ang = atan(vBell.z, vBell.x);
  c *= 0.9 + 0.1 * sin(ang * 180.0);
  // heat tint banding near the throat (blue -> gold), grows with run time
  float band = sin(x * 40.0) * 0.5 + 0.5;
  vec3 tint = mix(vec3(0.25, 0.3, 0.55), vec3(0.75, 0.55, 0.2), band);
  c = mix(c, c * tint * 2.2, (1.0 - smoothstep(0.05, 0.45, x)) * clamp(vHeat * 1.5, 0.0, 0.8));
  diffuseColor.rgb = c;
  gBellT = 700.0 + vHeat * 900.0 * (1.0 - smoothstep(0.0, 0.55, x));
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += blackbody(gBellT) * glowRadiance(gBellT) * 0.8;`);
  };
  m.customProgramCacheKey = () => 'bell-v2';
  return m;
}

/** Radiatively cooled RVac nozzle extension: dull dark grey, cherry glow ramping with burn time. */
export function createRvacSkirtMaterial(): { material: THREE.MeshStandardMaterial; glow: THREE.IUniform<number> } {
  const glow = { value: 0 };
  const m = new THREE.MeshStandardMaterial({ color: 0x2b2a2a, roughness: 0.6, metalness: 0.7, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = glow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${BLACKBODY_GLSL}\nuniform float uGlow;\nvarying vec3 vP;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float x = clamp(-vP.y / ${CONFIG.engines.rvacLength.toFixed(2)}, 0.0, 1.0);
  float T = 700.0 + uGlow * 650.0 * (1.0 - 0.6 * x);
  float rib = 0.85 + 0.15 * step(0.5, fract(atan(vP.z, vP.x) * 24.0 / 6.2831));
  totalEmissiveRadiance += blackbody(T) * glowRadiance(T) * rib;
}`);
  };
  m.customProgramCacheKey = () => 'rvac-v1';
  return { material: m, glow };
}

export const titaniumMaterial = (): THREE.MeshPhysicalMaterial => {
  const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.45, 0.42, 0.4), metalness: 1, roughness: 0.45, iridescence: 0.25, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 420] });
  return m;
};

export const darkMetal = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.08, 0.08, 0.085), metalness: 0.75, roughness: 0.55 });
export const plumbingSteel = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.5, 0.52), metalness: 1, roughness: 0.38 });
export const foilMaterial = (): THREE.MeshStandardMaterial => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.78, 0.76, 0.72), metalness: 1, roughness: 0.25 });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_NOISE}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{ vec3 wp = vViewPosition * 6.0; normal = normalize(normal + 0.35 * vec3(gnoise3(wp), gnoise3(wp + 7.1), gnoise3(wp + 3.3))); }`);
  };
  m.customProgramCacheKey = () => 'foil-v1';
  return m;
};
export const sootInterior = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.025, 0.022, 0.02), metalness: 0.1, roughness: 0.95, side: THREE.DoubleSide });
export const tileBlack = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(CONFIG.vehicle.tiles.albedo, CONFIG.vehicle.tiles.albedo, CONFIG.vehicle.tiles.albedo), metalness: 0, roughness: CONFIG.vehicle.tiles.roughness });

/** Painted / galvanised steel for the tower and GSE. */
export const towerSteel = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.11, 0.115, 0.12), metalness: 0.55, roughness: 0.6 });
export const galvanised = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.42, 0.43, 0.44), metalness: 0.85, roughness: 0.5 });
export const concrete = (): THREE.MeshStandardMaterial => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.4, 0.39, 0.37), metalness: 0, roughness: 0.9 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\nvarying vec3 vWp;\nuniform float uChar;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float n = fbm3(vWp * 0.35, 4) * 0.5 + 0.5;
  diffuseColor.rgb *= 0.82 + 0.3 * n;
  float stain = smoothstep(0.55, 0.8, fbm3(vWp * vec3(0.8, 0.12, 0.8), 3) * 0.5 + 0.5);
  diffuseColor.rgb *= 1.0 - 0.3 * stain;
}`);
  };
  m.customProgramCacheKey = () => 'concrete-v1';
  return m;
};
export const whiteInsulation = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.78, 0.79, 0.8), metalness: 0, roughness: 0.75 });
export const frostWhite = (): THREE.MeshPhysicalMaterial => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.88, 0.9), metalness: 0, roughness: 0.85, sheen: 0.6, sheenColor: new THREE.Color(0.9, 0.95, 1.0), sheenRoughness: 0.6 });
export const paintRed = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.05, 0.03), metalness: 0.2, roughness: 0.55 });
export const paintYellow = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.75, 0.55, 0.05), metalness: 0.2, roughness: 0.55 });
export const rubberBlack = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.02, 0.02, 0.02), metalness: 0, roughness: 0.8 });
