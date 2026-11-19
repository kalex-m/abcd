import * as THREE from 'three';
import { CONFIG } from '../config';
import { GLSL_NOISE } from '../util/noise';
import { FullscreenQuad } from '../post/fsquad';

/**
 * Pad-level smoke / steam / dust as a Lagrangian puff field (Section 9.2). Every puff is a pure function
 * of its index and mission time (deterministic, seekable, no history): four emission phases (deluge
 * mist, ignition steam balloon, liftoff mushroom + dust ring + column, climb-out wash), radial outflow
 * decaying with drag, buoyant rise, wind drift integrated through the power-law / jet-stream profile,
 * curl-noise wander, entrainment growth (R ~ a^0.7), dilution and dissipation. A GPU pass evaluates all
 * puffs into a state texture; a splat pass rasterises them into a 3D density grid (R steam, G soot,
 * B dust, A heat) slice by slice, which the raymarcher (volumetric-cloud.ts) renders.
 */
const W = CONFIG.wind;
const toRad = (d: number) => (d * Math.PI) / 180;
const windTo = toRad(W.fromDeg + 180), jetTo = toRad(W.jetFromDeg + 180);

export const WIND_GLSL = /* glsl */ `
// wind velocity (m/s, world x east / z south) at height h above ground (power law + jet stream)
vec3 windAt(float h) {
  float hh = clamp(h, 1.0, ${W.profileTop.toFixed(1)});
  float v = ${W.v10.toFixed(3)} * pow(hh / 10.0, ${W.powerLawAlpha.toFixed(3)});
  vec3 low = vec3(sin(${windTo.toFixed(6)}), 0.0, -cos(${windTo.toFixed(6)})) * v;
  float j = exp(-pow((h - ${W.jetAlt.toFixed(1)}) / ${W.jetThickness.toFixed(1)}, 2.0));
  vec3 jet = vec3(sin(${jetTo.toFixed(6)}), 0.0, -cos(${jetTo.toFixed(6)})) * ${W.jetSpeed.toFixed(2)};
  float above = smoothstep(${W.profileTop.toFixed(1)}, ${(W.jetAlt * 0.6).toFixed(1)}, h);
  return mix(low, low * 0.8 + jet * 0.35, above) * (1.0 - j) + jet * j;
}
`;

/** TS twin of windAt. */
export function windAt(h: number): [number, number, number] {
  const hh = Math.min(Math.max(h, 1), W.profileTop);
  const v = W.v10 * Math.pow(hh / 10, W.powerLawAlpha);
  const low = [Math.sin(windTo) * v, 0, -Math.cos(windTo) * v];
  const j = Math.exp(-Math.pow((h - W.jetAlt) / W.jetThickness, 2));
  const jet = [Math.sin(jetTo) * W.jetSpeed, 0, -Math.cos(jetTo) * W.jetSpeed];
  const x = Math.min(1, Math.max(0, (h - W.profileTop) / (W.jetAlt * 0.6 - W.profileTop)));
  const above = x * x * (3 - 2 * x);
  return [0, 1, 2].map((k) => ((low[k] * (1 - above) + (low[k] * 0.8 + jet[k] * 0.35) * above) * (1 - j) + jet[k] * j)) as [number, number, number];
}

