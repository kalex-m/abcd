import * as THREE from 'three';
import { CONFIG } from '../config';
import { FullscreenQuad, passMaterial } from './fsquad';

/**
 * Physically based bloom (Jimenez 2014 dual filter): 13-tap downsample with Karis average on the first
 * mip and a soft-knee threshold, 3x3 tent upsample accumulated additively. Also produces an optional
 * anamorphic streak from very bright sources.
 */
const DOWN = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uFirst;
uniform float uThreshold;
uniform float uKnee;
uniform sampler2D tExposure;
uniform float uEvComp;
varying vec2 vUv;
float gExposure = 1.0;
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 karis(vec3 a, vec3 b, vec3 c, vec3 d) {
  float wa = 1.0 / (1.0 + lum(a)), wb = 1.0 / (1.0 + lum(b)), wc = 1.0 / (1.0 + lum(c)), wd = 1.0 / (1.0 + lum(d));
  return (a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd);
}
vec3 S(vec2 o) {
  vec3 c = texture2D(tSrc, vUv + o * uTexel).rgb * gExposure;
  // limit extreme sources (sun disc, plume core) like the finite veiling glare of a real lens
  float l = max(c.r, max(c.g, c.b));
  return l > 48.0 ? c * (48.0 + log2(l / 48.0 + 1.0) * 8.0) / l : c;
}
void main() {
  if (uFirst > 0.5) { float ev = texture2D(tExposure, vec2(0.5)).r; gExposure = 0.18 / exp2(ev - 3.0) * exp2(uEvComp); }
  vec3 a = S(vec2(-2, 2)), b = S(vec2(0, 2)), c = S(vec2(2, 2));
  vec3 d = S(vec2(-2, 0)), e = S(vec2(0, 0)), f = S(vec2(2, 0));
  vec3 g = S(vec2(-2, -2)), h = S(vec2(0, -2)), i = S(vec2(2, -2));
  vec3 j = S(vec2(-1, 1)), k = S(vec2(1, 1)), l = S(vec2(-1, -1)), m = S(vec2(1, -1));
  vec3 col;
  if (uFirst > 0.5) {
    col = karis(j, k, l, m) * 0.5 + karis(a, b, d, e) * 0.125 + karis(b, c, e, f) * 0.125 + karis(d, e, g, h) * 0.125 + karis(e, f, h, i) * 0.125;
    float br = max(col.r, max(col.g, col.b));
    float rq = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    rq = (rq * rq) / (4.0 * uKnee + 1e-5);
    col *= max(rq, br - uThreshold) / max(br, 1e-5);
  } else {
    col = (j + k + l + m) * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + e * 0.125;
  }
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

const UP = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uRadius;
varying vec2 vUv;
void main() {
  vec2 o = uTexel * uRadius;
  vec3 c = texture2D(tSrc, vUv + vec2(-o.x, o.y)).rgb + texture2D(tSrc, vUv + vec2(0, o.y)).rgb * 2.0 + texture2D(tSrc, vUv + o).rgb
    + texture2D(tSrc, vUv + vec2(-o.x, 0)).rgb * 2.0 + texture2D(tSrc, vUv).rgb * 4.0 + texture2D(tSrc, vUv + vec2(o.x, 0)).rgb * 2.0
    + texture2D(tSrc, vUv - o).rgb + texture2D(tSrc, vUv + vec2(0, -o.y)).rgb * 2.0 + texture2D(tSrc, vUv + vec2(o.x, -o.y)).rgb;
  gl_FragColor = vec4(c / 16.0, 1.0);
}`;

const STREAK = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uPass;
varying vec2 vUv;
void main() {
  vec3 acc = vec3(0.0); float wsum = 0.0;
  for (int i = -12; i <= 12; i++) {
    float x = float(i);
    float w = exp(-abs(x) / 5.0);
    vec3 s = texture2D(tSrc, vUv + vec2(x * uTexel.x * (uPass > 0.5 ? 5.0 : 1.0), 0.0)).rgb;
    if (uPass < 0.5) s = max(s - uThreshold, 0.0);
    acc += s * w; wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, 1.0);
}`;

export class Bloom {
  readonly mips: THREE.WebGLRenderTarget[] = [];
  private readonly streakA: THREE.WebGLRenderTarget;
  private readonly streakB: THREE.WebGLRenderTarget;
  readonly down = passMaterial(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 }, uThreshold: { value: CONFIG.post.bloomThreshold }, uKnee: { value: CONFIG.post.bloomKnee }, tExposure: { value: null }, uEvComp: { value: 0 } });
  private readonly up = passMaterial(UP, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1 } }, { blending: THREE.AdditiveBlending, transparent: true });
  private readonly streak = passMaterial(STREAK, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: CONFIG.camera.anamorphicThreshold }, uPass: { value: 0 } });

  constructor(private quad: FullscreenQuad, count: number) {
    const opts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    for (let i = 0; i < count; i++) this.mips.push(new THREE.WebGLRenderTarget(2, 2, opts));
    this.streakA = new THREE.WebGLRenderTarget(2, 2, opts);
    this.streakB = new THREE.WebGLRenderTarget(2, 2, opts);
  }

  setSize(w: number, h: number): void {
    this.mips.forEach((m, i) => m.setSize(Math.max(1, w >> (i + 1)), Math.max(1, h >> (i + 1))));
    this.streakA.setSize(Math.max(1, w >> 3), Math.max(1, h >> 4));
    this.streakB.setSize(Math.max(1, w >> 3), Math.max(1, h >> 4));
  }

  /** Returns [bloom texture (half res), streak texture]. */
  /** `exposure`: 1x1 float texture holding the adapted EV (bloom runs in exposed units). */
  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, srcW: number, srcH: number, exposure: THREE.Texture, evComp: number): [THREE.Texture, THREE.Texture] {
    this.down.uniforms.tExposure.value = exposure;
    this.down.uniforms.uEvComp.value = evComp;
    let prev: THREE.Texture = src;
    let pw = srcW, ph = srcH;
    for (let i = 0; i < this.mips.length; i++) {
      this.down.uniforms.tSrc.value = prev;
      this.down.uniforms.uTexel.value.set(1 / pw, 1 / ph);
      this.down.uniforms.uFirst.value = i === 0 ? 1 : 0;
      this.quad.render(renderer, this.down, this.mips[i]);
      prev = this.mips[i].texture;
      pw = this.mips[i].width;
      ph = this.mips[i].height;
    }
    for (let i = this.mips.length - 1; i > 0; i--) {
      this.up.uniforms.tSrc.value = this.mips[i].texture;
      this.up.uniforms.uTexel.value.set(1 / this.mips[i].width, 1 / this.mips[i].height);
      this.quad.render(renderer, this.up, this.mips[i - 1]);
    }
    // anamorphic streak from mip 2
    const sm = this.mips[Math.min(2, this.mips.length - 1)];
    this.streak.uniforms.tSrc.value = sm.texture;
    this.streak.uniforms.uTexel.value.set(1 / sm.width, 1 / sm.height);
    this.streak.uniforms.uPass.value = 0;
    this.quad.render(renderer, this.streak, this.streakA);
    this.streak.uniforms.tSrc.value = this.streakA.texture;
    this.streak.uniforms.uTexel.value.set(1 / this.streakA.width, 1 / this.streakA.height);
    this.streak.uniforms.uPass.value = 1;
    this.quad.render(renderer, this.streak, this.streakB);
    return [this.mips[0].texture, this.streakB.texture];
  }

  dispose(): void {
    this.mips.forEach((m) => m.dispose());
    this.streakA.dispose();
    this.streakB.dispose();
    this.down.dispose();
    this.up.dispose();
    this.streak.dispose();
  }
}
