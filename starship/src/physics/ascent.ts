import { CONFIG } from '../config';
import { atmosphere, gravity } from './atmosphere';
import {
  boosterEngineEnvelope,
  raptorSLThrust,
  raptorSLMdot,
  shipEngineEnvelope,
  rvacThrust,
  rvacMdot,
  type ReturnEvents,
} from './engine-schedule';
import { clamp, DEG, smootherstep, table } from '../util/math';

/**
 * Planar 3-DOF + attitude ascent integrator (RK4, fixed step). Coordinates: inertial 2D plane containing
 * the local vertical at the pad and the launch azimuth. x = downrange (m), y = up (m), origin at the OLM
 * top surface; Earth centre at (0, -R0). The 3D world mapping happens in `Trajectory` (staging.ts).
 *
 * State vector layout (Float64Array, length NS):
 *  0 px, 1 py, 2 vx, 3 vy, 4 mass, 5 pitch (rad, inertial body-axis angle from +y towards +x), 6 pitch rate,
 *  7 gimbal pitch, 8 gimbal pitch rate, 9 yaw (rad, out of plane), 10 yaw rate, 11 gimbal yaw, 12 gimbal yaw rate
 */
export const NS = 13;
export const R0 = CONFIG.planet.radius + CONFIG.site.olmHeight + CONFIG.planet.siteElevation; // m
const MU = CONFIG.planet.g0 * CONFIG.planet.radius * CONFIG.planet.radius; // m^3/s^2

/** Drag coefficient vs Mach (transonic bump peaks at 0.58 near M 1.05). */
const CD_TABLE: [number, number][] = [
  [0, 0.3], [0.6, 0.32], [0.8, 0.38], [0.95, 0.5], [1.05, 0.58], [1.2, 0.53], [1.5, 0.43],
  [2.0, 0.36], [3.0, 0.29], [4.0, 0.26], [6.0, 0.22],
];
export const cdOfMach = (m: number): number => table(CD_TABLE, m);

export interface Derived {
  alt: number; // m above OLM top
  altASL: number; // m above MSL
  upX: number; upY: number; // local vertical (unit)
  theta: number; // rad, angular position of the vehicle around Earth centre (downrange angle)
  speed: number; // m/s inertial
  mach: number;
  q: number; // Pa
  rho: number; p: number; a: number;
  gamma: number; // rad, inertial velocity angle from +y
}

export function derive(s: Float64Array): Derived {
  const rx = s[0], ry = s[1] + R0;
  const r = Math.hypot(rx, ry);
  const alt = r - R0;
  const altASL = alt + CONFIG.site.olmHeight + CONFIG.planet.siteElevation;
  const atm = atmosphere(altASL);
  const speed = Math.hypot(s[2], s[3]);
  return {
    alt, altASL, upX: rx / r, upY: ry / r, theta: Math.atan2(rx, ry), speed,
    mach: speed / atm.a, q: 0.5 * atm.rho * speed * speed, rho: atm.rho, p: atm.p, a: atm.a,
    gamma: speed > 1 ? Math.atan2(s[2], s[3]) : Math.atan2(rx, ry),
  };
}

/** Per-step inputs supplied by a phase controller. */
export interface Control {
  thrust: number; // N along the body axis (after throttle)
  thrustGimbal: number; // N produced by gimballing engines (control authority)
  mdot: number; // kg/s
  /** Commanded pitch (rad, inertial). If `kinematic` is true the attitude is set directly. */
  pitchCmd: number;
  kinematic: boolean;
  /** Extra acceleration (m/s^2) e.g. grid-fin lift steering, inertial x/y. */
  ax: number; ay: number;
  /** Aerodynamic reference: Cd multiplier and area (m^2). */
  cdScale: number; area: number;
  inertia: number; // kg m^2
  /** thrust direction override (rad, inertial). NaN = body axis */
  thrustDir: number;
  disturb: number; // N m pitch disturbance torque
  disturbYaw: number; // N m yaw disturbance torque
}

export const defaultControl = (): Control => ({
  thrust: 0, thrustGimbal: 0, mdot: 0, pitchCmd: 0, kinematic: false, ax: 0, ay: 0, cdScale: 1,
  area: CONFIG.physics.frontalArea, inertia: CONFIG.physics.stackInertia, thrustDir: NaN, disturb: 0, disturbYaw: 0,
});

