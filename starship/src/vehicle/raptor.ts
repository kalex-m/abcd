import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config';
import { createBellMaterial, createRvacSkirtMaterial, darkMetal, plumbingSteel, foilMaterial } from './materials';
import type { EngineSlot } from './engines-layout';

/**
 * Raptor engine geometry at real scale, origin at the gimbal pivot (top), +Y up, nozzle pointing -Y.
 * Parts: powerhead dome, main injector, combustion chamber, regeneratively-cooled parabolic bell with a
 * wall lip, ox-rich and fuel-rich turbopumps with volutes, preburners, 6-8 plumbing runs, gimbal block
 * with two actuators, crinkled thermal-foil wraps. Instanced per material; per-instance gimbal matrices
 * and heat (glow) updated every frame.
 */
export const PIVOT_TO_THROAT = 1.2; // m

function bellProfile(rThroat: number, rExit: number, len: number, wall: number, seg: number): THREE.Vector2[] {
  // parabolic (Rao-like) contour: r(x) = rt + (re - rt) * (x/L)^0.62 with a convergent lead-in
  const outer: THREE.Vector2[] = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const r = rThroat + (rExit - rThroat) * Math.pow(u, 0.62);
    outer.push(new THREE.Vector2(r + wall, -u * len));
  }
  const inner = outer.map((p) => new THREE.Vector2(p.x - wall, p.y)).reverse();
  // outer surface top->bottom, lip, inner surface bottom->top
  return [...outer, new THREE.Vector2(rExit, -len - 0.01), ...inner];
}

export interface EngineParts {
  bell: THREE.BufferGeometry;
  dark: THREE.BufferGeometry;
  steel: THREE.BufferGeometry;
  foil: THREE.BufferGeometry;
  skirt?: THREE.BufferGeometry;
  bellLength: number;
  totalLength: number;
}

function tube(points: [number, number, number][], r: number): THREE.BufferGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 20, r, 8, false);
}

/** Build the non-bell parts shared by sea-level and vacuum Raptors. */
function powerhead(): { dark: THREE.BufferGeometry; steel: THREE.BufferGeometry; foil: THREE.BufferGeometry } {
  const cw = CONFIG.engines.chamberWidth / 2;
  const dark: THREE.BufferGeometry[] = [];
  const steel: THREE.BufferGeometry[] = [];
  const foil: THREE.BufferGeometry[] = [];
  // gimbal block and thrust puck
  dark.push(new THREE.CylinderGeometry(0.28, 0.32, 0.22, 16).translate(0, -0.11, 0));
  // powerhead dome + main injector
  dark.push(new THREE.SphereGeometry(cw * 1.05, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, -0.42, 0));
  dark.push(new THREE.CylinderGeometry(cw * 1.05, cw, 0.18, 24).translate(0, -0.51, 0));
  // combustion chamber with a convergent section to the throat
  dark.push(new THREE.LatheGeometry([new THREE.Vector2(cw, -0.6), new THREE.Vector2(cw, -0.95), new THREE.Vector2(0.26, -1.1), new THREE.Vector2(0.21, -PIVOT_TO_THROAT)], 24));
  // turbopumps (ox-rich and fuel-rich) with volutes, preburners
  for (const side of [-1, 1]) {
    const x = side * 0.42;
    dark.push(new THREE.CylinderGeometry(0.15, 0.17, 0.62, 16).translate(x, -0.55, 0.08 * side));
    dark.push(new THREE.TorusGeometry(0.17, 0.06, 8, 20).rotateX(Math.PI / 2).translate(x, -0.82, 0.08 * side));
    dark.push(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 12).translate(x * 0.75, -0.25, -0.22 * side));
    foil.push(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 14, 1, true).translate(x, -0.45, 0.08 * side));
  }
  // plumbing: hot-gas manifolds and propellant lines into the injector / cooling jacket
  steel.push(tube([[0.42, -0.85, 0.08], [0.36, -1.0, 0.18], [0.28, -1.12, 0.12], [0.24, -1.25, 0.0]], 0.05));
  steel.push(tube([[-0.42, -0.85, -0.08], [-0.36, -1.0, -0.2], [-0.28, -1.15, -0.1], [-0.23, -1.3, 0.0]], 0.05));
  steel.push(tube([[0.32, -0.25, -0.22], [0.12, -0.18, -0.3], [-0.1, -0.22, -0.3], [-0.32, -0.25, 0.22]], 0.045));
  steel.push(tube([[0.42, -0.3, 0.1], [0.3, -0.35, 0.3], [0.05, -0.45, 0.32], [-0.1, -0.6, 0.3]], 0.04));
  steel.push(tube([[-0.42, -0.3, -0.1], [-0.3, -0.38, -0.32], [0.0, -0.5, -0.33], [0.15, -0.62, -0.28]], 0.04));
  steel.push(tube([[0.15, -0.95, 0.3], [0.25, -1.05, 0.25], [0.27, -1.3, 0.18], [0.3, -1.6, 0.12]], 0.035));
  steel.push(tube([[-0.15, -0.95, -0.3], [-0.25, -1.05, -0.25], [-0.27, -1.3, -0.18], [-0.3, -1.6, -0.12]], 0.035));
  // gimbal actuators (two, at 90 deg) from the thrust structure to the chamber
  for (const a of [0, Math.PI / 2]) {
    const top = new THREE.Vector3(Math.cos(a) * 0.55, -0.02, Math.sin(a) * 0.55);
    const bot = new THREE.Vector3(Math.cos(a) * 0.32, -0.9, Math.sin(a) * 0.32);
    const dir = bot.clone().sub(top);
    const len = dir.length();
    const cyl = new THREE.CylinderGeometry(0.07, 0.07, len * 0.6, 10).translate(0, -len * 0.3, 0);
    const rod = new THREE.CylinderGeometry(0.035, 0.035, len * 0.5, 8).translate(0, -len * 0.75, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    const m = new THREE.Matrix4().compose(top, q, new THREE.Vector3(1, 1, 1));
    dark.push(cyl.applyMatrix4(m));
    steel.push(rod.applyMatrix4(m));
  }
  return { dark: mergeGeometries(dark), steel: mergeGeometries(steel), foil: mergeGeometries(foil) };
}

