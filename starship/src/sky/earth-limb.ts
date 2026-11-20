import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { GLSL_NOISE } from '../util/noise';
import { smoothstep } from '../util/math';
import { SHARED } from '../post/shared';

/**
 * Spherical Earth for high-altitude shots: procedural day-side albedo (Gulf / ocean, Texas-Mexico
 * coastal plain, inland scrub and a white cloud deck), specular sun glint on water, night-side city
 * lights past the terminator. The thin blue limb and haze come from the sky dome and the aerial
 * perspective pass. Cross-fades with the flat terrain between 40 and 80 km camera altitude.
 */
export class EarthLimb implements System {
  readonly name = 'earthLimb';
  readonly mesh: THREE.Mesh;
  private readonly fade = { value: 0 };
  private readonly flatHide: THREE.Object3D[];

  constructor(scene: THREE.Scene, flat: THREE.Object3D[]) {
    this.flatHide = flat;
    const R = CONFIG.planet.skyRadius;
    const geo = new THREE.SphereGeometry(R, 384, 192);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, transparent: false });
    const fade = this.fade;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uFade = fade;
      sh.uniforms.uSunW = SHARED.uSunDirW;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vN0;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvN0 = normalize(position);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\nuniform float uFade;\nuniform vec3 uSunW;\nvarying vec3 vN0;\nfloat gWater = 0.0;\nfloat gCity = 0.0;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 n = vN0;
  // local tangent coordinates around the launch site (x east, z south) in km
  vec2 q = vec2(n.x, n.z) * ${(R / 1000).toFixed(1)};
  float coast = q.x * 0.99 + q.y * 0.14 - 0.52 + fbm2(q * 0.004, 5) * 90.0 + fbm2(q * 0.03, 4) * 12.0;
  float land = smoothstep(4.0, -4.0, coast);
  float inland = fbm2(q * 0.006 + 4.0, 5) * 0.5 + 0.5;
  vec3 landC = mix(vec3(0.12, 0.11, 0.07), vec3(0.2, 0.18, 0.12), inland);
  landC = mix(landC, vec3(0.07, 0.09, 0.05), smoothstep(0.55, 0.8, fbm2(q * 0.02, 4) * 0.5 + 0.5));
  vec3 ocean = mix(vec3(0.012, 0.03, 0.05), vec3(0.03, 0.07, 0.08), smoothstep(-40.0, 0.0, coast) * 0.8);
  vec3 c = mix(ocean, landC, land);
  float cl = smoothstep(0.55, 0.78, fbm2(q * 0.0035 + vec2(uFade * 0.0, 7.0), 6) * 0.5 + 0.5);
  cl *= 0.85;
  c = mix(c, vec3(0.75, 0.76, 0.78), cl);
  diffuseColor.rgb = c;
  gWater = (1.0 - land) * (1.0 - cl);
  gCity = land * smoothstep(0.72, 0.9, vnoise2(q * 0.08)) * (1.0 - cl);
}`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.85, 0.18, gWater);')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float night = smoothstep(0.05, -0.12, dot(vN0, uSunW));
  totalEmissiveRadiance += vec3(1.0, 0.62, 0.3) * gCity * 0.002 * night;
}`);
    };
    mat.customProgramCacheKey = () => 'earth-v1';
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.name = 'earth';
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  update(ctx: FrameContext): void {
    const alt = ctx.camTrue.y + CONFIG.site.olmHeight;
    const [a0, a1] = CONFIG.sky.earthBlend;
    const f = smoothstep(a0 * 0.5, a1, alt);
    this.fade.value = f;
    this.mesh.visible = alt > a0 * 0.5;
    const R = CONFIG.planet.skyRadius;
    this.mesh.position.set(0, -CONFIG.site.olmHeight - CONFIG.planet.siteElevation - R - (1 - f) * 40, 0).sub(ctx.origin);
    for (const o of this.flatHide) o.visible = alt < a1;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
