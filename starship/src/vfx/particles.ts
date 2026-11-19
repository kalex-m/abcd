import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import type { Trajectory } from '../physics/staging';
import { planarToWorld, DOWNRANGE } from '../vehicle/state';
import { SHARED, SHARED_GLSL, ADDITIVE, PREMULT } from '../post/shared';
import { GLSL_NOISE } from '../util/noise';
import { WIND_GLSL } from './smoke-gpu';
import { rngFor } from '../util/rng';

/**
 * Stateless GPU particles. Each emitter supplies a GLSL `emit()` that maps (index, randoms, mission
 * time) to a true-world position, size, colour/alpha, velocity (for motion streaks) and an emissive
 * flag, using the closed-form helpers below (linear drag + gravity + wind, ground bounce). Nothing is
 * simulated incrementally, so any frame is reproducible in isolation (record mode, scrubbing).
 * Particles are camera-facing quads stretched along their screen-space velocity, soft against the depth
 * buffer, attenuated by the smoke / cloud transmittance slices, rendered into the FX layer either
 * additively (sparks, embers, flames) or as premultiplied lit puffs (spray, dust, vapour, ice).
 */
export const TRAJ_TEX_W = 2048;
export const TRAJ_T0 = -10;
export const TRAJ_T1 = 480;

