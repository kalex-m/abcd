import * as THREE from 'three';
import { CONFIG } from '../config';
import { ATMOS_GLSL } from './atmosphere-glsl';
import { STARS_GLSL } from './sun-moon-stars';
import { GLSL_NOISE } from '../util/noise';
import { FullscreenQuad } from '../post/fsquad';

/**
 * Precomputed atmospheric scattering (Hillaire 2020): transmittance + multiple-scattering LUTs (static),
 * sky-view LUT (per frame, depends on camera altitude and sun), sky dome with sun disc, stars, Milky Way
 * and a cirrus sheet. Also provides the sky IBL capture.
 */
export interface SkyUniforms {
  tTransmittance: THREE.IUniform<THREE.Texture | null>;
  tMultiScat: THREE.IUniform<THREE.Texture | null>;
  tSkyView: THREE.IUniform<THREE.Texture | null>;
  uSunDir: THREE.IUniform<THREE.Vector3>;
  uSunIlluminance: THREE.IUniform<number>;
  uCamAltKm: THREE.IUniform<number>;
  uCamXZ: THREE.IUniform<THREE.Vector2>;
  uTime: THREE.IUniform<number>;
  uStarAmount: THREE.IUniform<number>;
  uTwinkle: THREE.IUniform<number>;
  uExcludeSun: THREE.IUniform<number>;
  uCirrusCoverage: THREE.IUniform<number>;
  uWindOffset: THREE.IUniform<THREE.Vector2>;
}

const LUT_PARAMS = /* glsl */ `
uniform float uCamAltKm;
uniform vec3 uSunDir;
varying vec2 vUv;
`;

const TRANSMITTANCE_FRAG = /* glsl */ `
${ATMOS_GLSL}
varying vec2 vUv;
void main() {
  float H = sqrt(RT * RT - RG * RG);
  float rho = H * vUv.y;
  float r = sqrt(rho * rho + RG * RG);
  float dmin = RT - r, dmax = rho + H;
  float d = dmin + vUv.x * (dmax - dmin);
  float mu = d <= 0.0 ? 1.0 : clamp((H * H - rho * rho - d * d) / (2.0 * r * d), -1.0, 1.0);
  vec3 ro = vec3(0.0, r, 0.0);
  vec3 rd = vec3(sqrt(max(0.0, 1.0 - mu * mu)), mu, 0.0);
  float tEnd = raySphere(ro, rd, RT).y;
  vec3 od = vec3(0.0);
  const int N = 48;
  for (int i = 0; i < N; i++) {
    float t = (float(i) + 0.5) / float(N) * tEnd;
    vec3 p = ro + rd * t;
    vec3 sR; float sM; vec3 ext;
    mediumAt(length(p) - RG, sR, sM, ext);
    od += ext * (tEnd / float(N));
  }
  gl_FragColor = vec4(exp(-od), 1.0);
}`;

const MULTISCAT_FRAG = /* glsl */ `
${ATMOS_GLSL}
varying vec2 vUv;
void main() {
  float muS = vUv.x * 2.0 - 1.0;
  float r = RG + clamp(vUv.y, 0.002, 0.998) * (RT - RG);
  vec3 ro = vec3(0.0, r, 0.0);
  vec3 sunDir = vec3(sqrt(max(0.0, 1.0 - muS * muS)), muS, 0.0);
  vec3 L2 = vec3(0.0), fms = vec3(0.0);
  const int SQ = 8;
  for (int i = 0; i < SQ; i++) for (int j = 0; j < SQ; j++) {
    float u = (float(i) + 0.5) / float(SQ), v = (float(j) + 0.5) / float(SQ);
    float th = 2.0 * A_PI * u, ph = acos(1.0 - 2.0 * v);
    vec3 rd = vec3(sin(ph) * cos(th), cos(ph), sin(ph) * sin(th));
    vec2 top = raySphere(ro, rd, RT);
    vec2 gnd = raySphere(ro, rd, RG);
    float tEnd = top.y;
    bool hitG = gnd.x > 0.0;
    if (hitG) tEnd = gnd.x;
    const int N = 20;
    vec3 T = vec3(1.0), Ls = vec3(0.0), f = vec3(0.0);
    float dt = tEnd / float(N);
    for (int k = 0; k < N; k++) {
      vec3 p = ro + rd * (float(k) + 0.5) * dt;
      float rr = length(p);
      vec3 sR; float sM; vec3 ext;
      mediumAt(rr - RG, sR, sM, ext);
      vec3 sc = sR + vec3(sM);
      vec3 Ts = sunTransmittance(p, sunDir);
      vec3 stepT = exp(-ext * dt);
      vec3 S = sc * Ts / (4.0 * A_PI);
      Ls += T * (S - S * stepT) / max(ext, vec3(1e-6));
      f += T * (sc - sc * stepT) / max(ext, vec3(1e-6));
      T *= stepT;
    }
    if (hitG) {
      vec3 p = ro + rd * gnd.x;
      vec3 n = normalize(p);
      Ls += T * sunTransmittance(p + n * 1e-3, sunDir) * max(dot(n, sunDir), 0.0) * GROUND_ALBEDO / A_PI;
    }
    L2 += Ls;
    fms += f;
  }
  float inv = 1.0 / float(SQ * SQ);
  L2 *= inv;
  fms *= inv;
  gl_FragColor = vec4(L2 / max(vec3(1.0) - fms, vec3(1e-3)), 1.0);
}`;

