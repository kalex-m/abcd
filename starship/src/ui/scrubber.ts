import type { Clock } from '../clock';
import type { Engine } from '../engine';

/** Bottom scrubber with shot and event ticks; hover shows the time, click/drag seeks. */
export class Scrubber {
  private readonly root: HTMLDivElement;
  private readonly fill: HTMLDivElement;
  private readonly tip: HTMLDivElement;
  private dragging = false;

  constructor(parent: HTMLElement, private engine: Engine) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, { position: 'absolute', left: '4vw', right: '4vw', bottom: '2.6vh', height: '14px', cursor: 'pointer', pointerEvents: 'auto' } as CSSStyleDeclaration);
    const line = document.createElement('div');
    Object.assign(line.style, { position: 'absolute', left: '0', right: '0', top: '7px', height: '1px', background: 'rgba(255,255,255,0.22)' });
    this.fill = document.createElement('div');
    Object.assign(this.fill.style, { position: 'absolute', left: '0', top: '7px', height: '1px', width: '0%', background: 'rgba(255,255,255,0.8)' });
    this.tip = document.createElement('div');
    Object.assign(this.tip.style, { position: 'absolute', bottom: '16px', fontSize: '10px', letterSpacing: '0.12em', opacity: '0', color: '#fff', fontFamily: 'ui-monospace, monospace', transform: 'translateX(-50%)', whiteSpace: 'nowrap' });
    this.root.append(line, this.fill, this.tip);
    const D = engine.shots.duration;
    engine.shots.defs.forEach((_, i) => {
      const t = document.createElement('div');
      Object.assign(t.style, { position: 'absolute', left: `${(engine.shots.startOf(i) / D) * 100}%`, top: '3px', width: '1px', height: '9px', background: 'rgba(255,255,255,0.4)' });
      this.root.appendChild(t);
    });
    for (const ev of engine.timeline.events) {
      if (!ev.label) continue;
      const cin = engine.shots.cinForMission(ev.t0);
      if (cin <= 0) continue;
      const t = document.createElement('div');
      Object.assign(t.style, { position: 'absolute', left: `${(cin / D) * 100}%`, top: '5px', width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,190,120,0.75)', transform: 'translateX(-1px)' });
      t.title = ev.label;
      this.root.appendChild(t);
    }
    const seek = (e: PointerEvent) => {
      const r = this.root.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      this.engine.freeFly = false;
      this.engine.cameraOverride = null;
      this.engine.clock.seek(f * D);
    };
    this.root.addEventListener('pointerdown', (e) => { this.dragging = true; this.root.setPointerCapture(e.pointerId); seek(e); });
    this.root.addEventListener('pointermove', (e) => {
      const r = this.root.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const cin = f * D;
      const s = engine.shots.at(cin);
      const m = s.mission;
      this.tip.textContent = `${fmt(cin)}  ·  T${m < 0 ? '-' : '+'}${Math.abs(m).toFixed(1)}s  ·  ${s.name.toUpperCase()}`;
      this.tip.style.left = `${f * 100}%`;
      this.tip.style.opacity = '0.85';
      if (this.dragging) seek(e);
    });
    this.root.addEventListener('pointerleave', () => (this.tip.style.opacity = '0'));
    this.root.addEventListener('pointerup', () => (this.dragging = false));
    parent.appendChild(this.root);
  }

  setVisible(v: boolean): void { this.root.style.display = v ? 'block' : 'none'; }

  update(clock: Clock): void {
    this.fill.style.width = `${(clock.cin / clock.duration) * 100}%`;
  }

  dispose(): void { this.root.remove(); }
}

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