export const PUFF_GLSL = /* glsl */ `
${WIND_GLSL}
const float GROUND = ${(-CONFIG.site.olmHeight).toFixed(2)};
// Evaluate puff i at mission time T. Returns false when not yet born or fully dissipated.
bool puffAt(float i, float N, float T, out vec3 pos, out float R, out vec4 dens) {
  vec4 h0 = hash41(i * 1.6180339 + 0.5);
  vec4 h1 = hash41(i * 2.7182818 + 7.1);
  vec4 h2 = hash41(i * 3.1415926 + 13.3);
  float u = (i + 0.5) / N;
  float t0, t1, pw, r0, u0, tauR, H, tauH, R0, kR, rho, tauD, heat0;
  float steamF, sootF;
  vec3 src = vec3(0.0, GROUND + 3.5, 0.0);
  if (u < 0.07) { // deluge mist
    t0 = ${CONFIG.deluge.preflowT.toFixed(1)}; t1 = -8.5; pw = 1.0;
    r0 = 9.0 + 6.0 * h0.z; u0 = 2.0 + 4.0 * h1.x; tauR = 4.0; H = 5.0 + 12.0 * h1.y; tauH = 6.0;
    R0 = 3.0 + 2.5 * h1.z; kR = 1.4; rho = 0.32; tauD = 28.0; heat0 = 0.0; steamF = 1.0; sootF = 0.0;
  } else if (u < 0.36) { // ignition steam balloon (T-8.2 .. T0)
    t0 = -8.0; t1 = 0.0; pw = 0.8;
    r0 = 2.0 + 7.0 * h0.z; u0 = 12.0 + 26.0 * h1.x; tauR = 2.6 + 1.6 * h1.w; H = 25.0 + 200.0 * pow(h1.y, 1.6); tauH = 12.0 + 10.0 * h2.x;
    R0 = 7.0 + 7.0 * h1.z; kR = 6.0; rho = 1.0; tauD = 160.0; heat0 = 0.6; steamF = 0.88; sootF = 0.04;
  } else if (u < 0.86) { // liftoff mushroom, dust ring and column
    float col = step(0.72, h2.y);
    t0 = mix(0.0, 3.0, col); t1 = 12.0; pw = 1.6;
    r0 = mix(3.0 + 12.0 * h0.z, 1.0 + 6.0 * h0.z, col);
    u0 = mix(40.0 + 45.0 * h1.x, 4.0 + 10.0 * h1.x, col);
    tauR = 3.0 + 2.5 * h1.w;
    H = mix(120.0 + 520.0 * pow(h1.y, 1.2), 300.0 + 400.0 * h1.y, col);
    tauH = mix(11.0 + 11.0 * h2.x, 9.0 + 6.0 * h2.x, col);
    R0 = 10.0 + 8.0 * h1.z; kR = 8.0; rho = 1.15; tauD = 170.0; heat0 = 0.5; steamF = 0.76; sootF = 0.1;
  } else { // climb-out wash
    t0 = 10.0; t1 = 28.0; pw = 1.2;
    r0 = 5.0 + 25.0 * h0.z; u0 = 10.0 + 15.0 * h1.x; tauR = 4.0; H = 80.0 + 300.0 * h1.y; tauH = 15.0;
    R0 = 10.0 + 6.0 * h1.z; kR = 6.5; rho = 0.55; tauD = 140.0; heat0 = 0.2; steamF = 0.7; sootF = 0.18;
  }
  float tb = mix(t0, t1, pow(h0.x, pw));
  float a = T - tb;
  if (a <= 0.0) return false;
  // type
  float ty = h0.y;
  float isSteam = step(ty, steamF);
  float isSoot = step(steamF, ty) * step(ty, steamF + sootF);
  float isDust = 1.0 - isSteam - isSoot;
  // dust hugs the ground, soot rises less than steam
  H *= mix(1.0, 0.08 + 0.12 * h2.z, isDust) * mix(1.0, 0.7, isSoot);
  tauD *= mix(1.0, 0.45, isDust) * mix(1.0, 2.2, isSoot);
  float ang = h0.w * 6.2831853;
  vec2 dir = vec2(cos(ang), sin(ang));
  float r = r0 + u0 * tauR * (1.0 - exp(-a / tauR));
  float y = H * (1.0 - exp(-a / tauH)) * smoothstep(0.0, 2.5 * (1.0 - isDust * 0.7), a);
  // wind drift integrated along the rising path (4-point midpoint rule)
  vec3 drift = vec3(0.0);
  for (int k = 0; k < 4; k++) {
    float ak = a * (float(k) + 0.5) / 4.0;
    float yk = H * (1.0 - exp(-ak / tauH));
    drift += windAt(yk + 4.0) * (a / 4.0);
  }
  R = min(R0 + kR * pow(a, 0.7), 180.0);
  // curl-like wander proportional to the puff size
  vec3 wander = vec3(gnoise3(vec3(i * 0.37, a * 0.06, 1.0)), gnoise3(vec3(i * 0.37, a * 0.06, 7.0)) * 0.5, gnoise3(vec3(i * 0.37, a * 0.06, 13.0))) * R * 0.6;
  pos = src + vec3(dir.x * r, y, dir.y * r) + drift + wander;
  pos.y = max(pos.y, GROUND + R * 0.35);
  float d = rho * pow(R0 / R, 1.05) * smoothstep(0.0, 0.7, a) * exp(-a / tauD);
  if (d < 0.002) return false;
  dens = vec4(isSteam, isSoot, isDust, 0.0) * d;
  dens.a = heat0 * exp(-a / 1.8) * d;
  return true;
}
`;

