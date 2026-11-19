import * as THREE from 'three';
import { CONFIG, type QualityPreset } from '../config';
import { FullscreenQuad, passMaterial } from './fsquad';
import { SHARED, SHARED_GLSL } from './shared';
import { Bloom } from './bloom';
import { Dof } from './dof';
import { MotionBlur } from './motion-blur';
import { TONEMAP_GLSL, buildGradeLut } from './grade';
import { GRAIN_GLSL } from './grain';
import { LENS_GLSL, makeLensDirt } from './lens';
import { ATMOS_GLSL } from '../sky/atmosphere-glsl';
import type { AtmosphereSky } from '../sky/atmosphere-sky';

/**
 * Pass graph (Section 12):
 *  1 scene HDR (MSAA, RGBA16F, log depth)  2 aerial perspective + volumetric composite (depth-aware)
 *  3 FX layer (plume, particles; soft depth + volume transmittance)  4 heat-haze distortion + FX combine
 *  5 motion blur  6 depth of field  7 bloom + anamorphic streak + halation  8 auto exposure
 *  9 AgX/ACES + creative LUT  10 lens distortion, CA, vignette, grain, dither, letterbox, fades
 */
export interface VolumePass {
  enabled: boolean;
  /** rgb: in-scattered radiance (premultiplied), a: transmittance */
  readonly color: THREE.Texture;
  /** rgba: transmittance at uSliceDist distances; */
  readonly slices: THREE.Texture;
  render(renderer: THREE.WebGLRenderer): void;
  setSize(w: number, h: number): void;
}

export interface ComposeParams {
  scene: THREE.Scene;
  fxScene: THREE.Scene;
  heatScene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  smoke: VolumePass | null;
  clouds: VolumePass | null;
  cloudsInFront: boolean;
  dispBooster: THREE.Vector3;
  dispShip: THREE.Vector3;
  vehicleDist: [number, number];
  focal: number;
  fStop: number;
  focus: number;
  sensorH: number;
  shutter: number;
  evComp: number;
  fade: number; // 0 = black, 1 = full image
  letterbox: boolean;
  distortion: number;
  frame: number;
  cut: boolean; // instant exposure adaptation and history reset
  dt: number; // s since previous frame (cinematic)
  heat: number; // global heat-haze strength multiplier
  lensWater: number; // 0..1 droplets on the lens (deluge spray)
  flash: number; // additive white flash (separation)
  enableMotionBlur: boolean;
  enableDof: boolean;
  anamorphic: number;
  accumulate: boolean;
}

