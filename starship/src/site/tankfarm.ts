import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { beamMesh, cylinderBetween, placed, type Beam } from './beams';
import { whiteInsulation, galvanised, frostWhite, concrete, towerSteel, paintRed, darkMetal } from '../vehicle/materials';
import { terrainHeight } from './terrain';
import { rngFor } from '../util/rng';

/**
 * Tank farm and ground support equipment: vacuum-jacketed vertical LOX/CH4 tanks with ring stiffeners
 * and ladders, two spherical tanks on columns, frosted LOX transfer lines, pumps, small buildings, a
 * lattice crawler crane, plus distant scale cues: an assembly high-bay silhouette, a second pad tower,
 * a highway with moving vehicle lights, catenary power lines and a faint town glow on the horizon.
 */
export class TankFarm implements System {
  readonly name = 'tankfarm';
  readonly group = new THREE.Group();
  private readonly carLights: THREE.InstancedMesh;
  private readonly carLightMat: THREE.MeshBasicMaterial;
  readonly ventPoints: THREE.Vector3[] = [];

  constructor(parent: THREE.Object3D) {
    const G = -CONFIG.site.olmHeight;
    const [cx, , cz] = CONFIG.site.tankFarmCenter;
    parent.add(this.group);
    const rng = rngFor('tankfarm');
    const ins = whiteInsulation();
    const tanks: THREE.BufferGeometry[] = [];
    const rings: THREE.BufferGeometry[] = [];
    const tankG = mergeGeometries([
      new THREE.CylinderGeometry(6, 6, 30, 48, 1, true).translate(0, 15, 0),
      new THREE.SphereGeometry(6, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1).translate(0, 30, 0),
    ]);
    const ringG = new THREE.TorusGeometry(6.08, 0.09, 6, 48).rotateX(Math.PI / 2);
    const tankPos: [number, number][] = [[-22, -14], [-6, -14], [10, -14], [26, -14]];
    for (const [x, z] of tankPos) {
      tanks.push(placed(tankG, new THREE.Vector3(cx + x, G, cz + z)));
      for (let y = 3; y < 30; y += 3.6) rings.push(placed(ringG, new THREE.Vector3(cx + x, G + y, cz + z)));
      this.ventPoints.push(new THREE.Vector3(cx + x, G + 33, cz + z));
    }
    const tankMesh = new THREE.Mesh(mergeGeometries(tanks), ins);
    tankMesh.castShadow = tankMesh.receiveShadow = true;
    this.group.add(tankMesh, new THREE.Mesh(mergeGeometries(rings), galvanised()));
    // spheres on columns
    const sphG = new THREE.SphereGeometry(10, 48, 24);
    const sph: THREE.BufferGeometry[] = [];
    const cols: Beam[] = [];
    for (const [x, z] of [[-14, 22], [16, 22]] as [number, number][]) {
      sph.push(placed(sphG, new THREE.Vector3(cx + x, G + 13, cz + z)));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        cols.push({ a: new THREE.Vector3(cx + x + Math.cos(a) * 8.2, G, cz + z + Math.sin(a) * 8.2), b: new THREE.Vector3(cx + x + Math.cos(a) * 8.6, G + 13, cz + z + Math.sin(a) * 8.6), w: 0.6 });
      }
      this.ventPoints.push(new THREE.Vector3(cx + x, G + 24, cz + z));
    }
    const sm = new THREE.Mesh(mergeGeometries(sph), ins);
    sm.castShadow = sm.receiveShadow = true;
    const cm = beamMesh(cols, galvanised());
    cm.castShadow = true;
    this.group.add(sm, cm);
    // frosted transfer lines, pumps, small buildings
    const frost = frostWhite();
    for (const [x, z] of tankPos) this.group.add(cylinderBetween(new THREE.Vector3(cx + x, G + 1.2, cz + z + 6), new THREE.Vector3(cx + x, G + 1.2, cz + 2), 0.35, frost));
    this.group.add(cylinderBetween(new THREE.Vector3(cx - 26, G + 1.2, cz + 2), new THREE.Vector3(cx + 50, G + 1.2, cz + 2), 0.5, frost));
    const box = new THREE.BoxGeometry(1, 1, 1);
    const buildings: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const w = rng.range(4, 14), d = rng.range(4, 10), h = rng.range(3, 7);
      const x = cx + rng.range(-60, 60), z = cz + rng.range(35, 70);
      buildings.push(box.clone().scale(w, h, d).translate(x, G + h / 2 + terrainHeight(x, z), z));
    }
    const bm = new THREE.Mesh(mergeGeometries(buildings), concrete());
    bm.castShadow = bm.receiveShadow = true;
    this.group.add(bm);
    const pumps: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) pumps.push(new THREE.BoxGeometry(2.2, 1.6, 1.4).translate(cx - 30 + i * 5.5, G + 0.8, cz + 8));
    this.group.add(new THREE.Mesh(mergeGeometries(pumps), paintRed()));
    // crawler crane (lattice boom)
    const boom: Beam[] = [];
    const base = new THREE.Vector3(cx + 70, G, cz - 40);
    const tip = base.clone().add(new THREE.Vector3(-30, 78, 18));
    for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]] as [number, number][]) boom.push({ a: base.clone().add(new THREE.Vector3(ox, 3, oz)), b: tip.clone().add(new THREE.Vector3(ox * 0.4, 0, oz * 0.4)), w: 0.2 });
    for (let k = 0; k < 26; k++) {
      const p0 = base.clone().lerp(tip, k / 26).add(new THREE.Vector3(-0.8, 3, -0.8));
      const p1 = base.clone().lerp(tip, (k + 1) / 26).add(new THREE.Vector3(0.8, 3, 0.8));
      boom.push({ a: p0, b: p1, w: 0.08 });
    }
    const crane = beamMesh(boom, new THREE.MeshStandardMaterial({ color: 0x9a7a10, metalness: 0.4, roughness: 0.5 }));
    crane.castShadow = true;
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 6), darkMetal());
    body.position.copy(base).add(new THREE.Vector3(0, 2.5, 0));
    this.group.add(crane, body, cylinderBetween(tip, tip.clone().setY(G + 25), 0.04, galvanised()));

    // --- distant scale cues
    const far = new THREE.Group();
    const hb = new THREE.Mesh(new THREE.BoxGeometry(70, 110, 45).translate(0, 55, 0), new THREE.MeshStandardMaterial({ color: 0x8c8f92, metalness: 0.6, roughness: 0.4 }));
    hb.position.set(-2600, G, -900);
    hb.castShadow = true;
    const hb2 = new THREE.Mesh(new THREE.BoxGeometry(60, 80, 140).translate(0, 40, 0), new THREE.MeshStandardMaterial({ color: 0x6c7074, metalness: 0.5, roughness: 0.5 }));
    hb2.position.set(-2750, G, -700);
    far.add(hb, hb2);
    // second pad tower (no vehicle)
    const t2: Beam[] = [];
    const p2 = new THREE.Vector3(-380, G, -420);
    for (const [x, z] of [[-5, -5], [5, -5], [5, 5], [-5, 5]] as [number, number][]) t2.push({ a: p2.clone().add(new THREE.Vector3(x, 0, z)), b: p2.clone().add(new THREE.Vector3(x, 146, z)), w: 1 });
    for (let y = 0; y < 146; y += 6) {
      t2.push({ a: p2.clone().add(new THREE.Vector3(-5, y, -5)), b: p2.clone().add(new THREE.Vector3(5, y + 6, -5)), w: 0.4 });
      t2.push({ a: p2.clone().add(new THREE.Vector3(-5, y, 5)), b: p2.clone().add(new THREE.Vector3(5, y + 6, 5)), w: 0.4 });
      t2.push({ a: p2.clone().add(new THREE.Vector3(-5, y + 6, -5)), b: p2.clone().add(new THREE.Vector3(-5, y, 5)), w: 0.4 });
      t2.push({ a: p2.clone().add(new THREE.Vector3(5, y + 6, -5)), b: p2.clone().add(new THREE.Vector3(5, y, 5)), w: 0.4 });
    }
    const t2m = beamMesh(t2, towerSteel());
    t2m.castShadow = true;
    far.add(t2m);
    const olm2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 2.4, 32).translate(0, 18.8, 0), towerSteel());
    olm2.position.copy(p2).add(new THREE.Vector3(27, 0, 2));
    far.add(olm2);
    // highway (Hwy 4) towards the west with power-line poles and catenary wires
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1d, roughness: 0.85 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9).rotateX(-Math.PI / 2), roadMat);
    road.position.set(-4700, G + 0.25, 260);
    road.receiveShadow = true;
    far.add(road);
    const poles: Beam[] = [];
    const wires: THREE.BufferGeometry[] = [];
    let prev: THREE.Vector3 | null = null;
    for (let x = -300; x > -8000; x -= 75) {
      const z = 275;
      const by = G + terrainHeight(x, z);
      poles.push({ a: new THREE.Vector3(x, by, z), b: new THREE.Vector3(x, by + 13, z), w: 0.32 });
      poles.push({ a: new THREE.Vector3(x, by + 12, z - 1.8), b: new THREE.Vector3(x, by + 12, z + 1.8), w: 0.18, up: new THREE.Vector3(0, 1, 0) });
      const topP = new THREE.Vector3(x, by + 12.2, z);
      if (prev) {
        for (const dz of [-1.6, 0, 1.6]) {
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i <= 8; i++) {
            const u = i / 8;
            const p = prev.clone().lerp(topP, u).add(new THREE.Vector3(0, 0, dz));
            p.y -= Math.sin(u * Math.PI) * 1.2;
            pts.push(p);
          }
          wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.025, 3));
        }
      }
      prev = topP;
    }
    far.add(beamMesh(poles, new THREE.MeshStandardMaterial({ color: 0x3a2e22, roughness: 0.9 })));
    far.add(new THREE.Mesh(mergeGeometries(wires), darkMetal()));
    // moving car lights on the road (headlights / tail lights), animated per frame
    this.carLightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(40, 30, 18), toneMapped: false });
    this.carLights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 6, 4), this.carLightMat, 24);
    far.add(this.carLights);
    // town glow on the western horizon (Brownsville / Port Isabel direction)
    const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.55, 0.25), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(9000, 600, 9000), glowMat);
    glow.position.set(-24000, G, -2000);
    glow.name = 'townGlow';
    far.add(glow);
    this.group.add(far);
    this.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).receiveShadow = true; });
  }

  update(ctx: FrameContext): void {
    const m = new THREE.Matrix4();
    const G = -CONFIG.site.olmHeight;
    for (let i = 0; i < 24; i++) {
      const lane = i % 2 === 0 ? 1 : -1;
      const speed = 22 + (i % 5) * 2;
      const span = 8500;
      const x = -300 - ((((ctx.mission + 1000) * speed + i * 977) % span) + span) % span * (lane > 0 ? 1 : 1);
      const xx = lane > 0 ? x : -300 - span - x - 300;
      m.makeTranslation(xx, G + 1.0, 260 + lane * 2);
      this.carLights.setMatrixAt(i, m);
    }
    this.carLights.instanceMatrix.needsUpdate = true;
    const dark = Math.max(0, Math.min(1, (2 - ctx.sunElevationDeg) / 6));
    this.carLightMat.visible = dark > 0.05;
    const glow = this.group.getObjectByName('townGlow') as THREE.Mesh;
    (glow.material as THREE.MeshBasicMaterial).opacity = 0.012 * dark;
  }

  dispose(): void {
    this.group.traverse((o) => {
      const mm = o as THREE.Mesh;
      if (mm.isMesh) {
        mm.geometry.dispose();
        (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((x) => x.dispose());
      }
    });
  }
}
