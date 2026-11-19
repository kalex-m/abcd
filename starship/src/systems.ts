import * as THREE from 'three';
import type { Engine } from './engine';
import { Hud } from './ui/hud';
import { Governor } from './ui/presets';
import { DebugPanel } from './ui/debug';
import { FreeFly } from './camera/freefly';
import { AudioEngine } from './audio/engine';
import { GpuTimer } from './util/gpu-timer';
import { Terrain } from './site/terrain';
import { Gulf } from './water/gulf';
import { Pad } from './site/pad';
import { Tower } from './site/tower';
import { TankFarm } from './site/tankfarm';
import { SiteLights } from './site/lights';
import { Vegetation } from './site/vegetation';
import { Booster } from './vehicle/booster';
import { Ship } from './vehicle/ship';
import { Plumes } from './vfx/plume';
import { SmokeVolume } from './vfx/volumetric-cloud';
import { generateNoise3D } from './vfx/noise3d';
import { Clouds } from './sky/clouds';
import { EarthLimb } from './sky/earth-limb';
import { ParticleSystem } from './vfx/particles';
import { delugeEmitters } from './vfx/deluge-water';
import { debrisEmitters } from './vfx/debris-dust';
import { sparkEmitters } from './vfx/sparks-embers';
import { ventEmitters } from './vfx/frost-vent';
import { contrailEmitter } from './vfx/contrail';
import { HotStageFire, coldGasEmitter } from './vfx/hotstage-fire';
import { VaporCone } from './vfx/vapor-cone';
import { Shockwave } from './vfx/shockwave';
import { Birds } from './vfx/birds';
import { CONFIG } from './config';

export interface BuiltSystems {
  hud: Hud;
  audio: AudioEngine;
  governor: Governor;
  debug: DebugPanel;
  freeFly: FreeFly;
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Build and register every system in update order. Heavy procedural generation is spread across frames
 * behind the loading bar.
 */
export async function buildSystems(engine: Engine, ui: HTMLElement, progress: (f: number, t: string) => void, record: boolean): Promise<BuiltSystems> {
  const steps: [string, () => void | Promise<void>][] = [];
  let booster: Booster | null = null;
  let tankfarm: TankFarm | null = null;
  steps.push(['terrain', () => engine.register(new Terrain(engine.world))]);
  steps.push(['gulf', () => engine.register(new Gulf(engine.world))]);
  steps.push(['launch mount', () => engine.register(new Pad(engine.world))]);
  steps.push(['tower', () => engine.register(new Tower(engine.world))]);
  steps.push(['tank farm', () => { tankfarm = new TankFarm(engine.world); engine.register(tankfarm); }]);
  steps.push(['site lights', () => engine.register(new SiteLights(engine.world, engine.fxScene))]);
  const useCache = !record;
  steps.push(['booster hull maps', async () => { booster = await Booster.create(engine.renderer, engine.scene, engine.preset.hullTexSize, useCache); engine.register(booster); }]);
  steps.push(['ship hull maps', async () => engine.register(await Ship.create(engine.renderer, engine.scene, engine.preset.hullTexSize, useCache, engine.preset.tileLodDistance))]);
  steps.push(['plumes', () => engine.register(new Plumes(engine.scene, engine.fxScene, engine.heatScene, engine.sky, engine.preset.plumeSteps))]);
  let noise: THREE.Texture | null = null;
  steps.push(['volume noise', () => { noise = generateNoise3D(engine.renderer, 64); }]);
  steps.push(['pyrocumulus', () => {
    const smoke = new SmokeVolume(engine.renderer, engine.camera, engine.sky, noise as THREE.Texture, engine.preset);
    engine.register(smoke);
    engine.hooks.smoke = smoke;
  }]);
  steps.push(['cumulus layer', () => {
    const clouds = new Clouds(engine.camera, engine.sky, noise as THREE.Texture, engine.preset.cloudSteps, engine.traj);
    engine.register(clouds);
    engine.hooks.clouds = clouds;
  }]);
  steps.push(['earth', () => {
    const flat = engine.world.children.filter((o) => o.name === 'terrain' || o.name === 'gulf');
    engine.register(new EarthLimb(engine.scene, flat));
  }]);
  steps.push(['particles', () => {
    const ps = new ParticleSystem(engine.fxScene, engine.traj);
    const B = engine.preset.particles;
    const b = booster as unknown as Booster;
    const heading = ((CONFIG.physics.padHeadingDeg - CONFIG.physics.azimuthDeg) * Math.PI) / 180;
    for (const d of delugeEmitters(B * 0.25)) ps.add(d);
    for (const d of debrisEmitters(B * 0.2, engine.traj.events.catchT)) ps.add(d);
    for (const d of sparkEmitters(B, engine.traj.events.catchT, CONFIG.site.tower.catchArmHeight)) ps.add(d);
    for (const d of ventEmitters(B, b.ventPorts, (tankfarm as unknown as TankFarm).ventPoints, heading)) ps.add(d);
    ps.add(contrailEmitter());
    ps.add(coldGasEmitter());
    engine.register(ps);
    engine.register(new HotStageFire(engine.fxScene, b.ring));
    engine.register(new VaporCone(engine.fxScene));
    engine.register(new Shockwave(engine.heatScene));
    engine.register(new Birds(engine.world));
  }]);
  steps.push(['vegetation', () => engine.register(new Vegetation(engine.world, { grass: engine.preset.grassBlades, shrubs: engine.preset.shrubs }))]);
  for (let i = 0; i < steps.length; i++) {
    progress(i / steps.length, steps[i][0]);
    await nextFrame();
    await steps[i][1]();
  }
  engine.setSize(engine.width, engine.height, engine.pixelRatio);
  const hud = new Hud(ui, engine);
  if (record) hud.setVisible(new URLSearchParams(location.search).get('hud') === '1');
  const audio = new AudioEngine(engine);
  const timer = new GpuTimer(engine.renderer.getContext() as WebGL2RenderingContext);
  const governor = new Governor(engine, timer, (s) => hud.toast(s));
  const debug = new DebugPanel(engine);
  const freeFly = new FreeFly(engine);
  return { hud, audio, governor, debug, freeFly };
}
