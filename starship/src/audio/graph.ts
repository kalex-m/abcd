import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Engine } from '../engine';
import { planarToWorld } from '../vehicle/state';
import { boosterAscentWindows } from '../physics/engine-schedule';
import { noiseBuffer, buildRumble, loopSource, type RumbleLayer } from './synth-rumble';
import { crackleBuffer, buildRoar, type RoarLayer } from './crackle';
import { buildVent, buildDeluge, type SimpleLayer } from './vent';
import { buildAmbience, type AmbienceLayer } from './wind';
import { nWave, thump, crack, patter, reverbIR, clankBank } from './sonic-boom';
import { Countdown } from './countdown';

/**
 * The complete procedural mix, buildable on any BaseAudioContext (live AudioContext or
 * OfflineAudioContext) so the recorded soundtrack matches what plays live. Two spatial groups (the pad
 * and the vehicle) each run through a propagation chain: two cross-faded delay lines (d / 343 s,
 * stretched by the time warp), air-absorption low-pass (18 kHz * e^(-d/1500)), distance gain
 * (1 / (1 + d/50), perceptually compressed). Master: shot mix -> bus compressor (-18 dB, 3:1, 8/180 ms)
 * -> limiter (-1 dBTP) -> destination.
 */
export interface AudioState {
  cin: number;
  mission: number;
  warp: number; // d mission / d cinematic
  shotId: string;
  cut: boolean;
  dPad: number; // m camera -> pad
  dVeh: number; // m camera -> loudest stage
  thrust: number; // normalised 0..1 (loudest stage)
  landing: number; // 0..1 landing/entry/boostback burn (turbopump whine)
  deluge: number;
  vent: number;
  insects: number;
  camAlt: number; // m
  countdown: number | null;
}

interface OneShot { t: number; kind: 'chuff' | 'crack' | 'boom' | 'staging' | 'clank' | 'beep' | 'qd' | 'creak' | 'coldgas'; group: 'pad' | 'veh' | 'local'; gain: number }

interface Group { input: GainNode; delays: [DelayNode, DelayNode]; xf: [GainNode, GainNode]; active: number; lp: BiquadFilterNode; dist: GainNode }

const SHOT_MIX: Record<string, { gain: number; lp: number; rumble: number }> = {
  '1': { gain: 0.9, lp: 18000, rumble: 1 }, '2': { gain: 1, lp: 18000, rumble: 1 }, '3': { gain: 1.1, lp: 18000, rumble: 2 },
  '4': { gain: 1, lp: 18000, rumble: 1.3 }, '5': { gain: 1.2, lp: 18000, rumble: 1.6 }, '6': { gain: 0.95, lp: 16000, rumble: 1 },
  '7': { gain: 0.95, lp: 14000, rumble: 1.2 }, '8': { gain: 0.85, lp: 9000, rumble: 0.8 }, '9': { gain: 0.8, lp: 7000, rumble: 0.7 },
  '10': { gain: 0.3, lp: 200, rumble: 0.5 }, '11': { gain: 1, lp: 18000, rumble: 1.3 }, '11B': { gain: 1.1, lp: 18000, rumble: 1.2 },
};

export class AudioGraph {
  readonly master: GainNode;
  private readonly shotLp: BiquadFilterNode;
  private readonly shotGain: GainNode;
  private readonly pad: Group;
  private readonly veh: Group;
  private readonly rumble: RumbleLayer;
  private readonly roar: RoarLayer;
  private readonly vent: SimpleLayer;
  private readonly deluge: SimpleLayer;
  private readonly amb: AmbienceLayer;
  private readonly whine: GainNode;
  private readonly whineOsc: OscillatorNode;
  private readonly reverbSend: GainNode;
  private readonly buffers: Record<string, AudioBuffer> = {};
  readonly events: OneShot[] = [];
  private lastMission = -1e9;
  private readonly sources: AudioScheduledSourceNode[] = [];