/** Time derivative of the state for a given control (held constant over the RK4 step). */
export function deriv(s: Float64Array, c: Control, out: Float64Array, held: boolean): void {
  const d = derive(s);
  const m = Math.max(s[4], 1);
  const g = gravity(d.alt);
  const cd = cdOfMach(d.mach) * c.cdScale;
  const drag = d.q * cd * c.area; // N
  const dir = Number.isNaN(c.thrustDir) ? s[5] : c.thrustDir;
  let ax = (c.thrust * Math.sin(dir)) / m - g * d.upX + c.ax;
  let ay = (c.thrust * Math.cos(dir)) / m - g * d.upY + c.ay;
  if (d.speed > 0.1) {
    ax -= (drag / m) * (s[2] / d.speed);
    ay -= (drag / m) * (s[3] / d.speed);
  }
  if (held) {
    out.fill(0);
    out[4] = -c.mdot;
  } else {
    out[0] = s[2];
    out[1] = s[3];
    out[2] = ax;
    out[3] = ay;
    out[4] = -c.mdot;
  }
  // Attitude: PD on pitch error commanding TVC, second-order gimbal actuator.
  const p = CONFIG.physics;
  const e = CONFIG.engines;
  const wn = e.gimbalWn, z = e.gimbalZeta, maxG = e.gimbalMaxDeg * DEG;
  if (c.kinematic || held) {
    out[5] = 0; out[6] = 0;
    out[7] = s[8]; out[8] = wn * wn * (0 - s[7]) - 2 * z * wn * s[8];
    out[9] = 0; out[10] = 0;
    out[11] = s[12]; out[12] = wn * wn * (0 - s[11]) - 2 * z * wn * s[12];
    return;
  }
  const auth = Math.max(c.thrustGimbal * p.gimbalLever, 1);
  const err = wrapAngle(c.pitchCmd - s[5]);
  const alphaDes = p.attitudeKp * err - p.attitudeKd * s[6];
  const gCmd = Math.asin(clamp((alphaDes * c.inertia) / auth, -Math.sin(maxG), Math.sin(maxG)));
  out[5] = s[6];
  out[6] = (auth * Math.sin(s[7]) + c.disturb) / c.inertia;
  out[7] = s[8];
  out[8] = wn * wn * (gCmd - s[7]) - 2 * z * wn * s[8];
  // Yaw axis: regulate to zero against gust torque
  const yDes = -p.attitudeKp * s[9] - p.attitudeKd * s[10];
  const yCmd = Math.asin(clamp((yDes * c.inertia) / auth, -Math.sin(maxG), Math.sin(maxG)));
  out[9] = s[10];
  out[10] = (auth * Math.sin(s[11]) + c.disturbYaw) / c.inertia;
  out[11] = s[12];
  out[12] = wn * wn * (yCmd - s[11]) - 2 * z * wn * s[12];
}

export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

const k1 = new Float64Array(NS), k2 = new Float64Array(NS), k3 = new Float64Array(NS), k4 = new Float64Array(NS);
const tmp = new Float64Array(NS);

/** One classical RK4 step of size dt with the control held constant. */
export function rk4(s: Float64Array, c: Control, dt: number, held: boolean): void {
  deriv(s, c, k1, held);
  for (let i = 0; i < NS; i++) tmp[i] = s[i] + 0.5 * dt * k1[i];
  deriv(tmp, c, k2, held);
  for (let i = 0; i < NS; i++) tmp[i] = s[i] + 0.5 * dt * k2[i];
  deriv(tmp, c, k3, held);
  for (let i = 0; i < NS; i++) tmp[i] = s[i] + dt * k3[i];
  deriv(tmp, c, k4, held);
  for (let i = 0; i < NS; i++) s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}

/** Deterministic low-altitude gust torque (sum of incommensurate sines scaled by density). */
export function gustTorque(t: number, rho: number, phase: number): number {
  const w = (2 * Math.PI) / CONFIG.wind.gustPeriod;
  const n = Math.sin(w * t + phase) * 0.6 + Math.sin(w * 2.718 * t + 1.3 + phase) * 0.3 + Math.sin(w * 6.1 * t + 4.1 + phase) * 0.15;
  return CONFIG.physics.gustTorque * n * Math.min(1, rho / 1.225);
}

