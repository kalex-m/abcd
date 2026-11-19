import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { generateHullMaps } from './procedural-tex';
import { createSteelMaterial, darkMetal, sootInterior, galvanised, type SteelUniforms } from './materials';
import { hullLathe, perforatedDisc } from './hull';
import { boosterLayout } from './engines-layout';
import { EngineCluster, raptorSLParts } from './raptor';
import { GridFins } from './gridfins';
import { HotStageRing } from './hotstage-ring';
import { createHexTileMaterial } from './flaps';
import { R } from './profile';
import { smoothstep, DEG } from '../util/math';

/**
 * Super Heavy: 71 m stainless booster. Hull cans with weld beads and procedural maps, aft skirt with a
 * boat-tail tile ring, engine bay (mount plate, perforated heat shield, flame-diverter dome) holding 33
 * instanced Raptors, cable trays, QD panel, interface-ring bolts, vent ports, catch pins, four grid fins
 * and the vented hot-stage ring. Frost, soot and heat glow are driven from the timeline each frame.
 */
export const BOOSTER_LAYER = 5;
export const ENGINE_MOUNT_Y = 2.4;

export class Booster implements System {
  readonly name = 'booster';
  readonly group = new THREE.Group();
  engines!: EngineCluster;
  enginesOuter!: EngineCluster;
  fins!: GridFins;
  ring!: HotStageRing;
  steel!: SteelUniforms;
  readonly ventPorts: THREE.Vector3[] = [];
  readonly slots = boosterLayout();
  /** vehicle-local height of the catch pins */
  readonly pinY: number;

  private constructor() {
    const v = CONFIG.vehicle;
    this.pinY = v.boosterHeight - v.hotStageHeight - v.gridFinBelowHotStage - v.catchPinBelowFins;
  }

  static async create(renderer: THREE.WebGLRenderer, scene: THREE.Scene, texSize: number, useCache: boolean): Promise<Booster> {
    const b = new Booster();
    await b.build(renderer, texSize, useCache);
    scene.add(b.group);
    return b;
  }

