import * as THREE from 'three';
import { CONFIG } from '../config';
import type { FrameContext, System } from '../engine';
import { generateHullMaps } from './procedural-tex';
import { createSteelMaterial, darkMetal, sootInterior, galvanised, type SteelUniforms } from './materials';
import { hullLathe, perforatedDisc } from './hull';
import { shipLayout } from './engines-layout';
import { EngineCluster, raptorSLParts, rvacParts } from './raptor';
import { HeatShield } from './heatshield';
import { Flaps } from './flaps';
import { shipRadius, SHIP_CYL_TOP, R } from './profile';
import { smoothstep } from '../util/math';

/**
 * Ship (upper stage): 52 m hull with weld beads up to the header-tank shoulder, tangent-ogive nose with
 * cap, aft skirt and engine bay holding 3 sea-level Raptors and 3 RVacs (radiatively cooled skirts that
 * glow cherry-red after ~30 s in vacuum), windward hex heat shield, four flaps, header raceway and aft
 * vents. Transform follows the ship track; before separation it rides on the booster.
 */
export const SHIP_LAYER = 6;
export const SHIP_MOUNT_Y = 4.0;

export class Ship implements System {
  readonly name = 'ship';
  readonly group = new THREE.Group();
  sl!: EngineCluster;
  vac!: EngineCluster;
  shield!: HeatShield;
  flaps!: Flaps;
  steel!: SteelUniforms;
  readonly slots = shipLayout();

  static async create(renderer: THREE.WebGLRenderer, scene: THREE.Scene, texSize: number, useCache: boolean, tileLod: number): Promise<Ship> {
    const s = new Ship();
    await s.build(renderer, texSize, useCache, tileLod);
    scene.add(s.group);
    return s;
  }

  private async build(renderer: THREE.WebGLRenderer, texSize: number, useCache: boolean, tileLod: number): Promise<void> {
    const v = CONFIG.vehicle;
    const H = v.shipHeight;
    const maps = await generateHullMaps(renderer, 'ship', [Math.PI * v.diameter, H], texSize, false, useCache);
    const { material: steel, uniforms } = createSteelMaterial(maps, false, H);
    this.steel = uniforms;
    const L = SHIP_LAYER;
    const add = (m: THREE.Object3D, shadow = true) => {
      m.traverse((o) => {
        o.layers.enable(L);
        if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).castShadow = shadow; (o as THREE.Mesh).receiveShadow = true; }
      });
      this.group.add(m);
    };
    add(new THREE.Mesh(hullLathe(shipRadius, 0, H, H, 160, SHIP_CYL_TOP - 1.3), steel));
    // aft skirt bottom: engine bay
    const holes = this.slots.map((s) => ({ x: s.x, z: s.z, r: s.exitDiameter / 2 + 0.08 }));
    add(new THREE.Mesh(perforatedDisc(R - 0.02, holes, 0.25), sootInterior()));
    add(new THREE.Mesh(perforatedDisc(R - 0.02, holes.map((h) => ({ ...h, r: 0.4 })), SHIP_MOUNT_Y + 0.05), darkMetal()));
    add(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.03, SHIP_MOUNT_Y, 96, 1, true).translate(0, SHIP_MOUNT_Y / 2, 0), sootInterior()));
    this.sl = new EngineCluster(this.slots.slice(0, 3), raptorSLParts(CONFIG.engines.bellExitDiameter), SHIP_MOUNT_Y, L);
    this.vac = new EngineCluster(this.slots.slice(3), rvacParts(), SHIP_MOUNT_Y, L);
    add(this.sl.group);
    add(this.vac.group);
    // aft vents and COPV-like domes on the leeward aft skirt
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 2 + (i - 2.5) * 0.25;
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.7), sootInterior());
      vent.position.set(Math.cos(a) * (R + 0.02), 4.8, Math.sin(a) * (R + 0.02));
      vent.rotation.y = -a;
      add(vent, false);
    }
    // header-tank raceway on the leeward side
    const race = new THREE.Mesh(new THREE.BoxGeometry(0.16, SHIP_CYL_TOP - 5, 0.5).translate(0, 5 + (SHIP_CYL_TOP - 5) / 2, 0), steel);
    race.position.set(0, 0, R + 0.06);
    add(race);
    const bolt = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6).rotateZ(Math.PI / 2);
    const bolts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      bolts.push(bolt.clone().rotateY(-a).translate(Math.cos(a) * (R + 0.015), CONFIG.vehicle.shipAftSkirtHeight, Math.sin(a) * (R + 0.015)));
    }
    const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
    add(new THREE.Mesh(mergeGeometries(bolts), galvanised()), false);
    // heat shield and flaps
    this.shield = new HeatShield(L);
    this.shield.lodDistance = tileLod;
    add(this.shield.group, false);
    this.flaps = new Flaps(steel, L);
    add(this.flaps.group);
    this.group.name = 'ship';
  }

  update(ctx: FrameContext): void {
    const s = ctx.ship;
    this.group.position.copy(s.position).sub(ctx.origin);
    this.group.quaternion.copy(s.quaternion);
    this.group.updateMatrixWorld();
    const lv = s.engineLevel;
    this.sl.update(lv.subarray(0, 3), s.gimbalP, s.gimbalY, s.thrustMN > 1 ? 0.0015 : 0);
    this.vac.update(lv.subarray(3), 0, 0, 0);
    const t = ctx.mission;
    if (this.vac.rvacGlow) this.vac.rvacGlow.value = smoothstep(0, CONFIG.plume.vacGlowRamp, t - CONFIG.physics.hotStageT) * (lv[3] > 0.3 ? 1 : 0.4 * smoothstep(CONFIG.physics.hotStageT, CONFIG.physics.hotStageT + 60, t)) * smoothstep(0.5, 0.0, s.pAmb / 101325);
    const d = ctx.camera.position.distanceTo(this.group.position);
    this.shield.setLod(d);
    this.flaps.setDeploy(0);
    const u = this.steel;
    u.uFrost.value = ctx.snap.frost * (t < CONFIG.physics.sepT ? 1 : 0.3);
    u.uSoot.value = 0.15 + 0.6 * smoothstep(CONFIG.physics.hotStageT - 0.5, CONFIG.physics.hotStageT + 3, t);
    u.uHeatGlow.value = ctx.snap.hotStageFire * 0.6;
    u.uTime.value = t;
  }

  dispose(): void {
    this.sl.dispose();
    this.vac.dispose();
    this.shield.dispose();
    this.flaps.dispose();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
  }
}
