import { CONFIG } from '../config';
import {
  NS, R0, MU, derive, rk4, defaultControl, makeSample, wrapAngle, integrateStack, cdOfMach,
  SAMPLE_FIELDS, type Sample, type StackResult,
} from './ascent';
import { gravity } from './atmosphere';
import {
  raptorSLThrust, raptorSLMdot, rvacThrust, rvacMdot, shipEngineEnvelope, boosterEngineEnvelope,
  type ReturnEvents,
} from './engine-schedule';
import { clamp, DEG, smootherstep, table, lerp } from '../util/math';

/**
 * Stage separation, booster return (flip, boostback, coast with grid-fin steering, entry burn, suicide
 * landing burn, catch) and ship ascent to orbit insertion. Produces uniformly sampled tracks.
 */

export interface MissionEvents extends ReturnEvents {
  liftoff: number;
  towerClear: number;
  mach1: number;
  maxQ: number;
  maxQValue: number;
  meco: number;
  hotStage: number;
  sep: number;
  flipStart: number;
  flipEnd: number;
  finDeploy: number;
  shipSeco: number;
  boosterApogee: number;
  boosterApogeeAlt: number;
  catchMissBeforeAlign: number;
}

/** Height of the booster base above the OLM top at the catch (m): chopstick arm level minus pin height. */
export function catchBaseHeight(): number {
  const v = CONFIG.vehicle;
  const pinFromBase = v.boosterHeight - v.gridFinBelowHotStage - v.hotStageHeight - v.catchPinBelowFins;
  return CONFIG.site.tower.catchArmHeight - pinFromBase;
}

const F13 = (p: number) => 13 * raptorSLThrust(p);
const F3 = (p: number) => 3 * raptorSLThrust(p);

/** Ballistic impact prediction (downrange, m) with a constant drag area, semi-implicit Euler. */
function predictImpact(s0: Float64Array, cdA: number, targetAlt: number): number {
  let x = s0[0], y = s0[1], vx = s0[2], vy = s0[3];
  const m = s0[4];
  const dt = 0.5;
  for (let i = 0; i < 4000; i++) {
    const rx = x, ry = y + R0;
    const r = Math.hypot(rx, ry);
    const alt = r - R0;
    if (alt < targetAlt && vy < 0) break;
    const st = derive(new Float64Array([x, y, vx, vy, m, 0, 0, 0, 0, 0, 0, 0, 0]));
    const g = gravity(alt);
    const sp = Math.hypot(vx, vy);
    const dragA = (st.q * cdOfMach(st.mach) * cdA) / m;
    vx += (-g * rx / r - (sp > 0 ? (dragA * vx) / sp : 0)) * dt;
    vy += (-g * ry / r - (sp > 0 ? (dragA * vy) / sp : 0)) * dt;
    x += vx * dt;
    y += vy * dt;
  }
  return R0 * Math.atan2(x, y + R0);
}

function trackAngle(cur: number, target: number, tau: number, dt: number): number {
  return cur + wrapAngle(target - cur) * (1 - Math.exp(-dt / tau));
}

interface ReturnResult {
  samples: Sample[];
  events: ReturnEvents & { finDeploy: number; flipStart: number; flipEnd: number; apogee: number; apogeeAlt: number; miss: number };
}

