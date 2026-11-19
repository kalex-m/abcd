import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { GLSL_NOISE } from '../util/noise';
import { DEG } from '../util/math';

/**
 * Boca Chica coastal terrain: tidal flats, salt marsh with pools below sea level, dunes and beach to
 * the east, the Gulf beyond. Heights come from one analytic function evaluated in the vertex shader
 * (GLSL) with a float32-faithful TypeScript twin for prop/vegetation placement. The radial mesh is
 * re-centred on the camera (snapped) so every ground camera gets sub-metre foreground resolution.
 * Splat (concrete, gravel, wet/dry sand, mud, scrub, salt crust) is computed per fragment.
 */

const f32 = Math.fround;
function fract(x: number): number { return f32(x - Math.floor(x)); }
/** float32-faithful port of GLSL hash12 (Hoskins). */
export function hash12(x: number, y: number): number {
  let p3x = fract(f32(x * 0.1031)), p3y = fract(f32(y * 0.1031)), p3z = fract(f32(x * 0.1031));
  const d = f32(f32(p3x * f32(p3y + 33.33)) + f32(p3y * f32(p3z + 33.33)) + f32(p3z * f32(p3x + 33.33)));
  p3x = f32(p3x + d); p3y = f32(p3y + d); p3z = f32(p3z + d);
  return fract(f32(f32(p3x + p3y) * p3z));
}
function vnoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x: number, y: number, oct: number): number {
  let s = 0, a = 0.5;
  for (let i = 0; i < oct; i++) {
    s += a * (vnoise(x, y) * 2 - 1);
    const nx = 1.6 * x - 1.2 * y + 7.3, ny = 1.2 * x + 1.6 * y + 7.3;
    x = nx; y = ny;
    a *= 0.5;
  }
  return s;
}

const SH_A = CONFIG.site.shorelineAngleDeg * DEG;
export const SHORE_COS = Math.cos(SH_A), SHORE_SIN = Math.sin(SH_A);
const POOL1 = [-902, 978, 20] as const; // shot-1 foreground pool (x, z, radius)

/** Signed distance (m) seaward of the shoreline at true-world (x, z). */
export function shoreDistance(x: number, z: number): number {
  return x * SHORE_COS + z * SHORE_SIN - CONFIG.site.shorelineX + 18 * fbm(z / 420, x / 420, 2);
}

/** Terrain height relative to the grade (m) at true-world (x, z). TS twin of GLSL terrainHeight. */
export function terrainHeight(x: number, z: number): number {
  const ds = shoreDistance(x, z);
  let h = 0.55 * fbm(x / 520, z / 520, 4) + 0.22 * fbm(x / 95 + 3.1, z / 95, 3);
  // marsh pools and channels in the west/south flats
  const marsh = fbm(x / 300 - 11, z / 300 + 5, 4);
  const poolMask = Math.max(0, Math.min(1, (marsh - 0.18) / 0.12));
  h = h * (1 - poolMask) + -2.4 * poolMask;
  // dunes behind the beach
  const duneBand = Math.exp(-Math.pow((ds + 70) / 55, 2));
  const rid = 1 - Math.abs(fbm(x / 70, z / 45, 3));
  h += duneBand * (2.6 * rid * rid + 0.6);
  // beach slope and sea floor
  if (ds > 0) h = h * Math.max(0, 1 - ds / 25) + (-0.3 - ds * 0.045) * Math.min(1, ds / 25);
  if (ds > 60) h = Math.min(h, -3.0 - (ds - 60) * 0.012);
  // pad, apron and the shot-1 pool
  const r = Math.hypot(x, z);
  const padW = 1 - Math.min(1, Math.max(0, (r - 150) / 70));
  h = h * (1 - padW);
  const tf = Math.hypot(x - CONFIG.site.tankFarmCenter[0], z - CONFIG.site.tankFarmCenter[2]);
  const tfW = 1 - Math.min(1, Math.max(0, (tf - 110) / 50));
  h = h * (1 - tfW);
  const pd = Math.hypot(x - POOL1[0], z - POOL1[1]) + 9 * fbm(x / 25, z / 25, 2);
  if (pd < POOL1[2] + 12) h = h + (-2.5 - h) * Math.min(1, Math.max(0, (POOL1[2] + 12 - pd) / 12));
  return h;
}

