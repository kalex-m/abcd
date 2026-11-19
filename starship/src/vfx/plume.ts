import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import type { VehicleState } from '../vehicle/state';
import type { EngineSlot } from '../vehicle/engines-layout';
import { boosterLayout, shipLayout } from '../vehicle/engines-layout';
import { boosterAscentWindows } from '../physics/engine-schedule';
import { GLSL_NOISE } from '../util/noise';
import { SHARED, SHARED_GLSL, ADDITIVE } from '../post/shared';
import { blackbody, clamp, smoothstep } from '../util/math';
import PLUME_GLSL from './plume-shader.glsl';
import type { AtmosphereSky } from '../sky/atmosphere-sky';

/**
 * Exhaust plumes for the booster and the ship (one raymarched volume each), the ground-impingement disc
 * at liftoff, three plume point lights per active stage (core / mid / flare, intensity ~ thrust, colour
 * temperature 3000 K -> 1800 K), a heat-haze field and an emissive glow injected into the sky IBL so
 * the steel reflects the fire.
 */
const VERT = /* glsl */ `
varying vec3 vWorld;
varying vec4 vClip;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  vClip = gl_Position;
}`;

const FRAG = /* glsl */ `
${SHARED_GLSL}
${GLSL_NOISE}
${PLUME_GLSL}
uniform mat4 uWorldToPlume; // scene -> plume local (x = flow)
uniform float uBoundR; // m
varying vec3 vWorld;
varying vec4 vClip;
// ray vs finite cylinder along x: returns (tNear, tFar)
vec2 rayCyl(vec3 ro, vec3 rd, float rad, float x0, float x1) {
  float a = dot(rd.yz, rd.yz);
  float b = dot(ro.yz, rd.yz);
  float c = dot(ro.yz, ro.yz) - rad * rad;
  float tn = -1e9, tf = 1e9;
  if (a > 1e-8) {
    float h = b * b - a * c;
    if (h < 0.0) return vec2(1.0, -1.0);
    h = sqrt(h);
    tn = (-b - h) / a; tf = (-b + h) / a;
  } else if (c > 0.0) return vec2(1.0, -1.0);
  if (abs(rd.x) > 1e-8) {
    float t0 = (x0 - ro.x) / rd.x, t1 = (x1 - ro.x) / rd.x;
    tn = max(tn, min(t0, t1)); tf = min(tf, max(t0, t1));
  } else if (ro.x < x0 || ro.x > x1) return vec2(1.0, -1.0);
  return vec2(tn, tf);
}
void main() {
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  vec3 roW = uCamPosW;
  vec3 rdW = normalize(vWorld - roW);
  vec3 ro = (uWorldToPlume * vec4(roW, 1.0)).xyz;
  vec3 rd = normalize((uWorldToPlume * vec4(rdW, 0.0)).xyz);
  vec2 hit = rayCyl(ro, rd, uBoundR, -0.2, uLength);
  // convert view depth to ray distance
  vec3 fwd = normalize(-vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]));
  float tScene = sceneDepthAt(suv) / max(dot(rdW, fwd), 1e-3);
  float t0 = max(hit.x, 0.0), t1 = min(hit.y, tScene);
  if (t1 <= t0) discard;
  float n = uSteps;
  float dt = (t1 - t0) / n;
  float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 7.0) * 43758.5453);
  vec3 acc = vec3(0.0);
  float T = 1.0;
  for (int i = 0; i < 64; i++) {
    if (float(i) >= n) break;
    float t = t0 + (float(i) + jitter) * dt;
    vec3 q = ro + rd * t;
    vec3 d = plumeDensity(q, uTime);
    if (d.x <= 0.0) continue;
    vec3 c = plumeColor(d.y, uAfterburn, uVacuum);
    float dist = t;
    float vt = volumeTransmittance(suv, dist);
    acc += T * c * d.x * dt * vt;
    // soot / particulate self-occlusion keeps the edges volumetric
    T *= exp(-d.z * dt * 0.02 * (1.0 - uVacuum));
  }
  gl_FragColor = vec4(acc * uRadiance * 0.018, 0.0);
}`;

