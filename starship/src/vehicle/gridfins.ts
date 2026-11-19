import * as THREE from 'three';
import { CONFIG } from '../config';
import { beamMesh, type Beam } from '../site/beams';
import { titaniumMaterial, darkMetal } from './materials';
import { GLSL_NOISE } from '../util/noise';

/**
 * Grid fins: real lattice of individual instanced bars (diagonal cells, 25 mm plates, 0.55 m chord),
 * perimeter frame, hinge pivot and two chunky actuator arms. Titanium with blue anodise on the leading
 * edges and black heat scarring. Each fin rotates about its hinge from stowed (folded up against the
 * hull) to deployed (horizontal) in 2.2 s.
 */
export class GridFins {
  readonly group = new THREE.Group();
  private readonly pivots: THREE.Group[] = [];
  readonly heat = { value: 0 };

  constructor(hingeY: number, radius: number, layers: number) {
    const gf = CONFIG.vehicle.gridFin;
    const ti = titaniumMaterial();
    const heat = this.heat;
    ti.onBeforeCompile = (sh) => {
      sh.uniforms.uFinHeat = heat;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFinN;\nvarying vec3 vFinP;').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvFinN = objectNormal;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFinP = (instanceMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${GLSL_NOISE}\nuniform float uFinHeat;\nvarying vec3 vFinN;\nvarying vec3 vFinP;`).replace('#include <color_fragment>', `#include <color_fragment>
{
  // leading edges (+y in fin space when stowed = windward during descent): blue anodise and soot
  float edge = smoothstep(0.15, 0.3, vFinP.y + 0.28);
  float scar = smoothstep(0.45, 0.75, fbm3(vFinP * 2.5, 4) * 0.5 + 0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.34, 0.48), edge * 0.35);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03), scar * 0.65);
}`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(1.0, 0.32, 0.08) * uFinHeat * 6.0 * smoothstep(0.1, 0.3, vFinP.y + 0.28);`);
    };
    ti.customProgramCacheKey = () => 'gridfin-ti';
    // Lattice in fin space: x = radial (0 at hinge .. width), z = tangential (-h/2 .. h/2), y = chord (depth)
    const W = gf.width, H = gf.height, D = gf.barDepth;
    const bars: Beam[] = [];
    const n = gf.cellsAcross;
    const step = (W + H) / n;
    const clip = (a: THREE.Vector2, b: THREE.Vector2): [THREE.Vector2, THREE.Vector2] | null => {
      // Liang-Barsky clip of segment a-b to [0, W] x [-H/2, H/2]
      let t0 = 0, t1 = 1;
      const dx = b.x - a.x, dy = b.y - a.y;
      const p = [-dx, dx, -dy, dy];
      const q = [a.x, W - a.x, a.y + H / 2, H / 2 - a.y];
      for (let i = 0; i < 4; i++) {
        if (p[i] === 0) { if (q[i] < 0) return null; continue; }
        const r = q[i] / p[i];
        if (p[i] < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
      }
      if (t0 >= t1) return null;
      return [new THREE.Vector2(a.x + dx * t0, a.y + dy * t0), new THREE.Vector2(a.x + dx * t1, a.y + dy * t1)];
    };
    const up = new THREE.Vector3(0, 1, 0);
    for (let k = -n; k <= 2 * n; k++) {
      const c = k * step;
      for (const sgn of [1, -1]) {
        const a = new THREE.Vector2(c, -H / 2 - 10);
        const b = new THREE.Vector2(c + sgn * (H + 20), H / 2 + 10);
        const seg = clip(a, b);
        if (!seg) continue;
        bars.push({ a: new THREE.Vector3(seg[0].x, 0, seg[0].y), b: new THREE.Vector3(seg[1].x, 0, seg[1].y), w: D, d: gf.barThickness, up });
      }
    }
    // perimeter frame
    const F = 0.12;
    const fr: Beam[] = [
      { a: new THREE.Vector3(0, 0, -H / 2), b: new THREE.Vector3(W, 0, -H / 2), w: D + 0.06, d: F },
      { a: new THREE.Vector3(0, 0, H / 2), b: new THREE.Vector3(W, 0, H / 2), w: D + 0.06, d: F },
      { a: new THREE.Vector3(W, 0, -H / 2), b: new THREE.Vector3(W, 0, H / 2), w: D + 0.06, d: F },
      { a: new THREE.Vector3(0, 0, -H / 2), b: new THREE.Vector3(0, 0, H / 2), w: D + 0.12, d: 0.22 },
    ].map((b) => ({ ...b, up: new THREE.Vector3(0, 1, 0) }));
    for (let f = 0; f < 4; f++) {
      const ang = (f / 4) * Math.PI * 2 + Math.PI / 4; // 45 deg relative to the quad axes
      const mount = new THREE.Group();
      mount.rotation.y = -ang;
      mount.position.y = hingeY;
      const pivot = new THREE.Group();
      pivot.position.x = radius + 0.18;
      const latt = beamMesh(bars, ti);
      const frame = beamMesh(fr, ti);
      latt.castShadow = frame.castShadow = true;
      latt.layers.enable(layers);
      frame.layers.enable(layers);
      // the lattice beams were built with their thickness along local x of each bar; rotate so the chord (d)
      // runs along the vehicle axis (pivot-local y)
      const holder = new THREE.Group();
      holder.add(latt, frame);
      pivot.add(holder);
      // hinge barrel and actuator arms
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, H * 0.8, 16).rotateX(Math.PI / 2), darkMetal());
      barrel.castShadow = true;
      pivot.add(barrel);
      mount.add(pivot);
      for (const z of [-0.9, 0.9]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.38, 0.42).translate(0.45, 0, 0), darkMetal());
        arm.position.set(radius - 0.1, -0.9, z);
        arm.rotation.z = 0.9;
        arm.castShadow = true;
        mount.add(arm);
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 1.0), darkMetal());
        box.position.set(radius + 0.15, -1.3, z);
        mount.add(box);
      }
      this.pivots.push(pivot);
      this.group.add(mount);
    }
    this.setDeploy(0);
  }

  /** 0 = stowed against the hull (pointing up), 1 = deployed horizontally. */
  setDeploy(d: number): void {
    for (const p of this.pivots) p.rotation.z = (1 - d) * (Math.PI / 2);
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
    });
  }
}
