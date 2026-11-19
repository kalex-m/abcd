import type { FrameContext } from '../engine';
import type { Engine } from '../engine';

/** Web Audio engine (filled out in the audio phase). */
export class AudioEngine {
  muted = false;
  voice = true;
  constructor(readonly engine: Engine) {}
  start(): void {}
  suspend(): void {}
  update(_ctx: FrameContext, _playing: boolean): void {}
  toggleMute(): void { this.muted = !this.muted; }
  toggleVoice(): void { this.voice = !this.voice; }
  async renderOffline(_start: number, _end: number): Promise<string> { return ''; }
  dispose(): void {}
}