const HEAT_FRAG = /* glsl */ `
uniform mat4 uWorldToPlume;
uniform float uLength;
uniform float uRadius0;
uniform float uStrength;
uniform vec3 uCamPosW;
varying vec3 vWorld;
varying vec4 vClip;
void main() {
  vec3 q = (uWorldToPlume * vec4(vWorld, 1.0)).xyz;
  float r = length(q.yz);
  float x = q.x;
  float h = exp(-x / (uLength * 0.6)) * smoothstep(uRadius0 * 3.5 + x * 0.25, uRadius0, r) * uStrength;
  float camFade = smoothstep(5.0, 40.0, length(vWorld - uCamPosW));
  gl_FragColor = vec4(h * camFade * 0.25, 0.0, 0.0, 1.0);
}`;

/** Impingement disc: radial fiery outflow along the ground for the first seconds after ignition. */
const DISC_FRAG = /* glsl */ `
${SHARED_GLSL}
${GLSL_NOISE}
uniform vec3 uCenter; // scene coords of the impact point on the ground
uniform float uFront; // m radius of the expanding front
uniform float uHeight; // m
uniform float uIntensity;
uniform float uSteps;
varying vec3 vWorld;
varying vec4 vClip;
void main() {
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  vec3 ro = uCamPosW;
  vec3 rd = normalize(vWorld - ro);
  vec3 fwd = normalize(-vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]));
  float tScene = sceneDepthAt(suv) / max(dot(rd, fwd), 1e-3);
  // bounding cylinder around the impact point
  vec3 oc = ro - uCenter;
  float R = uFront + 10.0;
  float a = dot(rd.xz, rd.xz), b = dot(oc.xz, rd.xz), c = dot(oc.xz, oc.xz) - R * R;
  float hh = b * b - a * c;
  if (hh < 0.0) discard;
  hh = sqrt(hh);
  float tn = (-b - hh) / a, tf = (-b + hh) / a;
  float ty0 = (-2.0 - oc.y) / rd.y, ty1 = (uHeight * 1.6 - oc.y) / rd.y;
  tn = max(tn, min(ty0, ty1)); tf = min(tf, max(ty0, ty1));
  tn = max(tn, 0.0); tf = min(tf, tScene);
  if (tf <= tn) discard;
  float dt = (tf - tn) / uSteps;
  vec3 acc = vec3(0.0);
  float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(39.3, 11.7)) + uTime * 3.0) * 4375.5);
  for (int i = 0; i < 32; i++) {
    if (float(i) >= uSteps) break;
    vec3 p = oc + rd * (tn + (float(i) + jitter) * dt);
    float r = length(p.xz);
    float y = p.y;
    float ang = atan(p.z, p.x);
    vec3 np = vec3(r * 0.08 - uTime * 3.5, y * 0.12, ang * 4.0);
    float turb = gnoise3(np) * 0.6 + gnoise3(np * 2.3) * 0.4;
    float front = smoothstep(uFront + 8.0, uFront - 25.0, r);
    float h = uHeight * (0.5 + 0.5 * smoothstep(0.0, uFront, r));
    float vert = exp(-pow(max(y, 0.0) / (h * (0.7 + 0.3 * turb)), 2.0)) * step(-1.0, y);
    float radial = exp(-r / (uFront * 0.55 + 10.0));
    float d = front * vert * radial * (0.5 + 0.7 * turb);
    float tmix = exp(-r / 25.0);
    vec3 col = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.85, 0.6), tmix);
    acc += col * d * dt * volumeTransmittance(suv, length(p - oc));
  }
  gl_FragColor = vec4(acc * uIntensity, 0.0);
}`;

interface PlumeVolume {
  mesh: THREE.Mesh;
  heat: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  heatMat: THREE.ShaderMaterial;
  tex: THREE.DataTexture;
  data: Uint8Array;
  slots: EngineSlot[];
  extent: number;
}

const TEX = 64;

export class Plumes implements System {
  readonly name = 'plumes';
  private readonly booster: PlumeVolume;
  private readonly ship: PlumeVolume;
  private readonly disc: THREE.Mesh;
  private readonly discMat: THREE.ShaderMaterial;
  readonly lights: THREE.PointLight[] = [];
  private readonly envGlow: THREE.Mesh;
  private readonly ascentOn = boosterAscentWindows().on;

