import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { beamMesh, cylinderBetween, type Beam } from './beams';
import { towerSteel, galvanised, rubberBlack, darkMetal, paintYellow } from '../vehicle/materials';
import { lerp, DEG } from '../util/math';
import { terrainHeight } from './terrain';

/**
 * Launch / catch tower: square lattice truss with K-bracing on three faces and carriage rails on the
 * pad face, decks with grating and railings every 18 m, ladder, elevator shaft, cable trays, aviation
 * beacons, crown and lightning rod. Chopstick carriage with two box-girder arms (pistons, cable runs,
 * padded catch rails) and the ship QD arm, all animated from the timeline. Three lightning masts with
 * guy cables. Three LOD levels for the lattice.
 */
export class Tower implements System {
  readonly name = 'tower';
  readonly group = new THREE.Group();
  private readonly carriage = new THREE.Group();
  private readonly arms: THREE.Group[] = [];
  private readonly qdArm = new THREE.Group();
  private readonly beaconMat: THREE.MeshStandardMaterial;
  private readonly strobeMat: THREE.MeshStandardMaterial;
  readonly beaconPositions: THREE.Vector3[] = [];
  readonly armPinY = { value: 0 };
  private readonly closedAngle: number;
  readonly base: THREE.Vector3;

  constructor(parent: THREE.Object3D) {
    const tw = CONFIG.site.tower;
    const G = -CONFIG.site.olmHeight;
    const [tx, , tz] = tw.offset;
    this.base = new THREE.Vector3(tx, G, tz);
    const W = tw.width / 2;
    const H = tw.height;
    const top = G + H;
    const steel = towerSteel();
    this.group.name = 'tower';
    parent.add(this.group);

    const c = (x: number, y: number, z: number) => new THREE.Vector3(tx + x, y, tz + z);
    const corners: [number, number][] = [[-W, -W], [W, -W], [W, W], [-W, W]];
    const main: Beam[] = [];
    const detail: Beam[] = [];
    // corner columns
    for (const [x, z] of corners) main.push({ a: c(x, G, z), b: c(x, top, z), w: 1.0 });
    // ring braces every 6 m, K-bracing on the three lattice faces, light cross-bracing
    for (let y = G; y < top - 0.1; y += tw.braceSpacing) {
      const y1 = Math.min(top, y + tw.braceSpacing);
      for (let f = 0; f < 4; f++) {
        const [ax, az] = corners[f];
        const [bx, bz] = corners[(f + 1) % 4];
        main.push({ a: c(ax, y1, az), b: c(bx, y1, bz), w: tw.beam, up: new THREE.Vector3(0, 1, 0) });
        const padFace = ax === W && bx === W; // +x face carries the rails
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        if (!padFace) {
          main.push({ a: c(ax, y, az), b: c(mx, y1, mz), w: tw.beam * 0.85 });
          main.push({ a: c(bx, y, bz), b: c(mx, y1, mz), w: tw.beam * 0.85 });
          detail.push({ a: c(ax, (y + y1) / 2, az), b: c(mx, (y + y1) / 2 + 0.01, mz), w: 0.18 });
          detail.push({ a: c(bx, (y + y1) / 2, bz), b: c(mx, (y + y1) / 2 + 0.01, mz), w: 0.18 });
        } else {
          detail.push({ a: c(ax, y, az), b: c(bx, y1, bz), w: 0.22 });
        }
      }
      // internal plan diagonals
      detail.push({ a: c(-W, y1 - 0.2, -W), b: c(W, y1 - 0.2, W), w: 0.2 });
    }
    // carriage rails on the pad face
    for (const z of [-3.2, 3.2]) main.push({ a: c(W + 0.55, G + 2, z), b: c(W + 0.55, top - 2, z), w: 0.6, d: 0.45 });
    // decks every 18 m: perimeter beams + railings + toe boards
    for (let y = G + tw.deckSpacing; y < top - 2; y += tw.deckSpacing) {
      for (let f = 0; f < 4; f++) {
        const [ax, az] = corners[f];
        const [bx, bz] = corners[(f + 1) % 4];
        const o = 1.6;
        const ox = (x: number) => x + Math.sign(x) * o, oz = (z: number) => z + Math.sign(z) * o;
        detail.push({ a: c(ox(ax), y, oz(az)), b: c(ox(bx), y, oz(bz)), w: 0.3, up: new THREE.Vector3(0, 1, 0) });
        detail.push({ a: c(ox(ax), y + 1.1, oz(az)), b: c(ox(bx), y + 1.1, oz(bz)), w: 0.05 });
        detail.push({ a: c(ox(ax), y + 0.55, oz(az)), b: c(ox(bx), y + 0.55, oz(bz)), w: 0.04 });
        for (let k = 0; k <= 8; k++) {
          const px = lerp(ox(ax), ox(bx), k / 8), pz = lerp(oz(az), oz(bz), k / 8);
          detail.push({ a: c(px, y, pz), b: c(px, y + 1.1, pz), w: 0.05 });
        }
      }
    }
    // ladder (west face) with rungs and cage hoops
    for (const dz of [-0.25, 0.25]) detail.push({ a: c(-W - 0.7, G, dz + 2), b: c(-W - 0.7, top, dz + 2), w: 0.06 });
    for (let y = G + 0.3; y < top; y += 0.3) detail.push({ a: c(-W - 0.7, y, 1.75), b: c(-W - 0.7, y + 0.001, 2.25), w: 0.03 });
    for (let y = G + 2.5; y < top; y += 1.2) {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI * (k / 6);
        pts.push(c(-W - 0.7 - Math.sin(a) * 0.75, y, 2 + Math.cos(a) * 0.4));
      }
      for (let k = 0; k < 6; k++) detail.push({ a: pts[k], b: pts[k + 1], w: 0.035 });
    }
    // elevator shaft frame (south face) + cable trays (north face)
    for (const [x, z] of [[-1.6, W + 0.4], [1.6, W + 0.4], [-1.6, W + 3.2], [1.6, W + 3.2]] as [number, number][]) detail.push({ a: c(x, G, z), b: c(x, top - 6, z), w: 0.22 });
    for (let y = G; y < top - 6; y += 3) {
      detail.push({ a: c(-1.6, y, W + 3.2), b: c(1.6, y, W + 3.2), w: 0.12, up: new THREE.Vector3(0, 1, 0) });
      detail.push({ a: c(-1.6, y, W + 0.4), b: c(-1.6, y, W + 3.2), w: 0.12, up: new THREE.Vector3(0, 1, 0) });
      detail.push({ a: c(1.6, y, W + 0.4), b: c(1.6, y, W + 3.2), w: 0.12, up: new THREE.Vector3(0, 1, 0) });
    }
    for (const x of [-2.5, -1.2]) detail.push({ a: c(x, G, -W - 0.5), b: c(x, top - 3, -W - 0.5), w: 0.55, d: 0.18 });