const COMPOSITE = /* glsl */ `
${SHARED_GLSL}
${ATMOS_GLSL}
uniform sampler2D tScene;
uniform sampler2D tSmoke;
uniform sampler2D tSmokeSlicesTex;
uniform sampler2D tClouds;
uniform sampler2D tCloudSlicesTex;
uniform float uHasSmoke;
uniform float uHasClouds;
uniform float uCloudsFront;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform float uCamAltKm;
uniform vec3 uSunDir;
uniform float uSunIlluminance;
uniform vec2 uVolTexel;
varying vec2 vUv;

// depth-aware upsample: choose among 4 low-res neighbours the one whose stored depth best matches
vec4 upsample(sampler2D tex, sampler2D depthTex, float w) {
  vec2 base = vUv;
  vec2 o = uVolTexel * 0.5;
  vec2 uvs[4];
  uvs[0] = base + vec2(-o.x, -o.y); uvs[1] = base + vec2(o.x, -o.y); uvs[2] = base + vec2(-o.x, o.y); uvs[3] = base + vec2(o.x, o.y);
  vec4 acc = vec4(0.0); float ws = 0.0;
  float lw = log2(max(w, 0.1));
  for (int i = 0; i < 4; i++) {
    float dl = texture2D(depthTex, uvs[i]).a;
    float wt = 1.0 / (0.02 + abs(log2(max(dl, 0.1)) - lw));
    acc += texture2D(tex, uvs[i]) * wt;
    ws += wt;
  }
  return acc / ws;
}

void main() {
  vec3 col = texture2D(tScene, vUv).rgb;
  float d = texture2D(tDepth, vUv).r;
  float w = linearDepth(d);
  vec4 ndc = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 vp = uInvProj * ndc;
  vec3 vdir = vp.xyz / vp.w;
  vdir /= -vdir.z;
  vec3 rdW = normalize(mat3(uCamWorld) * vdir);
  if (w < 1e8) {
    float distKm = length(vdir * w) / 1000.0;
    if (distKm > 0.03) {
      vec3 L, T;
      vec3 ro = vec3(0.0, RG + max(uCamAltKm, 0.002), 0.0);
      integrateAtmos(ro, rdW, uSunDir, distKm, distKm > 30.0 ? 16 : 10, false, L, T);
      col = col * T + L * uSunIlluminance;
    }
  }
  vec4 sm = uHasSmoke > 0.5 ? upsample(tSmoke, tSmokeSlicesTex, w) : vec4(0.0, 0.0, 0.0, 1.0);
  vec4 cl = uHasClouds > 0.5 ? upsample(tClouds, tCloudSlicesTex, w) : vec4(0.0, 0.0, 0.0, 1.0);
  if (uCloudsFront > 0.5) {
    col = col * sm.a + sm.rgb;
    col = col * cl.a + cl.rgb;
  } else {
    col = col * cl.a + cl.rgb;
    col = col * sm.a + sm.rgb;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const COMBINE = /* glsl */ `