/** Recorded per-sample telemetry. */
export interface Sample {
  t: number; px: number; py: number; vx: number; vy: number; m: number; pitch: number; pitchRate: number;
  gimbalP: number; gimbalY: number; yaw: number; throttle: number; thrust: number; q: number; mach: number;
  accelG: number; prop: number; engines: number; alt: number; downrange: number; speed: number; fpa: number;
}

export const SAMPLE_FIELDS: (keyof Sample)[] = [
  't', 'px', 'py', 'vx', 'vy', 'm', 'pitch', 'pitchRate', 'gimbalP', 'gimbalY', 'yaw', 'throttle', 'thrust', 'q',
  'mach', 'accelG', 'prop', 'engines', 'alt', 'downrange', 'speed', 'fpa',
];

export function makeSample(t: number, s: Float64Array, c: Control, throttle: number, prop: number, engines: number): Sample {
  const d = derive(s);
  const drag = d.q * cdOfMach(d.mach) * c.cdScale * c.area;
  const m = Math.max(1, s[4]);
  // sensed acceleration = non-gravitational specific force
  const fx = c.thrust * Math.sin(Number.isNaN(c.thrustDir) ? s[5] : c.thrustDir) - (d.speed > 0.1 ? (drag * s[2]) / d.speed : 0) + c.ax * m;
  const fy = c.thrust * Math.cos(Number.isNaN(c.thrustDir) ? s[5] : c.thrustDir) - (d.speed > 0.1 ? (drag * s[3]) / d.speed : 0) + c.ay * m;
  const vLocalUp = s[2] * d.upX + s[3] * d.upY;
  const vLocalH = s[2] * d.upY - s[3] * d.upX;
  return {
    t, px: s[0], py: s[1], vx: s[2], vy: s[3], m: s[4], pitch: s[5], pitchRate: s[6], gimbalP: s[7], gimbalY: s[11],
    yaw: s[9], throttle, thrust: c.thrust, q: d.q, mach: d.mach, accelG: Math.hypot(fx, fy) / m / CONFIG.planet.g0,
    prop, engines, alt: d.alt, downrange: R0 * d.theta, speed: d.speed, fpa: Math.atan2(vLocalUp, Math.max(1e-3, Math.abs(vLocalH))),
  };
}

/** Max-Q throttle bucket factor at time t. */
export function bucket(t: number): number {
  const b = CONFIG.physics.maxQBucket;
  const t0 = b.center - b.halfWidth;
  const t1 = b.center + b.halfWidth;
  const down = smootherstep(t0 - b.ramp, t0, t);
  const up = smootherstep(t1, t1 + b.ramp, t);
  return 1 - (1 - b.level) * (down - up);
}

export interface StackResult {
  samples: Sample[];
  sepState: Float64Array; // stack state at separation
  boosterPropAtSep: number;
  shipPropAtSep: number;
  maxQ: { t: number; q: number };
  mach1T: number;
  towerClearT: number;
}

/**
 * Integrate the full stack from T-10 s (held down until release at T0) to stage separation.
 * Booster engines follow the ignition / MECO envelope table; throttle obeys the Max-Q bucket and an
 * acceleration cap; ship engines light at hot staging and push the still-attached stack.
 */