  constructor(scene: THREE.Scene, private fxScene: THREE.Scene, heatScene: THREE.Scene, private sky: AtmosphereSky, steps: number) {
    this.booster = this.makeVolume(boosterLayout(), 5.0, steps, 11);
    this.ship = this.makeVolume(shipLayout(), 4.0, steps, 23);
    for (const v of [this.booster, this.ship]) {
      fxScene.add(v.mesh);
      heatScene.add(v.heat);
    }
    this.discMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: DISC_FRAG, ...ADDITIVE, depthTest: false, side: THREE.BackSide,
      uniforms: { ...SHARED, uCenter: { value: new THREE.Vector3() }, uFront: { value: 0 }, uHeight: { value: 20 }, uIntensity: { value: 0 }, uSteps: { value: Math.max(12, Math.floor(steps * 0.75)) } },
    });
    this.disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, false).translate(0, 0.5, 0), this.discMat);
    this.disc.frustumCulled = false;
    fxScene.add(this.disc);
    const temps = CONFIG.lighting.plumeLightColorK;
    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(new THREE.Color(...blackbody(temps[i])), 0, 0, 2);
      l.castShadow = false;
      scene.add(l);
      this.lights.push(l);
    }
    this.envGlow = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.6, 0.25) }));
    sky.envExtras.add(this.envGlow);
  }

  private makeVolume(slots: EngineSlot[], extent: number, steps: number, seed: number): PlumeVolume {
    const data = new Uint8Array(TEX * TEX * 4);
    const tex = new THREE.DataTexture(data, TEX, TEX, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    const P = CONFIG.plume;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, ...ADDITIVE, depthTest: false, side: THREE.BackSide,
      uniforms: {
        ...SHARED,
        tEngines: { value: tex }, uEngineExtent: { value: extent }, uLength: { value: 60 }, uRadius0: { value: 4 }, uExpansion: { value: 0 },
        uDiamondL: { value: 5 }, uDiamonds: { value: 1 }, uDiamondDecay: { value: P.diamondDecay }, uCore: { value: 1 }, uAfterburn: { value: 1 },
        uVacuum: { value: 0 }, uRadiance: { value: P.radianceScale }, uFlowSpeed: { value: P.visibleFlowSpeed }, uSteps: { value: steps },
        uGroundX: { value: 1e6 }, uFlicker: { value: 1 }, uSeed: { value: seed }, uCoreColor: { value: new THREE.Vector3(...P.coreColor) },
        uEdgeColor: { value: new THREE.Vector3(...P.edgeColor) }, uWorldToPlume: { value: new THREE.Matrix4() }, uBoundR: { value: 10 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32, 1, false).rotateZ(Math.PI / 2).translate(0.5, 0, 0), mat);
    mesh.frustumCulled = false;
    const heatMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: HEAT_FRAG, ...ADDITIVE, depthTest: false, side: THREE.DoubleSide,
      uniforms: { uWorldToPlume: mat.uniforms.uWorldToPlume, uLength: mat.uniforms.uLength, uRadius0: mat.uniforms.uRadius0, uStrength: { value: 0 }, uCamPosW: SHARED.uCamPosW },
    });
    const heat = new THREE.Mesh(mesh.geometry, heatMat);
    heat.frustumCulled = false;
    return { mesh, heat, mat, heatMat, tex, data, slots, extent };
  }

  /** Rasterise the per-engine pattern (R level, G chug, B spark) into the 64x64 texture. */
  private paint(v: PlumeVolume, levels: Float32Array, chug: Float32Array, spark: Float32Array): boolean {
    const d = v.data;
    d.fill(0);
    let any = false;
    v.slots.forEach((s, i) => {
      const lv = levels[i], cg = chug[i], sp = spark[i];
      if (lv < 0.01 && cg < 0.01 && sp < 0.01) return;
      any = true;
      const cx = (s.x / v.extent * 0.5 + 0.5) * TEX, cz = (s.z / v.extent * 0.5 + 0.5) * TEX;
      const rr = (s.exitDiameter / 2 / v.extent) * 0.5 * TEX;
      const r2 = rr * rr;
      for (let y = Math.floor(cz - rr - 1); y <= Math.ceil(cz + rr + 1); y++) {
        for (let x = Math.floor(cx - rr - 1); x <= Math.ceil(cx + rr + 1); x++) {
          if (x < 0 || y < 0 || x >= TEX || y >= TEX) continue;
          const dd = (x + 0.5 - cx) ** 2 + (y + 0.5 - cz) ** 2;
          if (dd > r2 * 1.4) continue;
          const f = clamp(1 - dd / (r2 * 1.4), 0, 1);
          const o = (y * TEX + x) * 4;
          d[o] = Math.min(255, d[o] + f * lv * 255);
          d[o + 1] = Math.min(255, d[o + 1] + f * cg * 255);
          d[o + 2] = Math.min(255, d[o + 2] + f * sp * 255);
          d[o + 3] = 255;
        }
      }
    });
    v.tex.needsUpdate = true;
    return any;
  }

  private updateVolume(v: PlumeVolume, st: VehicleState, ctx: FrameContext, chug: Float32Array, spark: Float32Array, rvac: boolean): number {
    const levels = st.engineLevel;
    const any = this.paint(v, levels, chug, spark);
    let total = 0;
    for (let i = 0; i < levels.length; i++) total += levels[i];
    const frac = total / levels.length;
    const vis = any && (frac > 0.003 || chug.some((c) => c > 0.01));
    v.mesh.visible = vis;
    v.heat.visible = vis;
    if (!vis) return 0;
    const shape = rvac ? st.plumeVac : st.plume;
    const u = v.mat.uniforms;
    const L = shape.length * (0.35 + 0.65 * Math.min(1, frac * 1.6));
    u.uLength.value = L;
    u.uRadius0.value = rvac ? 3.4 : 4.2;
    u.uExpansion.value = shape.expansion;
    u.uDiamondL.value = shape.diamondSpacing;
    u.uDiamonds.value = shape.diamonds;
    u.uCore.value = Math.max(0.15, shape.coreBrightness);
    u.uAfterburn.value = shape.afterburn;
    u.uVacuum.value = shape.vacuum;
    const P = CONFIG.plume;
    const f = P.flickerHz;
    const tt = ctx.cin;
    u.uFlicker.value = 1 + 0.05 * Math.sin(tt * 2 * Math.PI * f[0]) + 0.035 * Math.sin(tt * 2 * Math.PI * f[1] + 1.3) + 0.02 * Math.sin(tt * 2 * Math.PI * 29.3);
    const R = (u.uRadius0.value as number) + 0.6 + L * Math.tan(Math.max(0.035, shape.expansion));
    u.uBoundR.value = R * 1.35;
    // plume frame: x along -body axis from the nozzle exit plane
    const exitY = rvac ? -0.5 : -0.45;
    const axis = st.axis.clone();
    const origin = st.position.clone().sub(ctx.origin).addScaledVector(axis, exitY);
    const flow = axis.clone().negate();
    const up = Math.abs(flow.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const yA = new THREE.Vector3().crossVectors(flow, up).normalize();
    const zA = new THREE.Vector3().crossVectors(flow, yA).normalize();
    // plume local yz must match the engine pattern (vehicle local x/z); use the vehicle quaternion
    const lx = new THREE.Vector3(1, 0, 0).applyQuaternion(st.quaternion);
    const lz = new THREE.Vector3(0, 0, 1).applyQuaternion(st.quaternion);
    void yA; void zA;
    const toWorld = new THREE.Matrix4().makeBasis(flow, lx, lz).setPosition(origin);
    (u.uWorldToPlume.value as THREE.Matrix4).copy(toWorld).invert();
    v.mesh.matrixAutoUpdate = false;
    v.mesh.matrix.copy(toWorld).multiply(new THREE.Matrix4().makeScale(L, R * 1.35, R * 1.35));
    v.mesh.matrixWorld.copy(v.mesh.matrix);
    v.heat.matrixAutoUpdate = false;
    v.heat.matrix.copy(v.mesh.matrix);
    v.heat.matrixWorld.copy(v.mesh.matrix);
    // ground / deflector cut-off
    const groundY = -CONFIG.site.olmHeight + 3.7 + ctx.origin.y * 0;
    const oy = origin.y + ctx.origin.y;
    const dy = flow.y;
    u.uGroundX.value = dy < -0.2 && oy < 400 ? Math.max(0, (oy - groundY) / -dy) : 1e6;
    v.heatMat.uniforms.uStrength.value = Math.min(1, frac * 2) * (1 - shape.vacuum);
    return frac;
  }

  update(ctx: FrameContext): void {
    const t = ctx.mission;
    const b = ctx.booster;
    // ignition transients per booster engine: spark (40 ms before), chug (350 ms after light)
    const chugB = new Float32Array(33), sparkB = new Float32Array(33);
    for (let e = 0; e < 33; e++) {
      const on = this.ascentOn[e];
      const dt = t - on;
      sparkB[e] = dt > -0.06 && dt < 0.0 ? 1 : 0;
      chugB[e] = dt >= 0 && dt < 0.6 ? Math.exp(-dt / 0.2) * (0.6 + 0.4 * Math.sin(dt * 90)) : 0;
    }
    const fracB = this.updateVolume(this.booster, b, ctx, chugB, sparkB, false);
    const zero6 = new Float32Array(6);
    const s = ctx.ship;
    // ship: sea-level engines use the SL shape, the merged plume is dominated by the RVacs in vacuum
    const fracS = this.updateVolume(this.ship, s, ctx, zero6, zero6, s.pAmb < 5000);
    // impingement disc while the booster is low
    const low = Math.max(0, b.alt);
    const impact = new THREE.Vector3(0, -CONFIG.site.olmHeight + 0.5, 0).sub(ctx.origin);
    const P = CONFIG.plume;
    const strength = fracB * Math.exp(-low / 90) * (t > -8.5 ? 1 : 0);
    this.disc.visible = strength > 0.01 && t < 30;
    if (this.disc.visible) {
      const age = Math.max(0, t + 7.0);
      const front = Math.min(P.impingeMaxRadius * 0.55, age * P.impingeFrontSpeed * 0.18 + 12);
      this.discMat.uniforms.uCenter.value.copy(impact);
      this.discMat.uniforms.uFront.value = front;
      this.discMat.uniforms.uHeight.value = P.impingeHeight[0] + (P.impingeHeight[1] - P.impingeHeight[0]) * smoothstep(0, 8, age);
      this.discMat.uniforms.uIntensity.value = strength * P.radianceScale * 0.0012 * Math.exp(-Math.max(0, t) / 5);
      this.disc.position.copy(impact).setY(impact.y - 3);
      this.disc.scale.set(front + 12, P.impingeHeight[1] * 2, front + 12);
    }
    // plume lights (scene coordinates), intensity ~ thrust
    const L = CONFIG.lighting;
    const lightsFor = (st: VehicleState, frac: number, scale: number) => {
      const exit = st.position.clone().sub(ctx.origin);
      const flow = st.axis.clone().negate();
      const cand = st.kind === 'booster' && st.alt < 120 ? Math.max(0, (exit.y + ctx.origin.y + CONFIG.site.olmHeight - 4) / Math.max(0.2, -flow.y)) : 1e9;
      const pts = [exit.clone().addScaledVector(flow, 6), exit.clone().addScaledVector(flow, Math.min(25, cand)), exit.clone().addScaledVector(flow, Math.min(60, cand))];
      const I = st.thrustMN * L.plumeLightCandelaPerMN * L.luxScale * scale * (0.3 + 0.7 * frac);
      return { pts, I };
    };
    const main = fracB > 0.003 ? lightsFor(b, fracB, 1) : lightsFor(s, fracS, 0.6);
    const weights = [0.45, 0.35, 0.2];
    for (let i = 0; i < 3; i++) {
      const l = this.lights[i];
      l.position.copy(main.pts[i]);
      l.intensity = main.I * weights[i] * ctx.preset.renderScale;
      l.visible = l.intensity > 1e-3;
      SHARED.uPlumeLightPos.value[i].copy(main.pts[i]);
      SHARED.uPlumeLightCol.value[i].set(l.color.r, l.color.g, l.color.b).multiplyScalar(l.intensity);
    }
    // staging fireball adds to the plume lights
    if (ctx.snap.hotStageFire > 0) {
      const ring = b.position.clone().sub(ctx.origin).addScaledVector(b.axis, CONFIG.vehicle.boosterHeight);
      this.lights[0].position.copy(ring);
      this.lights[0].intensity += ctx.snap.hotStageFire * 4e3;
      this.lights[0].visible = true;
      SHARED.uPlumeLightPos.value[0].copy(ring);
      SHARED.uPlumeLightCol.value[0].set(1, 0.6, 0.3).multiplyScalar(this.lights[0].intensity);
    }
    // IBL glow at the brightest light
    const gl = this.lights[1];
    this.envGlow.visible = gl.visible;
    this.envGlow.position.copy(gl.position);
    const gs = Math.min(60, 8 + gl.intensity * 0.01);
    this.envGlow.scale.setScalar(gs);
    const em = Math.min(400, gl.intensity / (gs * gs) * 0.5);
    (this.envGlow.material as THREE.MeshBasicMaterial).color.setRGB(em, em * 0.55, em * 0.22);
    void this.fxScene;
    void this.sky;
  }

  dispose(): void {
    for (const v of [this.booster, this.ship]) {
      v.mesh.geometry.dispose();
      v.mat.dispose();
      v.heatMat.dispose();
      v.tex.dispose();
    }
    this.disc.geometry.dispose();
    this.discMat.dispose();
    this.envGlow.geometry.dispose();
    (this.envGlow.material as THREE.Material).dispose();
  }
}