${SHARED_GLSL}
uniform sampler2D tSrc;
uniform sampler2D tFx;
uniform sampler2D tHeat;
uniform float uHeatStrength;
uniform float uLensWater;
uniform float uFlash;
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main() {
  vec2 uv = vUv;
  // heat haze: gradient of the heat field, animated
  vec2 ht = 1.0 / vec2(textureSize(tHeat, 0));
  float hC = texture2D(tHeat, uv).r;
  float hX = texture2D(tHeat, uv + vec2(ht.x, 0.0)).r - texture2D(tHeat, uv - vec2(ht.x, 0.0)).r;
  float hY = texture2D(tHeat, uv + vec2(0.0, ht.y)).r - texture2D(tHeat, uv - vec2(0.0, ht.y)).r;
  vec2 n = vec2(sin(uv.y * 160.0 + uTime * 23.0) + sin(uv.y * 71.0 - uTime * 11.0), cos(uv.x * 140.0 - uTime * 19.0) + sin(uv.x * 53.0 + uTime * 7.0));
  vec2 off = (vec2(hX, hY) * 2.0 + n * 0.5 * hC) * uHeatStrength;
  // lens water droplets (screen-space refraction blobs)
  if (uLensWater > 0.0) {
    vec2 g = uv * vec2(uResolution.x / uResolution.y, 1.0) * 9.0;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float r = h21(id);
    vec2 c = vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5;
    float dd = length(f - c * 0.6);
    float size = 0.12 + 0.2 * r;
    float drop = step(0.55, h21(id + floor(uTime * 0.5) * 0.0 + 1.3)) * smoothstep(size, size * 0.6, dd);
    off += (f - c * 0.6) * drop * 0.05 * uLensWater;
  }
  vec3 col = texture2D(tSrc, uv + off).rgb;
  vec4 fx = texture2D(tFx, uv + off * 0.5);
  col = col * (1.0 - fx.a) + fx.rgb;
  col += vec3(uFlash);
  gl_FragColor = vec4(col, 1.0);
}`;

const LUM = /* glsl */ `
uniform sampler2D tSrc;
uniform sampler2D tPrev;
uniform float uInstant;
varying vec2 vUv;
void main() {
  vec3 acc = vec3(0.0);
  float lsum = 0.0;
  for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) {
    vec2 o = (vec2(float(x), float(y)) - 1.5) / vec2(256.0, 256.0);
    vec3 c = texture2D(tSrc, vUv + o).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // clamp very bright / dark outliers relative to the current adaptation (approximates a histogram
    // with low/high percentile rejection) so the sun or the plume core cannot crush the exposure
    float prevEv = texture2D(tPrev, vec2(0.5)).r - 3.0;
    float lo = uInstant > 0.5 ? -14.0 : prevEv - 7.0;
    float hi = uInstant > 0.5 ? 6.0 : prevEv + 3.5;
    lsum += clamp(log2(max(l, 1e-6)), lo, hi);
  }
  vec2 cc = vUv - 0.5;
  float wgt = mix(0.35, 1.0, exp(-dot(cc, cc) * 6.0));
  gl_FragColor = vec4(lsum / 16.0 * wgt, wgt, 0.0, 1.0);
}`;

const ADAPT = /* glsl */ `
uniform sampler2D tLum;
uniform sampler2D tPrev;
uniform float uDt;
uniform float uInstant;
uniform float uUp;
uniform float uDown;
uniform vec2 uEvRange;
varying vec2 vUv;
void main() {
  float s = 0.0, ws = 0.0;
  for (int y = 0; y < 16; y++) for (int x = 0; x < 16; x++) {
    vec4 v = texture2D(tLum, (vec2(float(x), float(y)) + 0.5) / 16.0);
    s += v.r; ws += v.g;
  }
  float avgLog = s / max(ws, 1e-4);
  float ev = clamp(avgLog + 3.0, uEvRange.x - 3.0, uEvRange.y);  // log2(lum/0.125)
  float prev = texture2D(tPrev, vec2(0.5)).r;
  float tau = ev > prev ? uUp : uDown;
  float a = uInstant > 0.5 ? 1.0 : 1.0 - exp(-uDt / tau);
  gl_FragColor = vec4(mix(prev, ev, a), 0.0, 0.0, 1.0);
}`;

const FINAL = /* glsl */ `
${TONEMAP_GLSL}
${GRAIN_GLSL}
${LENS_GLSL}
uniform sampler2D tSrc;
uniform sampler2D tBloom;
uniform sampler2D tStreak;
uniform sampler2D tDirt;
uniform sampler2D tExposure;
uniform highp sampler3D tLut;
uniform float uBloom;
uniform float uHalation;
uniform float uAnamorphic;
uniform float uEvComp;
uniform float uGrain;
uniform float uVignette;
uniform float uCA;
uniform float uDistort;
uniform float uFade;
uniform float uLetterbox;
uniform float uFrame;
uniform float uAgx;
uniform vec2 uResolution;
uniform float uLutSize;
uniform float uManualExposure;
varying vec2 vUv;
vec3 tonemap(vec3 c) { return uAgx > 0.5 ? agx(c) : acesFitted(c); }
void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = lensDistort(vUv, uDistort, aspect);
  float ev = texture2D(tExposure, vec2(0.5)).r;
  float exposure = uManualExposure > 0.0 ? uManualExposure : 0.18 / exp2(ev - 3.0) * exp2(uEvComp);
  vec2 dir = (uv - 0.5);
  float caAmt = uCA / uResolution.x;
  vec3 col;
  col.r = texture2D(tSrc, uv - dir * caAmt * 2.0).r;
  col.g = texture2D(tSrc, uv).g;
  col.b = texture2D(tSrc, uv + dir * caAmt * 2.0).b;
  vec3 bloom = texture2D(tBloom, uv).rgb;
  vec3 dirt = texture2D(tDirt, uv).rgb;
  vec3 streak = texture2D(tStreak, uv).rgb * vec3(0.55, 0.7, 1.0);
  col = min(col * exposure, vec3(4096.0));
  col += bloom * uBloom * (1.0 + dirt * 1.2) + streak * uAnamorphic * 0.25;
  // halation: red-orange glow around strong highlights (film base reflection)
  col += bloom * vec3(1.0, 0.35, 0.12) * uHalation;
  col = tonemap(clamp(col, 0.0, 4096.0));
  // creative LUT (sampled at texel centres)
  vec3 lutUv = clamp(pow(col, vec3(1.0 / 2.2)), 0.0, 1.0) * ((uLutSize - 1.0) / uLutSize) + 0.5 / uLutSize;
  col = pow(texture(tLut, lutUv).rgb, vec3(2.2));
  // optical vignette
  float v = 1.0 - uVignette * pow(length(dir * vec2(aspect, 1.0) / vec2(aspect, 1.0)) * 1.35, 2.4);
  col *= clamp(v, 0.0, 1.0);
  col = linearToSRGB(col);
  col = filmGrain(col, gl_FragCoord.xy, uFrame, uGrain);
  col = ditherTri(col, gl_FragCoord.xy, uFrame);
  col *= uFade;
  if (uLetterbox > 0.0) {
    float barH = max(0.0, (1.0 - aspect / uLetterbox) * 0.5);
    if (vUv.y < barH || vUv.y > 1.0 - barH) col = vec3(0.0);
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const ACCUM = /* glsl */ `
uniform sampler2D tSrc;
uniform float uWeight;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tSrc, vUv).rgb * uWeight, 1.0); }`;

export class Composer {
  readonly quad = new FullscreenQuad();
  readonly hdrMS: THREE.WebGLRenderTarget;
  private readonly hdrA: THREE.WebGLRenderTarget;
  private readonly hdrB: THREE.WebGLRenderTarget;
  private readonly hdrC: THREE.WebGLRenderTarget;
  readonly fxRT: THREE.WebGLRenderTarget;
  private readonly heatRT: THREE.WebGLRenderTarget;
  private readonly maskRT: THREE.WebGLRenderTarget;
  readonly accumRT: THREE.WebGLRenderTarget;
  private readonly lumRT: THREE.WebGLRenderTarget;
  private expRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private expIdx = 0;
  private readonly bloom: Bloom;
  private readonly dof: Dof;
  readonly motionBlur: MotionBlur;
  private readonly composite: THREE.ShaderMaterial;
  private readonly combine: THREE.ShaderMaterial;
  private readonly lum: THREE.ShaderMaterial;
  private readonly adapt: THREE.ShaderMaterial;
  readonly final: THREE.ShaderMaterial;
  private readonly accum: THREE.ShaderMaterial;
  private readonly maskMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  private readonly lutDay: THREE.Data3DTexture;
  private readonly lutTwilight: THREE.Data3DTexture;
  private readonly dirt: THREE.Texture;
  width = 2;
  height = 2;
  private firstFrame = true;
  /** debug: 'scene' | 'composite' | 'combine' | 'fx' to present an intermediate buffer */
  debugView = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('dbg') ?? '';

  constructor(private renderer: THREE.WebGLRenderer, private preset: QualityPreset, sky: AtmosphereSky) {
    const hf = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    const depthTexture = new THREE.DepthTexture(2, 2, THREE.FloatType);
    depthTexture.minFilter = THREE.NearestFilter;
    depthTexture.magFilter = THREE.NearestFilter;
    this.hdrMS = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: preset.msaa, depthBuffer: true, depthTexture });
    this.hdrA = new THREE.WebGLRenderTarget(2, 2, hf);
    this.hdrB = new THREE.WebGLRenderTarget(2, 2, hf);
    this.hdrC = new THREE.WebGLRenderTarget(2, 2, hf);
    this.fxRT = new THREE.WebGLRenderTarget(2, 2, hf);
    this.heatRT = new THREE.WebGLRenderTarget(2, 2, hf);
    this.maskRT = new THREE.WebGLRenderTarget(2, 2, { ...hf, type: THREE.UnsignedByteType });
    this.accumRT = new THREE.WebGLRenderTarget(2, 2, { ...hf, type: THREE.FloatType });
    this.lumRT = new THREE.WebGLRenderTarget(16, 16, { ...hf, type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const e1 = { ...hf, type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter };
    this.expRT = [new THREE.WebGLRenderTarget(1, 1, e1), new THREE.WebGLRenderTarget(1, 1, e1)];
    this.bloom = new Bloom(this.quad, preset.bloomMips);
    this.dof = new Dof(this.quad);
    this.motionBlur = new MotionBlur(this.quad);
    SHARED.tDepth.value = depthTexture;

    this.composite = passMaterial(COMPOSITE, {
      ...SHARED,
      ...(sky.uniforms as unknown as Record<string, THREE.IUniform>),
      tScene: { value: this.hdrMS.texture }, tSmoke: { value: null }, tSmokeSlicesTex: { value: null }, tClouds: { value: null }, tCloudSlicesTex: { value: null },
      uHasSmoke: { value: 0 }, uHasClouds: { value: 0 }, uCloudsFront: { value: 0 }, uInvProj: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() }, uVolTexel: { value: new THREE.Vector2() },
    });
    this.combine = passMaterial(COMBINE, {
      ...SHARED, tSrc: { value: this.hdrA.texture }, tFx: { value: this.fxRT.texture }, tHeat: { value: this.heatRT.texture },
      uHeatStrength: { value: 0 }, uLensWater: { value: 0 }, uFlash: { value: 0 },
    });
    this.lum = passMaterial(LUM, { tSrc: { value: null }, tPrev: { value: null }, uInstant: { value: 1 } });
    this.adapt = passMaterial(ADAPT, {
      tLum: { value: this.lumRT.texture }, tPrev: { value: null }, uDt: { value: 0.016 }, uInstant: { value: 1 },
      uUp: { value: CONFIG.post.exposureAdaptUp }, uDown: { value: CONFIG.post.exposureAdaptDown }, uEvRange: { value: new THREE.Vector2(...CONFIG.post.evRange) },
    });
    this.lutDay = buildGradeLut(0);
    this.lutTwilight = buildGradeLut(1);
    this.dirt = makeLensDirt();
    this.final = passMaterial(FINAL, {
      tSrc: { value: null }, tBloom: { value: null }, tStreak: { value: null }, tDirt: { value: this.dirt }, tExposure: { value: null }, tLut: { value: this.lutDay },
      uBloom: { value: CONFIG.post.bloomIntensity }, uHalation: { value: CONFIG.post.halation }, uAnamorphic: { value: 0.15 }, uEvComp: { value: 0 },
      uGrain: { value: CONFIG.post.grain }, uVignette: { value: CONFIG.post.vignette }, uCA: { value: CONFIG.camera.chromaticAberration }, uDistort: { value: 0 },
      uFade: { value: 1 }, uLetterbox: { value: 0 }, uFrame: { value: 0 }, uAgx: { value: CONFIG.post.tonemapper === 'agx' ? 1 : 0 },
      uResolution: { value: new THREE.Vector2() }, uLutSize: { value: CONFIG.post.lutSize }, uManualExposure: { value: 0 },
    });
    this.accum = passMaterial(ACCUM, { tSrc: { value: null }, uWeight: { value: 1 } }, { blending: THREE.AdditiveBlending, transparent: true });
  }

  setSize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.hdrMS.setSize(w, h);
    for (const rt of [this.hdrA, this.hdrB, this.hdrC, this.fxRT, this.accumRT]) rt.setSize(w, h);
    this.heatRT.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
    this.maskRT.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
    this.bloom.setSize(w, h);
    this.dof.setSize(w, h);
    SHARED.uResolution.value.set(w, h);
    this.final.uniforms.uResolution.value.set(w, h);
  }

  /** Set the twilight amount of the grade (switches between two LUTs). */
  setTwilight(t: number): void {
    this.final.uniforms.tLut.value = t > 0.5 ? this.lutTwilight : this.lutDay;
  }

  /** Render scene -> composite -> fx -> heat/combine -> motion blur -> DOF. Returns the HDR texture. */
  renderHDR(p: ComposeParams): THREE.Texture {
    const r = this.renderer;
    const cam = p.camera;
    // 1. scene
    r.setRenderTarget(this.hdrMS);
    r.setClearColor(0x000000, 1);
    r.clear(true, true, true);
    r.render(p.scene, cam);
    // 2. volumetrics
    if (p.smoke?.enabled) p.smoke.render(r);
    if (p.clouds?.enabled) p.clouds.render(r);
    SHARED.tSmokeSlices.value = p.smoke?.enabled ? p.smoke.slices : WHITE;
    SHARED.tCloudSlices.value = p.clouds?.enabled ? p.clouds.slices : WHITE;
    const cu = this.composite.uniforms;
    cu.tSmoke.value = p.smoke?.color ?? null;
    cu.tSmokeSlicesTex.value = p.smoke?.slices ?? null;
    cu.tClouds.value = p.clouds?.color ?? null;
    cu.tCloudSlicesTex.value = p.clouds?.slices ?? null;
    cu.uHasSmoke.value = p.smoke?.enabled ? 1 : 0;
    cu.uHasClouds.value = p.clouds?.enabled ? 1 : 0;
    cu.uCloudsFront.value = p.cloudsInFront ? 1 : 0;
    cu.uInvProj.value.copy(cam.projectionMatrixInverse);
    cu.uCamWorld.value.copy(cam.matrixWorld);
    const vs = this.preset.volumetricScale;
    cu.uVolTexel.value.set(1 / Math.max(1, Math.floor(this.width * vs)), 1 / Math.max(1, Math.floor(this.height * vs)));
    this.quad.render(r, this.composite, this.hdrA);
    // 3. FX layer
    r.setRenderTarget(this.fxRT);
    r.setClearColor(0x000000, 0);
    r.clear(true, false, false);
    r.render(p.fxScene, cam);
    // 4. heat field
    r.setRenderTarget(this.heatRT);
    r.setClearColor(0x000000, 0);
    r.clear(true, false, false);
    if (this.preset.heatHaze && p.heat > 0) r.render(p.heatScene, cam);
    const bu = this.combine.uniforms;
    bu.uHeatStrength.value = this.preset.heatHaze ? CONFIG.post.heatHazeStrength * p.heat : 0;
    bu.uLensWater.value = p.lensWater;
    bu.uFlash.value = p.flash;
    this.quad.render(r, this.combine, this.hdrB);
    let src: THREE.WebGLRenderTarget = this.hdrB;
    // 5. motion blur
    if (p.enableMotionBlur && this.preset.motionBlur && !p.accumulate) {
      this.renderMask(cam, p);
      if (p.cut) this.motionBlur.reset();
      const did = this.motionBlur.render(r, cam, src.texture, this.maskRT.texture, p.dispBooster, p.dispShip, this.preset.motionBlurSamples, p.shutter, this.hdrC, this.height);
      if (did) src = this.hdrC;
    } else {
      this.motionBlur.reset();
    }
    // 6. DOF
    if (p.enableDof && this.preset.dof) {
      this.dof.params.focal = p.focal;
      this.dof.params.fStop = p.fStop;
      this.dof.params.focus = p.focus;
      const out = src === this.hdrC ? this.hdrA : this.hdrC;
      this.dof.render(r, src.texture, this.width, this.height, out, p.sensorH);
      src = out;
    }
    r.setRenderTarget(null);
    return src.texture;
  }

  private renderMask(cam: THREE.PerspectiveCamera, p: ComposeParams): void {
    const r = this.renderer;
    r.setRenderTarget(this.maskRT);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, false);
    const prevMask = cam.layers.mask;
    const prevOverride = p.scene.overrideMaterial;
    const prevBg = p.scene.background;
    p.scene.overrideMaterial = this.maskMat;
    this.maskMat.blending = THREE.AdditiveBlending;
    this.maskMat.depthTest = true;
    cam.layers.set(5);
    this.maskMat.color.setRGB(1, 0, 0);
    r.render(p.scene, cam);
    cam.layers.set(6);
    this.maskMat.color.setRGB(0, 1, 0);
    r.render(p.scene, cam);
    cam.layers.mask = prevMask;
    p.scene.overrideMaterial = prevOverride;
    p.scene.background = prevBg;
  }

  /** Add an HDR sub-frame to the accumulation buffer (record-mode true motion blur). */
  accumulate(tex: THREE.Texture, weight: number, first: boolean): void {
    const r = this.renderer;
    if (first) {
      r.setRenderTarget(this.accumRT);
      r.setClearColor(0x000000, 1);
      r.clear(true, false, false);
    }
    this.accum.uniforms.tSrc.value = tex;
    this.accum.uniforms.uWeight.value = weight;
    this.quad.render(r, this.accum, this.accumRT);
  }

  /** Bloom, exposure, tone mapping and film effects from an HDR texture to the target (null = canvas). */
  present(hdr: THREE.Texture, p: ComposeParams, target: THREE.WebGLRenderTarget | null): void {
    const r = this.renderer;
    if (this.debugView === 'scene') hdr = this.hdrMS.texture;
    if (this.debugView === 'composite') hdr = this.hdrA.texture;
    if (this.debugView === 'combine') hdr = this.hdrB.texture;
    if (this.debugView === 'fx') hdr = this.fxRT.texture;
    if (this.debugView === 'depth') {
      const m = passMaterial(`${SHARED_GLSL}\nvarying vec2 vUv; void main(){ float d = texture2D(tDepth, vUv).r; float w = linearDepth(d); gl_FragColor = vec4(vec3(log2(w + 1.0) / 25.0) * 0.18 * 8.0, 1.0) + vec4(d > 0.999999 ? 1.0 : 0.0, 0.0, 0.0, 0.0) * 0.1; }`, { ...SHARED });
      this.quad.render(r, m, this.hdrC);
      hdr = this.hdrC.texture;
    }
    // exposure first (bloom runs in exposed units)
    const prev = this.expRT[this.expIdx];
    const next = this.expRT[1 - this.expIdx];
    this.lum.uniforms.tSrc.value = hdr;
    this.lum.uniforms.tPrev.value = prev.texture;
    this.lum.uniforms.uInstant.value = p.cut || this.firstFrame ? 1 : 0;
    this.quad.render(r, this.lum, this.lumRT);
    this.adapt.uniforms.tPrev.value = prev.texture;
    this.adapt.uniforms.uDt.value = Math.max(1e-3, p.dt);
    this.adapt.uniforms.uInstant.value = p.cut || this.firstFrame ? 1 : 0;
    this.quad.render(r, this.adapt, next);
    this.expIdx = 1 - this.expIdx;
    this.firstFrame = false;
    const [bloomTex, streakTex] = this.bloom.render(r, hdr, this.width, this.height, next.texture, p.evComp + CONFIG.lighting.exposureEVComp);
    const f = this.final.uniforms;
    f.tSrc.value = hdr;
    f.tBloom.value = bloomTex;
    f.tStreak.value = streakTex;
    f.tExposure.value = next.texture;
    f.uEvComp.value = p.evComp + CONFIG.lighting.exposureEVComp;
    f.uFade.value = p.fade;
    f.uLetterbox.value = p.letterbox ? CONFIG.post.letterbox : 0;
    f.uFrame.value = p.frame % 1000;
    f.uDistort.value = p.distortion;
    f.uAnamorphic.value = p.anamorphic;
    this.quad.render(r, this.final, target);
  }

  dispose(): void {
    for (const rt of [this.hdrMS, this.hdrA, this.hdrB, this.hdrC, this.fxRT, this.heatRT, this.maskRT, this.accumRT, this.lumRT, ...this.expRT]) rt.dispose();
    this.bloom.dispose();
    this.dof.dispose();
    this.motionBlur.dispose();
    for (const m of [this.composite, this.combine, this.lum, this.adapt, this.final, this.accum, this.maskMat]) m.dispose();
    this.lutDay.dispose();
    this.lutTwilight.dispose();
    this.dirt.dispose();
    this.quad.dispose();
  }
}

const WHITE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
})();
