/**
 * Countdown: neutral synthesised speech via the Web Speech API when available (live mode, toggle V),
 * otherwise (and always offline) a minimal tone-beep per second from T-10.
 */
export class Countdown {
  private lastSpoken: number | null = null;
  constructor(public voice: boolean) {}

  /** Live speech for whole seconds (null when not counting). */
  speak(sec: number | null): void {
    if (!this.voice || sec === null || sec === this.lastSpoken) { if (sec === null) this.lastSpoken = null; return; }
    this.lastSpoken = sec;
    if (typeof speechSynthesis === 'undefined') return;
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const text = sec === 10 ? 'T minus ten' : sec === 9 ? 'nine... ignition sequence start' : words[sec] ?? String(sec);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 0.9;
    u.volume = 0.8;
    speechSynthesis.speak(u);
  }

  /** Schedule beeps at the given context times (one per second of the countdown). */
  static scheduleBeeps(ctx: BaseAudioContext, out: AudioNode, times: number[]): void {
    for (const [i, t] of times.entries()) {
      const o = ctx.createOscillator();
      o.frequency.value = i === times.length - 1 ? 1320 : 880;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.005);
      g.gain.setValueAtTime(0.12, t + 0.11);
      g.gain.linearRampToValueAtTime(0, t + 0.13);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.15);
    }
  }
}
