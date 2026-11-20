import * as THREE from 'three';
import { GLSL_NOISE } from '../util/noise';
import { FullscreenQuad, passMaterial } from '../post/fsquad';

/**
 * Tileable 3D detail noise for volumetrics, generated slice by slice on the GPU into a 3D render target:
 * R = Perlin-Worley fbm (billows), G = Worley fbm (cauliflower edges), B = high-frequency fbm (wisps).
 * Tileable by sampling noise on a torus-wrapped lattice (periodic hashes).
 */
const FRAG = /* glsl */ `
${GLSL_NOISE}
uniform float uSlice;
uniform float uSize;
varying vec2 vUv;
const float P = 4.0; // period in lattice cells at base frequency
vec3 wrapHash(vec3 c, float per) { return hash33(mod(c, per)); }
float pworley(vec3 p, float per) {
  vec3 i = floor(p), f = fract(p); float d = 1.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(x, y, z); vec3 r = o + wrapHash(i + o, per) - f; d = min(d, dot(r, r));
  }
  return 1.0 - sqrt(d);
}
float pgrad(vec3 x, float per) {
  vec3 i = floor(x); vec3 f = fract(x); vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  #define G(o) dot(normalize(wrapHash(i + o, per) * 2.0 - 1.0 + 1e-5), f - o)
  float a = G(vec3(0,0,0)), b = G(vec3(1,0,0)), c = G(vec3(0,1,0)), d = G(vec3(1,1,0));
  float e = G(vec3(0,0,1)), g = G(vec3(1,0,1)), h = G(vec3(0,1,1)), k = G(vec3(1,1,1));
  return mix(mix(mix(a,b,u.x), mix(c,d,u.x), u.y), mix(mix(e,g,u.x), mix(h,k,u.x), u.y), u.z) * 1.6;
}
void main() {
  vec3 p = vec3(vUv, (uSlice + 0.5) / uSize);
  float perlin = 0.0, amp = 0.5, fr = 1.0;
  for (int o = 0; o < 4; o++) { perlin += amp * pgrad(p * P * fr, P * fr); fr *= 2.0; amp *= 0.5; }
  perlin = perlin * 0.5 + 0.5;
  float w1 = pworley(p * P, P), w2 = pworley(p * P * 2.0, P * 2.0), w3 = pworley(p * P * 4.0, P * 4.0);
  float wfbm = w1 * 0.625 + w2 * 0.25 + w3 * 0.125;
  float pw = clamp(perlin * 0.6 + wfbm * 0.55 - 0.15, 0.0, 1.0);
  float hi = 0.0; amp = 0.5; fr = 4.0;
  for (int o = 0; o < 3; o++) { hi += amp * pgrad(p * P * fr, P * fr); fr *= 2.0; amp *= 0.5; }
  gl_FragColor = vec4(pw, wfbm, hi * 0.5 + 0.5, 1.0);
}`;

export function generateNoise3D(renderer: THREE.WebGLRenderer, size = 64): THREE.Data3DTexture | THREE.Texture {
  const rt = new THREE.WebGL3DRenderTarget(size, size, size, { type: THREE.UnsignedByteType, depthBuffer: false });
  const tex = rt.texture;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const quad = new FullscreenQuad();
  const mat = passMaterial(FRAG, { uSlice: { value: 0 }, uSize: { value: size } });
  const prev = renderer.getRenderTarget();
  for (let z = 0; z < size; z++) {
    mat.uniforms.uSlice.value = z;
    quad.render(renderer, mat, rt, z);
  }
  renderer.setRenderTarget(prev);
  mat.dispose();
  quad.dispose();
  return tex;
}

