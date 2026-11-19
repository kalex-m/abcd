import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import type { HotStageRing } from '../vehicle/hotstage-ring';
import { SHARED, SHARED_GLSL, ADDITIVE } from '../post/shared';
import { GLSL_NOISE } from '../util/noise';
import type { EmitterDef } from './particles';

/**
 * Hot staging (Section 9.9): ~100 vent-slot flame jets around the hot-stage ring (instanced flame cones,
 * length 4-14 m driven by the staging pressure, randomised per-slot lag), a turbulent fireball filling
 * the gap between the stages, an expanding shock shell (400 m/s decelerating) and post-separation ring
 * venting. Cold-gas flip thrusters on the booster top are particle puffs (see coldGasEmitter).
 */
const FLAME_VERT = /* glsl */ `
attribute float aLag;
attribute float aSeed;
uniform float uFire;
uniform float uTimeF;
varying float vX;
varying vec2 vR;
varying float vSeed;
varying float vLen;
varying vec4 vClip;
varying float vDepth;
void main() {
  float lagged = clamp(uFire * 1.25 - aLag * 0.35, 0.0, 1.0);
  float len = mix(${CONFIG.hotStage.slotFlameLength[0].toFixed(1)}, ${CONFIG.hotStage.slotFlameLength[1].toFixed(1)}, lagged) * (0.85 + 0.3 * sin(uTimeF * 23.0 + aSeed * 40.0));
  vec3 p = position;
  p.x *= len * lagged;
  p.yz *= (0.5 + p.x * 0.25);
  vX = position.x; vR = position.yz; vSeed = aSeed; vLen = lagged;
  vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position;
  vDepth = -mv.z;
}`;
const FLAME_FRAG = /* glsl */ `
${SHARED_GLSL}
${GLSL_NOISE}
uniform float uTimeF;
uniform float uRadianceF;
varying float vX;
varying vec2 vR;
varying float vSeed;
varying float vLen;
varying vec4 vClip;
varying float vDepth;
void main() {
  if (vLen <= 0.01) discard;
  float r = length(vR);
  float n = gnoise3(vec3(vX * 4.0 - uTimeF * 9.0, vR * 3.0 + vSeed * 9.0)) * 0.5 + 0.5;
  float a = (1.0 - smoothstep(0.2, 1.0, r + n * 0.4)) * (1.0 - smoothstep(0.4, 1.0, vX + n * 0.25));
  vec3 c = mix(vec3(1.0, 0.85, 0.6), vec3(1.0, 0.35, 0.08), smoothstep(0.0, 0.8, vX));
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  float soft = clamp((sceneDepthAt(suv) - vDepth) / 1.5, 0.0, 1.0);
  gl_FragColor = vec4(c * a * uRadianceF * soft * vLen, 0.0);
}`;

