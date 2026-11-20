import type { PresetName } from '../config';

/**
 * Start overlay (click to begin: needed for the audio unlock) with a quality preset selector, and the
 * loading screen (progress bar + thin mission-clock-like line).
 */
export class Overlay {
  readonly root: HTMLDivElement;
  private bar: HTMLDivElement | null = null;
  private label: HTMLDivElement | null = null;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed', inset: '0', background: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '28px', zIndex: '20', transition: 'opacity 0.8s',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', letterSpacing: '0.18em',
    } as CSSStyleDeclaration);
    parent.appendChild(this.root);
  }

  /** Show the start screen; resolves with the chosen preset on click. */
  waitForStart(defaultPreset: PresetName, webgpu: boolean): Promise<PresetName> {
    this.root.innerHTML = '';
    const title = document.createElement('div');
    title.textContent = 'CLICK TO BEGIN';
    Object.assign(title.style, { fontSize: '15px', opacity: '0.85', cursor: 'pointer', padding: '18px 32px', border: '1px solid rgba(255,255,255,0.35)' });
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '14px', fontSize: '11px', opacity: '0.7' });
    let chosen: PresetName = defaultPreset;
    const btns: HTMLSpanElement[] = [];
    for (const p of ['low', 'high', 'ultra'] as PresetName[]) {
      const b = document.createElement('span');
      b.textContent = p.toUpperCase();
      Object.assign(b.style, { cursor: 'pointer', padding: '4px 10px', borderBottom: '1px solid transparent' });
      b.onclick = (e) => { e.stopPropagation(); chosen = p; btns.forEach((x) => (x.style.borderBottomColor = 'transparent')); b.style.borderBottomColor = '#fff'; };
      if (p === defaultPreset) b.style.borderBottomColor = '#fff';
      btns.push(b);
      row.appendChild(b);
    }
    const note = document.createElement('div');
    note.textContent = `${webgpu ? 'WEBGPU DETECTED · ' : ''}WEBGL2 RENDERER · HEADPHONES RECOMMENDED`;
    Object.assign(note.style, { fontSize: '10px', opacity: '0.4' });
    this.root.append(title, row, note);
    return new Promise((resolve) => {
      title.onclick = () => resolve(chosen);
    });
  }

  showLoading(): void {
    this.root.innerHTML = '';
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { width: '320px', display: 'flex', flexDirection: 'column', gap: '10px' });
    this.label = document.createElement('div');
    Object.assign(this.label.style, { fontSize: '10px', opacity: '0.6' });
    const track = document.createElement('div');
    Object.assign(track.style, { height: '1px', background: 'rgba(255,255,255,0.15)', position: 'relative' });
    this.bar = document.createElement('div');
    Object.assign(this.bar.style, { position: 'absolute', left: '0', top: '0', height: '1px', width: '0%', background: '#fff', transition: 'width 0.2s' });
    track.appendChild(this.bar);
    wrap.append(this.label, track);
    this.root.appendChild(wrap);
  }

  progress(frac: number, text: string): void {
    if (this.bar) this.bar.style.width = `${Math.round(frac * 100)}%`;
    if (this.label) this.label.textContent = `T-${String(Math.max(0, Math.round((1 - frac) * 100))).padStart(2, '0')}  ${text.toUpperCase()}`;
  }

  hide(): void {
    this.root.style.opacity = '0';
    setTimeout(() => (this.root.style.display = 'none'), 900);
  }

  message(text: string): void {
    this.root.style.display = 'flex';
    this.root.style.opacity = '1';
    this.root.innerHTML = `<div style="font-size:12px;opacity:0.8;max-width:520px;text-align:center;line-height:1.8">${text}</div>`;
  }
}