/** Float texture with the vehicles' true-world positions and axes over mission time. */
export function makeTrajectoryTexture(traj: Trajectory): THREE.DataTexture {
  const w = TRAJ_TEX_W, h = 4;
  const data = new Float32Array(w * h * 4);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < w; i++) {
    const t = TRAJ_T0 + ((TRAJ_T1 - TRAJ_T0) * i) / (w - 1);
    const rows: [Trajectory['booster'], number][] = [[traj.booster, 0], [traj.ship, 2]];
    for (const [track, r] of rows) {
      const s = track.at(t);
      planarToWorld(s.px, s.py, tmp);
      data.set([tmp.x, tmp.y, tmp.z, s.speed], (r * w + i) * 4);
      const ax = DOWNRANGE.clone().multiplyScalar(Math.sin(s.pitch)).add(new THREE.Vector3(0, Math.cos(s.pitch), 0));
      data.set([ax.x, ax.y, ax.z, s.thrust / 1e6], ((r + 1) * w + i) * 4);
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export const PARTICLE_LIB = /* glsl */ `
${GLSL_NOISE}
${WIND_GLSL}
uniform sampler2D tTraj;
const float TRAJ_T0 = ${TRAJ_T0.toFixed(1)};
const float TRAJ_T1 = ${TRAJ_T1.toFixed(1)};
const float GRADE = ${(-CONFIG.site.olmHeight).toFixed(2)};
vec4 trajFetch(int row, float t) {
  float x = clamp((t - TRAJ_T0) / (TRAJ_T1 - TRAJ_T0), 0.0, 1.0) * ${(TRAJ_TEX_W - 1).toFixed(1)};
  float i = floor(x); float f = x - i;
  vec4 a = texelFetch(tTraj, ivec2(int(i), row), 0);
  vec4 b = texelFetch(tTraj, ivec2(int(min(i + 1.0, ${(TRAJ_TEX_W - 1).toFixed(1)})), row), 0);
  return mix(a, b, f);
}
vec3 vehPos(int v, float t) { return trajFetch(v * 2, t).xyz; }
vec3 vehAxis(int v, float t) { return normalize(trajFetch(v * 2 + 1, t).xyz); }
float vehThrust(int v, float t) { return trajFetch(v * 2 + 1, t).w; }
// closed-form motion with linear drag (time constant tau) towards the wind, plus gravity
vec3 dragMotion(vec3 p0, vec3 v0, float t, float tau, vec3 wind, float g) {
  vec3 vInf = wind + vec3(0.0, -g * tau, 0.0);
  return p0 + vInf * t + (v0 - vInf) * tau * (1.0 - exp(-t / tau));
}
vec3 dragVel(vec3 v0, float t, float tau, vec3 wind, float g) {
  vec3 vInf = wind + vec3(0.0, -g * tau, 0.0);
  return vInf + (v0 - vInf) * exp(-t / tau);
}
// single inelastic bounce on the grade
vec3 bounce(vec3 p, float ground, float rest) { if (p.y < ground) p.y = ground + (ground - p.y) * rest; return p; }
`;

const VERT = /* glsl */ `
${SHARED_GLSL}
${PARTICLE_LIB}
attribute vec4 aR0;
attribute vec4 aR1;
attribute float aId;
uniform float uT;
uniform float uIntensity;
uniform float uSizeScale;
varying vec2 vQuad;
varying vec4 vCol;
varying float vEmis;
varying float vSoft;
varying float vDepth;
varying vec4 vClipP;
varying float vSeed;
%EMITTER%
void main() {
  vec3 pos; float size; vec4 col; vec3 vel; float emis;
  bool alive = emit(aId, aR0, aR1, uT, pos, size, col, vel, emis);
  if (!alive || col.a <= 0.0005 || size <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  col.a *= uIntensity;
  vec3 pS = pos - uOrigin;
  vec4 mv = viewMatrix * vec4(pS, 1.0);
  // camera-facing quad stretched along the projected velocity
  vec3 velV = (viewMatrix * vec4(vel, 0.0)).xyz;
  vec2 vdir = velV.xy;
  float vl = length(vdir);
  float stretch = 1.0 + min(vl * ${(1 / 60).toFixed(5)} / max(size, 1e-3), 8.0);
  vec2 axisU = vl > 1e-4 ? vdir / vl : vec2(1.0, 0.0);
  vec2 axisV = vec2(-axisU.y, axisU.x);
  vec2 q = position.xy;
  vec2 off = axisU * q.x * size * stretch + axisV * q.y * size;
  mv.xy += off * uSizeScale;
  gl_Position = projectionMatrix * mv;
  vQuad = q;
  vCol = col;
  vEmis = emis;
  vSoft = size * 1.5;
  vDepth = -mv.z;
  vClipP = gl_Position;
  vSeed = aR1.w;
}`;

const FRAG = /* glsl */ `
${SHARED_GLSL}
uniform float uAdditive;
uniform float uPuffy;
varying vec2 vQuad;
varying vec4 vCol;
varying float vEmis;
varying float vSoft;
varying float vDepth;
varying vec4 vClipP;
varying float vSeed;
void main() {
  float r2 = dot(vQuad, vQuad);
  if (r2 > 1.0) discard;
  float a = 1.0 - r2;
  a = uPuffy > 0.5 ? a * a * (0.65 + 0.35 * sin(atan(vQuad.y, vQuad.x) * 5.0 + vSeed * 40.0) * (1.0 - a)) : a * a;
  vec2 suv = vClipP.xy / vClipP.w * 0.5 + 0.5;
  float scene = sceneDepthAt(suv);
  float soft = clamp((scene - vDepth) / max(vSoft, 0.05), 0.0, 1.0);
  float camFade = smoothstep(0.3, 2.5, vDepth);
  float vt = volumeTransmittance(suv, vDepth);
  float alpha = vCol.a * a * soft * camFade;
  if (uAdditive > 0.5) gl_FragColor = vec4(vCol.rgb * alpha * vt, 0.0);
  else gl_FragColor = vec4(vCol.rgb * alpha * vt, alpha * vt);
}`;

export interface EmitterDef {
  name: string;
  count: number;
  additive: boolean;
  puffy?: boolean;
  /** GLSL source defining: bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) */
  glsl: string;
  uniforms?: Record<string, THREE.IUniform>;
  /** per-frame hook: return the overall intensity (0 hides the emitter) */
  update?: (ctx: FrameContext, u: Record<string, THREE.IUniform>) => number;
}

/** Lighting helper for lit (alpha) particles, evaluated in the vertex shader. */
export const PARTICLE_LIGHT_GLSL = /* glsl */ `
vec3 litColor(vec3 albedo, vec3 posW, float forward) {
  vec3 pS = posW - uOrigin;
  vec3 V = normalize(pS - uCamPosW);
  float c = dot(V, uSunDirW);
  float g = 0.55 * forward;
  float ph = (1.0 - g * g) / pow(max(1.0 + g * g - 2.0 * g * c, 1e-3), 1.5) * 0.25;
  vec3 sun = uSunColor * (0.3 + min(ph, 1.2)) * step(-0.05, uSunDirW.y);
  vec3 amb = uAmbient * 7.0 + uSunColor * 0.06;
  vec3 fire = plumeLightAt(pS, 8.0) * 0.12;
  return albedo * (sun * 0.45 + amb + fire);
}
`;

export class ParticleSystem implements System {
  readonly name = 'particles';
  private readonly meshes: { mesh: THREE.Mesh; def: EmitterDef; mat: THREE.ShaderMaterial }[] = [];
  readonly trajTex: THREE.DataTexture;

  constructor(private fxScene: THREE.Scene, traj: Trajectory) {
    this.trajTex = makeTrajectoryTexture(traj);
  }

  add(def: EmitterDef): void {
    const n = Math.max(1, Math.floor(def.count));
    const rng = rngFor(`particles:${def.name}`);
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const r0 = new Float32Array(n * 4), r1 = new Float32Array(n * 4), id = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 4; k++) { r0[i * 4 + k] = rng.next(); r1[i * 4 + k] = rng.next(); }
      id[i] = i;
    }
    g.setAttribute('aR0', new THREE.InstancedBufferAttribute(r0, 4));
    g.setAttribute('aR1', new THREE.InstancedBufferAttribute(r1, 4));
    g.setAttribute('aId', new THREE.InstancedBufferAttribute(id, 1));
    g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT.replace('%EMITTER%', `${def.additive ? '' : PARTICLE_LIGHT_GLSL}\nconst float N_PARTICLES = ${n.toFixed(1)};\n${def.glsl}`),
      fragmentShader: FRAG,
      ...(def.additive ? ADDITIVE : PREMULT),
      depthTest: false,
      uniforms: {
        ...SHARED, tTraj: { value: this.trajTex }, uT: { value: 0 }, uIntensity: { value: 1 }, uSizeScale: { value: 1 },
        uAdditive: { value: def.additive ? 1 : 0 }, uPuffy: { value: def.puffy ? 1 : 0 }, ...(def.uniforms ?? {}),
      },
    });
    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false;
    mesh.name = `particles:${def.name}`;
    mesh.renderOrder = def.additive ? 2 : 1;
    this.fxScene.add(mesh);
    this.meshes.push({ mesh, def, mat });
  }

  update(ctx: FrameContext): void {
    for (const m of this.meshes) {
      const k = m.def.update ? m.def.update(ctx, m.mat.uniforms) : 1;
      m.mesh.visible = k > 0.001;
      m.mat.uniforms.uT.value = ctx.mission;
      m.mat.uniforms.uIntensity.value = k;
    }
  }

  dispose(): void {
    for (const m of this.meshes) {
      m.mesh.geometry.dispose();
      m.mat.dispose();
    }
    this.trajTex.dispose();
  }
}
