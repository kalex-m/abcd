import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { GLSL_NOISE } from '../util/noise';
import { TERRAIN_GLSL, radialGrid } from '../site/terrain';

/**
 * Gulf of Mexico + tidal pools: one sea-level surface (land above it occludes it). Six Gerstner waves
 * scaled by openness (calm in marsh pools, swell offshore, breaking line foam), two scrolling detail
 * normals, sub-surface green near the shore, Fresnel via the PBR BRDF against the sky IBL, plume
 * glitter from the plume point lights, and radial shock ripples after liftoff.
 */
const WAVES: [number, number, number, number][] = [
  // [direction deg (towards), wavelength m, steepness, amplitude m]
  [255, 60, 0.32, 0.45],
  [240, 37, 0.3, 0.28],
  [272, 23, 0.26, 0.16],
  [228, 14, 0.24, 0.09],
  [290, 8.5, 0.2, 0.05],
  [210, 5.0, 0.18, 0.03],
];

export class Gulf implements System {
  readonly name = 'gulf';
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshPhysicalMaterial;
  private readonly center = new THREE.Vector2(1e9, 1e9);
  readonly uniforms = {
    uCenter: { value: new THREE.Vector2() },
    uWaveTime: { value: 0 },
    uShockT: { value: -1 },
  };

  constructor(parent: THREE.Object3D) {
    const geo = radialGrid(200, 256, CONFIG.site.terrainSize * 0.75, 0.5);
    this.material = new THREE.MeshPhysicalMaterial({ color: 0x0b1d22, roughness: 0.06, metalness: 0, ior: 1.333, specularIntensity: 1 });
    const u = this.uniforms;
    const wGlsl = WAVES.map(([d, L, Q, A]) => {
      const rad = (d * Math.PI) / 180;
      return `vec4(${Math.sin(rad).toFixed(5)}, ${(-Math.cos(rad)).toFixed(5)}, ${(2 * Math.PI / L).toFixed(5)}, ${A.toFixed(4)}), ${Q.toFixed(3)}`;
    });
    this.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
${GLSL_NOISE}
${TERRAIN_GLSL}
uniform vec2 uCenter;
uniform float uWaveTime;
uniform float uShockT;
varying vec3 vWW;
varying float vOpen;
varying float vFoam;
void gerstner(vec4 w, float q, vec2 p, float open, inout vec3 disp, inout vec3 tx, inout vec3 tz) {
  vec2 d = w.xy; float k = w.z; float a = w.w * open;
  float c = sqrt(9.81 * k);
  float f = k * dot(d, p) - c * uWaveTime;
  float qa = q * a;
  disp += vec3(d.x * qa * cos(f), a * sin(f), d.y * qa * cos(f));
  tx += vec3(-d.x * d.x * q * a * k * sin(f), d.x * a * k * cos(f), -d.x * d.y * q * a * k * sin(f));
  tz += vec3(-d.x * d.y * q * a * k * sin(f), d.y * a * k * cos(f), -d.y * d.y * q * a * k * sin(f));
}`)
        .replace('#include <beginnormal_vertex>', `
vec2 pW = position.xz + uCenter;
float ds = shoreDistance(pW);
float open = smoothstep(10.0, 260.0, ds) * 0.85 + 0.15 * smoothstep(-5.0, 30.0, ds);
open *= 1.0 - 0.9 * smoothstep(-40.0, -300.0, ds);
vec3 disp = vec3(0.0); vec3 tx = vec3(1.0, 0.0, 0.0); vec3 tz = vec3(0.0, 0.0, 1.0);
${wGlsl.map((w) => `gerstner(${w}, pW, open, disp, tx, tz);`).join('\n')}
// shock ripples from the pad
if (uShockT > 0.0) {
  float r = length(pW);
  float k = 0.35; float A = 0.25 * exp(-r / 600.0) * exp(-uShockT / 3.0);
  float ph = k * r - 2.2 * uShockT * 3.0;
  float front = smoothstep(343.0 * uShockT + 20.0, 343.0 * uShockT - 60.0, r);
  disp.y += A * sin(ph) * front;
}
vec3 objectNormal = normalize(cross(tz, tx));
vOpen = open;
vFoam = smoothstep(55.0, 18.0, ds) * smoothstep(-6.0, 12.0, ds);
#ifdef USE_TANGENT
vec3 objectTangent = vec3(1.0, 0.0, 0.0);
#endif`)
        .replace('#include <begin_vertex>', `
float rr = length(position.xz);
vec3 transformed = position + disp;
transformed.y -= rr * rr / (2.0 * 6371000.0);
vWW = vec3(pW.x + disp.x, disp.y, pW.y + disp.z);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${GLSL_NOISE}
uniform float uWaveTime;
varying vec3 vWW;
varying float vOpen;
varying float vFoam;
vec3 gWaterN = vec3(0.0);
float gFoam = 0.0;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 p = vWW.xz;
  vec2 e = vec2(0.15, 0.0);
  vec2 q1 = p * 0.35 + vec2(uWaveTime * 0.08, uWaveTime * 0.05);
  vec2 q2 = p * 1.3 - vec2(uWaveTime * 0.17, -uWaveTime * 0.11);
  float h0 = vnoise2(q1) + 0.4 * vnoise2(q2);
  float hx = vnoise2(q1 + e.xy) + 0.4 * vnoise2(q2 + e.xy * 3.7);
  float hz = vnoise2(q1 + e.yx) + 0.4 * vnoise2(q2 + e.yx * 3.7);
  gWaterN = vec3(h0 - hx, 0.0, h0 - hz) * (0.9 * vOpen + 0.12);
  float foamN = vnoise2(p * 0.6 + uWaveTime * 0.3) * vnoise2(p * 2.1 - uWaveTime * 0.2);
  gFoam = vFoam * smoothstep(0.15, 0.45, foamN + vWW.y * 0.4);
  vec3 deep = vec3(0.010, 0.035, 0.045);
  vec3 shallow = vec3(0.03, 0.09, 0.075);
  diffuseColor.rgb = mix(shallow, deep, vOpen);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.8, 0.82, 0.82), gFoam);
}`)
        .replace('#include <roughnessmap_fragment>', `float roughnessFactor = mix(0.035, 0.6, gFoam);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
normal = normalize(normal + (viewMatrix * vec4(gWaterN, 0.0)).xyz);`);
    };
    this.material.customProgramCacheKey = () => 'gulf-v1';
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.name = 'gulf';
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }

  update(ctx: FrameContext): void {
    const alt = ctx.camTrue.y + CONFIG.site.olmHeight;
    const target = alt < 1500 ? new THREE.Vector2(ctx.camTrue.x, ctx.camTrue.z) : new THREE.Vector2(0, 0);
    target.set(Math.round(target.x / 8) * 8, Math.round(target.y / 8) * 8);
    if (target.distanceTo(this.center) > 60 || ctx.cut) this.center.copy(target);
    this.uniforms.uCenter.value.copy(this.center);
    this.mesh.position.set(this.center.x, -CONFIG.site.olmHeight - CONFIG.planet.siteElevation, this.center.y);
    this.uniforms.uWaveTime.value = ctx.mission + 100;
    this.uniforms.uShockT.value = ctx.mission > 0 && ctx.mission < 8 ? ctx.mission : -1;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