  private async build(renderer: THREE.WebGLRenderer, texSize: number, useCache: boolean): Promise<void> {
    const v = CONFIG.vehicle;
    const H = v.boosterHeight;
    const maps = await generateHullMaps(renderer, 'booster', [Math.PI * v.diameter, H], texSize, true, useCache);
    const { material: steel, uniforms } = createSteelMaterial(maps, true, H);
    this.steel = uniforms;
    const ringBase = H - v.hotStageHeight;
    const L = BOOSTER_LAYER;
    const add = (m: THREE.Object3D, shadow = true) => {
      m.traverse((o) => {
        o.layers.enable(L);
        if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).castShadow = shadow; (o as THREE.Mesh).receiveShadow = true; }
      });
      this.group.add(m);
    };
    // hull (weld beads on every can)
    const hull = new THREE.Mesh(hullLathe((y) => (y < 0.35 ? R + 0.05 : R), 0, ringBase, H, 160, ringBase), steel);
    add(hull);
    // launch-mount interface ring and the boat-tail tile ring
    add(new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.09, 8, 128).rotateX(Math.PI / 2).translate(0, 0.12, 0), darkMetal()));
    const tileBand = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 1.1, 128, 1, true).translate(0, 0.95, 0), createHexTileMaterial());
    add(tileBand);
    // engine bay: mount plate, perforated heat shield, flame-diverter dome
    const holes = this.slots.map((s) => ({ x: s.x, z: s.z, r: s.exitDiameter / 2 + 0.06 }));
    add(new THREE.Mesh(perforatedDisc(R - 0.02, holes.map((h) => ({ ...h, r: 0.36 })), ENGINE_MOUNT_Y + 0.05), darkMetal()));
    const shield = new THREE.Mesh(perforatedDisc(R - 0.02, holes, 0.65), sootInterior());
    add(shield);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI).translate(0, ENGINE_MOUNT_Y, 0), sootInterior()));
    add(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.03, ENGINE_MOUNT_Y - 0.6, 96, 1, true).translate(0, 0.6 + (ENGINE_MOUNT_Y - 0.6) / 2, 0), sootInterior()));
    // engines
    // centre + inner (gimballing, 1.3 m bells) and outer ring (fixed, 1.15 m bells)
    this.engines = new EngineCluster(this.slots.slice(0, 13), raptorSLParts(CONFIG.engines.bellExitDiameter), ENGINE_MOUNT_Y, L);
    this.enginesOuter = new EngineCluster(this.slots.slice(13), raptorSLParts(1.15), ENGINE_MOUNT_Y, L);
    add(this.engines.group);
    add(this.enginesOuter.group);
    // cable trays on opposite sides
    for (const a of [0, Math.PI]) {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.2, ringBase - 5.5, v.cableTrayWidth).translate(R + 0.1, 4.5 + (ringBase - 5.5) / 2, 0), steel);
      tray.rotation.y = a;
      add(tray);
    }
    // QD panel: recess with six stubs
    const qd = new THREE.Group();
    qd.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 1.8), darkMetal()));
    for (let i = 0; i < 6; i++) {
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 12).rotateZ(Math.PI / 2), galvanised());
      stub.position.set(0.1, -0.35 + (i % 2) * 0.7, -0.6 + Math.floor(i / 2) * 0.6);
      qd.add(stub);
    }
    qd.position.set(-(R + 0.02), v.qdPanelHeight, 0);
    add(qd);
    // interface bolts (skirt joint and below the hot-stage ring)
    const bolt = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6).rotateZ(Math.PI / 2);
    const bolts: THREE.BufferGeometry[] = [];
    for (const y of [v.aftSkirtHeight, ringBase - 0.15, 42.3]) {
      for (let i = 0; i < 180; i++) {
        const a = (i / 180) * Math.PI * 2;
        bolts.push(bolt.clone().rotateY(-a).translate(Math.cos(a) * (R + 0.015), y, Math.sin(a) * (R + 0.015)));
      }
    }
    add(new THREE.Mesh(mergeGeometries(bolts), galvanised()), false);
    // vent ports (LOX vents high on the booster, CH4 side vents)
    for (const [a, y] of [[0.4, ringBase - 1.2], [0.4 + Math.PI, ringBase - 1.2], [1.9, 44.5], [1.9 + Math.PI, 44.5]] as [number, number][]) {
      const port = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), sootInterior());
      port.position.set(Math.cos(a) * (R + 0.01), y, Math.sin(a) * (R + 0.01));
      port.lookAt(port.position.clone().multiplyScalar(2).setY(y));
      add(port, false);
      this.ventPorts.push(port.position.clone());
    }
    // catch pins: two reinforced lugs aligned with the chopstick arms at the catch
    const finalHeading = (CONFIG.physics.padHeadingDeg - CONFIG.physics.azimuthDeg + CONFIG.physics.rollDeg) * DEG;
    for (const sgn of [-1, 1]) {
      const pin = new THREE.Group();
      const lug = new THREE.Mesh(new THREE.BoxGeometry(v.catchPinLength, 0.55, 0.7).translate(v.catchPinLength / 2, 0, 0), darkMetal());
      const gus = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.2).translate(0.45, -0.5, 0), darkMetal());
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16).rotateX(Math.PI / 2).translate(v.catchPinLength - 0.25, -0.2, 0), galvanised());
      pin.add(lug, gus, roller);
      pin.position.y = this.pinY;
      // local direction that maps to world +-Z after the final heading rotation
      const ang = Math.atan2(sgn, 0) + finalHeading;
      pin.rotation.y = -ang;
      pin.position.x = Math.cos(ang) * R;
      pin.position.z = Math.sin(ang) * R;
      add(pin);
    }
    // grid fins and hot-stage ring
    this.fins = new GridFins(ringBase - v.gridFinBelowHotStage, R, L);
    add(this.fins.group);
    this.ring = new HotStageRing(ringBase, R, steel, L);
    add(this.ring.group);
    this.group.name = 'booster';
  }

  update(ctx: FrameContext): void {
    const s = ctx.booster;
    this.group.position.copy(s.position).sub(ctx.origin);
    this.group.quaternion.copy(s.quaternion);
    this.group.updateMatrixWorld();
    const t = ctx.mission;
    const vib = s.thrustMN > 1 ? 0.002 : 0;
    this.engines.update(s.engineLevel.subarray(0, 13), s.gimbalP, s.gimbalY, vib);
    this.enginesOuter.update(s.engineLevel.subarray(13), 0, 0, 0);
    this.fins.setDeploy(ctx.snap.finDeploy);
    this.fins.heat.value = s.reentry;
    const u = this.steel;
    u.uFrost.value = ctx.snap.frost;
    u.uSoot.value = 0.3 + 0.7 * smoothstep(-8, 25, t);
    u.uHeatGlow.value = ctx.snap.hotStageFire * 0.9 + ctx.snap.ringVent * 0.5;
    u.uTime.value = t;
    u.uWet.value = ctx.snap.deluge * 0.8 * (t < 3 ? 1 : 0);
  }

  dispose(): void {
    this.engines.dispose();
    this.enginesOuter.dispose();
    this.fins.dispose();
    this.ring.dispose();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
  }
}
