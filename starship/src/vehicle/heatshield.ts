import * as THREE from 'three';
import { CONFIG } from '../config';
import { GLSL_NOISE } from '../util/noise';
import { shipProfileSamples, R } from './profile';
import { tileWear, TILE_WEAR_GLSL } from './damage-wear';

/**
 * Hexagonal heat-shield tiles on the ship's windward side (local -Z). Instanced hex prisms
 * (0.17 m flat-to-flat, 0.05 m thick, 12 mm gaps) placed row by row along the meridian, coverage 40 %
 * of the circumference at the aft end growing to 60 % at the nose and the full cap; per-tile offset and
 * rotation jitter; missing / chipped / scorched variants; the vertex shader bends each tile to the hull.
 * A procedural "tile shell" under the tiles shows gap filler (and bare steel where a tile is missing)
 * up close and the full hex pattern beyond the LOD distance, where the instances are hidden.
 */
export class HeatShield {
  readonly group = new THREE.Group();
  readonly tiles: THREE.InstancedMesh;
  readonly shell: THREE.Mesh;
  readonly count: number;
  readonly shellUniforms = { uNear: { value: 1 } };

  constructor(layers: number) {
    const t = CONFIG.vehicle.tiles;
    const pitchX = t.flatToFlat + t.gap;
    const pitchY = pitchX * Math.sqrt(3) / 2;
    const prof = shipProfileSamples(400);
    const H = CONFIG.vehicle.shipHeight;
    const coverage = (y: number) => {
      const u = Math.min(1, Math.max(0, y / H));
      return t.coverageAft + (t.coverageNose - t.coverageAft) * u * u;
    };
    const tLen = prof[prof.length - 1].t;
    const sample = (tt: number) => {
      let i = 1;
      while (i < prof.length - 1 && prof[i].t < tt) i++;
      const a = prof[i - 1], b = prof[i];
      const f = (tt - a.t) / Math.max(1e-6, b.t - a.t);
      return { y: a.y + (b.y - a.y) * f, r: a.r + (b.r - a.r) * f, beta: a.beta + (b.beta - a.beta) * f };
    };
    const mats: THREE.Matrix4[] = [];
    const attrs: number[] = [];
    const belly = -Math.PI / 2;
    const m = new THREE.Matrix4();
    const rng = (a: number, b: number) => tileWearRand(a, b);
    for (let row = 0; ; row++) {
      const tt = 0.7 + row * pitchY;
      if (tt > tLen - 0.25 || mats.length >= t.maxInstances) break;
      const s = sample(tt);
      if (s.r < 0.12) break;
      const fullWrap = s.y > H - 1.6;
      const halfAng = fullWrap ? Math.PI : coverage(s.y) * Math.PI;
      const arc = 2 * halfAng * s.r;
      const n = Math.max(1, Math.floor(arc / pitchX));
      const dA = (2 * halfAng) / n;
      const off = (row % 2) * 0.5;
      for (let col = 0; col < n; col++) {
        const w = tileWear(col, row);
        if (w.missing || mats.length >= t.maxInstances) continue;
        const theta = belly - halfAng + (col + 0.5 + off) * dA + (rng(col, row) - 0.5) * (t.offsetJitter / s.r) * 2;
        if (!fullWrap && (theta > belly + halfAng || theta < belly - halfAng)) continue;
        const cb = Math.cos(s.beta), sb = Math.sin(s.beta);
        const nrm = new THREE.Vector3(Math.cos(theta) * cb, sb, Math.sin(theta) * cb);
        const tang = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
        const bit = new THREE.Vector3().crossVectors(tang, nrm);
        const pos = new THREE.Vector3(Math.cos(theta) * s.r, s.y + (rng(row, col) - 0.5) * t.offsetJitter * 2, Math.sin(theta) * s.r).addScaledVector(nrm, t.thickness / 2 + 0.003);
        const rot = new THREE.Matrix4().makeBasis(tang, nrm, bit);
        const jit = new THREE.Matrix4().makeRotationY(((rng(col + 7, row + 3) - 0.5) * 2 * t.rotJitterDeg * Math.PI) / 180);
        m.copy(rot).multiply(jit).setPosition(pos);
        mats.push(m.clone());
        attrs.push(w.shade, w.chipped, w.scorched, w.seed);
      }
    }
    this.count = mats.length;
    const circ = t.flatToFlat / Math.sqrt(3);
    const geo = new THREE.CylinderGeometry(circ, circ, t.thickness, 6, 1, false);
    geo.setAttribute('aTile', new THREE.InstancedBufferAttribute(new Float32Array(attrs), 4));
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.albedo, t.albedo, t.albedo), roughness: t.roughness, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aTile;\nvarying vec4 vTile;\nvarying vec3 vTP;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vTile = aTile;
vTP = position;
// bend the tile to the hull curvature (cylinder of radius R about the vehicle axis)
transformed.y -= transformed.x * transformed.x / (2.0 * ${R.toFixed(2)});
// soften the top edge (chamfer) for nicer grazing highlights
transformed.y -= step(0.0, position.y) * smoothstep(${(circ * 0.75).toFixed(4)}, ${circ.toFixed(4)}, length(position.xz)) * 0.008;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\nvarying vec4 vTile;\nvarying vec3 vTP;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  float n = vnoise2(vTP.xz * 60.0 + vTile.w * 40.0);
  diffuseColor.rgb *= vTile.x * (0.9 + 0.2 * n);
  // chipped corner: lighter exposed substrate in one sector
  float ang = atan(vTP.z, vTP.x) + vTile.w * 6.283;
  float chip = vTile.y * step(0.8, cos(ang)) * step(${(circ * 0.55).toFixed(4)}, length(vTP.xz));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.21, 0.2), chip);
  // scorched sheen: brown/tan glaze
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.11, 0.075, 0.045), vTile.z * 0.7 * (0.6 + 0.4 * n));
}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.32, vTile.z * 0.6);`);
    };
    mat.customProgramCacheKey = () => 'tiles-v1';
    this.tiles = new THREE.InstancedMesh(geo, mat, Math.max(1, this.count));
    mats.forEach((mm, i) => this.tiles.setMatrixAt(i, mm));
    this.tiles.count = this.count;
    this.tiles.instanceMatrix.needsUpdate = true;
    this.tiles.castShadow = false;
    this.tiles.receiveShadow = true;
    this.tiles.frustumCulled = false;
    this.tiles.layers.enable(layers);
    this.group.add(this.tiles);

    // ---- tile shell (lathe slightly above the hull; procedural hex pattern) ----
    const profPts = prof.filter((_, i) => i % 2 === 0);
    const segs = 160;
    const pos: number[] = [], uv: number[] = [], aux: number[] = [], idx: number[] = [];
    profPts.forEach((p) => {
      for (let j = 0; j <= segs; j++) {
        const th = (j / segs) * Math.PI * 2;
        const cb = Math.cos(p.beta), sb = Math.sin(p.beta);
        const lift = 0.004;
        pos.push(Math.cos(th) * (p.r + lift * cb), p.y + lift * sb, Math.sin(th) * (p.r + lift * cb));
        uv.push(j / segs, p.y / H);
        aux.push(p.t, p.r);
      }
    });
    for (let i = 0; i < profPts.length - 1; i++) {
      for (let j = 0; j < segs; j++) {
        const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    sg.setAttribute('aMer', new THREE.Float32BufferAttribute(aux, 2));
    sg.setIndex(idx);
    sg.computeVertexNormals();
    const sm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const su = this.shellUniforms;
    sm.onBeforeCompile = (sh) => {
      sh.uniforms.uNear = su.uNear;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aMer;\nvarying vec2 vMer;\nvarying vec3 vSP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMer = aMer;\nvSP = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_NOISE}\n${TILE_WEAR_GLSL}\nuniform float uNear;\nvarying vec2 vMer;\nvarying vec3 vSP;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  const float PX = ${pitchX.toFixed(5)};
  const float PY = ${pitchY.toFixed(5)};
  float H = ${H.toFixed(2)};
  float u = clamp(vSP.y / H, 0.0, 1.0);
  bool full = vSP.y > H - 1.6;
  float halfAng = full ? 3.14159 : (${t.coverageAft.toFixed(3)} + (${(t.coverageNose - t.coverageAft).toFixed(3)}) * u * u) * 3.14159;
  float th = atan(vSP.z, vSP.x);
  float d = th - (-1.5707963);
  d = mod(d + 3.14159265, 6.2831853) - 3.14159265;
  if (abs(d) > halfAng) discard;
  // hex lattice in (arc, meridian) space: nearest of the candidate rows
  float tt = vMer.x - 0.7;
  float r = vMer.y;
  float rowF = tt / PY;
  float bestD = 1e9; vec2 bestCell = vec2(0.0);
  for (int k = 0; k < 2; k++) {
    float row = floor(rowF) + float(k);
    float off = mod(row, 2.0) * 0.5;
    float n = max(1.0, floor(2.0 * halfAng * r / PX));
    float dA = 2.0 * halfAng / n;
    float colF = (d + halfAng) / dA - 0.5 - off;
    float col = floor(colF + 0.5);
    float dx = (colF - col) * dA * r;
    float dy = (rowF - row) * PY;
    float dd = dx * dx + dy * dy;
    if (dd < bestD) { bestD = dd; bestCell = vec2(col, row); }
  }
  float edge = sqrt(bestD);
  float missing = tileMissing(bestCell.x, bestCell.y) ? 1.0 : 0.0;
  vec3 gapFiller = vec3(0.30, 0.29, 0.27);
  vec3 tileCol = vec3(${t.albedo.toFixed(3)}) * (0.86 + 0.28 * hash12(bestCell + vec2(101.0, 7.0)));
  float inTile = 1.0 - smoothstep(${(t.flatToFlat * 0.46).toFixed(4)}, ${(t.flatToFlat * 0.52).toFixed(4)}, edge);
  vec3 far = mix(gapFiller * 0.8, tileCol, inTile);
  vec3 steel = vec3(0.6, 0.61, 0.63);
  vec3 c = mix(far, gapFiller, uNear);
  c = mix(c, steel, missing * inTile);
  diffuseColor.rgb = c;
}`)
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = 0.0;');
    };
    sm.customProgramCacheKey = () => 'tileshell-v1';
    this.shell = new THREE.Mesh(sg, sm);
    this.shell.receiveShadow = true;
    this.shell.layers.enable(layers);
    this.group.add(this.shell);
  }

  /** Switch between instanced tiles (near) and the baked shell (far). */
  setLod(distance: number): void {
    const near = distance < CONFIG.vehicle.tiles.maxInstances * 0 + this.lodDistance;
    this.tiles.visible = near;
    this.shellUniforms.uNear.value = near ? 1 : 0;
  }

  lodDistance = 120;

  dispose(): void {
    this.tiles.geometry.dispose();
    (this.tiles.material as THREE.Material).dispose();
    this.shell.geometry.dispose();
    (this.shell.material as THREE.Material).dispose();
  }
}

function tileWearRand(a: number, b: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
