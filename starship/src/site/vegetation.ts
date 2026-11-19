import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { rngFor } from '../util/rng';
import { terrainHeight, shoreDistance } from './terrain';
import { GLSL_NOISE } from '../util/noise';

/**
 * Instanced vegetation: two-segment grass blades, taller reeds along the marsh pools and low scrub
 * shrubs. Dense patches surround the ground cameras, a sparse field covers the flats. Every blade
 * bends with the wind (gusting power-law surface wind) and with the liftoff blast: an analytic radial
 * impulse travelling outward from the pad at the speed of sound, decaying over ~4 s.
 */
const WIND_GLSL = /* glsl */ `
uniform float uWindT;
uniform vec2 uWindDir;
uniform float uWindSpeed;
uniform float uShockT; // s since liftoff (or < 0)
uniform float uBlast; // 0..1 near-pad plume outflow strength
vec3 vegDisplace(vec3 wp, float h01, float stiff) {
  float gust = 0.55 + 0.45 * sin(uWindT * 0.8 + dot(wp.xz, vec2(0.031, 0.017))) * sin(uWindT * 0.33 + wp.x * 0.011);
  float flutter = gnoise3(vec3(wp.xz * 0.35, uWindT * 1.7)) * 0.35;
  vec2 w = uWindDir * uWindSpeed * 0.035 * (gust + flutter);
  vec3 d = vec3(w.x, 0.0, w.y);
  if (uShockT > 0.0) {
    float r = length(wp.xz);
    float front = 343.0 * uShockT;
    float pulse = exp(-pow((r - front) / 40.0, 2.0)) * 0.6 + smoothstep(front + 10.0, front - 30.0, r) * exp(-uShockT / 4.0) * 0.35;
    float near = uBlast * exp(-r / 380.0) * 1.2;
    vec2 dir = normalize(wp.xz + 1e-3);
    float flick = 1.0 + 0.4 * sin(uWindT * 31.0 + r * 0.7);
    d.xz += dir * (pulse * (500.0 / (r + 300.0)) + near) * flick;
  }
  d *= h01 * h01 / stiff;
  d.y = -length(d.xz) * 0.35 * h01;
  return d;
}
`;

