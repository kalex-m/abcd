import { rngFor } from '../util/rng';

/**
 * Procedural noise buffers (deterministic) and the sub-rumble layer: brown noise through a 2nd-order
 * 60 Hz low-pass plus 28 / 41 / 55 Hz partials with slow FM, a mild waveshaping saturator, and a level
 * that follows thrust with a 1.5 s lag (applied by the graph via setTargetAtTime).
 */
export type NoiseColor = 'white' | 'pink' | 'brown';

export function noiseBuffer(ctx: BaseAudioContext, color: NoiseColor, seconds = 8): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const r = rngFor(`noise-${color}-${ch}`);
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const w = r.next() * 2 - 1;
      if (color === 'white') d[i] = w * 0.5;
      else if (color === 'pink') {
        // Paul Kellet's refined pink filter
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    // crossfade the loop seam
    const xf = Math.floor(sr * 0.05);
    for (let i = 0; i < xf; i++) {
      const a = i / xf;
      d[i] = d[i] * a + d[n - xf + i] * (1 - a);
    }
  }
  return buf;
}

export function loopSource(ctx: BaseAudioContext, buf: AudioBuffer, offset = 0): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.start(0, offset % buf.duration);
  return s;
}

/** Soft-clip curve for the rumble saturator. */
export function saturatorCurve(amount = 2.5, n = 2048): Float32Array<ArrayBuffer> {
  const c = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return c;
}

export interface RumbleLayer { out: GainNode; level: GainNode; sources: AudioScheduledSourceNode[] }

export function buildRumble(ctx: BaseAudioContext, brown: AudioBuffer): RumbleLayer {
  const level = ctx.createGain();
  level.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 60;
  lp.Q.value = 0.7;
  const lp2 = ctx.createBiquadFilter();
  lp2.type = 'lowpass';
  lp2.frequency.value = 75;
  const src = loopSource(ctx, brown, 1.3);
  const nGain = ctx.createGain();
  nGain.gain.value = 3.2;
  src.connect(lp).connect(lp2).connect(nGain).connect(level);
  const sources: AudioScheduledSourceNode[] = [src];
  for (const [f, a] of [[28, 0.35], [41, 0.25], [55, 0.18]] as [number, number][]) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13 + f * 0.003;
    const lfoG = ctx.createGain();
    lfoG.gain.value = f * 0.04;
    lfo.connect(lfoG).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.value = a;
    o.connect(g).connect(level);
    o.start(0);
    lfo.start(0);
    sources.push(o, lfo);
  }
  const sat = ctx.createWaveShaper();
  sat.curve = saturatorCurve(2.2);
  const out = ctx.createGain();
  out.gain.value = 0.9;
  level.connect(sat).connect(out);
  return { out, level, sources };
}
