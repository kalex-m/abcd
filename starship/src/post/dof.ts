import * as THREE from 'three';
import { CONFIG } from '../config';
import { FullscreenQuad, passMaterial } from './fsquad';
import { SHARED, SHARED_GLSL } from './shared';

/**
 * Gather-based depth of field at half resolution. Thin-lens circle of confusion from focal length,
 * f-number and focus distance; golden-angle disc gather with scatter-as-gather weighting; optical
 * vignetting squeezes the disc into a cat's eye towards the frame edges; bright samples get a mild
 * bokeh emphasis.
 */
const COC = /* glsl */ `
${SHARED_GLSL}
uniform float uFocal; // mm
uniform float uFStop;
uniform float uFocus; // m
uniform float uPxPerMm;
uniform float uMaxCoC; // px
float cocPx(float depthM) {
  float f = uFocal;
  float S1 = max(uFocus, f * 0.0011) * 1000.0;
  float S2 = min(depthM, 1e7) * 1000.0;
  float A = f / uFStop;
  float c = A * f * (S2 - S1) / (S2 * (S1 - f));
  return clamp(c * uPxPerMm, -uMaxCoC, uMaxCoC);
}
`;

const GATHER = /* glsl */ `
${COC}
uniform sampler2D tSrc;
uniform vec2 uTexel; // of the full-res source
varying vec2 vUv;
void main() {
  float d0 = sceneDepthAt(vUv);
  float c0 = cocPx(d0);
  vec3 acc = vec3(0.0); float wsum = 0.0;
  const int N = 40;
  const float GA = 2.39996323;
  vec2 radial = (vUv - 0.5);
  float edge = length(radial) * 2.0;
  vec2 rdir = normalize(radial + 1e-5);
  float maxR = uMaxCoC;
  for (int i = 0; i < N; i++) {
    float r = sqrt((float(i) + 0.5) / float(N));
    float th = float(i) * GA;
    vec2 o = vec2(cos(th), sin(th)) * r;
    // cat's eye: compress the disc along the radial direction near the edges
    float along = dot(o, rdir);
    o -= rdir * along * 0.45 * smoothstep(0.4, 1.2, edge);
    vec2 uv = vUv + o * maxR * uTexel;
    float ds = sceneDepthAt(uv);
    float cs = cocPx(ds);
    float sampleR = r * maxR;
    // scatter-as-gather: a sample contributes if its own CoC reaches this pixel;
    // foreground (negative CoC) samples may bleed over the focused background
    float reach = max(abs(cs), (cs < 0.0 && ds < d0) ? abs(cs) : 0.0);
    float w = smoothstep(sampleR - 1.5, sampleR + 0.5, reach);
    vec3 s = texture2D(tSrc, uv).rgb;
    float l = dot(s, vec3(0.2126, 0.7152, 0.0722));
    w *= 1.0 + 0.6 * smoothstep(2.0, 20.0, l);
    acc += s * w; wsum += w;
  }
  vec3 col = wsum > 0.0 ? acc / wsum : texture2D(tSrc, vUv).rgb;
  gl_FragColor = vec4(col, abs(c0));
}`;

const COMPOSE = /* glsl */ `
${COC}
uniform sampler2D tSrc;
uniform sampler2D tBlur;
varying vec2 vUv;
void main() {
  vec3 sharp = texture2D(tSrc, vUv).rgb;
  vec4 b = texture2D(tBlur, vUv);
  float c = abs(cocPx(sceneDepthAt(vUv)));
  float m = smoothstep(0.75, 2.5, max(c, b.a * 0.6));
  gl_FragColor = vec4(mix(sharp, b.rgb, m), 1.0);
}`;

export class Dof {
  private readonly half: THREE.WebGLRenderTarget;
  readonly gather: THREE.ShaderMaterial;
  readonly compose: THREE.ShaderMaterial;
  readonly params = { focal: 35, fStop: 2.8, focus: 100 };

  constructor(private quad: FullscreenQuad) {
    this.half = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false });
    const u = () => ({
      ...SHARED,
      tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFocal: { value: 35 }, uFStop: { value: 2.8 },
      uFocus: { value: 100 }, uPxPerMm: { value: 45 }, uMaxCoC: { value: CONFIG.post.dofMaxCoC },
    });
    this.gather = passMaterial(GATHER, u());
    this.compose = passMaterial(COMPOSE, { ...u(), tBlur: { value: this.half.texture } });
  }

  setSize(w: number, h: number): void {
    this.half.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
  }

  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, w: number, h: number, out: THREE.WebGLRenderTarget, sensorH: number): void {
    for (const m of [this.gather, this.compose]) {
      m.uniforms.tSrc.value = src;
      m.uniforms.uTexel.value.set(1 / w, 1 / h);
      m.uniforms.uFocal.value = this.params.focal;
      m.uniforms.uFStop.value = this.params.fStop;
      m.uniforms.uFocus.value = this.params.focus;
      m.uniforms.uPxPerMm.value = h / sensorH;
      m.uniforms.uMaxCoC.value = CONFIG.post.dofMaxCoC * (h / 1080);
    }
    this.quad.render(renderer, this.gather, this.half);
    this.quad.render(renderer, this.compose, out);
  }

  dispose(): void {
    this.half.dispose();
    this.gather.dispose();
    this.compose.dispose();
  }
}