/** A tuft of `n` two-segment blades fanned around the tuft centre (each blade: 5 verts, 3 tris). */
function bladeGeometry(n = 6, w = 0.04, spread = 0.12, seed = 1): THREE.BufferGeometry {
  const pos: number[] = [], nrm: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let b = 0; b < n; b++) {
    const a = (b / n) * Math.PI * 2 + Math.sin(b * 12.9898 + seed) * 0.6;
    const r = spread * (0.3 + 0.7 * Math.abs(Math.sin(b * 78.233 + seed)));
    const ox = Math.cos(a) * r, oz = Math.sin(a) * r;
    const lean = 0.18 + 0.2 * Math.abs(Math.cos(b * 3.1 + seed));
    const hs = 0.75 + 0.25 * Math.abs(Math.sin(b * 5.7 + seed));
    const tx = -Math.sin(a), tz = Math.cos(a);
    const base = pos.length / 3;
    const pts = [[-w, 0], [w, 0], [-w * 0.7, 0.5], [w * 0.7, 0.5], [0, 1]];
    for (const [s, y] of pts) {
      const yy = y * hs;
      pos.push(ox + tx * s + Math.cos(a) * lean * yy * yy, yy, oz + tz * s + Math.sin(a) * lean * yy * yy);
      nrm.push(Math.cos(a), 0.4, Math.sin(a));
      uv.push(s > 0 ? 1 : 0, y);
    }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export class Vegetation implements System {
  readonly name = 'vegetation';
  readonly group = new THREE.Group();
  private readonly uniforms = {
    uWindT: { value: 0 },
    uWindDir: { value: new THREE.Vector2(-0.707, -0.707) },
    uWindSpeed: { value: CONFIG.wind.v10 },
    uShockT: { value: -1 },
    uBlast: { value: 0 },
  };

  constructor(parent: THREE.Object3D, budget: { grass: number; shrubs: number }) {
    parent.add(this.group);
    const rng = rngFor('vegetation');
    const G = -CONFIG.site.olmHeight;
    const cams: [number, number, number][] = [
      // [x, z, radius]
      [-930, 1010, 110], [150, 1590, 120], [-3, 194, 90], [-82, 108, 40], [-130, 420, 120],
    ];
    const ok = (x: number, z: number, minH = -1.8) => {
      const r = Math.hypot(x, z);
      if (r < 175) return false;
      const tf = Math.hypot(x - CONFIG.site.tankFarmCenter[0], z - CONFIG.site.tankFarmCenter[2]);
      if (tf < 120) return false;
      if (shoreDistance(x, z) > -15) return false;
      return terrainHeight(x, z) > minH;
    };
    // --- grass
    const nGrass = Math.floor(budget.grass / 5); // tufts of ~6 blades
    const grassM = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const grassMat = this.material(new THREE.Color(0.2, 0.2, 0.08), 1.0, true);
    const grass = new THREE.InstancedMesh(bladeGeometry(6, 0.035, 0.12, 1), grassMat, nGrass);
    const tint = new Float32Array(nGrass);
    let gi = 0;
    let guard = 0;
    while (gi < nGrass && guard++ < nGrass * 6) {
      let x: number, z: number;
      if (rng.next() < 0.7) {
        const c = cams[Math.floor(rng.next() * cams.length)];
        const a = rng.next() * Math.PI * 2, r = Math.pow(rng.next(), 1.6) * c[2];
        x = c[0] + Math.cos(a) * r; z = c[1] + Math.sin(a) * r;
      } else {
        const a = rng.next() * Math.PI * 2, r = 180 + Math.sqrt(rng.next()) * (CONFIG.site.grassRadius - 180);
        x = Math.cos(a) * r; z = Math.sin(a) * r;
      }
      if (!ok(x, z)) continue;
      const h = terrainHeight(x, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.next() * Math.PI * 2);
      const height = rng.range(0.25, 0.75) * (h < -1.0 ? 1.6 : 1);
      s.set(rng.range(0.8, 1.4), height, 1);
      p.set(x, G + h - 0.02, z);
      grassM.compose(p, q, s);
      grass.setMatrixAt(gi, grassM);
      tint[gi] = rng.next();
      gi++;
    }
    grass.count = gi;
    grass.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1));
    grass.computeBoundingSphere();
    grass.receiveShadow = true;
    grass.frustumCulled = false;
    this.group.add(grass);

    // --- reeds on the pool margins near the shot-1 camera
    const nReeds = Math.floor(nGrass * 0.12);
    const reedMat = this.material(new THREE.Color(0.25, 0.22, 0.11), 2.2, true);
    const reeds = new THREE.InstancedMesh(bladeGeometry(9, 0.022, 0.18, 7), reedMat, nReeds);
    const rt = new Float32Array(nReeds);
    let ri = 0;
    guard = 0;
    while (ri < nReeds && guard++ < nReeds * 40) {
      const c = cams[guard % 2 === 0 ? 0 : 4];
      const a = rng.next() * Math.PI * 2, r = Math.pow(rng.next(), 1.3) * c[2] * 1.3;
      const x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r;
      const h = terrainHeight(x, z);
      if (h < -2.35 || h > -0.2 || Math.hypot(x, z) < 175) continue;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.next() * Math.PI * 2);
      s.set(rng.range(0.7, 1.1), rng.range(1.1, 2.3), 1);
      p.set(x, G + h, z);
      grassM.compose(p, q, s);
      reeds.setMatrixAt(ri, grassM);
      rt[ri] = rng.next();
      ri++;
    }
    reeds.count = ri;
    reeds.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(rt, 1));
    reeds.computeBoundingSphere();
    reeds.frustumCulled = false;
    reeds.receiveShadow = true;
    this.group.add(reeds);

    // --- shrubs
    const nShrub = budget.shrubs;
    const shrubG = new THREE.IcosahedronGeometry(1, 1);
    const sp = shrubG.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i);
      sp.setY(i, y < 0 ? y * 0.2 : y);
      sp.setX(i, sp.getX(i) * (1 + 0.25 * Math.sin(i * 1.7)));
      sp.setZ(i, sp.getZ(i) * (1 + 0.25 * Math.cos(i * 2.3)));
    }
    shrubG.computeVertexNormals();
    const shrubMat = this.material(new THREE.Color(0.11, 0.12, 0.06), 6.0, false);
    const shrubs = new THREE.InstancedMesh(shrubG, shrubMat, nShrub);
    const st = new Float32Array(nShrub);
    let si = 0;
    guard = 0;
    while (si < nShrub && guard++ < nShrub * 8) {
      let x: number, z: number;
      if (rng.next() < 0.4) {
        const c = cams[Math.floor(rng.next() * cams.length)];
        const a = rng.next() * Math.PI * 2, r = Math.sqrt(rng.next()) * c[2] * 2;
        x = c[0] + Math.cos(a) * r; z = c[1] + Math.sin(a) * r;
      } else {
        const a = rng.next() * Math.PI * 2, r = 180 + Math.sqrt(rng.next()) * 1600;
        x = Math.cos(a) * r; z = Math.sin(a) * r;
      }
      if (!ok(x, z, -1.2)) continue;
      const h = terrainHeight(x, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.next() * Math.PI * 2);
      const sc = rng.range(0.35, 1.3);
      s.set(sc * rng.range(0.9, 1.6), sc * rng.range(0.5, 0.9), sc * rng.range(0.9, 1.6));
      p.set(x, G + h - 0.05, z);
      grassM.compose(p, q, s);
      shrubs.setMatrixAt(si, grassM);
      st[si] = rng.next();
      si++;
    }
    shrubs.count = si;
    shrubs.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(st, 1));
    shrubs.computeBoundingSphere();
    shrubs.frustumCulled = false;
    shrubs.castShadow = true;
    shrubs.receiveShadow = true;
    this.group.add(shrubs);
  }

  private material(base: THREE.Color, stiff: number, blade: boolean): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.85, metalness: 0, side: blade ? THREE.DoubleSide : THREE.FrontSide });
    const u = this.uniforms;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\n${WIND_GLSL}\nattribute float aTint;\nvarying float vTint;\nvarying float vH;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vTint = aTint;
