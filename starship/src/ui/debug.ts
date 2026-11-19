import GUI from 'lil-gui';
import Stats from 'stats-gl';
import { CONFIG } from '../config';
import type { Engine } from '../engine';

/** Debug panel (hidden by default; toggle ` or G) with live post / camera tunables and stats-gl. */
export class DebugPanel {
  private gui: GUI | null = null;
  private stats: Stats | null = null;

  constructor(private engine: Engine) {}

  toggle(): void {
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
      this.stats?.dom.remove();
      this.stats = null;
      return;
    }
    this.gui = new GUI({ title: 'Debug' });
    const e = this.engine;
    const f = e.composer.final.uniforms;
    const post = this.gui.addFolder('Post');
    post.add(f.uBloom, 'value', 0, 2, 0.01).name('bloom');
    post.add(f.uGrain, 'value', 0, 0.2, 0.005).name('grain');
    post.add(f.uVignette, 'value', 0, 1, 0.01).name('vignette');
    post.add(f.uHalation, 'value', 0, 0.5, 0.01).name('halation');
    post.add(f.uAgx, 'value', 0, 1, 1).name('AgX (1) / ACES (0)');
    post.add(CONFIG.lighting, 'exposureEVComp', -4, 4, 0.1).name('EV comp');
    const misc = this.gui.addFolder('Accessibility');
    misc.add(e, 'safeFlashes').name('safe flashes');
    misc.add(e, 'reduceMotion').name('reduce motion');
    misc.add(e, 'letterbox');
    const clk = this.gui.addFolder('Clock');
    clk.add(e.clock, 'speed', [0.1, 0.25, 0.5, 1, 2, 4]);
    clk.add(e.clock, 'cin', 0, e.clock.duration, 0.01).listen().name('cinematic t');
    this.stats = new Stats({ trackGPU: true, horizontal: true });
    this.stats.init(e.renderer);
    document.body.appendChild(this.stats.dom);
  }

  tick(): void {
    this.stats?.update();
  }
}
