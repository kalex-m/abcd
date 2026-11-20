import type { FrameContext } from '../engine';

/** Accessibility captions for audio events (toggle C). Driven by the timeline's caption fields. */
export class Captions {
  private readonly el: HTMLDivElement;
  private enabled = false;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, { position: 'absolute', left: '0', right: '0', top: '6vh', textAlign: 'center', fontSize: '13px', color: '#fff', textShadow: '0 1px 3px #000', fontFamily: 'ui-sans-serif, system-ui, sans-serif', letterSpacing: '0.04em', pointerEvents: 'none' });
    parent.appendChild(this.el);
  }

  toggle(): void { this.enabled = !this.enabled; }

  update(ctx: FrameContext): void {
    if (!this.enabled) { this.el.textContent = ''; return; }
    const c = [...ctx.snap.captions];
    if (ctx.snap.countdown !== null) c.unshift(`"T minus ${ctx.snap.countdown}"`);
    this.el.textContent = c.join('   ');
  }

  dispose(): void { this.el.remove(); }
}
