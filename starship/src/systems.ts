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
  steps.push(['terrain', () => engine.register(new Terrain(engine.world))]);
  steps.push(['gulf', () => engine.register(new Gulf(engine.world))]);
  steps.push(['launch mount', () => engine.register(new Pad(engine.world))]);
  steps.push(['tower', () => engine.register(new Tower(engine.world))]);
  steps.push(['tank farm', () => engine.register(new TankFarm(engine.world))]);
  steps.push(['site lights', () => engine.register(new SiteLights(engine.world, engine.fxScene))]);
  const useCache = !record;
  steps.push(['booster hull maps', async () => engine.register(await Booster.create(engine.renderer, engine.scene, engine.preset.hullTexSize, useCache))]);
  steps.push(['ship hull maps', async () => engine.register(await Ship.create(engine.renderer, engine.scene, engine.preset.hullTexSize, useCache, engine.preset.tileLodDistance))]);
  steps.push(['plumes', () => engine.register(new Plumes(engine.scene, engine.fxScene, engine.heatScene, engine.sky, engine.preset.plumeSteps))]);
  let noise: THREE.Texture | null = null;
  steps.push(['volume noise', () => { noise = generateNoise3D(engine.renderer, 64); }]);
  steps.push(['pyrocumulus', () => {
    const smoke = new SmokeVolume(engine.renderer, engine.camera, engine.sky, noise as THREE.Texture, engine.preset);
    engine.register(smoke);
    engine.hooks.smoke = smoke;
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
