import { rngFor } from '../util/rng';
import { loopSource } from './synth-rumble';

/**
 * Ambience: gusting wind (low band-passed noise with slow gust LFO), distant surf (low-passed pink with a
 * wave-period swell), night insects (FM chirps at ~4.4 kHz gated by a pulse LFO; they fall silent at
 * T-8 when the countdown begins) and occasional gull calls (formant-filtered gliding saw bursts).
 */
export interface AmbienceLayer { out: GainNode; wind: GainNode; surf: GainNode; insects: GainNode; gulls: GainNode; sources: AudioScheduledSourceNode[] }

export function buildAmbience(ctx: BaseAudioContext, brown: AudioBuffer, pink: AudioBuffer, duration: number): AmbienceLayer {
  const out = ctx.createGain();
  out.gain.value = 1;
  const sources: AudioScheduledSourceNode[] = [];
  // wind
  const w = loopSource(ctx, brown, 4.4);
  const wbp = ctx.createBiquadFilter(); wbp.type = 'bandpass'; wbp.frequency.value = 320; wbp.Q.value = 0.6;
  const wind = ctx.createGain(); wind.gain.value = 0.25;
  const gust = ctx.createOscillator(); gust.frequency.value = 0.09;
  const gustG = ctx.createGain(); gustG.gain.value = 0.12;
  gust.connect(gustG).connect(wind.gain);
  w.connect(wbp).connect(wind).connect(out);
  sources.push(w, gust);
  // surf
  const s = loopSource(ctx, pink, 6.6);
  const slp = ctx.createBiquadFilter(); slp.type = 'lowpass'; slp.frequency.value = 500;
  const surf = ctx.createGain(); surf.gain.value = 0.12;
  const swell = ctx.createOscillator(); swell.frequency.value = 1 / 7.5;
  const swellG = ctx.createGain(); swellG.gain.value = 0.08;
  swell.connect(swellG).connect(surf.gain);
  s.connect(slp).connect(surf).connect(out);
  sources.push(s, swell);
  // insects
  const carrier = ctx.createOscillator(); carrier.frequency.value = 4400;
  const fm = ctx.createOscillator(); fm.frequency.value = 31;
  const fmG = ctx.createGain(); fmG.gain.value = 420;
  fm.connect(fmG).connect(carrier.frequency);
  const gate = ctx.createGain(); gate.gain.value = 0;
  const pulse = ctx.createOscillator(); pulse.type = 'square'; pulse.frequency.value = 2.3;
  const pulseG = ctx.createGain(); pulseG.gain.value = 0.5;
  pulse.connect(pulseG).connect(gate.gain);
  const insects = ctx.createGain(); insects.gain.value = 0;
  const ibp = ctx.createBiquadFilter(); ibp.type = 'bandpass'; ibp.frequency.value = 4400; ibp.Q.value = 3;
  carrier.connect(gate).connect(ibp).connect(insects).connect(out);
  sources.push(carrier, fm, pulse);
  // gulls: scheduled calls over the whole timeline (deterministic)
  const gulls = ctx.createGain(); gulls.gain.value = 0.0;
  gulls.connect(out);
  const r = rngFor('gulls');
  for (let t = 1.5; t < duration; t += 3 + r.next() * 7) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f0 = 1100 + r.next() * 500;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + 0.35);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 1800; f1.Q.value = 5;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.18, t + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(f1).connect(env).connect(gulls);
    o.start(t);
    o.stop(t + 0.45);
  }
  return { out, wind, surf, insects, gulls, sources };
}
