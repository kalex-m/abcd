import { CONFIG } from './config';
import type { MissionEvents } from './physics/staging';
import { clamp, smootherstep, smoothstep, expoOut, cubicBezier, hermiteKeys, lerp } from './util/math';

/**
 * Master event table (Section 4) and the immutable per-frame timeline snapshot. Systems read the
 * snapshot only; nobody mutates global time here.
 */

export type Curve = 'linear' | 'smoother' | 'expoOut' | 'easeOut' | 'step';
const EASE_OUT = cubicBezier(0.16, 1, 0.3, 1);

export interface TimelineEvent {
  id: string;
  t0: number; // s mission time
  t1: number; // s mission time (t1 >= t0)
  curve: Curve;
  label?: string; // HUD ticker text
  caption?: string; // accessibility caption for audio
}

export interface Snapshot {
  t: number;
  /** progress 0..1 of each event by id */
  progress: Record<string, number>;
  ventLevel: number;
  frost: number;
  deluge: number;
  floodlights: number;
  strobes: number;
  qdRetract: number;
  shipQdRetract: number;
  chopstickOpen: number; // 1 open, 0 closed on the pins
  carriageHeight: number; // m (y)
  finDeploy: number;
  hotStageFire: number;
  sepFlash: number;
  ringVent: number;
  coldGas: [number, number, number, number];
  shipChill: number;
  countdown: number | null; // whole seconds remaining during T-10..T-0
  ticker: { label: string; alpha: number } | null;
  captions: string[];
  catchSettle: number; // m downward settle of the booster on the arms
  birdsStartled: number;
  insects: number;
}

function ease(c: Curve, x: number): number {
  const u = clamp(x, 0, 1);
  switch (c) {
    case 'linear': return u;
    case 'smoother': return smootherstep(0, 1, u);
    case 'expoOut': return expoOut(u);
    case 'easeOut': return EASE_OUT(u);
    case 'step': return u > 0 ? 1 : 0;
  }
}

export class Timeline {
  readonly events: TimelineEvent[];
  private readonly byId = new Map<string, TimelineEvent>();
  readonly mission: MissionEvents;

  constructor(ev: MissionEvents) {
    this.mission = ev;
    const p = CONFIG.physics;
    const tw = CONFIG.site.tower;
    const E: TimelineEvent[] = [
      { id: 'predawn', t0: -90, t1: -60, curve: 'linear' },
      { id: 'ventIncrease', t0: -60, t1: -50, curve: 'smoother', caption: '[LOX venting hiss]' },
      { id: 'sunrise', t0: -30, t1: 0, curve: 'linear' },
      { id: 'frost', t0: -30, t1: -10, curve: 'smoother' },
      { id: 'deluge', t0: CONFIG.deluge.preflowT, t1: CONFIG.deluge.peakT, curve: 'smoother', caption: '[deluge water roaring]' },
      { id: 'countdown', t0: -10, t1: 0, curve: 'linear' },
      { id: 'ignitionCenter', t0: -8.2, t1: -7.0, curve: 'smoother', label: 'IGNITION', caption: '[engines igniting: sharp pops]' },
      { id: 'ignitionInner', t0: -7.5, t1: -6.3, curve: 'smoother' },
      { id: 'ignitionOuter', t0: -6.5, t1: -4.0, curve: 'smoother' },
      { id: 'fullThrust', t0: -4.0, t1: 0, curve: 'linear', caption: '[deep roar building]' },
      { id: 'qdRetract', t0: -1.0, t1: -0.2, curve: 'easeOut' },
      { id: 'liftoff', t0: 0, t1: 0.01, curve: 'step', label: 'LIFTOFF', caption: '[hold-down release: thunderous crack]' },
      { id: 'towerClear', t0: ev.towerClear, t1: ev.towerClear + 0.01, curve: 'step', label: 'TOWER CLEAR' },
      { id: 'pitchKick', t0: p.pitchKickT, t1: p.pitchKickT + p.pitchKickDuration, curve: 'smoother' },
      { id: 'roll', t0: p.rollStart, t1: p.rollEnd, curve: 'smoother' },
      { id: 'mach1', t0: ev.mach1, t1: ev.mach1 + 0.01, curve: 'step', label: 'SUPERSONIC', caption: '[sonic boom, double thump]' },
      { id: 'maxQ', t0: ev.maxQ, t1: ev.maxQ + 0.01, curve: 'step', label: 'MAX-Q' },
      { id: 'shipChill', t0: 148, t1: p.shipEngineStartT, curve: 'smoother' },
      { id: 'meco', t0: p.mecoT, t1: p.mecoT + 2.6, curve: 'linear', label: 'MECO' },
      { id: 'hotStage', t0: p.hotStageT, t1: p.hotStageT + 4, curve: 'linear', label: 'HOT STAGING', caption: '[staging boom and crackle]' },
      { id: 'sep', t0: p.sepT, t1: p.sepT + 0.01, curve: 'step', label: 'STAGE SEPARATION' },
      { id: 'flip', t0: ev.flipStart, t1: ev.flipEnd, curve: 'smoother' },
      { id: 'boostback', t0: ev.boostbackStart, t1: ev.boostbackEnd, curve: 'linear', label: 'BOOSTBACK BURN' },
      { id: 'finDeploy', t0: ev.finDeploy, t1: ev.finDeploy + CONFIG.vehicle.gridFin.deployTime, curve: 'smoother', label: 'GRID FINS DEPLOYED' },
      { id: 'entryBurn', t0: ev.entryStart, t1: ev.entryEnd, curve: 'linear', label: 'ENTRY BURN' },
      { id: 'landingBurn', t0: ev.landingStart, t1: ev.catchT, curve: 'linear', label: 'LANDING BURN', caption: '[landing burn roar, turbopump whine]' },
      { id: 'carriageRise', t0: ev.catchT - 70, t1: ev.catchT - 35, curve: 'smoother' },
      { id: 'chopsticksClose', t0: ev.catchT - tw.chopstickCloseTime + 0.5, t1: ev.catchT + 0.5, curve: 'smoother' },
      { id: 'catch', t0: ev.catchT, t1: ev.catchT + 0.01, curve: 'step', label: 'CATCH', caption: '[metallic clank, long reverb]' },
      { id: 'seco', t0: ev.shipSeco, t1: ev.shipSeco + 0.01, curve: 'step', label: 'SECO' },
    ];
    this.events = E.sort((a, b) => a.t0 - b.t0);
    for (const e of this.events) this.byId.set(e.id, e);
  }