  constructor(readonly ctx: BaseAudioContext, engine: Engine, duration: number) {
    const A = CONFIG.audio;
    const white = noiseBuffer(ctx, 'white');
    const pink = noiseBuffer(ctx, 'pink');
    const brown = noiseBuffer(ctx, 'brown');
    // master chain
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = A.compressor.threshold;
    comp.ratio.value = A.compressor.ratio;
    comp.attack.value = A.compressor.attack;
    comp.release.value = A.compressor.release;
    comp.knee.value = 6;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = A.limiterCeiling;
    lim.ratio.value = 20;
    lim.attack.value = 0.001;
    lim.release.value = 0.08;
    lim.knee.value = 0;
    this.master = ctx.createGain();
    this.master.gain.value = A.masterGain;
    this.shotLp = ctx.createBiquadFilter();
    this.shotLp.type = 'lowpass';
    this.shotLp.frequency.value = 18000;
    this.shotGain = ctx.createGain();
    const mix = ctx.createGain();
    mix.connect(this.shotLp).connect(this.shotGain).connect(comp).connect(lim).connect(this.master).connect(ctx.destination);
    // propagation groups
    this.pad = this.group(mix);
    this.veh = this.group(mix);
    // reverb (big open space)
    const conv = ctx.createConvolver();
    conv.buffer = reverbIR(ctx, A.reverbRT60);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.35;
    this.reverbSend.connect(conv);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.5;
    conv.connect(revOut).connect(mix);
    this.pad.dist.connect(this.reverbSend);
    // layers
    this.rumble = buildRumble(ctx, brown);
    this.roar = buildRoar(ctx, pink, crackleBuffer(ctx));
    this.rumble.out.connect(this.veh.input);
    this.roar.out.connect(this.veh.input);
    this.vent = buildVent(ctx, white);
    this.deluge = buildDeluge(ctx, white, pink);
    this.vent.out.connect(this.pad.input);
    this.deluge.out.connect(this.pad.input);
    this.amb = buildAmbience(ctx, brown, pink, duration + 5);
    this.amb.out.connect(mix);
    // turbopump whine (landing / entry burns)
    this.whineOsc = ctx.createOscillator();
    this.whineOsc.type = 'triangle';
    this.whineOsc.frequency.value = 820;
    this.whine = ctx.createGain();
    this.whine.gain.value = 0;
    this.whineOsc.connect(this.whine).connect(this.veh.input);
    this.whineOsc.start(0);
    this.sources.push(...this.rumble.sources, ...this.roar.sources, ...this.vent.sources, ...this.deluge.sources, ...this.amb.sources, this.whineOsc);
    // one-shot buffers
    this.buffers.boom = nWave(ctx);
    this.buffers.thump = thump(ctx, 62, 0.35, 0.4, 'thump');
    this.buffers.chuff = thump(ctx, 85, 0.12, 0.75, 'chuff');
    this.buffers.crack = crack(ctx, 'crack');
    this.buffers.patter = patter(ctx, 'patter');
    this.buffers.clank = crack(ctx, 'clank', 0.05);
    this.buffers.coldgas = crack(ctx, 'coldgas', 0.4);
    this.buildEvents(engine);
  }

  private group(mix: AudioNode): Group {
    const c = this.ctx;
    const input = c.createGain();
    const d1 = c.createDelay(60), d2 = c.createDelay(60);
    const x1 = c.createGain(), x2 = c.createGain();
    x1.gain.value = 1; x2.gain.value = 0;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 18000;
    const dist = c.createGain();
    input.connect(d1).connect(x1).connect(lp);
    input.connect(d2).connect(x2).connect(lp);
    lp.connect(dist).connect(mix);
    return { input, delays: [d1, d2], xf: [x1, x2], active: 0, lp, dist };
  }

  private buildEvents(engine: Engine): void {
    const ev = engine.traj.events;
    const on = boosterAscentWindows().on;
    on.forEach((t) => this.events.push({ t, kind: 'chuff', group: 'pad', gain: 0.35 }));
    this.events.push({ t: -1.0, kind: 'qd', group: 'pad', gain: 0.4 });
    this.events.push({ t: 0, kind: 'crack', group: 'pad', gain: 1.0 });
    this.events.push({ t: 0.6, kind: 'creak', group: 'veh', gain: 0.3 });
    this.events.push({ t: 2.2, kind: 'creak', group: 'veh', gain: 0.25 });
    this.events.push({ t: ev.mach1, kind: 'boom', group: 'veh', gain: 1.0 });
    this.events.push({ t: ev.hotStage, kind: 'staging', group: 'veh', gain: 1.0 });
    this.events.push({ t: ev.sep, kind: 'crack', group: 'veh', gain: 0.8 });
    for (let k = 0; k < 8; k++) this.events.push({ t: ev.flipStart + k * 1.6, kind: 'coldgas', group: 'veh', gain: 0.3 });
    for (const t of [ev.boostbackStart, ev.entryStart, ev.landingStart]) this.events.push({ t, kind: 'chuff', group: 'veh', gain: 0.8 });
    this.events.push({ t: ev.catchT, kind: 'clank', group: 'pad', gain: 1.0 });
    for (let s = 10; s >= 1; s--) this.events.push({ t: -s, kind: 'beep', group: 'local', gain: 1 });
    this.events.sort((a, b) => a.t - b.t);
  }

