import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { ADDITIVE } from '../post/shared';

/**
 * Acoustic shock (Section 9.10): a refractive ground ring expanding at the speed of sound from T-0
 * (radius 343 t, capped at 1 km) and an air-compression halo around the plume origin for the first 3 s,
 * both written into the heat-haze buffer so they bend the image behind them. The visible dust lift at
 * the front is drawn by the terrain shader; grass flattening by the vegetation shader.
 */
const VERT = /* glsl */ `
varying vec2 vUv2;
varying vec3 vN;
varying vec3 vW;
void main() {
  vUv2 = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  vW = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const RING_FRAG = /* glsl */ `
uniform float uA;
varying vec2 vUv2;
void main() {
  float d = abs(vUv2.y - 0.5) * 2.0;
  float a = (1.0 - d) * (1.0 - d) * uA;
  gl_FragColor = vec4(a, 0.0, 0.0, 1.0);
}`;
const HALO_FRAG = /* glsl */ `
uniform float uA;
uniform vec3 uCam;
varying vec3 vN;
varying vec3 vW;
void main() {
  float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vW - uCam))), 3.0);
  gl_FragColor = vec4(rim * uA, 0.0, 0.0, 1.0);
}`;

export class Shockwave implements System {
  readonly name = 'shockwave';
  private readonly ring: THREE.Mesh;
  private readonly ringMat: THREE.ShaderMaterial;
  private readonly halo: THREE.Mesh;
  private readonly haloMat: THREE.ShaderMaterial;

  constructor(heatScene: THREE.Scene) {
    this.ringMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: RING_FRAG, ...ADDITIVE, depthTest: false, side: THREE.DoubleSide, uniforms: { uA: { value: 0 } } });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 128, 1).rotateX(-Math.PI / 2), this.ringMat);
    this.ring.frustumCulled = false;
    this.haloMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: HALO_FRAG, ...ADDITIVE, depthTest: false, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uCam: { value: new THREE.Vector3() } } });
    this.halo = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), this.haloMat);
    this.halo.frustumCulled = false;
    heatScene.add(this.ring, this.halo);
  }

  update(ctx: FrameContext): void {
    const t = ctx.mission;
    const R = CONFIG.shock.speedOfSound * t;
    const G = -CONFIG.site.olmHeight;
    this.ring.visible = t > 0 && R < CONFIG.shock.maxRadius;
    this.ring.position.set(0, G + 1.0, 0).sub(ctx.origin);
    this.ring.scale.set(Math.max(1, R), 1, Math.max(1, R));
    this.ringMat.uniforms.uA.value = 0.9 * Math.exp(-t / 2.0);
    this.halo.visible = t > -4 && t < CONFIG.shock.haloDuration;
    const hr = 20 + 60 * Math.max(0, t + 4) / (CONFIG.shock.haloDuration + 4);
    this.halo.position.copy(ctx.booster.position).sub(ctx.origin).y -= 10;
    this.halo.scale.setScalar(hr);
    this.haloMat.uniforms.uA.value = 0.5 * (ctx.booster.thrustMN / 76);
    this.haloMat.uniforms.uCam.value.copy(ctx.camera.position);
  }

  dispose(): void {
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.halo.geometry.dispose();
    this.haloMat.dispose();
  }
}