  get(id: string): TimelineEvent {
    const e = this.byId.get(id);
    if (!e) throw new Error(`timeline: unknown event ${id}`);
    return e;
  }

  progress(id: string, t: number): number {
    const e = this.get(id);
    if (e.t1 <= e.t0) return t >= e.t0 ? 1 : 0;
    return ease(e.curve, (t - e.t0) / (e.t1 - e.t0));
  }

  /** Immutable snapshot of every derived intensity at mission time t (s). */
  at(t: number, safeFlashes = false): Snapshot {
    const progress: Record<string, number> = {};
    for (const e of this.events) progress[e.id] = this.progress(e.id, t);
    const p = CONFIG.physics;
    const ev = this.mission;
    const tw = CONFIG.site.tower;
    const ventLevel = lerp(0.35, 1, progress.ventIncrease) * (1 - smoothstep(-3, 0.5, t));
    const frost = lerp(0.55, 1, progress.frost) * (t < 0 ? 1 : lerp(1, 0.3, smoothstep(0, 25, t)));
    const deluge = t < CONFIG.deluge.preflowT ? 0 : lerp(0.25, 1, progress.deluge) * smoothstep(CONFIG.deluge.preflowT, CONFIG.deluge.preflowT + 1.5, t) * (1 - smoothstep(10, 25, t));
    const floodlights = 1 - smoothstep(20, 30, t);
    const strobes = t > -60 && t < 2 ? 1 : 0;
    const carriageHeight = lerp(tw.carriageParkHeight, tw.catchArmHeight, progress.carriageRise);
    const chopstickOpen = 1 - progress.chopsticksClose;
    const hs = t - p.hotStageT;
    const hotStageFire = hs < -0.3 ? 0 : smoothstep(-0.3, 0.25, hs) * (1 - smoothstep(1.2, 4.0, hs));
    const flashRaw = Math.exp(-Math.pow((t - p.sepT) / 0.045, 2));
    const sepFlash = safeFlashes ? flashRaw * 0.25 : flashRaw;
    const ringVent = t < p.sepT ? 0 : Math.exp(-(t - p.sepT) / (CONFIG.hotStage.ventDuration * 0.45)) * (t < p.sepT + CONFIG.hotStage.ventDuration ? 1 : 0);
    const coldGas: [number, number, number, number] = [0, 0, 0, 0];
    if (t > ev.flipStart - 0.5 && t < ev.flipEnd + 1.5) {
      for (let k = 0; k < 4; k++) {
        const period = 1.6;
        const ph = (t - ev.flipStart + k * 0.4) % period;
        coldGas[k] = ph > 0 && ph < 0.3 ? Math.sin((ph / 0.3) * Math.PI) : 0;
      }
    }
    const settleT = t - ev.catchT;
    const catchSettle = settleT < 0 ? 0 : 0.3 * (1 - Math.exp(-settleT * 3) * Math.cos(settleT * 9));
    // countdown seconds for the voice / HUD
    const countdown = t >= -10 && t < 0 ? Math.ceil(-t) : null;
    // ticker: most recent labelled event within the fade window
    let ticker: Snapshot['ticker'] = null;
    for (const e of this.events) {
      if (!e.label) continue;
      const age = t - e.t0;
      if (age >= 0 && age < CONFIG.hud.eventFade) {
        const a = smoothstep(0, 0.3, age) * (1 - smoothstep(CONFIG.hud.eventFade - 0.8, CONFIG.hud.eventFade, age));
        ticker = { label: e.label, alpha: a };
      }
    }
    const captions: string[] = [];
    for (const e of this.events) if (e.caption && t >= e.t0 && t < e.t0 + 3) captions.push(e.caption);
    return {
      t, progress, ventLevel, frost, deluge, floodlights, strobes,
      qdRetract: progress.qdRetract, shipQdRetract: smoothstep(-1.0, 1.5, t),
      chopstickOpen, carriageHeight, finDeploy: progress.finDeploy, hotStageFire, sepFlash, ringVent, coldGas,
      shipChill: progress.shipChill * (1 - smoothstep(p.shipEngineStartT, p.hotStageT + 1, t)),
      countdown, ticker, captions, catchSettle,
      birdsStartled: smoothstep(CONFIG.birds.startleT, CONFIG.birds.startleT + 1, t),
      insects: 1 - smoothstep(-9, -7.5, t),
    };
  }
}

/** C1-continuous time warp from local shot time (s) to mission time (s) through [cinLocal, mission] keys. */
export function makeWarp(keys: [number, number][]): (x: number) => number {
  return hermiteKeys(keys);
}