export function integrateStack(): StackResult {
  const p = CONFIG.physics;
  const dt = p.dt;
  const s = new Float64Array(NS);
  // Propellant burnt during the 8 s ignition sequence is loaded on top so that mass(T0) = liftoffMass.
  let preburn = 0;
  for (let t = -10; t < 0; t += dt) for (let e = 0; e < 33; e++) preburn += boosterEngineEnvelope(e, t) * raptorSLMdot() * dt;
  s[4] = p.liftoffMass + preburn;
  let boosterProp = p.boosterProp + preburn;
  let shipProp = p.shipProp;
  const samples: Sample[] = [];
  const sampleEvery = Math.round(1 / (p.sampleRate * dt));
  let step = 0;
  let maxQ = { t: 0, q: 0 };
  let mach1T = -1;
  let towerClearT = -1;
  let kickEndResidual = NaN;
  const kickEnd = p.pitchKickT + p.pitchKickDuration;
  const fullThrustSL = 33 * raptorSLThrust(101325);

  for (let t = -10; t <= p.sepT + 1e-9; t += dt, step++) {
    const d = derive(s);
    // --- booster engines
    let thrustB = 0, thrustG = 0, mdotB = 0, nB = 0;
    const fe = raptorSLThrust(d.p);
    const md = raptorSLMdot();
    const envs: number[] = [];
    for (let e = 0; e < 33; e++) {
      const env = boosterEngineEnvelope(e, t);
      envs.push(env);
      if (env > 0.5) nB++;
    }
    // throttle command
    let thr = 1;
    if (t > 0) {
      thr *= bucket(t);
      const envSum = envs.reduce((a, v) => a + v, 0);
      const fFull = envSum * fe;
      if (fFull > 0) thr = Math.min(thr, (p.accelLimitG * CONFIG.planet.g0 * s[4]) / fFull);
      // propellant-time guidance: arrive at MECO with exactly the return reserve
      if (t > p.fuelGuidanceStart && t < p.mecoT) {
        const mdFull = envSum * md;
        const need = (boosterProp - p.boosterReserveProp) / Math.max(1e-3, mdFull * (p.mecoT - t));
        thr = Math.min(thr, need);
      }
      thr = clamp(thr, 0.4, 1);
    }
    for (let e = 0; e < 33; e++) {
      thrustB += envs[e] * thr * fe;
      if (e < 13) thrustG += envs[e] * thr * fe;
      mdotB += envs[e] * thr * md;
    }
    if (boosterProp <= 0) { thrustB = 0; thrustG = 0; mdotB = 0; }
    // --- ship engines (hot staging)
    let thrustS = 0, mdotS = 0;
    for (let e = 0; e < 6; e++) {
      const env = shipEngineEnvelope(e, t, 1e9);
      if (e < 3) { thrustS += env * raptorSLThrust(d.p); mdotS += env * raptorSLMdot(); }
      else { thrustS += env * rvacThrust(d.p); mdotS += env * rvacMdot(); }
    }
    // --- attitude program
    // Steering: vertical rise, 1.5 deg pitch kick, alpha-biased pitch-over, zero-alpha through max-Q,
    // then a pitch-from-vertical program once dynamic pressure has fallen.
    let pitchCmd = d.theta;
    if (t >= p.pitchKickT && t < kickEnd) {
      pitchCmd = d.theta + p.pitchKickDeg * DEG * smootherstep(p.pitchKickT, kickEnd, t);
    } else if (t >= kickEnd) {
      if (Number.isNaN(kickEndResidual)) kickEndResidual = wrapAngle(s[5] - d.gamma);
      const bias = p.pitchOverAlphaDeg * DEG * (1 - smootherstep(p.pitchOverEnd - 6, p.pitchOverEnd, t));
      const zeroAlpha = d.gamma + Math.max(kickEndResidual * Math.exp(-(t - kickEnd) / 20), bias);
      const prog = d.theta + table(p.postMaxQPitch, t) * DEG;
      const w = smootherstep(p.postMaxQPitch[0][0], p.postMaxQPitch[0][0] + 12, t);
      pitchCmd = zeroAlpha + wrapAngle(prog - zeroAlpha) * w;
    }
    const c = defaultControl();
    c.thrust = thrustB + thrustS;
    c.thrustGimbal = thrustG + thrustS;
    c.mdot = mdotB + mdotS;
    c.pitchCmd = pitchCmd;
    c.inertia = p.stackInertia * (s[4] / p.liftoffMass);
    c.disturb = t > 0 ? gustTorque(t, d.rho, 0) : 0;
    c.disturbYaw = t > 0 ? gustTorque(t * 1.13 + 40, d.rho, 2.1) * 0.7 : 0;

    const held = t < p.holdDownT;
    if (step % sampleEvery === 0) {
      const totalProp = p.boosterProp + p.shipProp;
      samples.push(makeSample(t, s, c, thr, (boosterProp + shipProp) / totalProp, nB));
    }
    rk4(s, c, dt, held);
    boosterProp -= mdotB * dt;
    shipProp -= mdotS * dt;
    const dn = derive(s);
    if (!held && dn.q > maxQ.q) maxQ = { t, q: dn.q };
    if (mach1T < 0 && dn.mach >= 1) mach1T = t;
    if (towerClearT < 0 && s[1] > CONFIG.site.tower.height - CONFIG.site.olmHeight) towerClearT = t;
    void fullThrustSL;
  }
  return { samples, sepState: s, boosterPropAtSep: boosterProp, shipPropAtSep: shipProp, maxQ, mach1T, towerClearT };
}

export type { ReturnEvents };
export { MU };