/** Integrate the booster from separation to the catch (+20 s settled). */
export function integrateBoosterReturn(stack: StackResult): ReturnResult {
  const p = CONFIG.physics;
  const dt = p.dt;
  const s = new Float64Array(NS);
  s.set(stack.sepState);
  let prop = stack.boosterPropAtSep;
  s[4] = p.boosterDry + Math.max(0, prop);
  s[6] = 0; s[7] = 0; s[8] = 0; s[9] = 0; s[10] = 0; s[11] = 0; s[12] = 0;
  const samples: Sample[] = [];
  const sampleEvery = Math.round(1 / (p.sampleRate * dt));
  const catchH = catchBaseHeight();
  type Phase = 'coast0' | 'flip' | 'boostback' | 'coast' | 'entry' | 'coast2' | 'landing' | 'caught';
  let phase: Phase = 'coast0';
  const ev = {
    boostbackStart: p.boostbackStart, boostbackEnd: p.boostbackStart + 20, boostback13to3: p.boostbackStart + 17,
    entryStart: 1e9, entryEnd: 1e9, landingStart: 1e9, landing13to3: 1e9, catchT: 1e9,
    finDeploy: p.finDeployT, flipStart: p.boosterFlipStart, flipEnd: p.boosterFlipStart + p.boosterFlipDuration,
    apogee: 0, apogeeAlt: 0, miss: 0,
  };
  const flipFrom = s[5];
  const thetaSep = derive(s).theta;
  const bbDir = (theta: number) => theta - (90 + p.boostbackPitchDownDeg) * DEG;
  let use3 = false;
  let lastPred = 1e9;
  let predT = -1;
  let latCmd = 0;
  let landDecel = 0;
  let landUse3 = false;
  let prevVy = s[3];
  let gimbalVis = 0;
  const cdAfins = CONFIG.physics.frontalArea * CONFIG.physics.boosterCdBroadside;
  const minThrottle = 0.4;

  for (let t = p.sepT, step = 0; t < p.sepT + 420; t += dt, step++) {
    const d = derive(s);
    const c = defaultControl();
    c.kinematic = true;
    c.inertia = 2.5e8;
    let throttle = 0;
    const finsOut = t >= ev.finDeploy;
    c.cdScale = finsOut ? p.boosterCdBroadside / Math.max(0.2, cdOfMach(d.mach)) : 1;
    let pitchTarget = s[5];

    if (phase === 'coast0' && t >= p.boosterFlipStart) phase = 'flip';
    if (phase === 'flip') {
      const k = smootherstep(p.boosterFlipStart, p.boosterFlipStart + p.boosterFlipDuration, t);
      const to = bbDir(thetaSep);
      s[5] = flipFrom + wrapAngle(to - flipFrom) * k;
      if (t >= p.boostbackStart) phase = 'boostback';
    }
    if (phase === 'boostback') {
      s[5] = trackAngle(s[5], bbDir(d.theta), 1.5, dt);
      if (predT < 0 || t - predT > 0.25) {
        lastPred = predictImpact(s, cdAfins, catchH);
        predT = t;
      }
      const err = lastPred - 0;
      const fAvail = use3 ? F3(d.p) : F13(d.p);
      throttle = 1;
      if (!use3 && err < 9000) { use3 = true; ev.boostback13to3 = t; }
      c.thrust = fAvail * throttle;
      c.mdot = (use3 ? 3 : 13) * raptorSLMdot() * throttle;
      if (err <= 0 || prop <= p.boostbackMinProp) {
        ev.boostbackEnd = t;
        if (!use3) ev.boostback13to3 = t;
        phase = 'coast';
      }
      gimbalVis = 0.04 * Math.sin(t * 1.7);
    }
    if (phase === 'coast' || phase === 'coast2') {
      // engines-first: body axis opposite the velocity vector
      pitchTarget = Math.atan2(-s[2], -s[3]);
      s[5] = trackAngle(s[5], pitchTarget, 5, dt);
      if (prevVy > 0 && s[3] <= 0 && ev.apogee === 0) { ev.apogee = t; ev.apogeeAlt = d.alt; }
      if (finsOut && d.rho > 1e-5) {
        if (predT < 0 || t - predT > 1.0) {
          lastPred = predictImpact(s, cdAfins, catchH);
          predT = t;
          const drag = d.q * p.boosterCdBroadside * p.frontalArea;
          const aMax = (p.gridFinLD * drag) / s[4];
          latCmd = clamp(-lastPred * 0.002, -aMax, aMax);
        }
        // lateral = horizontal direction (local), perpendicular to up
        c.ax = latCmd * d.upY;
        c.ay = -latCmd * d.upX;
      }
      if (phase === 'coast' && s[3] < 0 && d.alt < p.entryBurnAlt && d.speed > p.entryBurnSpeedTarget) {
        phase = 'entry';
        ev.entryStart = t;
      }
      if (phase === 'coast2' || (phase === 'coast' && d.alt < p.entryBurnAlt * 0.5)) {
        // landing ignition check (suicide burn)
        const hRem = d.alt - catchH;
        const aAvail = (p.landingThrottleMargin * F13(d.p)) / s[4] - gravity(d.alt);
        if (s[3] < 0 && hRem > 0 && (d.speed * d.speed) / (2 * Math.max(aAvail, 1)) >= hRem) {
          phase = 'landing';
          ev.landingStart = t;
          landDecel = (d.speed * d.speed) / (2 * hRem);
        }
      }
    }
    if (phase === 'entry') {
      pitchTarget = Math.atan2(-s[2], -s[3]);
      s[5] = trackAngle(s[5], pitchTarget, 2, dt);
      throttle = p.entryThrottle;
      c.thrust = F13(d.p) * throttle;
      c.mdot = 13 * raptorSLMdot() * throttle;
      gimbalVis = 0.03 * Math.sin(t * 2.3);
      if (d.speed <= p.entryBurnSpeedTarget || prop <= p.entryMinProp) {
        ev.entryEnd = t;
        phase = 'coast2';
      }
    }
    if (phase === 'landing') {
      const hRem = Math.max(0, d.alt - catchH);
      const vUp = s[2] * d.upX + s[3] * d.upY;
      const xErr = R0 * d.theta;
      const vH = s[2] * d.upY - s[3] * d.upX;
      const g = gravity(d.alt);
      // constant-deceleration ("required deceleration") law, velocity hold for the last metre
      const aReq = vUp < 0 ? (vUp * vUp) / (2 * Math.max(hRem, 1.0)) : 0;
      const aUp = hRem > 1.5 ? g + aReq + 0.4 * (-Math.sqrt(2 * landDecel * hRem) - vUp) * 0.1 : g + 2.0 * (-0.3 - vUp);
      const aLat = clamp(-0.02 * xErr - 0.35 * vH, -0.25 * Math.abs(aUp), 0.25 * Math.abs(aUp));
      const aMag = Math.hypot(aUp, aLat);
      const fWanted = aMag * s[4];
      if (!landUse3 && Math.abs(vUp) < 95 && fWanted < 0.9 * F3(d.p)) { landUse3 = true; ev.landing13to3 = t; }
      const fAvail = landUse3 ? F3(d.p) : F13(d.p);
      throttle = clamp(fWanted / fAvail, minThrottle, 1);
      c.thrust = fAvail * throttle;
      c.mdot = (landUse3 ? 3 : 13) * raptorSLMdot() * throttle;
      c.thrustDir = d.theta + Math.atan2(aLat, aUp);
      s[5] = trackAngle(s[5], c.thrustDir, 0.6, dt);
      gimbalVis = clamp(wrapAngle(c.thrustDir - s[5]) * 3, -0.2, 0.2);
      if ((hRem < 0.4 && Math.abs(vUp) < 0.6) || t > ev.landingStart + 60) {
        ev.catchT = t;
        if (!landUse3) ev.landing13to3 = t;
        ev.miss = xErr;
        phase = 'caught';
      }
    }
    if (phase === 'caught') {
      s[2] = 0; s[3] = 0; s[6] = 0;
      s[5] = trackAngle(s[5], d.theta, 0.5, dt);
      c.thrust = 0; c.mdot = 0; throttle = 0;
      gimbalVis = 0;
    }
    if (phase === 'coast0') gimbalVis = 0;

    prop -= c.mdot * dt;
    if (prop < 0) { prop = 0; c.thrust = 0; c.mdot = 0; }
    if (step % sampleEvery === 0) {
      const smp = makeSample(t, s, c, throttle, prop / p.boosterProp, 0);
      smp.gimbalP = gimbalVis;
      smp.gimbalY = gimbalVis * 0.4 * Math.sin(t * 0.9);
      samples.push(smp);
    }
    prevVy = s[3];
    if (phase !== 'caught') rk4(s, c, dt, false);
    if (phase === 'caught' && t > ev.catchT + 25) break;
  }
  return { samples, events: ev };
}