vH = ${blade ? 'position.y' : 'clamp(position.y * 0.5 + 0.5, 0.0, 1.0)'};
{
  vec3 wBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz + uOriginV;
  float sc = length(instanceMatrix[1].xyz);
  vec3 dW = vegDisplace(wBase, ${blade ? 'position.y' : 'max(position.y, 0.0)'}, ${stiff.toFixed(2)}) * sc;
  mat3 R = mat3(instanceMatrix);
  vec3 dL = transpose(R) * dW / max(sc * sc, 1e-4);
  transformed += dL;
}`)
        .replace('#include <common>', '#include <common>');
      sh.vertexShader = sh.vertexShader.replace('uniform float uBlast;', 'uniform float uBlast;\nuniform vec3 uOriginV;');
      sh.uniforms.uOriginV = { value: new THREE.Vector3() };
      (m.userData as { origin?: THREE.IUniform<THREE.Vector3> }).origin = sh.uniforms.uOriginV as THREE.IUniform<THREE.Vector3>;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTint;\nvarying float vH;')
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 dry = vec3(0.36, 0.30, 0.17);
  vec3 green = vec3(0.12, 0.15, 0.05);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(green, dry, vTint), 0.6) * (0.55 + 0.6 * vH);
}`);
    };
    m.customProgramCacheKey = () => `veg-${blade ? 'b' : 's'}-${stiff}`;
    return m;
  }

  update(ctx: FrameContext): void {
    const w = CONFIG.wind;
    const to = ((w.fromDeg + 180) * Math.PI) / 180;
    this.uniforms.uWindDir.value.set(Math.sin(to), -Math.cos(to));
    this.uniforms.uWindT.value = ctx.mission + 500;
    this.uniforms.uWindSpeed.value = w.v10;
    this.uniforms.uShockT.value = ctx.mission > 0 && ctx.mission < 14 ? ctx.mission : -1;
    this.uniforms.uBlast.value = ctx.booster.alt < 400 ? Math.min(1, ctx.booster.thrustMN / 75) * Math.exp(-Math.max(0, ctx.booster.alt) / 150) : 0;
    this.group.traverse((o) => {
      const mm = (o as THREE.Mesh).material as THREE.Material | undefined;
      const og = mm && (mm.userData as { origin?: THREE.IUniform<THREE.Vector3> }).origin;
      if (og) og.value.copy(ctx.origin);
    });
  }

  dispose(): void {
    this.group.traverse((o) => {
      const mm = o as THREE.Mesh;
      if (mm.isMesh) {
        mm.geometry.dispose();
        (mm.material as THREE.Material).dispose();
      }
    });
  }
}