export const TERRAIN_GLSL = /* glsl */ `
const float SHORE_COS = ${SHORE_COS.toFixed(8)};
const float SHORE_SIN = ${SHORE_SIN.toFixed(8)};
const float SHORE_X = ${CONFIG.site.shorelineX.toFixed(2)};
const vec2 TANKFARM = vec2(${CONFIG.site.tankFarmCenter[0].toFixed(1)}, ${CONFIG.site.tankFarmCenter[2].toFixed(1)});
const vec3 POOL1 = vec3(${POOL1[0].toFixed(1)}, ${POOL1[1].toFixed(1)}, ${POOL1[2].toFixed(1)});
float tFbm(vec2 p, int oct) { float s = 0.0, a = 0.5; for (int i = 0; i < 8; i++) { if (i >= oct) break; s += a * (vnoise2(p) * 2.0 - 1.0); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; } return s; }
float shoreDistance(vec2 p) { return p.x * SHORE_COS + p.y * SHORE_SIN - SHORE_X + 18.0 * tFbm(vec2(p.y, p.x) / 420.0, 2); }
float marshMask(vec2 p) { return clamp((tFbm(p / 300.0 + vec2(-11.0, 5.0), 4) - 0.18) / 0.12, 0.0, 1.0); }
float terrainHeight(vec2 p) {
  float ds = shoreDistance(p);
  float h = 0.55 * tFbm(p / 520.0, 4) + 0.22 * tFbm(p / 95.0 + vec2(3.1, 0.0), 3);
  float pm = marshMask(p);
  h = mix(h, -2.4, pm);
  float duneBand = exp(-pow((ds + 70.0) / 55.0, 2.0));
  float rid = 1.0 - abs(tFbm(vec2(p.x / 70.0, p.y / 45.0), 3));
  h += duneBand * (2.6 * rid * rid + 0.6);
  if (ds > 0.0) h = h * max(0.0, 1.0 - ds / 25.0) + (-0.3 - ds * 0.045) * min(1.0, ds / 25.0);
  if (ds > 60.0) h = min(h, -3.0 - (ds - 60.0) * 0.012);
  float r = length(p);
  h *= clamp((r - 150.0) / 70.0, 0.0, 1.0);
  float tf = length(p - TANKFARM);
  h *= clamp((tf - 110.0) / 50.0, 0.0, 1.0);
  float pd = length(p - POOL1.xy) + 9.0 * tFbm(p / 25.0, 2);
  if (pd < POOL1.z + 12.0) h = mix(h, -2.5, clamp((POOL1.z + 12.0 - pd) / 12.0, 0.0, 1.0));
  return h;
}
`;

const MESH_RINGS = CONFIG.site.terrainRings;
const MESH_SEGS = CONFIG.site.terrainSegments;
const MESH_R = CONFIG.site.terrainSize * 0.6;

