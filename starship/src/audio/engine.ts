import type { FrameContext, Engine } from '../engine';
import { AudioGraph, audioStateAt } from './graph';
import { Countdown } from './countdown';
import { renderOfflineWav } from './offline-render';

/**
 * Live Web Audio engine. Unlocked on the first click (autoplay policy), suspended when the tab is
 * hidden, driven every frame from the cinematic clock. M mutes, V toggles the countdown voice.
 */
export class AudioEngine {
  muted = false;
  voice = true;
  private ctx: AudioContext | null = null;
  private graph: AudioGraph | null = null;
  private readonly countdown = new Countdown(true);
  private prevShot: string | null = null;

  constructor(readonly engine: Engine) {}

  start(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
      this.graph = new AudioGraph(this.ctx, this.engine, this.engine.shots.duration);
      void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  update(ctx: FrameContext, playing: boolean): void {
    if (!this.ctx || !this.graph) return;
    if (playing && this.ctx.state === 'suspended') void this.ctx.resume();
    if (!playing) { if (this.ctx.state === 'running') void this.ctx.suspend(); return; }
    const s = audioStateAt(this.engine, ctx.cin, this.prevShot);
    s.cut = s.cut || ctx.cut;
    this.prevShot = s.shotId;
    const speech = this.voice && typeof speechSynthesis !== 'undefined';
    this.graph.apply(s, this.ctx.currentTime, !speech);
    this.countdown.voice = speech;
    this.countdown.speak(ctx.snap.countdown);
    this.graph.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  toggleMute(): void { this.muted = !this.muted; }
  toggleVoice(): void { this.voice = !this.voice; }

  /** Render the soundtrack for [start, end] cinematic seconds offline; returns a base64 WAV. */
  async renderOffline(start: number, end: number): Promise<string> {
    return renderOfflineWav(this.engine, start, end);
  }

  dispose(): void {
    this.graph?.stop();
    void this.ctx?.close();
  }
}
