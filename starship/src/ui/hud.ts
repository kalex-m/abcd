import { CONFIG } from '../config';
import type { FrameContext } from '../engine';
import type { Clock } from '../clock';
import { Scrubber } from './scrubber';
import { Captions } from './captions';
import type { Engine } from '../engine';

/**
 * Minimal telemetry HUD (toggle H): mission clock bottom-left in tabular figures, telemetry stack
 * bottom-right with eased numbers updated at 8 Hz, centred event ticker, scrubber, captions, toasts.
 */
interface Field { key: string; label: string; el: HTMLSpanElement; value: number; shown: number; fmt: (v: number) => string }

export class Hud {
  readonly root: HTMLDivElement;
  private readonly clockEl: HTMLDivElement;
  private readonly shotEl: HTMLDivElement;
  private readonly ticker: HTMLDivElement;
  private readonly toastEl: HTMLDivElement;
  private readonly stageEl: HTMLSpanElement;
  private readonly fields: Field[] = [];
  private visible = true;
  private lastUpdate = -1;
  private toastUntil = 0;
  readonly scrubber: Scrubber;
  readonly captions: Captions;

  constructor(parent: HTMLElement, engine: Engine) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, { position: 'absolute', inset: '0', pointerEvents: 'none', color: 'rgba(255,255,255,0.72)', textShadow: '0 1px 3px rgba(0,0,0,0.55)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontVariantNumeric: 'tabular-nums' } as CSSStyleDeclaration);
    parent.appendChild(this.root);
    this.clockEl = document.createElement('div');
    Object.assign(this.clockEl.style, { position: 'absolute', left: '4vw', bottom: '7vh', fontSize: 'clamp(22px, 3.2vw, 46px)', fontWeight: '300', letterSpacing: '0.06em', borderTop: '1px solid rgba(255,255,255,0.45)', paddingTop: '8px' });
    this.shotEl = document.createElement('div');
    Object.assign(this.shotEl.style, { position: 'absolute', left: '4vw', bottom: 'calc(7vh + clamp(46px, 5.6vw, 76px))', fontSize: '10px', letterSpacing: '0.2em', opacity: '0.6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' });
    const right = document.createElement('div');
    Object.assign(right.style, { position: 'absolute', right: '4vw', bottom: '7vh', display: 'grid', gridTemplateColumns: 'auto auto', columnGap: '18px', rowGap: '4px', fontSize: 'clamp(10px, 0.95vw, 13px)', borderTop: '1px solid rgba(255,255,255,0.45)', paddingTop: '8px', textAlign: 'right' });
    const add = (key: string, label: string, fmt: (v: number) => string) => {
      const l = document.createElement('span');
      l.textContent = label;
      Object.assign(l.style, { opacity: '0.55', letterSpacing: '0.16em', fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: '0.82em', textAlign: 'left' });
      const v = document.createElement('span');
      right.append(l, v);
      this.fields.push({ key, label, el: v, value: 0, shown: 0, fmt });
    };
    add('alt', 'ALTITUDE', (v) => `${(v / 1000).toFixed(v < 10000 ? 2 : 1)} KM`);
    add('kmh', 'VELOCITY', (v) => `${Math.round(v).toLocaleString('en-US')} KM/H`);
    add('ms', '', (v) => `${Math.round(v).toLocaleString('en-US')} M/S`);
    add('mach', 'MACH', (v) => v.toFixed(2));
    add('q', 'Q', (v) => `${(v / 1000).toFixed(1)} KPA`);
    add('g', 'ACCEL', (v) => `${v.toFixed(2)} G`);
    add('thrust', 'THRUST', (v) => `${v.toFixed(1)} MN`);
    add('prop', 'PROPELLANT', (v) => `${Math.round(v * 100)}%`);
    add('eng', 'ENGINES', (v) => `${Math.round(v)}`);
    const sl = document.createElement('span');
    sl.textContent = 'STAGE';
    Object.assign(sl.style, { opacity: '0.55', letterSpacing: '0.16em', fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: '0.82em', textAlign: 'left' });
    this.stageEl = document.createElement('span');
    right.append(sl, this.stageEl);
    this.ticker = document.createElement('div');
    Object.assign(this.ticker.style, { position: 'absolute', left: '0', right: '0', bottom: '15vh', textAlign: 'center', fontSize: 'clamp(12px, 1.3vw, 18px)', letterSpacing: '0.42em', fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: '300', opacity: '0' });
    this.toastEl = document.createElement('div');
    Object.assign(this.toastEl.style, { position: 'absolute', top: '4vh', right: '4vw', fontSize: '11px', letterSpacing: '0.2em', opacity: '0', transition: 'opacity 0.3s' });
    this.root.append(this.clockEl, this.shotEl, right, this.ticker, this.toastEl);
    this.scrubber = new Scrubber(parent, engine);
    this.captions = new Captions(parent);
  }

  toggle(): void { this.setVisible(!this.visible); }
  setVisible(v: boolean): void {
    this.visible = v;
    this.root.style.display = v ? 'block' : 'none';
    this.scrubber.setVisible(v);
  }
  toggleCaptions(): void { this.captions.toggle(); }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    this.toastUntil = performance.now() + 1600;
  }

  update(ctx: FrameContext, clock: Clock): void {
    if (performance.now() > this.toastUntil) this.toastEl.style.opacity = '0';
    this.scrubber.update(clock);
    this.captions.update(ctx);
    if (!this.visible) return;
    const t = ctx.mission;
    const sign = t < 0 ? '-' : '+';
    const a = Math.abs(t);
    const hh = Math.floor(a / 3600), mm = Math.floor((a % 3600) / 60), ss = Math.floor(a % 60);
    this.clockEl.textContent = `T${sign}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    this.shotEl.textContent = `${ctx.shot.id.padStart(2, '0')} · ${ctx.shot.name.toUpperCase()}`;
    if (ctx.snap.ticker) {
      this.ticker.textContent = ctx.snap.ticker.label;
      this.ticker.style.opacity = String(ctx.snap.ticker.alpha * 0.85);
    } else this.ticker.style.opacity = '0';
    // telemetry: follow the ship after separation unless the shot is about the booster
    const boosterShot = ['9', '11', '11B'].includes(ctx.shot.id);
    const v = t >= CONFIG.physics.sepT && !boosterShot ? ctx.ship : ctx.booster;
    this.stageEl.textContent = t < CONFIG.physics.sepT ? 'STACK' : v.kind === 'ship' ? 'SHIP' : 'BOOSTER';
    const now = ctx.cin;
    const updateDue = Math.abs(now - this.lastUpdate) >= 1 / CONFIG.hud.updateHz || ctx.cut;
    const vals: Record<string, number> = {
      alt: Math.max(0, v.alt), kmh: v.speed * 3.6, ms: v.speed, mach: v.mach, q: v.q, g: t < 0 ? 0 : v.accelG,
      thrust: v.thrustMN, prop: v.prop, eng: v.engines,
    };
    for (const f of this.fields) {
      if (updateDue) f.value = vals[f.key];
      f.shown += (f.value - f.shown) * (ctx.cut ? 1 : 0.25);
      f.el.textContent = f.fmt(f.shown);
    }
    if (updateDue) this.lastUpdate = now;
  }

  dispose(): void {
    this.root.remove();
    this.scrubber.dispose();
    this.captions.dispose();
  }
}