    const lod = new THREE.LOD();
    const l0 = new THREE.Group();
    const mMain = beamMesh(main, steel);
    const mDet = beamMesh(detail, steel);
    mMain.castShadow = mDet.castShadow = true;
    mMain.receiveShadow = mDet.receiveShadow = true;
    l0.add(mMain, mDet);
    const l1 = new THREE.Group();
    const m1 = beamMesh(main, steel);
    m1.castShadow = true;
    l1.add(m1);
    const l2 = new THREE.Group();
    const m2 = beamMesh(main.filter((_, i) => i < 4 || i % 3 === 0), steel);
    m2.castShadow = true;
    l2.add(m2);
    lod.addLevel(l0, 0);
    lod.addLevel(l1, 900);
    lod.addLevel(l2, 3500);
    lod.autoUpdate = true;
    this.group.add(lod);

    // deck gratings (alpha-tested grid)
    const grate = new THREE.MeshStandardMaterial({ color: 0x3a3c3e, metalness: 0.6, roughness: 0.55, alphaTest: 0.5, side: THREE.DoubleSide });
    grate.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGp = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGp;').replace('#include <alphatest_fragment>', `
{ vec2 f = abs(fract(vGp.xy / vec2(0.04, 0.12)) - 0.5); float bar = step(0.32, max(f.x, f.y)); diffuseColor.a = bar; }
#include <alphatest_fragment>`);
    };
    grate.customProgramCacheKey = () => 'grating';
    const decks: THREE.BufferGeometry[] = [];
    for (let y = G + tw.deckSpacing; y < top - 2; y += tw.deckSpacing) {
      decks.push(new THREE.PlaneGeometry(2 * W + 3.2, 2 * W + 3.2).rotateX(-Math.PI / 2).translate(tx, y, tz));
    }
    const deckMesh = new THREE.Mesh(mergeGeometries(decks), grate);
    deckMesh.castShadow = true;
    this.group.add(deckMesh);
    // elevator car + crown + lightning rod
    const car = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 2.6), galvanised());
    car.position.copy(c(0, G + 52, W + 1.8));
    car.castShadow = true;
    this.group.add(car);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(2 * W + 1, 2.2, 2 * W + 1), steel);
    crown.position.copy(c(0, top + 1.1, 0));
    crown.castShadow = true;
    this.group.add(crown, cylinderBetween(c(0, top + 2, 0), c(0, top + 14, 0), 0.12, galvanised()));

    // aviation beacons (red) and countdown strobes (white)
    this.beaconMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: new THREE.Color(1, 0.05, 0.02), emissiveIntensity: 0 });
    this.strobeMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 0 });
    const bulb = new THREE.SphereGeometry(0.35, 12, 8);
    const beaconGeo: THREE.BufferGeometry[] = [];
    const strobeGeo: THREE.BufferGeometry[] = [];
    for (let y = G + 36; y <= top + 2.5; y += 36) {
      for (const [x, z] of corners) {
        const p = c(x * 1.08, Math.min(y, top + 2.4), z * 1.08);
        beaconGeo.push(bulb.clone().translate(p.x, p.y, p.z));
        this.beaconPositions.push(p);
      }
    }
    for (const [x, z] of corners) {
      const p = c(x * 1.12, top + 2.6, z * 1.12);
      strobeGeo.push(bulb.clone().translate(p.x, p.y, p.z));
    }
    this.group.add(new THREE.Mesh(mergeGeometries(beaconGeo), this.beaconMat), new THREE.Mesh(mergeGeometries(strobeGeo), this.strobeMat));

    // --- chopstick carriage and arms
    this.group.add(this.carriage);
    this.carriage.position.copy(c(W + 1.2, 0, 0));
    const carr: Beam[] = [];
    for (const y of [-3, 3]) for (const x of [0, 2.5]) carr.push({ a: new THREE.Vector3(x, y, -5.5), b: new THREE.Vector3(x, y, 5.5), w: 0.8, up: new THREE.Vector3(0, 1, 0) });
    for (const z of [-5.5, 5.5]) for (const x of [0, 2.5]) carr.push({ a: new THREE.Vector3(x, -3, z), b: new THREE.Vector3(x, 3, z), w: 0.8 });
    for (const z of [-5.5, 0, 5.5]) carr.push({ a: new THREE.Vector3(0, -3, z), b: new THREE.Vector3(2.5, 3, z), w: 0.35 });
    const carrMesh = beamMesh(carr, steel);
    carrMesh.castShadow = true;
    this.carriage.add(carrMesh);
    // rollers on the rails
    const rollerG = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 16).rotateX(Math.PI / 2);
    for (const z of [-3.2, 3.2]) for (const y of [-2.6, 2.6]) {
      const r = new THREE.Mesh(rollerG, darkMetal());
      r.position.set(-0.6, y, z);
      this.carriage.add(r);
    }
    const L = tw.chopstickLength;
    // closed angle: arms pass through z = +-5.55 at the vehicle axis (x = 0 world)
    const pivotX = tx + W + 1.2 + 2.6;
    this.closedAngle = Math.atan2(5.55 - 4.0, -pivotX);
    for (const sgn of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(2.6, 0, sgn * 4.0);
      const truss: Beam[] = [];
      const depth = (u: number) => lerp(3.2, 1.6, u);
      const n = 12;
      for (let k = 0; k < n; k++) {
        const u0 = k / n, u1 = (k + 1) / n;
        const x0 = u0 * L, x1 = u1 * L;
        truss.push({ a: new THREE.Vector3(x0, depth(u0) / 2, 0), b: new THREE.Vector3(x1, depth(u1) / 2, 0), w: 0.9, d: 1.1, up: new THREE.Vector3(0, 0, 1) });
        truss.push({ a: new THREE.Vector3(x0, -depth(u0) / 2, 0), b: new THREE.Vector3(x1, -depth(u1) / 2, 0), w: 0.9, d: 1.1, up: new THREE.Vector3(0, 0, 1) });
        truss.push({ a: new THREE.Vector3(x0, -depth(u0) / 2, 0), b: new THREE.Vector3(x1, depth(u1) / 2, 0), w: 0.28 });
        truss.push({ a: new THREE.Vector3(x1, -depth(u1) / 2, 0), b: new THREE.Vector3(x1, depth(u1) / 2, 0), w: 0.32 });
      }
      const tm = beamMesh(truss, steel);
      tm.castShadow = true;
      arm.add(tm);
      // side plates (box girder look)
      const plateShape = new THREE.Shape([new THREE.Vector2(0, -1.6), new THREE.Vector2(L, -0.8), new THREE.Vector2(L, 0.8), new THREE.Vector2(0, 1.6)]);
      const plate = new THREE.Mesh(new THREE.ShapeGeometry(plateShape), new THREE.MeshStandardMaterial({ color: 0x1b1c1e, metalness: 0.6, roughness: 0.6, side: THREE.DoubleSide }));
      plate.position.z = sgn * -0.58;
      plate.castShadow = true;
      arm.add(plate);
      // padded catch rail on top of the inner edge (the booster's pins land here)
      const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.45, 0.9).translate(L - 18, 0, 0), paintYellow());
      rail.position.set(0, depth(0.5) / 2 + 0.45, sgn * -0.35);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 0.7).translate(L - 18, 0, 0), rubberBlack());
      pad.position.set(0, depth(0.5) / 2 + 0.78, sgn * -0.35);
      arm.add(rail, pad);
      // cable bundle along the top chord
      const cablePts: THREE.Vector3[] = [];
      for (let k = 0; k <= 10; k++) cablePts.push(new THREE.Vector3((k / 10) * L * 0.85, depth(k / 10) / 2 + 0.7 + 0.15 * Math.sin(k), sgn * 0.5));
      arm.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts), 40, 0.12, 6), rubberBlack()));
      // hydraulic piston from the carriage to the arm
      const piston = cylinderBetween(new THREE.Vector3(-2.4, 2.6, -sgn * 2.5), new THREE.Vector3(5.5, 1.2, 0), 0.22, galvanised());
      arm.add(piston);
      arm.userData.sgn = sgn;
      this.arms.push(arm);
      this.carriage.add(arm);
    }

    // --- ship QD arm
    this.qdArm.position.copy(c(W + 0.8, tw.shipQdHeight, -3.5));
    const qdLen = Math.abs(tx + W + 0.8) - 4.8;
    const qdBeams: Beam[] = [];
    for (const [y, z] of [[1.2, 0.8], [1.2, -0.8], [-1.2, 0.8], [-1.2, -0.8]] as [number, number][]) qdBeams.push({ a: new THREE.Vector3(0, y, z), b: new THREE.Vector3(qdLen, y * 0.7, z), w: 0.35 });
    for (let k = 0; k < 8; k++) {
      const x0 = (k / 8) * qdLen, x1 = ((k + 1) / 8) * qdLen;
      qdBeams.push({ a: new THREE.Vector3(x0, -1.2, 0.8), b: new THREE.Vector3(x1, 1.2, 0.8), w: 0.16 });
      qdBeams.push({ a: new THREE.Vector3(x0, -1.2, -0.8), b: new THREE.Vector3(x1, 1.2, -0.8), w: 0.16 });
    }
    const qm = beamMesh(qdBeams, steel);
    qm.castShadow = true;
    const plateQd = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 2.2), darkMetal());
    plateQd.position.set(qdLen + 0.6, 0, 0);
    this.qdArm.add(qm, plateQd);
    this.qdArm.rotation.y = Math.atan2(3.5, qdLen) * 0.0;
    this.group.add(this.qdArm);

    // --- lightning masts with guy cables
    const mastMat = galvanised();
    for (const [mx, mz] of CONFIG.site.lightningMasts) {
      const gy = G + terrainHeight(mx, mz);
      const h = CONFIG.site.lightningMastHeight;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.75, h, 10).translate(0, h / 2, 0), mastMat);
      m.position.set(mx, gy, mz);
      m.castShadow = true;
      this.group.add(m);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4;
        const anchor = new THREE.Vector3(mx + Math.cos(a) * 70, G + terrainHeight(mx + Math.cos(a) * 70, mz + Math.sin(a) * 70), mz + Math.sin(a) * 70);
        for (const hh of [0.55, 0.92]) {
          const topP = new THREE.Vector3(mx, gy + h * hh, mz);
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i <= 12; i++) {
            const u = i / 12;
            const p = topP.clone().lerp(anchor, u);
            p.y -= Math.sin(u * Math.PI) * 1.5;
            pts.push(p);
          }
          this.group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 4), mastMat));
        }
      }
    }
    void DEG;
  }

  update(ctx: FrameContext): void {
    const snap = ctx.snap;
    this.carriage.position.y = snap.carriageHeight - 2.5; // arm pads sit just below the catch-pin plane
    for (const arm of this.arms) {
      const s = arm.userData.sgn as number;
      const ang = this.closedAngle + snap.chopstickOpen * 26 * DEG;
      arm.rotation.y = -s * ang;
    }
    this.qdArm.rotation.y = snap.shipQdRetract * 72 * DEG;
    // beacons blink (0.7 Hz alternating), strobes during the countdown
    const b = Math.sin(ctx.cin * Math.PI * 2 * CONFIG.lighting.beaconHz) > 0 ? 1 : 0;
    this.beaconMat.emissiveIntensity = 60 * b;
    const st = snap.strobes * (Math.sin(ctx.cin * Math.PI * 2 * CONFIG.lighting.strobeHz) > 0.92 ? 1 : 0);
    this.strobeMat.emissiveIntensity = 900 * st;
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
      }
    });
  }
}
