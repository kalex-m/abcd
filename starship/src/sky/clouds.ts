import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import type { VolumePass } from '../post/composer';
import { SHARED, SHARED_GLSL } from '../post/shared';
import { FullscreenQuad } from '../post/fsquad';
import { ATMOS_GLSL } from './atmosphere-glsl';
import { SKY_LOOKUP_GLSL, type AtmosphereSky } from './atmosphere-sky';
import { GLSL_NOISE } from '../util/noise';
import { planarToWorld } from '../vehicle/state';

/**
 * Volumetric cumulus layer (Frostbite / Schneider style): weather-map coverage, Perlin-Worley base
 * shape with a cumulus height profile (flat base, rounded towers), Worley + fbm erosion, sun shadow
 * ray, powder, dual-lobe HG, sky ambient and ground bounce, aerial blend towards the sky at distance,
 * blue-noise-like jitter. The rising stack carves a widening hole where it punched through the layer.
 * Output layout matches the smoke pass (colour/T + transmittance slices/depth).
 */
const FRAG = /* glsl */ `
${SHARED_GLSL}
${ATMOS_GLSL}
${SKY_LOOKUP_GLSL}
${GLSL_NOISE}
layout(location = 0) out vec4 oColor;
layout(location = 1) out vec4 oSlices;
uniform highp sampler3D tNoise;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform float uSteps;
uniform float uBase;
uniform float uTop;
uniform float uCoverage;
uniform float uDensity;
uniform vec2 uWind;
uniform vec4 uCarve; // xz centre, radius, active
uniform vec3 uCamTrue;
varying vec2 vUv;

float hg(float c, float g) { float g2 = g * g; return (1.0 - g2) / (12.566 * pow(max(1.0 + g2 - 2.0 * g * c, 1e-4), 1.5)); }
float remap(float v, float a, float b, float c, float d) { return c + (v - a) / (b - a) * (d - c); }

float cloudDensity(vec3 p, bool detail) {
  float h = (p.y - uBase) / (uTop - uBase);
  if (h < 0.0 || h > 1.0) return 0.0;
  vec2 wp = p.xz + uWind;
  float weather = fbm2(wp * 0.00022 + 3.7, 4) * 0.5 + 0.5;
  float cov = clamp(uCoverage * 2.6 * smoothstep(0.36, 0.72, weather), 0.0, 0.95);
  if (cov <= 0.001) return 0.0;
  // cumulus profile: quick ramp at the flat base, rounded top that rises with coverage
  float prof = smoothstep(0.0, 0.08, h) * smoothstep(1.0, 0.45 + 0.3 * (1.0 - cov), h);
  vec4 n = texture(tNoise, vec3(wp.x, p.y * 1.4, wp.y) * 0.00042);
  float shape = remap(n.r, (1.0 - n.g) * 0.55, 1.0, 0.0, 1.0);
  float d = clamp(remap(shape * prof, 1.0 - cov, 1.0, 0.0, 1.0), 0.0, 1.0);
  if (detail && d > 0.0) {
    vec4 dn = texture(tNoise, vec3(wp.x, p.y, wp.y) * 0.0042 + vec3(0.0, -uTime * 0.002, 0.0));
    float det = mix(dn.g, 1.0 - dn.b, clamp(h * 3.0, 0.0, 1.0));
    d = clamp(remap(d, det * 0.32, 1.0, 0.0, 1.0), 0.0, 1.0);
  }
  if (uCarve.w > 0.0) {
    float r = length(p.xz - uCarve.xy);
    d *= smoothstep(uCarve.z, uCarve.z * 1.8 + 30.0, r);
  }
  return d * uDensity;
}

void main() {
  float dd = texture2D(tDepth, vUv).r;
  float w = linearDepth(dd);
  vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec3 vdir = vp.xyz / vp.w;
  vdir /= -vdir.z;
  vec3 rd = normalize(mat3(uCamWorld) * vdir);
  float tScene = w < 1e8 ? length(vdir * w) : 1e9;
  vec3 ro = uCamTrue;
  // slab intersection
  float t0, t1;
  if (abs(rd.y) < 1e-4) { if (ro.y < uBase || ro.y > uTop) { t0 = 1.0; t1 = 0.0; } else { t0 = 0.0; t1 = 40000.0; } }
  else {
    float ta = (uBase - ro.y) / rd.y, tb = (uTop - ro.y) / rd.y;
    t0 = max(min(ta, tb), 0.0); t1 = max(ta, tb);
  }
  t1 = min(min(t1, tScene), t0 + 30000.0);
  vec3 L = vec3(0.0); float T = 1.0; vec3 Ts = vec3(1.0);
  if (t1 > t0) {
    float n = uSteps;
    float dt = (t1 - t0) / n;
    float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 3.1) * 43758.5453);
    float c = dot(rd, uSunDir);
    float phase = mix(hg(c, 0.62), hg(c, -0.18), 0.3);
    vec3 skyUp = skyRadiance(vec3(0.0, 1.0, 0.0)) * 3.14159;
    vec3 sunC = uSunColor;
    float altKm = (uBase + uTop) * 0.5 / 1000.0;
    vec3 Tsun0 = getTransmittance(RG + altKm, uSunDir.y);
    sunC = uSunIlluminance * Tsun0;
    float shStep = (uTop - uBase) * 0.12;
    for (int i = 0; i < 96; i++) {
      if (float(i) >= n || T < 0.01) break;
      float t = t0 + (float(i) + jit) * dt;
      vec3 p = ro + rd * t;
      float den = cloudDensity(p, true);
      if (den > 0.001) {
        float od = 0.0;
        for (int k = 1; k <= 5; k++) od += cloudDensity(p + uSunDir * shStep * float(k), false) * shStep;
        float Tsun = exp(-od) * 0.7 + exp(-od * 0.25) * 0.3;
        float powder = 1.0 - exp(-den * 2.0 * dt);
        float h = clamp((p.y - uBase) / (uTop - uBase), 0.0, 1.0);
        vec3 amb = skyUp * mix(0.35, 0.8, h) * 0.6 + uSunColor * max(uSunDir.y, 0.0) * 0.12 * (1.0 - h);
        // plume light from below as the stack punches through
        vec3 pS = p - uOrigin;
        vec3 fire = vec3(0.0);
        for (int k = 0; k < 3; k++) { vec3 dl = uPlumeLightPos[k] - pS; fire += uPlumeLightCol[k] / (dot(dl, dl) + 2500.0); }
        vec3 S = (sunC * Tsun * phase * mix(0.5, 1.0, powder) * 2.0 + amb + fire * 0.05) * den;
        float stepT = exp(-den * dt);
        L += T * (S - S * stepT) / max(den, 1e-6);
        T *= stepT;
      }
      if (t > uSliceDist.x && Ts.x > T) Ts.x = T;
      if (t > uSliceDist.y && Ts.y > T) Ts.y = T;
      if (t > uSliceDist.z && Ts.z > T) Ts.z = T;
    }
    if (t1 < uSliceDist.x) Ts.x = T;
    if (t1 < uSliceDist.y) Ts.y = T;
    if (t1 < uSliceDist.z) Ts.z = T;
    // aerial perspective on the clouds: fade towards the sky behind with distance
    float fog = 1.0 - exp(-max(t0, 0.0) / 28000.0);
    vec3 sky = skyRadiance(rd);
    L = mix(L, sky * (1.0 - T), fog * 0.85);
  }
  oColor = vec4(L, T);
  oSlices = vec4(Ts, w);
}`;

const VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class Clouds implements System, VolumePass {
  readonly name = 'clouds';
  enabled = true;
  private readonly rt: THREE.WebGLRenderTarget;
  private readonly mat: THREE.ShaderMaterial;
  private readonly quad = new FullscreenQuad();
  private passT = -1;
  private passXZ = new THREE.Vector2();

  constructor(private camera: THREE.PerspectiveCamera, sky: AtmosphereSky, noise: THREE.Texture, steps: number, private ctxTraj: { booster: { at(t: number): { px: number; py: number; alt: number } } }) {
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, count: 2, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const S = CONFIG.sky;
    const G = -CONFIG.site.olmHeight;
    this.mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: {
        ...SHARED, ...(sky.uniforms as unknown as Record<string, THREE.IUniform>),
        tNoise: { value: noise }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uSteps: { value: steps },
        uBase: { value: G + S.cloudBase }, uTop: { value: G + S.cloudTop }, uCoverage: { value: S.cloudCoverage }, uDensity: { value: S.cloudDensity },
        uWind: { value: new THREE.Vector2() }, uCarve: { value: new THREE.Vector4(0, 0, 0, 0) }, uCamTrue: { value: new THREE.Vector3() },
      },
    });
    // when did the stack cross the middle of the cloud layer?
    const mid = (S.cloudBase + S.cloudTop) / 2;
    for (let t = 0; t < 120; t += 0.25) {
      const s = this.ctxTraj.booster.at(t);
      if (s.alt > mid) {
        this.passT = t;
        const p = planarToWorld(s.px, s.py);
        this.passXZ.set(p.x, p.z);
        break;
      }
    }
  }

  get color(): THREE.Texture { return this.rt.textures[0]; }
  get slices(): THREE.Texture { return this.rt.textures[1]; }

  setSize(w: number, h: number): void {
    this.rt.setSize(Math.max(1, w), Math.max(1, h));
  }

  update(ctx: FrameContext): void {
    const u = this.mat.uniforms;
    const w = CONFIG.wind;
    const to = ((w.fromDeg + 180) * Math.PI) / 180;
    const spd = 9 * CONFIG.sky.cloudWindScale;
    u.uWind.value.set(-Math.sin(to) * spd * (ctx.mission + 600), Math.cos(to) * spd * (ctx.mission + 600));
    u.uCamTrue.value.copy(ctx.camTrue);
    const since = ctx.mission - this.passT;
    if (this.passT > 0 && since > -3) {
      const r = Math.max(0, 25 + Math.max(0, since) * 6);
      u.uCarve.value.set(this.passXZ.x + u.uWind.value.x * 0, this.passXZ.y, since < 0 ? 0 : r, 1);
    } else u.uCarve.value.set(0, 0, 0, 0);
    // clouds only matter below ~15 km camera altitude (above, the layer is a thin far deck)
    this.enabled = ctx.camTrue.y < 60000;
  }

  render(renderer: THREE.WebGLRenderer): void {
    const u = this.mat.uniforms;
    u.uInvProj.value.copy(this.camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(this.camera.matrixWorld);
    this.quad.render(renderer, this.mat, this.rt);
  }

  dispose(): void {
    this.rt.dispose();
    this.mat.dispose();
    this.quad.dispose();
  }
}
