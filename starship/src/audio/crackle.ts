import { rngFor } from '../util/rng';
import { loopSource } from './synth-rumble';

/**
 * Roar / crackle layer: pink noise band-passed 150-2500 Hz with a 400-900 Hz body, amplitude-modulated
 * at audio rate by an irregular impulse train (80-200 events/s, exponentially decaying, waveshaped) so the
 * roar crackles like a real rocket. Distance raises the crackle ratio and adds a slow 0.3 Hz "rolling".
 */
export function crackleBuffer(ctx: BaseAudioContext, seconds = 6): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const r = rngFor('crackle');
  let t = 0;
  while (t < n) {
    const amp = Math.pow(r.next(), 2.2) * 1.6;
    const dec = sr * (0.0015 + 0.004 * r.next());
    const len = Math.floor(dec * 5);
    for (let i = 0; i < len && t + i < n; i++) d[t + i] += amp * Math.exp(-i / dec) * (i < 3 ? i / 3 : 1);
    t += Math.floor(sr / (80 + 120 * r.next()));
  }
  for (let i = 0; i < n; i++) d[i] = Math.tanh(d[i] * 1.4);
  return buf;
}

export interface RoarLayer { out: GainNode; level: GainNode; crackleDepth: GainNode; rolling: GainNode; sources: AudioScheduledSourceNode[] }

export function buildRoar(ctx: BaseAudioContext, pink: AudioBuffer, crackle: AudioBuffer): RoarLayer {
  const src = loopSource(ctx, pink, 2.7);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 150;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500;
  const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 620; body.Q.value = 0.8; body.gain.value = 7;
  const mod = ctx.createGain();
  mod.gain.value = 0.55; // base level, crackle adds on top at audio rate
  const crack = loopSource(ctx, crackle, 0.4);
  const crackleDepth = ctx.createGain();
  crackleDepth.gain.value = 0.6;
  crack.connect(crackleDepth).connect(mod.gain);
  const rolling = ctx.createGain();
  rolling.gain.value = 1;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.3;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0;
  lfo.connect(lfoDepth).connect(rolling.gain);
  lfo.start(0);
  const level = ctx.createGain();
  level.gain.value = 0;
  src.connect(hp).connect(lp).connect(body).connect(mod).connect(rolling).connect(level);
  const out = ctx.createGain();
  out.gain.value = 1.1;
  level.connect(out);
  (rolling as unknown as { lfoDepth: GainNode }).lfoDepth = lfoDepth;
  return { out, level, crackleDepth, rolling, sources: [src, crack, lfo] };
}