  /** Start a one-shot at context time `when` (playbackRate follows the time warp for transients). */
  private fire(e: OneShot, when: number, warp: number, beeps: boolean): void {
    const c = this.ctx;
    const dest = e.group === 'pad' ? this.pad.input : e.group === 'veh' ? this.veh.input : this.master;
    const play = (buf: AudioBuffer, gain: number, rate = 1, filter?: BiquadFilterNode) => {
      const s = c.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rate;
      const g = c.createGain();
      g.gain.value = gain;
      if (filter) s.connect(filter).connect(g); else s.connect(g);
      g.connect(dest);
      s.start(when);
    };
    const rate = Math.max(0.25, Math.min(1, warp));
    switch (e.kind) {
      case 'chuff': play(this.buffers.chuff, e.gain, rate); break;
      case 'qd': play(this.buffers.clank, 0.5 * e.gain, 0.6); break;
      case 'crack': play(this.buffers.crack, e.gain * 1.2, rate); play(this.buffers.thump, e.gain, rate); break;
      case 'creak': {
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 30;
        f.frequency.setValueAtTime(240, when); f.frequency.linearRampToValueAtTime(520, when + 0.8);
        play(this.buffers.patter, e.gain, 0.3, f);
        break;
      }
      case 'boom': {
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        play(this.buffers.boom, e.gain * 1.6, 1, f);
        break;
      }
      case 'staging': play(this.buffers.thump, e.gain * 1.4, rate * 0.8); play(this.buffers.crack, e.gain, rate); play(this.buffers.patter, e.gain * 0.5, rate); break;
      case 'coldgas': {
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
        play(this.buffers.coldgas, e.gain, 1, f);
        break;
      }
      case 'clank': {
        const s = c.createBufferSource();
        s.buffer = this.buffers.clank;
        const g = c.createGain();
        g.gain.value = e.gain;
        s.connect(g);
        clankBank(c, g, dest);
        s.start(when);
        play(this.buffers.thump, 0.6, 0.7);
        break;
      }
      case 'beep': if (beeps) Countdown.scheduleBeeps(c, this.master, [when]); break;
    }
  }

