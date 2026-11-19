import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import type { VolumePass } from '../post/composer';
import { SHARED, SHARED_GLSL } from '../post/shared';
import { FullscreenQuad } from '../post/fsquad';
import { ATMOS_GLSL } from '../sky/atmosphere-glsl';
import { SKY_LOOKUP_GLSL, type AtmosphereSky } from '../sky/atmosphere-sky';
import { SmokeField } from './smoke-gpu';

/**
 * Pyrocumulus raymarcher (Section 9.2) over the 3D puff grid: Beer-Lambert extinction, single scattering
 * of the sun with a 6-step shadow ray and the Schneider "powder" term, a dual-lobe Henyey-Greenstein
 * phase (g = 0.6 / -0.2), multiple-scattering approximation (octave-style softened extinction), sky
 * ambient from the sky-view LUT, ground bounce, distance-attenuated orange emission from the plume
 * lights (smoke lit from within) and glowing hot puffs. Detail erosion uses the tileable 3D noise.
 * Half-resolution MRT output: (in-scatter, transmittance) and (T at three distances, depth).
 */
const FRAG = /* glsl */ `
${SHARED_GLSL}
${ATMOS_GLSL}
${SKY_LOOKUP_GLSL}
layout(location = 0) out vec4 oColor;
layout(location = 1) out vec4 oSlices;
uniform highp sampler3D tGrid;
uniform highp sampler3D tNoise;
uniform vec3 uMin;
uniform vec3 uMax;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform float uSteps;
uniform float uExt;
uniform vec3 uSteamCol;
uniform vec3 uSootCol;
uniform vec3 uDustCol;
uniform vec2 uHG;
uniform float uTimeS;
uniform vec3 uWindOff;
varying vec2 vUv;

vec4 grid(vec3 p) {
  vec3 uvw = (p - uMin) / (uMax - uMin);
  if (any(lessThan(uvw, vec3(0.0))) || any(greaterThan(uvw, vec3(1.0)))) return vec4(0.0);
  return texture(tGrid, vec3(uvw.x, uvw.z, uvw.y));
}
float hg(float c, float g) { float g2 = g * g; return (1.0 - g2) / (4.0 * 3.14159 * pow(max(1.0 + g2 - 2.0 * g * c, 1e-4), 1.5)); }
vec2 rayBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax) {
  vec3 inv = 1.0 / rd;
  vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
  vec3 tmin = min(t0, t1), tmax = max(t0, t1);
  return vec2(max(max(tmin.x, tmin.y), tmin.z), min(min(tmax.x, tmax.y), tmax.z));
}
void main() {
  float d = texture2D(tDepth, vUv).r;
  float w = linearDepth(d);
  vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec3 vdir = vp.xyz / vp.w;
  vdir /= -vdir.z;
  vec3 rd = normalize(mat3(uCamWorld) * vdir);
  float tScene = w < 1e8 ? length(vdir * w) : 1e9;
  vec3 ro = uCamPosW + uOrigin; // true-world
  vec2 hit = rayBox(ro, rd, uMin, uMax);
  float t0 = max(hit.x, 0.0), t1 = min(hit.y, tScene);
  vec3 L = vec3(0.0);
  float T = 1.0;
  vec3 Ts = vec3(1.0);
  if (t1 > t0) {
    float n = uSteps;
    float dt = (t1 - t0) / n;
    float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTimeS * 1.7) * 43758.5453);
    float cosT = dot(rd, uSunDir);
    float phase = mix(hg(cosT, uHG.x), hg(cosT, uHG.y), 0.35);
    vec3 skyUp = skyRadiance(vec3(0.0, 1.0, 0.0));
    vec3 skyHz = skyRadiance(normalize(vec3(rd.x, 0.05, rd.z)));
    vec3 ambient = mix(skyHz, skyUp, 0.6) * 3.14159 * 0.55;
    vec3 groundBounce = uSunColor * max(uSunDir.y, 0.0) * 0.18 + uAmbientGround;
    vec3 cell = (uMax - uMin) / vec3(textureSize(tGrid, 0).x, textureSize(tGrid, 0).z, textureSize(tGrid, 0).y);
    float shStep = max(max(cell.x, cell.y), cell.z) * 1.6;
    for (int i = 0; i < 128; i++) {
      if (float(i) >= n || T < 0.01) break;
      float t = t0 + (float(i) + jit) * dt;
      vec3 p = ro + rd * t;
      vec4 g = grid(p);
      float base = g.r + g.g + g.b;
      if (base < 0.003) {
        if (t > uSliceDist.x && Ts.x > T) Ts.x = T;
        if (t > uSliceDist.y && Ts.y > T) Ts.y = T;
        if (t > uSliceDist.z && Ts.z > T) Ts.z = T;
        continue;
      }
      // detail erosion (billows at ~40 m and ~12 m), scrolled with rising turbulence
      vec3 q = (p - uWindOff) * 0.012 + vec3(0.0, -uTimeS * 0.004, 0.0);
      vec4 nz = texture(tNoise, q);
      vec4 nz2 = texture(tNoise, q * 3.3 + 0.37);
      float wisp = texture(tNoise, q * 9.1 - 0.21).b;
      float ero = nz.r * 0.55 + nz2.g * 0.3 + wisp * 0.15;
      // cloud-style remap: erosion bites hardest where the base density is thin (edges)
      float thr = (1.0 - ero) * 0.75 * clamp(1.3 - base, 0.0, 1.0);
      float dens = clamp((base - thr) / max(1.0 - thr, 0.2), 0.0, 4.0) * 1.3;
      if (dens <= 0.0) continue;
      float sigma = dens * uExt;
      vec3 frac = g.rgb / max(base, 1e-4);
      vec3 albedo = frac.r * uSteamCol * ${CONFIG.smoke.steamAlbedo.toFixed(3)} + frac.g * uSootCol * ${CONFIG.smoke.sootAlbedo.toFixed(3)} + frac.b * uDustCol * ${CONFIG.smoke.dustAlbedo.toFixed(3)};
      // shadow ray towards the sun
      float od = 0.0;
      for (int k = 1; k <= ${CONFIG.smoke.shadowSteps}; k++) {
        vec4 gs = grid(p + uSunDir * shStep * float(k) * float(k) * 0.5);
        od += (gs.r + gs.g + gs.b) * shStep * float(k);
      }
      od *= uExt;
      float Tsun = exp(-od) * 0.75 + exp(-od * 0.25) * 0.25; // multiple scattering approximation
      float powder = 1.0 - exp(-od * 2.0 - sigma * 8.0);
      vec3 sun = uSunColor * Tsun * phase * mix(0.6, 1.0, powder) * 4.0;
      // plume lights: smoke lit from within (distance attenuated, crude self-occlusion)
      vec3 pS = p - uOrigin;
      vec3 fire = vec3(0.0);
      for (int k = 0; k < 3; k++) {
        vec3 dl = uPlumeLightPos[k] - pS;
        float r2 = dot(dl, dl);
        float occl = exp(-sqrt(r2) * dens * uExt * 0.35);
        fire += uPlumeLightCol[k] / (r2 + 900.0) * occl;
      }
      fire *= 0.06;
      vec3 hot = vec3(1.0, 0.42, 0.12) * g.a / max(base, 1e-3) * 4.0 * dens;
      float up = clamp((p.y - uMin.y) / max(uMax.y - uMin.y, 1.0), 0.0, 1.0);
      vec3 amb = ambient * mix(0.55, 1.0, up) + groundBounce * (1.0 - up) * 0.6;
      vec3 S = albedo * (sun + amb + fire) * sigma + hot * sigma;
      float stepT = exp(-sigma * dt);
      L += T * (S - S * stepT) / max(sigma, 1e-6);
      T *= stepT;
      if (t > uSliceDist.x && Ts.x > T) Ts.x = T;
      if (t > uSliceDist.y && Ts.y > T) Ts.y = T;
      if (t > uSliceDist.z && Ts.z > T) Ts.z = T;
    }
    if (t1 < uSliceDist.x) Ts.x = T;
    if (t1 < uSliceDist.y) Ts.y = T;
    if (t1 < uSliceDist.z) Ts.z = T;
  }
  oColor = vec4(L, T);
  oSlices = vec4(Ts, w);
}`;

const VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class SmokeVolume implements System, VolumePass {
  readonly name = 'smokeVolume';
  enabled = false;
  readonly field: SmokeField;
  private readonly rt: THREE.WebGLRenderTarget;
  private readonly mat: THREE.ShaderMaterial;
  private readonly quad = new FullscreenQuad();

  constructor(private renderer: THREE.WebGLRenderer, private camera: THREE.PerspectiveCamera, sky: AtmosphereSky, noise: THREE.Texture, preset: { smokePuffs: number; smokeGrid: [number, number, number]; smokeSteps: number }) {
    this.field = new SmokeField(preset.smokePuffs, preset.smokeGrid);
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, count: 2, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const S = CONFIG.smoke;
    this.mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: {
        ...SHARED, ...(sky.uniforms as unknown as Record<string, THREE.IUniform>),
        tGrid: { value: this.field.grid.texture }, tNoise: { value: noise }, uMin: { value: this.field.min }, uMax: { value: this.field.max },
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uSteps: { value: preset.smokeSteps }, uExt: { value: S.extinction },
        uSteamCol: { value: new THREE.Vector3(...S.steamColor) }, uSootCol: { value: new THREE.Vector3(...S.sootColor) }, uDustCol: { value: new THREE.Vector3(...S.dustColor) },
        uHG: { value: new THREE.Vector2(...S.hgG) }, uTimeS: { value: 0 }, uWindOff: { value: new THREE.Vector3() },
      },
    });
  }

  get color(): THREE.Texture { return this.rt.textures[0]; }
  get slices(): THREE.Texture { return this.rt.textures[1]; }

  setSize(w: number, h: number): void {
    this.rt.setSize(Math.max(1, w), Math.max(1, h));
  }

  update(ctx: FrameContext): void {
    this.field.update(this.renderer, ctx.mission);
    this.enabled = this.field.active;
    const u = this.mat.uniforms;
    u.uTimeS.value = ctx.mission;
    const w = CONFIG.wind;
    const to = ((w.fromDeg + 180) * Math.PI) / 180;
    u.uWindOff.value.set(Math.sin(to), 0, -Math.cos(to)).multiplyScalar(w.v10 * 1.4 * (ctx.mission + 20));
    // transmittance slices around the focus (vehicle / pad) distance
    const focus = Math.max(30, ctx.camera.position.distanceTo(ctx.booster.position.clone().sub(ctx.origin)));
    SHARED.uSliceDist.value.set(focus * 0.5, focus * 0.9, focus * 1.4);
  }

  render(renderer: THREE.WebGLRenderer): void {
    const u = this.mat.uniforms;
    u.uInvProj.value.copy(this.camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(this.camera.matrixWorld);
    this.quad.render(renderer, this.mat, this.rt);
  }

  dispose(): void {
    this.field.dispose();
    this.rt.dispose();
    this.mat.dispose();
    this.quad.dispose();
  }
}