interface ShipResult {
  samples: Sample[];
  secoT: number;
}

/** Ship ascent after separation: pitch program, pressure-compensated thrust, SECO at circular velocity. */
export function integrateShip(stack: StackResult): ShipResult {
  const p = CONFIG.physics;
  const dt = p.dt;
  const s = new Float64Array(NS);
  s.set(stack.sepState);
  const L = CONFIG.vehicle.boosterHeight;
  s[0] += Math.sin(s[5]) * L;
  s[1] += Math.cos(s[5]) * L;
  let prop = stack.shipPropAtSep;
  s[4] = p.shipDry + p.payload + prop;
  s[6] = 0; s[7] = 0; s[8] = 0;
  const samples: Sample[] = [];
  const sampleEvery = Math.round(1 / (p.sampleRate * dt));
  let secoT = 1e9;
  for (let t = p.sepT, step = 0; t <= 520; t += dt, step++) {
    const d = derive(s);
    const c = defaultControl();
    c.kinematic = true;
    let thrust = 0, mdot = 0;
    for (let e = 0; e < 6; e++) {
      const env = shipEngineEnvelope(e, t, secoT);
      if (e < 3) { thrust += env * raptorSLThrust(d.p); mdot += env * raptorSLMdot(); }
      else { thrust += env * rvacThrust(d.p); mdot += env * rvacMdot(); }
    }
    if (prop <= 0) { thrust = 0; mdot = 0; if (secoT > t) secoT = t; }
    if (thrust > 0) {
      const lim = Math.min(1, (p.shipAccelLimitG * CONFIG.planet.g0 * s[4]) / thrust);
      thrust *= Math.max(0.45, lim);
      mdot *= Math.max(0.45, lim);
    }
    const r = d.alt + R0;
    const vH = s[2] * d.upY - s[3] * d.upX;
    if (secoT > 1e8 && vH >= Math.sqrt(MU / r)) secoT = t;
    const elev = table(p.shipPitchProgram, t - p.sepT) * DEG;
    // closed-loop altitude hold term keeps the trajectory in the 150-220 km band
    const vUp = s[2] * d.upX + s[3] * d.upY;
    const hold = t - p.sepT > 40 ? clamp((160000 - d.alt) * 0.000025 - vUp * 0.0012, -0.15, 0.35) : 0;
    const target = d.theta + Math.PI / 2 - (elev + hold);
    s[5] = trackAngle(s[5], target, 3, dt);
    c.thrust = thrust;
    c.mdot = mdot;
    prop -= mdot * dt;
    if (step % sampleEvery === 0) {
      const smp = makeSample(t, s, c, thrust > 0 ? 1 : 0, Math.max(0, prop) / p.shipProp, thrust > 1 ? 6 : 0);
      smp.gimbalP = thrust > 0 ? 0.015 * Math.sin(t * 0.7) : 0;
      smp.gimbalY = thrust > 0 ? 0.01 * Math.sin(t * 1.1 + 1) : 0;
      samples.push(smp);
    }
    rk4(s, c, dt, false);
  }
  return { samples, secoT };
}