const STATE_FRAG = /* glsl */ `
${GLSL_NOISE}
${PUFF_GLSL}
layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oDens;
uniform float uT;
uniform float uN;
uniform vec2 uTexSize;
varying vec2 vUv;
void main() {
  vec2 px = floor(vUv * uTexSize);
  float i = px.y * uTexSize.x + px.x;
  vec3 p; float R; vec4 d;
  if (i < uN && puffAt(i, uN, uT, p, R, d)) { oPos = vec4(p, R); oDens = d; }
  else { oPos = vec4(0.0, -1e6, 0.0, 0.0); oDens = vec4(0.0); }
}`;

const STATE_VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const SPLAT_VERT = /* glsl */ `
precision highp float;
uniform sampler2D tPos;
uniform sampler2D tDens;
uniform vec2 uTexSize;
uniform vec3 uMin;
uniform vec3 uMax;
uniform vec3 uOrigin; // true-world position of the scene origin
uniform float uSliceY; // true-world height of this slice
in vec3 position;
in float aIndex;
out vec4 vDens;
out vec2 vLocal; // position within the puff cross-section, in units of R
out float vRc;
out float vDy;
out float vSeed;
void main() {
  vec2 tc = (vec2(mod(aIndex, uTexSize.x), floor(aIndex / uTexSize.x)) + 0.5) / uTexSize;
  vec4 pr = texture(tPos, tc);
  vec4 d = texture(tDens, tc);
  float R = pr.w;
  float dy = uSliceY - pr.y;
  vDens = d; vSeed = aIndex;
  if (R <= 0.0 || abs(dy) >= R) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float rc = sqrt(R * R - dy * dy);
  vRc = rc / R; vDy = dy / R;
  vLocal = position.xy * vRc;
  vec2 c = pr.xz + position.xy * rc;
  vec2 ndc = (c - uMin.xz) / (uMax.xz - uMin.xz) * 2.0 - 1.0;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const SPLAT_FRAG = /* glsl */ `