  /** Apply the state at context time `when`; fires one-shots whose mission time was crossed. */
  apply(s: AudioState, when: number, beeps: boolean): void {
    const tc = (target: AudioParam, v: number, tau: number) => target.setTargetAtTime(v, when, Math.max(0.001, tau));
    const mixCfg = SHOT_MIX[s.shotId] ?? SHOT_MIX['1'];
    const vac = Math.min(1, Math.max(0, (s.camAlt - 30000) / 40000));
    tc(this.shotGain.gain, mixCfg.gain, 0.05);
    tc(this.shotLp.frequency, Math.min(mixCfg.lp, 18000 * (1 - vac) + 200 * vac), 0.1);
    const warp = Math.max(0.2, s.warp);
    // propagation per group
    const setGroup = (g: Group, d: number) => {
      const delay = Math.min(59, d / CONFIG.shock.speedOfSound / warp);
      if (s.cut) {
        // cross-fade to the idle delay line so the jump is click-free
        const next = 1 - g.active;
        g.delays[next].delayTime.setValueAtTime(delay, when);
        g.xf[next].gain.setTargetAtTime(1, when, 0.03);
        g.xf[g.active].gain.setTargetAtTime(0, when, 0.03);
        g.active = next;
      } else {
        g.delays[g.active].delayTime.setTargetAtTime(delay, when, 0.25);
      }
      const att = Math.pow(1 / (1 + d / CONFIG.audio.distanceRef), 0.6);
      tc(g.dist.gain, att, 0.1);
      tc(g.lp.frequency, Math.max(120, 18000 * Math.exp(-d / CONFIG.audio.airAbsorptionRef)), 0.2);
    };
    setGroup(this.pad, s.dPad);
    setGroup(this.veh, s.dVeh);
    // engine layers: rumble lags thrust by ~1.5 s, roar crackles more with distance
    tc(this.rumble.level.gain, s.thrust * 0.9 * mixCfg.rumble, CONFIG.audio.rumbleLag * 0.5 / warp);
    tc(this.roar.level.gain, s.thrust * 0.75, 0.25 / warp);
    const far = Math.min(1, s.dVeh / 2500);
    tc(this.roar.crackleDepth.gain, 0.45 + 0.9 * far, 0.3);
    tc((this.roar.rolling as unknown as { lfoDepth: GainNode }).lfoDepth.gain, 0.15 * far, 0.5);
    tc(this.whine.gain, s.landing * 0.012, 0.3);
    tc(this.whineOsc.frequency, 600 + 600 * s.landing, 0.5);
    tc(this.deluge.level.gain, s.deluge * 0.9, 0.4);
    tc(this.vent.level.gain, s.vent * 0.5, 0.6);
    const ground = s.camAlt < 300 ? 1 : 0;
    tc(this.amb.wind.gain, 0.25 * (1 - vac) * (0.5 + 0.5 * ground), 1.0);
    tc(this.amb.surf.gain, 0.12 * ground, 1.0);
    tc(this.amb.insects.gain, 0.05 * s.insects * ground, 0.6);
    tc(this.amb.gulls.gain, 0.6 * ground * s.insects, 1.0);
    // noise layers time-stretched in slow motion
    const nr = Math.max(0.5, Math.min(1, warp));
    for (const src of [...this.rumble.sources, ...this.roar.sources]) {
      if ((src as AudioBufferSourceNode).playbackRate) (src as AudioBufferSourceNode).playbackRate.setTargetAtTime(nr, when, 0.2);
    }
    // one-shots crossed since the last update (skipped across cuts that jump backwards)
    if (s.mission > this.lastMission && s.mission - this.lastMission < 30) {
      for (const e of this.events) if (e.t > this.lastMission && e.t <= s.mission) this.fire(e, when, warp, beeps);
    }
    this.lastMission = s.mission;
  }

  stop(): void {
    for (const s of this.sources) {
      try { s.stop(); } catch { /* already stopped */ }
    }
  }
}

/** Compute the audio state for cinematic time `cin` without rendering. */
export function audioStateAt(engine: Engine, cin: number, prevShot: string | null): AudioState {
  const shot = engine.shots.at(cin);
  const m = shot.mission;
  const dt = 1 / 60;
  const m2 = engine.shots.at(Math.min(engine.shots.duration, cin + dt)).mission;
  const warp = engine.shots.at(Math.min(engine.shots.duration, cin + dt)).index === shot.index ? (m2 - m) / dt : 1;
  const pose = engine.shots.pose(shot, null);
  const cam = pose.position;
  const b = engine.traj.booster.at(m);
  const sh = engine.traj.ship.at(m);
  const bp = planarToWorld(b.px, b.py);
  const sp = planarToWorld(sh.px, sh.py);
  const bThr = m < 0 ? Math.min(1, Math.max(0, (m + 8.2) / 4.2)) : b.thrust / (33 * 2.3e6);
  const sThr = sh.thrust / (6 * 2.4e6);
  const useShip = m > CONFIG.physics.sepT && !['9', '11', '11B'].includes(shot.id);
  const snap = engine.timeline.at(m);
  const ev = engine.traj.events;
  const burning = (m > ev.boostbackStart && m < ev.boostbackEnd) || (m > ev.entryStart && m < ev.entryEnd) || (m > ev.landingStart && m < ev.catchT);
  return {
    cin, mission: m, warp, shotId: shot.id, cut: prevShot !== null && prevShot !== shot.id,
    dPad: cam.distanceTo(new THREE.Vector3(0, -10, 0)),
    dVeh: cam.distanceTo(useShip ? sp : bp),
    thrust: Math.min(1.1, useShip ? sThr : Math.max(bThr, m < CONFIG.physics.sepT ? 0 : 0)),
    landing: burning ? 1 : 0,
    deluge: snap.deluge, vent: snap.ventLevel, insects: snap.insects, camAlt: cam.y + CONFIG.site.olmHeight,
    countdown: snap.countdown,
  };
}

export { loopSource };
