import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { SHARED, SHARED_GLSL, PREMULT, ADDITIVE } from '../post/shared';
import { GLSL_NOISE } from '../util/noise';
import { SHIP_CYL_TOP, R } from '../vehicle/profile';

/**
 * Prandtl-Glauert condensation (Section 9.4): noise-masked conical shells hugging the ship shoulder and
 * the interstage at transonic Mach (|M-1| < 0.25, humid air), 3-7 m thick and 20-50 m long, bright
 * leading rim, dissolving after M 1.4. Also the booster re-entry plasma sheath (Section 9.12): an
 * emissive fresnel shell around the aft end and grid fins, orange-pink at moderate speed shifting to
 * white-violet as speed rises.
 */
const VERT = /* glsl */ `
varying vec3 vL;
varying vec3 vN;
varying vec3 vW;
varying vec4 vClip;
varying float vDepth;
void main() {
  vL = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vec4 mv = viewMatrix * w;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position;
  vDepth = -mv.z;
}`;
const CONE_FRAG = /* glsl */ `
${SHARED_GLSL}
${GLSL_NOISE}
uniform float uAmount;
uniform float uLen;
uniform float uTop;
varying vec3 vL;
varying vec3 vN;
varying vec3 vW;
varying vec4 vClip;
varying float vDepth;
void main() {
  float x = clamp((uTop - vL.y) / uLen, 0.0, 1.0);
  float n = gnoise3(vec3(atan(vL.z, vL.x) * 3.0, vL.y * 0.35, uTime * 0.7)) * 0.5 + 0.5;
  float n2 = gnoise3(vL * 0.9 + uTime * 0.3) * 0.5 + 0.5;
  float rim = exp(-x * 9.0);
  float a = (smoothstep(0.25, 0.75, n * 0.7 + n2 * 0.45 - x * 0.6) + rim * 0.8) * (1.0 - smoothstep(0.6, 1.0, x)) * uAmount;
  vec3 V = normalize(vW - uCamPosW);
  float fres = pow(1.0 - abs(dot(normalize(vN), V)), 1.5);
  a *= 0.25 + 0.75 * fres;
  vec3 c = vec3(0.95, 0.96, 0.98) * (uSunColor * (0.4 + 0.6 * max(dot(normalize(vN), uSunDirW), 0.0)) * 0.35 + uAmbient * 2.5);
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  float soft = clamp((sceneDepthAt(suv) - vDepth) / 2.0, 0.0, 1.0);
  a = clamp(a, 0.0, 0.85) * soft;
  gl_FragColor = vec4(c * a, a);
}`;
const PLASMA_FRAG = /* glsl */ `
${SHARED_GLSL}
${GLSL_NOISE}
uniform float uAmount;
uniform float uSpeedK;
varying vec3 vL;
varying vec3 vN;
varying vec3 vW;
varying vec4 vClip;
varying float vDepth;
void main() {
  vec3 V = normalize(vW - uCamPosW);
  float fres = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);
  float n = gnoise3(vL * 0.6 + vec3(0.0, uTime * 6.0, 0.0)) * 0.5 + 0.5;
  vec3 c = mix(vec3(1.0, 0.45, 0.35), vec3(0.85, 0.75, 1.0), uSpeedK);
  float a = (0.25 + fres) * (0.6 + 0.6 * n) * uAmount * smoothstep(0.0, 6.0, -vL.y + 6.0);
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  float soft = clamp((sceneDepthAt(suv) - vDepth) / 2.0, 0.0, 1.0);
  gl_FragColor = vec4(c * a * 40.0 * soft, 0.0);
}`;

export class VaporCone implements System {
  readonly name = 'vaporCone';
  private readonly shells: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; top: number }[] = [];
  private readonly plasma: THREE.Mesh;
  private readonly plasmaMat: THREE.ShaderMaterial;

  constructor(fxScene: THREE.Scene) {
    const vc = CONFIG.vaporCone;
    const mk = (top: number, len: number, r0: number, r1: number) => {
      const prof: THREE.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        prof.push(new THREE.Vector2(r0 + (r1 - r0) * Math.pow(u, 0.6), top - u * len));
      }
      const g = new THREE.LatheGeometry(prof, 64);
      const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: CONE_FRAG, ...PREMULT, depthTest: false, side: THREE.DoubleSide, uniforms: { ...SHARED, uAmount: { value: 0 }, uLen: { value: len }, uTop: { value: top } } });
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      mesh.matrixAutoUpdate = false;
      fxScene.add(mesh);
      this.shells.push({ mesh, mat, top });
    };
    // ship shoulder (ship-local y) and the booster's forward section (booster-local y, offset later)
    mk(SHIP_CYL_TOP + 3, vc.length[1], R + 0.6, R + vc.thickness[1]);
    mk(CONFIG.vehicle.boosterHeight - 1, vc.length[0] + 10, R + 0.4, R + vc.thickness[0]);
    const pg = new THREE.SphereGeometry(R + 1.5, 48, 24, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55).scale(1, 1.6, 1).translate(0, 6, 0);
    this.plasmaMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: PLASMA_FRAG, ...ADDITIVE, depthTest: false, side: THREE.DoubleSide, uniforms: { ...SHARED, uAmount: { value: 0 }, uSpeedK: { value: 0 } } });
    this.plasma = new THREE.Mesh(pg, this.plasmaMat);
    this.plasma.frustumCulled = false;
    this.plasma.matrixAutoUpdate = false;
    fxScene.add(this.plasma);
  }

  update(ctx: FrameContext): void {
    const s = ctx.ship, b = ctx.booster;
    const amount = Math.max(s.vaporCone, b.vaporCone);
    const place = (mesh: THREE.Object3D, st: typeof s) => {
      mesh.matrix.compose(st.position.clone().sub(ctx.origin), st.quaternion, new THREE.Vector3(1, 1, 1));
      mesh.matrixWorld.copy(mesh.matrix);
    };
    this.shells.forEach((sh, i) => {
      sh.mesh.visible = amount > 0.01;
      sh.mat.uniforms.uAmount.value = amount * (i === 0 ? 1 : 0.7);
      place(sh.mesh, i === 0 ? s : b);
    });
    this.plasma.visible = b.reentry > 0.01;
    this.plasmaMat.uniforms.uAmount.value = b.reentry;
    this.plasmaMat.uniforms.uSpeedK.value = Math.min(1, Math.max(0, (b.speed - 900) / 900));
    place(this.plasma, b);
  }

  dispose(): void {
    for (const s of this.shells) { s.mesh.geometry.dispose(); s.mat.dispose(); }
    this.plasma.geometry.dispose();
    this.plasmaMat.dispose();
  }
}
