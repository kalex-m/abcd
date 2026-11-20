import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * Lathe hull builder with physical UVs (u = angle / 2pi, v = y / stage height) and real weld beads:
 * a 6 mm x 22 mm ridge at every can boundary (1.8 m) up to `beadTop`.
 */
export function hullLathe(radius: (y: number) => number, y0: number, y1: number, stageH: number, segs: number, beadTop: number): THREE.BufferGeometry {
  const v = CONFIG.vehicle;
  const ys: number[] = [];
  const step = 0.3;
  for (let y = y0; y < y1; y += step) ys.push(y);
  ys.push(y1);
  const bw = v.weldBeadWidth;
  for (let y = Math.ceil(y0 / v.ringHeight) * v.ringHeight; y < Math.min(y1, beadTop); y += v.ringHeight) {
    if (y <= y0 + 0.05) continue;
    ys.push(y - bw, y - bw * 0.35, y, y + bw * 0.35, y + bw);
  }
  ys.sort((a, b) => a - b);
  const uniq = ys.filter((y, i) => i === 0 || y - ys[i - 1] > 1e-4);
  const bead = (y: number) => {
    if (y >= beadTop) return 0;
    const k = Math.round(y / v.ringHeight) * v.ringHeight;
    const d = Math.abs(y - k);
    return d < bw ? v.weldBeadHeight * Math.cos((d / bw) * Math.PI * 0.5) ** 2 : 0;
  };
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i < uniq.length; i++) {
    const y = uniq[i];
    const r = radius(y) + bead(y);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
      uv.push(j / segs, y / stageH);
    }
  }
  for (let i = 0; i < uniq.length - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Disc with circular holes (engine bay heat shield / mount plate). */
export function perforatedDisc(r: number, holes: { x: number; z: number; r: number }[], y: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0, Math.PI * 2, false);
  for (const h of holes) {
    const p = new THREE.Path();
    p.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true);
    shape.holes.push(p);
  }
  return new THREE.ShapeGeometry(shape, 48).rotateX(-Math.PI / 2).translate(0, y, 0);
}