const SKYVIEW_FRAG = /* glsl */ `
${ATMOS_GLSL}
${LUT_PARAMS}
void main() {
  float r = RG + max(uCamAltKm, 0.002);
  vec3 ro = vec3(0.0, r, 0.0);
  float vHorizon = sqrt(max(r * r - RG * RG, 0.0));
  float beta = acos(clamp(vHorizon / r, -1.0, 1.0));
  float zha = A_PI - beta;
  float vz;
  if (vUv.y < 0.5) { float c = 1.0 - 2.0 * vUv.y; c *= c; vz = zha * (1.0 - c); }
  else { float c = vUv.y * 2.0 - 1.0; c *= c; vz = zha + beta * c; }
  float cz = cos(vz), sz = sin(vz);
  float cx = vUv.x * vUv.x;
  float lvc = -(cx * 2.0 - 1.0);
  float az = acos(clamp(lvc, -1.0, 1.0));
  vec3 rd = vec3(sz * cos(az), cz, sz * sin(az));
  float muS = uSunDir.y;
  vec3 sunDir = vec3(sqrt(max(0.0, 1.0 - muS * muS)), muS, 0.0);
  vec3 L, T;
  integrateAtmos(ro, rd, sunDir, 1e9, 30, true, L, T);
  gl_FragColor = vec4(L, 1.0);
}`;

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
  vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position, 1.0)).xyz, 1.0);
  gl_Position = p;
}`;

export const SKY_LOOKUP_GLSL = /* glsl */ `
uniform sampler2D tSkyView;
uniform float uCamAltKm;
uniform vec3 uSunDir;
uniform float uSunIlluminance;
// Luminance of the sky in direction rd (scene units), excluding the sun disc
vec3 skyRadiance(vec3 rd) {
  float r = RG + max(uCamAltKm, 0.002);
  float vHorizon = sqrt(max(r * r - RG * RG, 0.0));
  float cosBeta = vHorizon / r;
  float viewZenithCos = rd.y;
  bool ground = viewZenithCos < -cosBeta;
  vec3 sunH = vec3(uSunDir.x, 0.0, uSunDir.z);
  vec3 vH = vec3(rd.x, 0.0, rd.z);
  float lsun = length(sunH), lv = length(vH);
  float lightViewCos = (lsun > 1e-4 && lv > 1e-4) ? dot(sunH / lsun, vH / lv) : 1.0;
  vec2 uv = skyViewParamsToUV(ground, viewZenithCos, lightViewCos, r);
  return texture2D(tSkyView, uv).rgb * uSunIlluminance;
}
`;

const SKY_FRAG = /* glsl */ `
${GLSL_NOISE}
${ATMOS_GLSL}
${SKY_LOOKUP_GLSL}
${STARS_GLSL}
varying vec3 vDir;
uniform float uTime;
uniform float uStarAmount;
uniform float uTwinkle;
uniform float uExcludeSun;
uniform float uCirrusCoverage;
uniform vec2 uWindOffset;
uniform vec2 uCamXZ;
const float SUN_COS = ${Math.cos(CONFIG.lighting.sunAngularRadius).toFixed(10)};
const float CIRRUS_ALT = ${(CONFIG.sky.cirrusAlt / 1000).toFixed(3)};
void main() {
  vec3 rd = normalize(vDir);
  vec3 col = skyRadiance(rd);
  float r = RG + max(uCamAltKm, 0.002);
  vec3 ro = vec3(0.0, r, 0.0);
  bool hitsGround = raySphere(ro, rd, RG).x > 0.0;
  vec3 Tview = hitsGround ? vec3(0.0) : getTransmittance(r, rd.y);
  // stars and Milky Way, attenuated by the atmosphere
  if (!hitsGround && uStarAmount > 0.0) col += starField(rd, uTime, uTwinkle) * uStarAmount * Tview;
  // cirrus sheet (2D, thin): forward-scattering HG lobe + sky ambient
  if (uCirrusCoverage > 0.0 && !hitsGround) {
    float dh = CIRRUS_ALT - uCamAltKm;
    if (abs(rd.y) > 1e-3 && dh / rd.y > 0.0) {
      float t = dh / rd.y;
      if (t < 400.0) {
        vec2 p = uCamXZ + rd.xz * t + uWindOffset;
        vec2 q = vec2(p.x * 0.55 + p.y * 0.2, p.y * 1.8 - p.x * 0.35);
        float n = fbm2(q * 0.18, 6) * 0.5 + 0.5;
        float streak = fbm2(vec2(q.x * 1.6, q.y * 0.25) + n * 2.0, 5) * 0.5 + 0.5;
        float d = smoothstep(1.0 - uCirrusCoverage, 1.0, n * 0.6 + streak * 0.6) * 0.55;
        d *= smoothstep(400.0, 120.0, t);
        float c = dot(rd, uSunDir);
        float hg = (1.0 - 0.49) / pow(1.0 + 0.49 - 1.4 * c, 1.5) * 0.25 + 0.3;
        vec3 sunT = getTransmittance(RG + CIRRUS_ALT, uSunDir.y) * step(-0.12, uSunDir.y);
        vec3 amb = skyRadiance(vec3(0.0, 1.0, 0.0)) * 0.6;
        vec3 cirrusCol = sunT * uSunIlluminance * hg * 0.08 + amb;
        col = mix(col, cirrusCol, d * Tview.g);
      }
    }
  }
  // sun disc with limb darkening
  if (uExcludeSun < 0.5) {
    float c = dot(rd, uSunDir);
    if (c > SUN_COS && !hitsGround) {
      float mu = sqrt(max(0.0, 1.0 - pow(acos(min(c, 1.0)) / ${CONFIG.lighting.sunAngularRadius.toFixed(8)}, 2.0)));
      vec3 limb = vec3(0.397, 0.503, 0.652);
      vec3 ld = pow(vec3(mu), limb);
      vec3 sunL = Tview * uSunIlluminance / (A_PI * ${(CONFIG.lighting.sunAngularRadius ** 2).toExponential(6)}) * ld;
      col += min(sunL, vec3(${CONFIG.lighting.maxSunDiscRadiance.toFixed(1)}));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class AtmosphereSky {
  readonly transmittance: THREE.WebGLRenderTarget;
  readonly multiScat: THREE.WebGLRenderTarget;
  readonly skyView: THREE.WebGLRenderTarget;
  readonly uniforms: SkyUniforms;
  readonly dome: THREE.Mesh;
  readonly envScene = new THREE.Scene();
  private readonly quad = new FullscreenQuad();
  private readonly tMat: THREE.ShaderMaterial;
  private readonly msMat: THREE.ShaderMaterial;
  private readonly svMat: THREE.ShaderMaterial;
  private readonly cubeRT: THREE.WebGLCubeRenderTarget;
  private readonly cubeCam: THREE.CubeCamera;
  private readonly pmrem: THREE.PMREMGenerator;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private readonly envDome: THREE.Mesh;
  /** Optional extra emissive objects (plume glow) placed in the env capture scene. */
  readonly envExtras = new THREE.Group();

  constructor(renderer: THREE.WebGLRenderer, envSize: number) {
    const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
    const [tw, th] = CONFIG.sky.transmittanceLut;
    this.transmittance = new THREE.WebGLRenderTarget(tw, th, opts);
    this.multiScat = new THREE.WebGLRenderTarget(CONFIG.sky.multiScatterLut, CONFIG.sky.multiScatterLut, opts);
    const [sw, sh] = CONFIG.sky.skyViewLut;
    this.skyView = new THREE.WebGLRenderTarget(sw, sh, opts);
    this.uniforms = {
      tTransmittance: { value: this.transmittance.texture },
      tMultiScat: { value: this.multiScat.texture },
      tSkyView: { value: this.skyView.texture },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunIlluminance: { value: CONFIG.lighting.sunIlluminanceTOA * CONFIG.lighting.luxScale },
      uCamAltKm: { value: 0.02 },
      uCamXZ: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uStarAmount: { value: 1 },
      uTwinkle: { value: 1 },
      uExcludeSun: { value: 0 },
      uCirrusCoverage: { value: CONFIG.sky.cirrusCoverage },
      uWindOffset: { value: new THREE.Vector2() },
    };
    const vs = FullscreenQuad.vertexShader;
    this.tMat = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: TRANSMITTANCE_FRAG, uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>, depthTest: false, depthWrite: false });
    this.msMat = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: MULTISCAT_FRAG, uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>, depthTest: false, depthWrite: false });
    this.svMat = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: SKYVIEW_FRAG, uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>, depthTest: false, depthWrite: false });

    const skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>,
      side: THREE.BackSide, depthTest: false, depthWrite: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1.5e7, 64, 32), skyMat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -1000;
    this.dome.name = 'skyDome';

    // Env capture scene: same dome without the sun disc (direct sun comes from the DirectionalLight)
    const envUniforms = { ...this.uniforms, uExcludeSun: { value: 1 }, uStarAmount: { value: 0 } };
    const envMat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: envUniforms as unknown as Record<string, THREE.IUniform>, side: THREE.BackSide, depthTest: false, depthWrite: false });
    this.envDome = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), envMat);
    this.envDome.frustumCulled = false;
    this.envDome.renderOrder = -1000;
    this.envScene.add(this.envDome, this.envExtras);
    this.cubeRT = new THREE.WebGLCubeRenderTarget(envSize, { type: THREE.HalfFloatType, generateMipmaps: false });
    this.cubeCam = new THREE.CubeCamera(1, 5000, this.cubeRT);
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.generateStatic(renderer);
  }

  /** Render the static transmittance and multi-scattering LUTs. */
  generateStatic(renderer: THREE.WebGLRenderer): void {
    this.quad.render(renderer, this.tMat, this.transmittance);
    this.quad.render(renderer, this.msMat, this.multiScat);
  }

  /** Per-frame update: uniforms and sky-view LUT. */
  update(renderer: THREE.WebGLRenderer, sunDir: THREE.Vector3, camAltKm: number, camXZkm: THREE.Vector2, time: number, starAmount: number): void {
    this.uniforms.uSunDir.value.copy(sunDir);
    this.uniforms.uCamAltKm.value = Math.max(0.002, camAltKm);
    this.uniforms.uCamXZ.value.copy(camXZkm);
    this.uniforms.uTime.value = time;
    this.uniforms.uStarAmount.value = starAmount;
    this.uniforms.uTwinkle.value = camAltKm * 1000 < CONFIG.sky.twinkleMaxAlt ? 1 - camAltKm * 1000 / CONFIG.sky.twinkleMaxAlt : 0;
    const w = CONFIG.wind;
    this.uniforms.uWindOffset.value.set(time * w.jetSpeed * 0.001 * 0.3, time * w.jetSpeed * 0.0002);
    this.quad.render(renderer, this.svMat, this.skyView);
  }

  /** Capture the sky (plus envExtras) into a PMREM environment texture. */
  captureEnv(renderer: THREE.WebGLRenderer, at: THREE.Vector3): THREE.Texture {
    this.cubeCam.position.copy(at);
    this.envDome.position.copy(at);
    this.cubeCam.update(renderer, this.envScene);
    const next = this.pmrem.fromCubemap(this.cubeRT.texture, this.envRT ?? undefined);
    this.envRT = next;
    return next.texture;
  }

  /**
   * CPU transmittance (rgb) from altitude altM (m above ground) towards a direction with vertical cosine mu.
   * Mirrors the GLSL medium. Returns 0 when the planet blocks the ray.
   */
  static cpuTransmittance(altM: number, mu: number): [number, number, number] {
    const pl = CONFIG.planet;
    const RG = pl.skyRadius / 1000, RT = pl.skyTop / 1000;
    const r = RG + Math.max(0.001, altM / 1000);
    const b = r * mu;
    const cG = r * r - RG * RG;
    if (b < 0 && b * b - cG > 0) {
      const tG = -b - Math.sqrt(b * b - cG);
      if (tG > 0) return [0, 0, 0];
    }
    const cT = r * r - RT * RT;
    const tEnd = -b + Math.sqrt(Math.max(0, b * b - cT));
    const N = 64;
    const od = [0, 0, 0];
    const sinT = Math.sqrt(Math.max(0, 1 - mu * mu));
    for (let i = 0; i < N; i++) {
      const t = ((i + 0.5) / N) * tEnd;
      const px = sinT * t, py = r + mu * t;
      const h = Math.hypot(px, py) - RG;
      const dR = Math.exp(-Math.max(h, 0) / (pl.rayleighScale / 1000));
      const dM = Math.exp(-Math.max(h, 0) / (pl.mieScale / 1000));
      const dO = Math.max(0, 1 - Math.abs(h - 25) / 15);
      for (let k = 0; k < 3; k++) {
        od[k] += (pl.rayleighScattering[k] * 1000 * dR + pl.mieExtinction * 1000 * dM + pl.ozoneAbsorption[k] * 1000 * dO) * (tEnd / N);
      }
    }
    return [Math.exp(-od[0]), Math.exp(-od[1]), Math.exp(-od[2])];
  }

  dispose(): void {
    this.transmittance.dispose();
    this.multiScat.dispose();
    this.skyView.dispose();
    this.cubeRT.dispose();
    this.envRT?.dispose();
    this.pmrem.dispose();
    this.tMat.dispose();
    this.msMat.dispose();
    this.svMat.dispose();
    (this.dome.material as THREE.Material).dispose();
    this.dome.geometry.dispose();
    (this.envDome.material as THREE.Material).dispose();
    this.envDome.geometry.dispose();
  }
}
