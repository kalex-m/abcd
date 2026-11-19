import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { blackbody, smoothstep } from '../util/math';
import { SHARED, SHARED_GLSL, ADDITIVE } from '../post/shared';
import { beamMesh, type Beam } from './beams';
import { galvanised } from '../vehicle/materials';
import { terrainHeight } from './terrain';

/**
 * Pad floodlights: high-pressure-sodium flood banks on poles (SpotLights, no shadows), emissive lamp
 * faces, and volumetric light shafts through the humid pre-dawn air (additive cone volumes in the FX
 * layer with soft depth intersection and a forward-scattering phase function).
 */
const BEAM_VERT = /* glsl */ `
varying vec3 vLocal;
varying vec3 vWorld;
varying vec4 vClip;
void main() {
  vLocal = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  vClip = gl_Position;
}`;
const BEAM_FRAG = /* glsl */ `
${SHARED_GLSL}
uniform vec3 uColor;
uniform float uIntensity;
uniform float uLength;
uniform vec3 uDir;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec4 vClip;
void main() {
  // cone local: y from 0 (lamp) to -uLength, radius grows linearly
  float x = clamp(-vLocal.y / uLength, 0.0, 1.0);
  float r = length(vLocal.xz) / max(0.02 + x * 0.42 * uLength * 0.5, 1e-3);
  float core = pow(max(0.0, 1.0 - r), 2.0);
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  float scene = sceneDepthAt(suv);
  float myDepth = vClip.w;
  float soft = smoothstep(0.0, 6.0, scene - myDepth);
  vec3 V = normalize(vWorld - uCamPosW);
  float g = 0.55;
  float c = dot(V, uDir);
  float phase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * c, 1.5) / 12.566;
  float camFade = smoothstep(4.0, 30.0, length(vWorld - uCamPosW));
  float a = core * exp(-x * 2.2) * soft * camFade * phase * uIntensity * volumeTransmittance(suv, myDepth);
  gl_FragColor = vec4(uColor * a, 0.0);
}`;

export class SiteLights implements System {
  readonly name = 'siteLights';
  private readonly spots: THREE.SpotLight[] = [];
  private readonly lampMat: THREE.MeshStandardMaterial;
  private readonly beams: THREE.Mesh[] = [];
  private readonly beamMats: THREE.ShaderMaterial[] = [];

  constructor(world: THREE.Object3D, fxScene: THREE.Scene) {
    const L = CONFIG.lighting;
    const col = new THREE.Color(...blackbody(L.floodlightColorK));
    this.lampMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: col, emissiveIntensity: 0 });
    const poles: Beam[] = [];
    const G = -CONFIG.site.olmHeight;
    const target = new THREE.Vector3(0, 38, 0);
    for (const [x, y, z] of CONFIG.site.floodlights) {
      const pos = new THREE.Vector3(x, y, z);
      const gy = G + terrainHeight(x, z);
      poles.push({ a: new THREE.Vector3(x, gy, z), b: new THREE.Vector3(x, y - 0.5, z), w: 0.5 });
      const spot = new THREE.SpotLight(col, 0, 0, 0.42, 0.55, 2);
      spot.position.copy(pos);
      spot.target.position.copy(target);
      spot.castShadow = false;
      world.add(spot, spot.target);
      this.spots.push(spot);
      // lamp bank: 2 x 3 emissive panels facing the pad
      const bank = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.25), this.lampMat);
        p.position.set((i % 3 - 1) * 1.0, Math.floor(i / 3) * 0.8, 0);
        bank.add(p);
      }
      bank.position.copy(pos);
      bank.lookAt(target);
      world.add(bank);
      // volumetric shaft (FX layer)
      const len = pos.distanceTo(target) * 1.25;
      const g = new THREE.ConeGeometry(len * 0.42 * 0.5, len, 24, 1, true).translate(0, -len / 2, 0);
      const mat = new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, ...ADDITIVE, depthTest: false, side: THREE.DoubleSide,
        uniforms: { ...SHARED, uColor: { value: new THREE.Vector3(col.r, col.g, col.b) }, uIntensity: { value: 0 }, uLength: { value: len }, uDir: { value: target.clone().sub(pos).normalize() } },
      });
      const beam = new THREE.Mesh(g, mat);
      beam.position.copy(pos);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), target.clone().sub(pos).normalize());
      beam.frustumCulled = false;
      beam.userData.basePos = pos.clone();
      fxScene.add(beam);
      this.beams.push(beam);
      this.beamMats.push(mat);
    }
    const pm = beamMesh(poles, galvanised());
    pm.castShadow = true;
    world.add(pm);
  }

  update(ctx: FrameContext): void {
    const L = CONFIG.lighting;
    const dark = 1 - smoothstep(-1, 6, ctx.sunElevationDeg);
    const on = ctx.snap.floodlights;
    for (const s of this.spots) {
      s.intensity = L.floodlightIntensity * L.luxScale * on;
      s.visible = on > 0.01;
    }
    this.lampMat.emissiveIntensity = 400 * on;
    this.beams.forEach((b, i) => {
      b.position.copy(b.userData.basePos).sub(ctx.origin);
      this.beamMats[i].uniforms.uIntensity.value = 0.35 * on * (0.25 + 0.75 * dark) * L.floodlightIntensity * L.luxScale / 2500;
      b.visible = on > 0.01;
    });
    void SHARED;
  }

  dispose(): void {
    this.beams.forEach((b) => b.geometry.dispose());
    this.beamMats.forEach((m) => m.dispose());
    this.lampMat.dispose();
  }
}