/** Radial grid: rings with exponential spacing (0.4 m near the centre). */
export function radialGrid(rings: number, segs: number, radius: number, inner = 0.4): THREE.BufferGeometry {
  const k = Math.log(radius / inner) / (rings - 1);
  const pos: number[] = [0, 0, 0];
  for (let i = 0; i < rings; i++) {
    const r = inner * Math.exp(k * i);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = 1 + i * segs + j, b = 1 + i * segs + ((j + 1) % segs);
      const c = 1 + (i + 1) * segs + j, d = 1 + (i + 1) * segs + ((j + 1) % segs);
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  g.boundingSphere!.radius = radius * 1.5;
  return g;
}

export class Terrain implements System {
  readonly name = 'terrain';
  readonly mesh: THREE.Mesh;
  readonly material: THREE.MeshStandardMaterial;
  private readonly center = new THREE.Vector2(1e9, 1e9);
  readonly uniforms = {
    uCenter: { value: new THREE.Vector2() },
    uOriginT: { value: new THREE.Vector3() },
    uScorch: { value: 0 },
    uShock: { value: new THREE.Vector4(0, 0, -1, 0) }, // xz centre, radius, strength
    uWetness: { value: 0 },
    uFade: { value: 1 },
  };

  constructor(parent: THREE.Object3D) {
    const geo = radialGrid(MESH_RINGS, MESH_SEGS, MESH_R);
    this.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
    const u = this.uniforms;
    this.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
${GLSL_NOISE}
${TERRAIN_GLSL}
uniform vec2 uCenter;
uniform vec3 uOriginT;
varying vec3 vTW;
varying float vH;`)
        .replace('#include <beginnormal_vertex>', `
vec2 pT = position.xz + uCenter;
float hC = terrainHeight(pT);
float hX = terrainHeight(pT + vec2(0.6, 0.0));
float hZ = terrainHeight(pT + vec2(0.0, 0.6));
vec3 objectNormal = normalize(vec3(hC - hX, 0.6, hC - hZ));
#ifdef USE_TANGENT
vec3 objectTangent = vec3(1.0, 0.0, 0.0);
#endif`)
        .replace('#include <begin_vertex>', `
float rr = length(position.xz);
vec3 transformed = vec3(position.x, hC - rr * rr / (2.0 * 6371000.0), position.z);
vTW = vec3(pT.x, hC, pT.y);
vH = hC;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${GLSL_NOISE}
${TERRAIN_GLSL}
uniform float uScorch;
uniform vec4 uShock;
uniform float uWetness;
varying vec3 vTW;
varying float vH;
vec3 gTerrainNormalPerturb = vec3(0.0);
float gRough = 0.9;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 p = vTW.xz;
  float r = length(p);
  float ds = shoreDistance(p);
  float n1 = vnoise2(p * 0.9), n2 = vnoise2(p * 0.13 + 3.0), n3 = vnoise2(p * 4.1);
  float pm = marshMask(p);
  // base: flats with scrub/grass
  vec3 scrub = mix(vec3(0.16, 0.15, 0.08), vec3(0.24, 0.22, 0.12), n2) * mix(0.8, 1.15, n1);
  vec3 grass = mix(vec3(0.11, 0.13, 0.05), vec3(0.20, 0.19, 0.09), n1);
  vec3 col = mix(scrub, grass, smoothstep(0.3, 0.7, tFbm(p / 60.0, 3) * 0.5 + 0.5));
  float rough = 0.92;
  // salt crust patches
  float salt = smoothstep(0.62, 0.75, tFbm(p / 140.0 + 9.0, 4) * 0.5 + 0.5) * (1.0 - pm);
  col = mix(col, vec3(0.58, 0.55, 0.5), salt * 0.7);
  // mud flats around the pools (dark and wet)
  float mud = smoothstep(0.2, 1.4, -vH + 0.6) * (1.0 - step(60.0, ds));
  col = mix(col, vec3(0.085, 0.075, 0.06) * mix(0.8, 1.2, n3), mud);
  rough = mix(rough, 0.25, mud);
  // dunes and beach sand
  float sand = smoothstep(-180.0, -110.0, ds);
  vec3 dry = mix(vec3(0.55, 0.47, 0.36), vec3(0.62, 0.55, 0.43), n1);
  col = mix(col, dry, sand * (1.0 - smoothstep(0.0, 0.5, -vH - 0.4) * step(-30.0, ds)));
  float wet = smoothstep(-25.0, 5.0, ds);
  col = mix(col, vec3(0.30, 0.26, 0.20), wet);
  rough = mix(rough, 0.12, wet * smoothstep(-8.0, 4.0, ds));
  // pad apron: concrete slabs with expansion joints (6 m), gravel ring
  float apron = 1.0 - smoothstep(120.0, 135.0, r + 6.0 * n2);
  vec2 cell = fract(p / 6.0);
  float joint = (1.0 - smoothstep(0.0, 0.012, min(min(cell.x, 1.0 - cell.x), min(cell.y, 1.0 - cell.y))));
  vec3 conc = vec3(0.42, 0.41, 0.39) * mix(0.85, 1.08, hash12(floor(p / 6.0))) * mix(0.9, 1.05, n3);
  conc *= 1.0 - 0.45 * joint;
  float oil = smoothstep(0.7, 0.85, vnoise2(p * 0.08 + 17.0)) * 0.5;
  conc *= 1.0 - oil * 0.6;
  float gravel = smoothstep(115.0, 140.0, r) * (1.0 - smoothstep(150.0, 200.0, r + 15.0 * n2));
  vec3 grav = vec3(0.33, 0.31, 0.28) * mix(0.7, 1.2, hash12(floor(p * 7.0)));
  col = mix(col, grav, gravel);
  col = mix(col, conc, apron);
  rough = mix(rough, 0.82, apron + gravel);
  float tf = length(p - TANKFARM);
  col = mix(col, grav * 1.1, 1.0 - smoothstep(100.0, 130.0, tf));
  // soot exposure under the pad (accumulates during the burn)
  float soot = uScorch * (1.0 - smoothstep(10.0, 80.0 + 30.0 * n2, r));
  col *= 1.0 - 0.85 * soot;
  // flood water from the deluge
  float puddle = uWetness * (1.0 - smoothstep(20.0, 110.0, r + 20.0 * n2));
  col *= 1.0 - 0.35 * puddle;
  rough = mix(rough, 0.08, puddle);
  // shock ring: dust lifted at the passing front
  if (uShock.z > 0.0) {
    float ring = exp(-pow((r - uShock.z) / 6.0, 2.0)) * uShock.w;
    col = mix(col, vec3(0.5, 0.44, 0.36), ring * 0.5);
  }
  diffuseColor.rgb = col;
  gRough = rough;
  gTerrainNormalPerturb = vec3(vnoise2(p * 2.3) - 0.5, 0.0, vnoise2(p * 2.3 + 11.0) - 0.5) * (0.35 - 0.3 * apron) + vec3(vnoise2(p * 11.0) - 0.5, 0.0, vnoise2(p * 11.0 + 5.0) - 0.5) * 0.25 * (1.0 - wet);
}`)
        .replace('#include <roughnessmap_fragment>', `float roughnessFactor = gRough;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
normal = normalize(normal + (viewMatrix * vec4(gTerrainNormalPerturb, 0.0)).xyz);`);
    };
    this.material.customProgramCacheKey = () => 'terrain-v1';
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.name = 'terrain';
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }

  update(ctx: FrameContext): void {
    // recentre on the camera (snapped) for ground shots; on the pad for aerial views
    const alt = ctx.camTrue.y + CONFIG.site.olmHeight;
    const target = alt < 1500 ? new THREE.Vector2(ctx.camTrue.x, ctx.camTrue.z) : new THREE.Vector2(0, 0);
    const snap = 8;
    target.set(Math.round(target.x / snap) * snap, Math.round(target.y / snap) * snap);
    if (target.distanceTo(this.center) > 60 || ctx.cut) this.center.copy(target);
    this.uniforms.uCenter.value.copy(this.center);
    // mesh sits at the snapped centre in scene coordinates (the world group already applies -origin)
    this.mesh.position.set(this.center.x, -CONFIG.site.olmHeight, this.center.y);
    const t = ctx.mission;
    this.uniforms.uScorch.value = Math.min(1, Math.max(0, (t + 6) / 12));
    this.uniforms.uWetness.value = Math.max(ctx.snap.deluge, t > -17 && t < 120 ? 0.6 : 0);
    const shockR = ctx.mission >= 0 ? CONFIG.shock.speedOfSound * ctx.mission : -1;
    this.uniforms.uShock.value.set(0, 0, shockR < CONFIG.shock.maxRadius ? shockR : -1, Math.exp(-Math.max(0, ctx.mission) / 3));
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