/** Uniformly sampled track with linear interpolation of every telemetry field. */
export class Track {
  readonly t0: number;
  readonly rate: number;
  readonly n: number;
  private data: Float64Array;
  private readonly nf = SAMPLE_FIELDS.length;

  constructor(samples: Sample[], rate: number) {
    this.rate = rate;
    this.t0 = samples[0].t;
    this.n = samples.length;
    this.data = new Float64Array(this.n * this.nf);
    samples.forEach((s, i) => SAMPLE_FIELDS.forEach((f, j) => (this.data[i * this.nf + j] = s[f])));
  }

  get t1(): number {
    return this.t0 + (this.n - 1) / this.rate;
  }

  /** Interpolated sample at time t (clamped to the track range). */
  at(t: number, out?: Sample): Sample {
    const o = out ?? ({} as Sample);
    const x = clamp((t - this.t0) * this.rate, 0, this.n - 1.000001);
    const i = Math.floor(x);
    const f = x - i;
    const a = i * this.nf, b = Math.min(i + 1, this.n - 1) * this.nf;
    for (let j = 0; j < this.nf; j++) {
      const key = SAMPLE_FIELDS[j];
      const va = this.data[a + j], vb = this.data[b + j];
      (o as unknown as Record<string, number>)[key] = key === 'pitch' ? va + wrapAngle(vb - va) * f : lerp(va, vb, f);
    }
    o.t = t;
    return o;
  }

