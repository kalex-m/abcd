import type { Engine } from './engine';
import { Hud } from './ui/hud';
import { Governor } from './ui/presets';
import { DebugPanel } from './ui/debug';
import { FreeFly } from './camera/freefly';
import { AudioEngine } from './audio/engine';
import { GpuTimer } from './util/gpu-timer';
import { Terrain } from './site/terrain';
import { Gulf } from './water/gulf';

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
  for (let i = 0; i < steps.length; i++) {
    progress(i / steps.length, steps[i][0]);
    await nextFrame();
    await steps[i][1]();
  }
  const hud = new Hud(ui, engine);
  if (record) hud.setVisible(new URLSearchParams(location.search).get('hud') === '1');
  const audio = new AudioEngine(engine);
  const timer = new GpuTimer(engine.renderer.getContext() as WebGL2RenderingContext);
  const governor = new Governor(engine, timer, (s) => hud.toast(s));
  const debug = new DebugPanel(engine);
  const freeFly = new FreeFly(engine);
  return { hud, audio, governor, debug, freeFly };
}
