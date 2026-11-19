import { rngFor } from '../util/rng';

/**
 * One-shot transients (all synthesised): N-wave sonic boom (double thump 90 ms apart, sharp rise and
 * linear fall, low-passed), engine-start chuffs, hold-down release crack, hot-staging boom with a high
 * crack and a debris-patter tail, metallic catch clank through a resonant filter bank (150 / 380 /
 * 760 Hz), and a procedural reverb impulse response (exponentially decaying noise, RT60 3.5 s).
 */
export function nWave(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * 0.6);
  const b = ctx.createBuffer(1, n, sr);
  const d = b.getChannelData(0);
  const L = Math.floor(sr * 0.09);
  for (const off of [0, Math.floor(sr * 0.09)]) {
    for (let i = 0; i < L; i++) {
      const x = i / L;
      d[off + i] += (1 - 2 * x) * (off === 0 ? 1 : 0.85);
    }
  }
  // soften (rise of a few samples) and add a decaying low rumble tail
  for (let i = n - 1; i > 0; i--) d[i] = d[i] * 0.7 + d[i - 1] * 0.3;
  const r = rngFor('boom');
  let lp = 0;
  for (let i = Math.floor(sr * 0.18); i < n; i++) {
    lp = lp * 0.995 + (r.next() * 2 - 1) * 0.005;
    d[i] += lp * 6 * Math.exp(-(i - sr * 0.18) / (sr * 0.12));
  }
  return b;
}

export function thump(ctx: BaseAudioContext, freq: number, decay: number, noise: number, seed: string): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * Math.max(0.3, decay * 6));
  const b = ctx.createBuffer(1, n, sr);
  const d = b.getChannelData(0);
  const r = rngFor(seed);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t / decay) * Math.min(1, t * 400);
    const f = freq * (1 + 0.6 * Math.exp(-t / 0.03));
    lp = lp * 0.6 + (r.next() * 2 - 1) * 0.4;
    d[i] = (Math.sin(2 * Math.PI * f * t) * (1 - noise) + lp * noise * Math.exp(-t / (decay * 0.3))) * env;
  }
  return b;
}

export function crack(ctx: BaseAudioContext, seed: string, len = 0.25): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * len);
  const b = ctx.createBuffer(1, n, sr);
  const d = b.getChannelData(0);
  const r = rngFor(seed);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    d[i] = (r.next() * 2 - 1) * Math.exp(-t / 0.025) * (i < 30 ? i / 30 : 1);
  }
  return b;
}

export function patter(ctx: BaseAudioContext, seed: string, seconds = 3): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * seconds);
  const b = ctx.createBuffer(1, n, sr);
  const d = b.getChannelData(0);
  const r = rngFor(seed);
  for (let k = 0; k < 220; k++) {
    const t0 = Math.floor(Math.pow(r.next(), 1.6) * (n - sr * 0.05));
    const a = 0.15 + 0.6 * r.next();
    const f = 900 + 3000 * r.next();
    for (let i = 0; i < sr * 0.03; i++) d[t0 + i] += a * Math.sin(2 * Math.PI * f * i / sr) * Math.exp(-i / (sr * 0.006));
  }
  return b;
}

export function reverbIR(ctx: BaseAudioContext, rt60: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * rt60 * 1.1);
  const b = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    const r = rngFor(`ir${ch}`);
    const k = Math.log(1000) / (rt60 * sr); // -60 dB at rt60
    for (let i = 0; i < n; i++) d[i] = (r.next() * 2 - 1) * Math.exp(-k * i) * (i < sr * 0.01 ? i / (sr * 0.01) : 1);
  }
  return b;
}

/** Resonant filter bank used for the metallic catch clank. */
export function clankBank(ctx: BaseAudioContext, input: AudioNode, out: AudioNode): void {
  for (const [f, q, g] of [[150, 18, 1], [380, 25, 0.7], [760, 30, 0.45], [1210, 35, 0.25]] as [number, number, number][]) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = q;
    const gg = ctx.createGain();
    gg.gain.value = g * 6;
    input.connect(bp).connect(gg).connect(out);
  }
}
