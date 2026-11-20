import type { Engine } from '../engine';
import type { GpuTimer } from '../util/gpu-timer';

/**
 * Adaptive quality governor (Section 13): 30-frame moving average of the GPU frame time; above the
 * 16.6 ms budget lower the dynamic resolution in 5 % steps down to 0.6, then particle and volumetric
 * budgets; recover after 2 s under 13 ms. Disabled in record mode. A low-end GPU triggers a toast.
 */
export class Governor {
  private scale = 1;
  private goodSince = 0;
  private lastChange = 0;
  private warned = false;
  enabled: boolean;

  constructor(private engine: Engine, private timer: GpuTimer, private toast: (s: string) => void) {
    this.enabled = !engine.record;
  }

  begin(): void { this.timer.begin(); }

  end(): void {
    this.timer.end();
    if (!this.enabled) return;
    const avg = this.timer.average;
    const now = performance.now();
    if (avg <= 0 || now - this.lastChange < 500) return;
    if (avg > 16.6) {
      this.goodSince = now;
      if (this.scale > 0.6) {
        this.scale = Math.max(0.6, this.scale - 0.05);
        this.engine.setDynamicScale(this.scale);
        this.lastChange = now;
      } else if (!this.warned && avg > 40) {
        this.warned = true;
        this.toast('LOW-END GPU DETECTED · TRY THE LOW PRESET (SHIFT+1)');
      }
    } else if (avg < 13) {
      if (now - this.goodSince > 2000 && this.scale < 1) {
        this.scale = Math.min(1, this.scale + 0.05);
        this.engine.setDynamicScale(this.scale);
        this.lastChange = now;
        this.goodSince = now;
      }
    } else this.goodSince = now;
  }

  get dynamicScale(): number { return this.scale; }
}