  /** Post-process: blend the vertical coordinate towards target over [ta, tb] (and hold afterwards). */
  alignY(ta: number, tb: number, target: number): void {
    const iy = SAMPLE_FIELDS.indexOf('py');
    const it = SAMPLE_FIELDS.indexOf('t');
    const iEnd = Math.min(this.n - 1, Math.round((tb - this.t0) * this.rate));
    const err = this.data[iEnd * this.nf + iy] - target;
    for (let i = 0; i < this.n; i++) {
      const w = smootherstep(ta, tb, this.data[i * this.nf + it]);
      this.data[i * this.nf + iy] -= err * w;
    }
  }

  /** Post-process: blend the horizontal (downrange) coordinate towards target over [ta, tb]. */
  alignX(ta: number, tb: number, target: number): void {
    const ix = SAMPLE_FIELDS.indexOf('px');
    const it = SAMPLE_FIELDS.indexOf('t');
    let err = 0;
    const iEnd = Math.min(this.n - 1, Math.round((tb - this.t0) * this.rate));
    err = this.data[iEnd * this.nf + ix] - target;
    for (let i = 0; i < this.n; i++) {
      const t = this.data[i * this.nf + it];
      const w = smootherstep(ta, tb, t);
      this.data[i * this.nf + ix] -= err * w;
    }
  }
}

export interface Trajectory {
  booster: Track; // full stack until separation, then the returning booster
  ship: Track; // ship after separation (before: derive from booster + offset)
  events: MissionEvents;
  stack: StackResult;
}

/** Run the complete mission simulation. Deterministic, ~50-150 ms. */
export function simulateMission(): Trajectory {
  const stack = integrateStack();
  const ret = integrateBoosterReturn(stack);
  const ship = integrateShip(stack);
  const p = CONFIG.physics;
  const boosterSamples = stack.samples.filter((s) => s.t < p.sepT - 1e-6).concat(ret.samples);
  // Ship pre-separation samples come from the stack (position offset along the body axis).
  const L = CONFIG.vehicle.boosterHeight;
  const shipPre = stack.samples
    .filter((s) => s.t < p.sepT - 1e-6)
    .map((s) => ({ ...s, px: s.px + Math.sin(s.pitch) * L, py: s.py + Math.cos(s.pitch) * L }));
  const booster = new Track(boosterSamples, p.sampleRate);
  booster.alignX(ret.events.landingStart - 25, ret.events.catchT, 0);
  booster.alignY(ret.events.catchT - 4, ret.events.catchT, catchBaseHeight());
  const shipTrack = new Track(shipPre.concat(ship.samples), p.sampleRate);
  const events: MissionEvents = {
    ...ret.events,
    liftoff: p.holdDownT,
    towerClear: stack.towerClearT,
    mach1: stack.mach1T,
    maxQ: stack.maxQ.t,
    maxQValue: stack.maxQ.q,
    meco: p.mecoT,
    hotStage: p.hotStageT,
    sep: p.sepT,
    shipSeco: ship.secoT,
    boosterApogee: ret.events.apogee,
    boosterApogeeAlt: ret.events.apogeeAlt,
    catchMissBeforeAlign: ret.events.miss,
  };
  return { booster, ship: shipTrack, events, stack };
}

/** Number of booster engines running at time t, for HUD. */
export function boosterEngineCount(t: number, ev: ReturnEvents): number {
  let n = 0;
  for (let e = 0; e < 33; e++) if (boosterEngineEnvelope(e, t, ev) > 0.5) n++;
  return n;
}

export { gravity };