const BALL_FRAG = /* glsl */ `
${SHARED_GLSL}
${GLSL_NOISE}
uniform float uFire;
uniform float uTimeF;
uniform float uShock; // shock shell radius fraction 0..1 (relative to mesh)
varying vec3 vN;
varying vec3 vP;
varying vec4 vClip;
varying float vDepth;
void main() {
  vec3 V = normalize(vP - uCamPosW);
  float fres = 1.0 - abs(dot(normalize(vN), V));
  float n = gnoise3(vN * 3.0 + vec3(0.0, -uTimeF * 4.0, uTimeF)) * 0.5 + 0.5;
  float core = pow(1.0 - fres, 1.5) * (0.6 + 0.8 * n);
  vec3 c = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.9, 0.7), core);
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  float soft = clamp((sceneDepthAt(suv) - vDepth) / 4.0, 0.0, 1.0);
  gl_FragColor = vec4(c * core * uFire * 45.0 * soft, 0.0);
}`;
const BALL_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
varying vec4 vClip;
varying float vDepth;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vP = w.xyz;
  vec4 mv = viewMatrix * w;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position;
  vDepth = -mv.z;
}`;
const SHOCK_FRAG = /* glsl */ `
uniform float uShockA;
varying vec3 vN;
varying vec3 vP;
varying vec4 vClip;
varying float vDepth;
uniform vec3 uCamPosW;
void main() {
  vec3 V = normalize(vP - uCamPosW);
  float rim = pow(1.0 - abs(dot(normalize(vN), V)), 6.0);
  gl_FragColor = vec4(vec3(0.9, 0.95, 1.0) * rim * uShockA, 0.0);
}`;

export class HotStageFire implements System {
  readonly name = 'hotStageFire';
  private readonly flames: THREE.InstancedMesh;
  private readonly flameMat: THREE.ShaderMaterial;
  private readonly ball: THREE.Mesh;
  private readonly ballMat: THREE.ShaderMaterial;
  private readonly shock: THREE.Mesh;
  private readonly shockMat: THREE.ShaderMaterial;
  private readonly root = new THREE.Group();

  constructor(fxScene: THREE.Scene, ring: HotStageRing) {
    const n = ring.slotCenters.length;
    const geo = new THREE.ConeGeometry(0.35, 1, 12, 4, true).rotateZ(-Math.PI / 2).translate(0.5, 0, 0);
    const lag = new Float32Array(n), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { lag[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1; seed[i] = (Math.sin(i * 78.233) * 12345.678) % 1; }
    geo.setAttribute('aLag', new THREE.InstancedBufferAttribute(lag.map(Math.abs), 1));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed.map(Math.abs), 1));
    this.flameMat = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, ...ADDITIVE, depthTest: false, side: THREE.DoubleSide,
      uniforms: { ...SHARED, uFire: { value: 0 }, uTimeF: { value: 0 }, uRadianceF: { value: 40 } },
    });
    this.flames = new THREE.InstancedMesh(geo, this.flameMat, n);
    const m = new THREE.Matrix4();
    ring.slotCenters.forEach((c, i) => {
      const nrm = ring.slotNormals[i];
      m.makeBasis(nrm, new THREE.Vector3(0, 1, 0), new THREE.Vector3().crossVectors(nrm, new THREE.Vector3(0, 1, 0)));
      m.setPosition(c);
      this.flames.setMatrixAt(i, m);
    });
    this.flames.frustumCulled = false;
    this.ballMat = new THREE.ShaderMaterial({ vertexShader: BALL_VERT, fragmentShader: BALL_FRAG, ...ADDITIVE, depthTest: false, uniforms: { ...SHARED, uFire: { value: 0 }, uTimeF: { value: 0 }, uShock: { value: 0 } } });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), this.ballMat);
    this.ball.frustumCulled = false;
    this.shockMat = new THREE.ShaderMaterial({ vertexShader: BALL_VERT, fragmentShader: SHOCK_FRAG, ...ADDITIVE, depthTest: false, uniforms: { uShockA: { value: 0 }, uCamPosW: SHARED.uCamPosW } });
    this.shock = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), this.shockMat);
    this.shock.frustumCulled = false;
    this.root.add(this.flames, this.ball, this.shock);
    this.root.matrixAutoUpdate = false;
    fxScene.add(this.root);
  }

  update(ctx: FrameContext): void {
    const s = ctx.snap;
    const fire = Math.max(s.hotStageFire, s.ringVent * 0.6);
    this.root.visible = fire > 0.002 || (ctx.mission > CONFIG.physics.hotStageT && ctx.mission < CONFIG.physics.hotStageT + 6);
    if (!this.root.visible) return;
    const b = ctx.booster;
    const m = new THREE.Matrix4().compose(b.position.clone().sub(ctx.origin), b.quaternion, new THREE.Vector3(1, 1, 1));
    this.root.matrix.copy(m);
    this.root.matrixWorld.copy(m);
    this.root.children.forEach((c) => c.updateMatrixWorld(true));
    this.flameMat.uniforms.uFire.value = fire;
    this.flameMat.uniforms.uTimeF.value = ctx.cin;
    // fireball between the stages, growing as the gap opens
    const gap = Math.max(0, ctx.ship.position.distanceTo(b.position) - CONFIG.vehicle.boosterHeight);
    const r = 5.5 + gap * 0.45 + s.hotStageFire * 3;
    this.ball.position.set(0, CONFIG.vehicle.boosterHeight + gap * 0.5, 0);
    this.ball.scale.setScalar(r);
    this.ballMat.uniforms.uFire.value = s.hotStageFire;
    this.ballMat.uniforms.uTimeF.value = ctx.cin;
    // shock shell from the interface, 400 m/s decelerating
    const age = ctx.mission - CONFIG.physics.hotStageT;
    const R = age > 0 ? CONFIG.hotStage.shockSpeed * 1.2 * (1 - Math.exp(-age / 1.2)) : 0;
    this.shock.position.set(0, CONFIG.vehicle.boosterHeight, 0);
    this.shock.scale.setScalar(Math.max(1, R));
    this.shockMat.uniforms.uShockA.value = age > 0 && age < 3 ? 2.5 * Math.exp(-age / 0.6) : 0;
  }

  dispose(): void {
    this.flames.geometry.dispose();
    this.flameMat.dispose();
    this.ball.geometry.dispose();
    this.ballMat.dispose();
    this.shock.geometry.dispose();
    this.shockMat.dispose();
  }
}

/** Cold-gas flip thrusters: white puffs from four nozzles on the booster top (vehicle frame at birth). */
export function coldGasEmitter(): EmitterDef {
  const p = CONFIG.physics;
  return {
    name: 'cold-gas', count: 4 * 900, additive: false, puffy: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float k = mod(id, 4.0);
  float period = 1.6;
  float tb = ${(p.boosterFlipStart - 0.5).toFixed(2)} + (${(p.boosterFlipDuration + 2).toFixed(2)}) * r0.x;
  float ph = mod(tb - ${p.boosterFlipStart.toFixed(2)} + k * 0.4, period);
  if (ph > 0.3) return false;
  float a = T - tb;
  if (a < 0.0 || a > 1.6) return false;
  vec3 c = vehPos(0, tb) + vehAxis(0, tb) * ${(CONFIG.vehicle.boosterHeight - 1.5).toFixed(1)};
  vec3 ax = vehAxis(0, tb);
  vec3 s1 = normalize(cross(ax, vec3(0.0, 0.0, 1.0)));
  vec3 s2 = cross(ax, s1);
  float ang = k * 1.5707963 + 0.785;
  vec3 dir = normalize(s1 * cos(ang) + s2 * sin(ang) + (r1.xyz - 0.5) * 0.25);
  vec3 vb = (vehPos(0, tb + 0.1) - vehPos(0, tb)) * 10.0;
  pos = c + dir * (4.6 + (40.0 + 30.0 * r1.w) * (1.0 - exp(-a / 0.35)) * 0.35) + vb * a;
  vel = dir * 30.0 * exp(-a / 0.3);
  size = 0.4 + a * 2.6;
  col = vec4(litColor(vec3(0.95, 0.97, 1.0), pos, 0.7), 0.16 * (1.0 - a / 1.6));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > p.boosterFlipStart - 1 && ctx.mission < p.boosterFlipStart + p.boosterFlipDuration + 4 ? 1 : 0),
  };
}