precision highp float;
in vec4 vDens;
in vec2 vLocal;
in float vRc;
in float vDy;
in float vSeed;
out vec4 oCol;
void main() {
  float d2 = dot(vLocal, vLocal) + vDy * vDy;
  if (d2 >= 1.0) discard;
  float k = (1.0 - d2);
  k = k * k * (0.6 + 0.4 * k);
  oCol = vDens * k;
}`;

/** Float32-faithful twin of GLSL hash41 (Hoskins). */
function fract(x: number): number { return x - Math.floor(x); }
function hash41(p: number): [number, number, number, number] {
  let x = fract(p * 0.1031), y = fract(p * 0.103), z = fract(p * 0.0973), w = fract(p * 0.1099);
  const d = x * (w + 33.33) + y * (z + 33.33) + z * (x + 33.33) + w * (y + 33.33);
  x += d; y += d; z += d; w += d;
  return [fract((x + y) * z), fract((x + z) * y), fract((y + z) * w), fract((z + w) * x)];
}

export interface PuffBounds { min: THREE.Vector3; max: THREE.Vector3; count: number }

/** CPU estimate of the puff cloud bounds (uses the same emission/kinematics, ignores wander). */
export function puffBounds(T: number, N: number): PuffBounds {
  const min = new THREE.Vector3(1e9, 1e9, 1e9), max = new THREE.Vector3(-1e9, -1e9, -1e9);
  const G = -CONFIG.site.olmHeight;
  let count = 0;
  const step = Math.max(1, Math.floor(N / 1024));
  for (let i = 0; i < N; i += step) {
    const h0 = hash41(i * 1.6180339 + 0.5), h1 = hash41(i * 2.7182818 + 7.1), h2 = hash41(i * 3.1415926 + 13.3);
    const u = (i + 0.5) / N;
    let t0: number, t1: number, pw: number, r0: number, u0: number, tauR: number, H: number, tauH: number, R0: number, kR: number;
    if (u < 0.07) { t0 = CONFIG.deluge.preflowT; t1 = -8.5; pw = 1; r0 = 9 + 6 * h0[2]; u0 = 2 + 4 * h1[0]; tauR = 4; H = 5 + 12 * h1[1]; tauH = 6; R0 = 3 + 2.5 * h1[2]; kR = 1.4; }
    else if (u < 0.36) { t0 = -8; t1 = 0; pw = 0.8; r0 = 2 + 7 * h0[2]; u0 = 12 + 26 * h1[0]; tauR = 2.6 + 1.6 * h1[3]; H = 25 + 200 * Math.pow(h1[1], 1.6); tauH = 12 + 10 * h2[0]; R0 = 7 + 7 * h1[2]; kR = 6; }
    else if (u < 0.86) {
      const col = h2[1] >= 0.72 ? 1 : 0;
      t0 = col ? 3 : 0; t1 = 12; pw = 1.6; r0 = col ? 1 + 6 * h0[2] : 3 + 12 * h0[2]; u0 = col ? 4 + 10 * h1[0] : 40 + 45 * h1[0]; tauR = 3 + 2.5 * h1[3];
      H = col ? 300 + 400 * h1[1] : 120 + 520 * Math.pow(h1[1], 1.2); tauH = col ? 9 + 6 * h2[0] : 11 + 11 * h2[0]; R0 = 10 + 8 * h1[2]; kR = 8;
    } else { t0 = 10; t1 = 28; pw = 1.2; r0 = 5 + 25 * h0[2]; u0 = 10 + 15 * h1[0]; tauR = 4; H = 80 + 300 * h1[1]; tauH = 15; R0 = 10 + 6 * h1[2]; kR = 6.5; }
    const tb = t0 + (t1 - t0) * Math.pow(h0[0], pw);
    const a = T - tb;
    if (a <= 0) continue;
    const ang = h0[3] * Math.PI * 2;
    const r = r0 + u0 * tauR * (1 - Math.exp(-a / tauR));
    const y = H * (1 - Math.exp(-a / tauH));
    let dx = 0, dz = 0;
    for (let k = 0; k < 4; k++) {
      const ak = (a * (k + 0.5)) / 4;
      const w = windAt(H * (1 - Math.exp(-ak / tauH)) + 4);
      dx += (w[0] * a) / 4;
      dz += (w[2] * a) / 4;
    }
    const R = Math.min(R0 + kR * Math.pow(a, 0.7), 180) * 1.6;
    const px = Math.cos(ang) * r + dx, py = G + 3.5 + y, pz = Math.sin(ang) * r + dz;
    min.min(new THREE.Vector3(px - R, py - R, pz - R));
    max.max(new THREE.Vector3(px + R, py + R, pz + R));
    count++;
  }
  min.y = Math.max(min.y, G - 2);
  return { min, max, count };
}

export class SmokeField {
  readonly grid: THREE.WebGL3DRenderTarget;
  private readonly state: THREE.WebGLRenderTarget;
  private readonly stateMat: THREE.RawShaderMaterial | THREE.ShaderMaterial;
  private readonly splatMat: THREE.RawShaderMaterial;
  private readonly splatMesh: THREE.Mesh;
  private readonly splatScene = new THREE.Scene();
  private readonly splatCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad = new FullscreenQuad();
  readonly texW = 64;
  readonly texH: number;
  readonly min = new THREE.Vector3();
  readonly max = new THREE.Vector3();
  active = false;

  constructor(readonly N: number, readonly res: [number, number, number]) {
    this.texH = Math.ceil(N / this.texW);
    this.state = new THREE.WebGLRenderTarget(this.texW, this.texH, { type: THREE.FloatType, count: 2, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
    this.stateMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: STATE_VERT, fragmentShader: STATE_FRAG, depthTest: false, depthWrite: false,
      uniforms: { uT: { value: 0 }, uN: { value: N }, uTexSize: { value: new THREE.Vector2(this.texW, this.texH) } },
    });
    // grid texture layout: width = x, height = z, depth (layers) = y (horizontal slices)
    this.grid = new THREE.WebGL3DRenderTarget(res[0], res[2], res[1], { type: THREE.HalfFloatType, depthBuffer: false });
    this.grid.texture.minFilter = THREE.LinearFilter;
    this.grid.texture.magFilter = THREE.LinearFilter;
    this.grid.texture.wrapS = this.grid.texture.wrapT = this.grid.texture.wrapR = THREE.ClampToEdgeWrapping;
    const quadGeo = new THREE.InstancedBufferGeometry();
    quadGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    quadGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const idx = new Float32Array(N);
    for (let i = 0; i < N; i++) idx[i] = i;
    quadGeo.setAttribute('aIndex', new THREE.InstancedBufferAttribute(idx, 1));
    quadGeo.instanceCount = N;
    this.splatMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: SPLAT_VERT, fragmentShader: SPLAT_FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        tPos: { value: this.state.textures[0] }, tDens: { value: this.state.textures[1] }, uTexSize: { value: new THREE.Vector2(this.texW, this.texH) },
        uMin: { value: this.min }, uMax: { value: this.max }, uOrigin: { value: new THREE.Vector3() }, uSliceY: { value: 0 },
      },
    });
    this.splatMesh = new THREE.Mesh(quadGeo, this.splatMat);
    this.splatMesh.frustumCulled = false;
    this.splatScene.add(this.splatMesh);
  }

  /** Recompute puff states and rebuild the density grid for mission time T. */
  update(renderer: THREE.WebGLRenderer, T: number): void {
    if (T < CONFIG.deluge.preflowT) { this.active = false; return; }
    const b = puffBounds(T, this.N);
    if (b.count === 0) { this.active = false; return; }
    this.active = true;
    // pad the bounds and keep a minimum size so the voxel size never collapses
    const c = b.min.clone().add(b.max).multiplyScalar(0.5);
    const ext = b.max.clone().sub(b.min).max(new THREE.Vector3(160, 80, 160));
    this.min.copy(c).addScaledVector(ext, -0.5);
    this.max.copy(c).addScaledVector(ext, 0.5);
    this.min.y = Math.max(this.min.y, -CONFIG.site.olmHeight - 2);
    this.stateMat.uniforms.uT.value = T;
    this.quad.render(renderer, this.stateMat, this.state);
    const prev = renderer.getRenderTarget();
    const prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    const ny = this.res[1];
    for (let k = 0; k < ny; k++) {
      this.splatMat.uniforms.uSliceY.value = this.min.y + ((k + 0.5) / ny) * (this.max.y - this.min.y);
      renderer.setRenderTarget(this.grid, k);
      renderer.clear(true, false, false);
      renderer.render(this.splatScene, this.splatCam);
    }
    renderer.setRenderTarget(prev);
    renderer.autoClear = prevAuto;
  }

  dispose(): void {
    this.grid.dispose();
    this.state.dispose();
    this.stateMat.dispose();
    this.splatMat.dispose();
    this.splatMesh.geometry.dispose();
    this.quad.dispose();
  }
}