export function raptorSLParts(exitDiameter: number): EngineParts {
  const e = CONFIG.engines;
  const len = e.bellLength * (exitDiameter / e.bellExitDiameter);
  const bell = new THREE.LatheGeometry(bellProfile(0.21, exitDiameter / 2, len, 0.025, 24), 48).translate(0, -PIVOT_TO_THROAT, 0);
  const ph = powerhead();
  return { bell, dark: ph.dark, steel: ph.steel, foil: ph.foil, bellLength: len, totalLength: PIVOT_TO_THROAT + len };
}

export function rvacParts(): EngineParts {
  const e = CONFIG.engines;
  const regenLen = 1.4;
  const rRegen = 0.72;
  const bell = new THREE.LatheGeometry(bellProfile(0.21, rRegen, regenLen, 0.03, 20), 56).translate(0, -PIVOT_TO_THROAT, 0);
  // thin radiatively cooled extension with stiffening ribs
  const extLen = e.rvacLength - regenLen;
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    prof.push(new THREE.Vector2(rRegen + (e.rvacExitDiameter / 2 - rRegen) * Math.pow(u, 0.75), -u * extLen));
  }
  const skirt = new THREE.LatheGeometry(prof, 72).translate(0, -PIVOT_TO_THROAT - regenLen, 0);
  const ribs: THREE.BufferGeometry[] = [skirt];
  for (const u of [0.0, 0.35, 0.7, 1.0]) {
    const r = rRegen + (e.rvacExitDiameter / 2 - rRegen) * Math.pow(u, 0.75);
    ribs.push(new THREE.TorusGeometry(r + 0.012, 0.025, 6, 72).rotateX(Math.PI / 2).translate(0, -PIVOT_TO_THROAT - regenLen - u * extLen, 0));
  }
  const ph = powerhead();
  return { bell, dark: ph.dark, steel: ph.steel, foil: ph.foil, skirt: mergeGeometries(ribs), bellLength: regenLen, totalLength: PIVOT_TO_THROAT + e.rvacLength };
}

/**
 * A cluster of instanced engines of one kind. `mountY` is the vehicle-local height of the pivots.
 */
export class EngineCluster {
  readonly group = new THREE.Group();
  readonly meshes: THREE.InstancedMesh[] = [];
  private readonly heat: Float32Array;
  private readonly heatAttr: THREE.InstancedBufferAttribute;
  readonly rvacGlow: THREE.IUniform<number> | null = null;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler();

  constructor(readonly slots: EngineSlot[], readonly parts: EngineParts, readonly mountY: number, layers: number) {
    const n = slots.length;
    this.heat = new Float32Array(n);
    this.heatAttr = new THREE.InstancedBufferAttribute(this.heat, 1);
    const bellGeo = parts.bell.clone();
    bellGeo.setAttribute('aHeat', this.heatAttr);
    const list: [THREE.BufferGeometry, THREE.Material][] = [
      [bellGeo, createBellMaterial(parts.bellLength)],
      [parts.dark, darkMetal()],
      [parts.steel, plumbingSteel()],
      [parts.foil, foilMaterial()],
    ];
    if (parts.skirt) {
      const sk = createRvacSkirtMaterial();
      (this as { rvacGlow: THREE.IUniform<number> | null }).rvacGlow = sk.glow;
      list.push([parts.skirt, sk.material]);
    }
    for (const [g, mat] of list) {
      const im = new THREE.InstancedMesh(g, mat, n);
      im.castShadow = true;
      im.receiveShadow = true;
      im.frustumCulled = false;
      im.layers.enable(layers);
      this.meshes.push(im);
      this.group.add(im);
    }
    this.update(new Float32Array(n), 0, 0);
  }

  /**
   * @param level per-engine intensity 0..1
   * @param gp pitch gimbal (rad) applied to gimballing engines
   * @param gy yaw gimbal (rad)
   */
  update(level: Float32Array, gp: number, gy: number, jitter = 0): void {
    const max = (CONFIG.engines.gimbalMaxDeg * Math.PI) / 180;
    this.slots.forEach((s, i) => {
      const k = s.gimbal ? 1 : 0;
      const jx = jitter * Math.sin(i * 12.3 + jitter * 50);
      this.e.set(Math.max(-max, Math.min(max, (gp + jx) * k)), 0, Math.max(-max, Math.min(max, (gy - jx) * k)));
      this.q.setFromEuler(this.e);
      this.m.compose(new THREE.Vector3(s.x, this.mountY, s.z), this.q, new THREE.Vector3(1, 1, 1));
      for (const im of this.meshes) im.setMatrixAt(i, this.m);
      this.heat[i] = level[i];
    });
    for (const im of this.meshes) im.instanceMatrix.needsUpdate = true;
    this.heatAttr.needsUpdate = true;
  }

  dispose(): void {
    for (const im of this.meshes) {
      im.geometry.dispose();
      (im.material as THREE.Material).dispose();
    }
  }
}
