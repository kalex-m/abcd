import * as THREE from 'three';
import { CONFIG } from '../config';
import { sootInterior, darkMetal } from './materials';

/**
 * Hot-stage ring: perforated cylindrical skin (100 vent slots in two rows of 50) with real wall
 * thickness and slot side walls, a heavily sooted insulated interior, a top landing plate and the
 * booster forward dome. Exposes slot centres (vehicle-local) for the staging vent-flame jets.
 */
export class HotStageRing {
  readonly group = new THREE.Group();
  readonly slotCenters: THREE.Vector3[] = [];
  readonly slotNormals: THREE.Vector3[] = [];

  constructor(baseY: number, radius: number, steel: THREE.Material, layers: number) {
    const v = CONFIG.vehicle;
    const H = v.hotStageHeight;
    const cols = v.hotStageSlots / 2;
    const [sw, sh] = v.hotStageSlotSize;
    const rows = [0.35, 0.35 + sh + 0.55];
    const rOut = radius, rIn = radius - 0.12;
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    const quad = (a: number[], b: number[], c: number[], d: number[], ua: number[], ub: number[], uc: number[], ud: number[]) => {
      const i0 = pos.length / 3;
      pos.push(...a, ...b, ...c, ...d);
      uv.push(...ua, ...ub, ...uc, ...ud);
      idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    };
    const P = (r: number, ang: number, y: number) => [Math.cos(ang) * r, baseY + y, Math.sin(ang) * r];
    const U = (ang: number, y: number) => [ang / (Math.PI * 2), (baseY + y) / v.boosterHeight];
    const dAng = (Math.PI * 2) / cols;
    const slotA = sw / radius;
    // vertical breakpoints of the slot grid
    const ys = [0, rows[0], rows[0] + sh, rows[1], rows[1] + sh, H];
    for (let c = 0; c < cols; c++) {
      const a0 = c * dAng;
      const s0 = a0 + (dAng - slotA) / 2, s1 = s0 + slotA, a1 = a0 + dAng;
      const angs = [a0, s0, s1, a1];
      for (let yi = 0; yi < ys.length - 1; yi++) {
        const isSlotRow = yi === 1 || yi === 3;
        for (let ai = 0; ai < 3; ai++) {
          if (isSlotRow && ai === 1) continue; // the slot itself
          const x0 = angs[ai], x1 = angs[ai + 1], y0 = ys[yi], y1 = ys[yi + 1];
          for (const [r, flip] of [[rOut, false], [rIn, true]] as [number, boolean][]) {
            const A = P(r, x0, y0), B = P(r, x1, y0), C = P(r, x1, y1), D = P(r, x0, y1);
            if (!flip) quad(A, D, C, B, U(x0, y0), U(x0, y1), U(x1, y1), U(x1, y0));
            else quad(A, B, C, D, U(x0, y0), U(x1, y0), U(x1, y1), U(x0, y1));
          }
        }
        if (isSlotRow) {
          // slot side walls (connect outer and inner skins)
          const y0 = ys[yi], y1 = ys[yi + 1];
          for (const a of [s0, s1]) quad(P(rOut, a, y0), P(rIn, a, y0), P(rIn, a, y1), P(rOut, a, y1), U(a, y0), U(a, y0), U(a, y1), U(a, y1));
          for (const y of [y0, y1]) quad(P(rOut, s0, y), P(rOut, s1, y), P(rIn, s1, y), P(rIn, s0, y), U(s0, y), U(s1, y), U(s1, y), U(s0, y));
          const mid = (s0 + s1) / 2;
          this.slotCenters.push(new THREE.Vector3(Math.cos(mid) * rOut, baseY + (y0 + y1) / 2, Math.sin(mid) * rOut));
          this.slotNormals.push(new THREE.Vector3(Math.cos(mid), 0, Math.sin(mid)));
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const skin = new THREE.Mesh(g, steel);
    skin.castShadow = skin.receiveShadow = true;
    skin.layers.enable(layers);
    // sooty insulated interior and the forward dome
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(rIn - 0.35, rIn - 0.35, H, 64, 1, true).translate(0, baseY + H / 2, 0), sootInterior());
    const dome = new THREE.Mesh(new THREE.SphereGeometry(radius - 0.2, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.32, 1).translate(0, baseY + 0.1, 0), sootInterior());
    const plate = new THREE.Mesh(new THREE.RingGeometry(rIn - 0.4, rOut + 0.02, 96, 1).rotateX(-Math.PI / 2).translate(0, baseY + H, 0), darkMetal());
    inner.layers.enable(layers);
    dome.layers.enable(layers);
    plate.layers.enable(layers);
    this.group.add(skin, inner, dome, plate);
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
  }
}
