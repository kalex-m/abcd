import * as THREE from 'three';
import { CONFIG } from '../config';
import { FullscreenQuad, passMaterial } from './fsquad';
import { SHARED, SHARED_GLSL } from './shared';

/**
 * Velocity-buffer-free motion blur: per-pixel velocity from depth reprojection with the previous
 * view-projection matrix (camera motion), corrected for the two rigid vehicles through a mask
 * (R booster, G ship) and their per-frame displacement. 12+ samples along the velocity, centred.
 */
const FRAG = /* glsl */ `
${SHARED_GLSL}
uniform sampler2D tSrc;
uniform sampler2D tMask;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform mat4 uPrevViewProj;
uniform vec3 uDispBooster; // scene units moved since the previous frame
uniform vec3 uDispShip;
uniform float uScale; // shutter fraction
uniform float uMaxPx;
uniform int uSamples;
varying vec2 vUv;
void main() {
  float d = texture2D(tDepth, vUv).r;
  float w = linearDepth(d);
  vec4 ndc = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 vp = uInvProj * ndc;
  vec3 vdir = vp.xyz / vp.w;
  vdir /= -vdir.z;
  vec3 world;
  if (w > 1e8) world = (uCamWorld * vec4(normalize(vdir) * 1e7, 1.0)).xyz;
  else world = (uCamWorld * vec4(vdir * w, 1.0)).xyz;
  vec2 m = texture2D(tMask, vUv).rg;
  vec3 prevWorld = world - uDispBooster * m.r - uDispShip * m.g;
  vec4 pc = uPrevViewProj * vec4(prevWorld, 1.0);
  vec2 prevUv = pc.xy / pc.w * 0.5 + 0.5;
  vec2 vel = (vUv - prevUv) * uScale;
  vec2 px = vel * uResolution;
  float len = length(px);
  if (len > uMaxPx) vel *= uMaxPx / len;
  vec3 acc = vec3(0.0);
  float n = float(uSamples);
  for (int i = 0; i < 32; i++) {
    if (i >= uSamples) break;
    float t = (float(i) + 0.5) / n - 0.5;
    acc += texture2D(tSrc, vUv + vel * t).rgb;
  }
  gl_FragColor = vec4(acc / n, 1.0);
}`;

export class MotionBlur {
  readonly material: THREE.ShaderMaterial;
  private prevViewProj = new THREE.Matrix4();
  private hasPrev = false;

  constructor(private quad: FullscreenQuad) {
    this.material = passMaterial(FRAG, {
      ...SHARED,
      tSrc: { value: null }, tMask: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
      uPrevViewProj: { value: new THREE.Matrix4() }, uDispBooster: { value: new THREE.Vector3() }, uDispShip: { value: new THREE.Vector3() },
      uScale: { value: CONFIG.post.motionBlurShutter }, uMaxPx: { value: 48 }, uSamples: { value: 12 },
    });
  }

  /** Forget history (after a cut or a floating-origin rebase). */
  reset(): void {
    this.hasPrev = false;
  }

  render(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, src: THREE.Texture, mask: THREE.Texture, dispB: THREE.Vector3, dispS: THREE.Vector3, samples: number, shutter: number, out: THREE.WebGLRenderTarget, h: number): boolean {
    const vpNow = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (!this.hasPrev) {
      this.prevViewProj.copy(vpNow);
      this.hasPrev = true;
      return false;
    }
    const u = this.material.uniforms;
    u.tSrc.value = src;
    u.tMask.value = mask;
    u.uInvProj.value.copy(camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(camera.matrixWorld);
    u.uPrevViewProj.value.copy(this.prevViewProj);
    u.uDispBooster.value.copy(dispB);
    u.uDispShip.value.copy(dispS);
    u.uSamples.value = samples;
    u.uScale.value = shutter;
    u.uMaxPx.value = 48 * (h / 1080);
    this.quad.render(renderer, this.material, out);
    this.prevViewProj.copy(vpNow);
    return true;
  }

  dispose(): void {
    this.material.dispose();
  }
}
