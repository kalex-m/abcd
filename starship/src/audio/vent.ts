import { loopSource } from './synth-rumble';

/** Venting hiss (3-9 kHz, thin and ghostly) and deluge water roar (1-6 kHz with droplet clicks). */
export interface SimpleLayer { out: GainNode; level: GainNode; sources: AudioScheduledSourceNode[] }

export function buildVent(ctx: BaseAudioContext, white: AudioBuffer): SimpleLayer {
  const src = loopSource(ctx, white, 3.3);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
  const level = ctx.createGain(); level.gain.value = 0;
  const out = ctx.createGain(); out.gain.value = 0.35;
  src.connect(hp).connect(lp).connect(level).connect(out);
  return { out, level, sources: [src] };
}

export function buildDeluge(ctx: BaseAudioContext, white: AudioBuffer, pink: AudioBuffer): SimpleLayer {
  const a = loopSource(ctx, white, 5.1);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.45;
  const b = loopSource(ctx, pink, 1.9);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  const level = ctx.createGain(); level.gain.value = 0;
  const out = ctx.createGain(); out.gain.value = 0.5;
  a.connect(bp).connect(level);
  const bg = ctx.createGain(); bg.gain.value = 0.8;
  b.connect(lp).connect(bg).connect(level);
  level.connect(out);
  return { out, level, sources: [a, b] };
}
