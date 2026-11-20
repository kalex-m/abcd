import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Snapshot } from '../timeline';
import type { Trajectory, Track } from '../physics/staging';
import type { Sample } from '../physics/ascent';
import { R0, derive } from '../physics/ascent';
import { boosterEngineEnvelope, shipEngineEnvelope, raptorSLThrust } from '../physics/engine-schedule';
import { plumeShape, type PlumeShape } from '../physics/plume-model';
import { atmosphere } from '../physics/atmosphere';
import { DEG, smoothstep, smootherstep, clamp } from '../util/math';

/** World-space state of one stage, derived from the precomputed trajectory each frame. */
export interface VehicleState {
  kind: 'booster' | 'ship';
  /** true-world position of the aft end centre (m) */
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  /** unit body axis (towards the nose) */
  axis: THREE.Vector3;
  velocity: THREE.Vector3;
  alt: number; // m above the OLM top
  altASL: number;
  speed: number;
  mach: number;
  q: number; // Pa
  accelG: number;
  thrustMN: number;
  throttle: number;
  prop: number; // 0..1
  engines: number; // running count
  /** per-engine visible intensity (envelope x throttle), 33 or 6 entries */
  engineLevel: Float32Array;
  gimbalP: number; // rad
  gimbalY: number; // rad
  pAmb: number; // Pa
  plume: PlumeShape;
  plumeVac: PlumeShape;
  attached: boolean;
  vaporCone: number;
  reentry: number;
  downrange: number;
  fpa: number;
  sample: Sample;
}

const AZ = CONFIG.physics.azimuthDeg * DEG;
/** Downrange unit vector in world space (x east, z south). */
export const DOWNRANGE = new THREE.Vector3(Math.sin(AZ), 0, -Math.cos(AZ));
const UP = new THREE.Vector3(0, 1, 0);
const PITCH_AXIS = new THREE.Vector3().crossVectors(UP, DOWNRANGE).normalize();

/** Map planar trajectory coordinates to the true world frame. */
export function planarToWorld(px: number, py: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.copy(DOWNRANGE).multiplyScalar(px).addScaledVector(UP, py);
}

function makeState(kind: 'booster' | 'ship'): VehicleState {
  return {
    kind, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), axis: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(), alt: 0, altASL: 0, speed: 0, mach: 0, q: 0, accelG: 0, thrustMN: 0, throttle: 0,
    prop: 1, engines: 0, engineLevel: new Float32Array(kind === 'booster' ? 33 : 6), gimbalP: 0, gimbalY: 0, pAmb: 101325,
    plume: plumeShape(101325, 0), plumeVac: plumeShape(101325, 0, true), attached: true, vaporCone: 0, reentry: 0,
    downrange: 0, fpa: 0, sample: {} as Sample,
  };
}

const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion();

export class VehicleStates {
  readonly booster = makeState('booster');
  readonly ship = makeState('ship');
  private readonly tmp: Sample = {} as Sample;

  constructor(private traj: Trajectory) {}

  /** Booster thrust (MN) at mission time t (for delayed shake/audio lookups). */
  thrustAt(t: number): number {
    return this.traj.booster.at(t, this.tmp).thrust / 1e6;
  }

  update(t: number, snap: Snapshot): void {
    const ev = this.traj.events;
    this.fill(this.booster, this.traj.booster, t, snap);
    const p = CONFIG.physics;
    for (let e = 0; e < 33; e++) this.booster.engineLevel[e] = boosterEngineEnvelope(e, t, ev) * (t < 0 ? 1 : this.booster.throttle > 0 ? this.booster.throttle : 1);
    this.booster.engines = 0;
    for (let e = 0; e < 33; e++) if (this.booster.engineLevel[e] > 0.3) this.booster.engines++;
    // thrust before liftoff from the envelopes (the integrator sample holds it as well)
    if (t < 0) {
      let f = 0;
      for (let e = 0; e < 33; e++) f += this.booster.engineLevel[e] * raptorSLThrust(101325);
      this.booster.thrustMN = f / 1e6;
    }
    if (t >= ev.catchT) {
      this.booster.position.y -= snap.catchSettle;
      this.booster.engineLevel.fill(0);
      this.booster.thrustMN = 0;
    }
    this.fill(this.ship, this.traj.ship, t, snap);
    this.ship.attached = t < p.sepT;
    for (let e = 0; e < 6; e++) this.ship.engineLevel[e] = shipEngineEnvelope(e, t, ev.shipSeco);
    this.ship.engines = this.ship.engineLevel.reduce((a, v) => a + (v > 0.3 ? 1 : 0), 0);
    if (this.ship.attached) {
      // ship rides on the booster: identical attitude, offset along the axis
      this.ship.quaternion.copy(this.booster.quaternion);
      this.ship.axis.copy(this.booster.axis);
      this.ship.position.copy(this.booster.position).addScaledVector(this.booster.axis, CONFIG.vehicle.boosterHeight);
      this.ship.velocity.copy(this.booster.velocity);
      let f = 0;
      for (let e = 0; e < 6; e++) f += this.ship.engineLevel[e] * 2.4;
      this.ship.thrustMN = f;
    }
  }

  private fill(v: VehicleState, track: Track, t: number, _snap: Snapshot): void {
    const s = track.at(t, v.sample);
    planarToWorld(s.px, s.py, v.position);
    v.velocity.copy(DOWNRANGE).multiplyScalar(s.vx).addScaledVector(UP, s.vy);
    // attitude: heading (pad orientation + roll program) -> out-of-plane yaw -> pitch in the trajectory plane
    const p = CONFIG.physics;
    const roll = p.rollDeg * DEG * smootherstep(p.rollStart, p.rollEnd, t);
    qa.setFromAxisAngle(UP, (p.padHeadingDeg - CONFIG.physics.azimuthDeg) * DEG + roll);
    qb.setFromAxisAngle(DOWNRANGE, -s.yaw);
    qc.setFromAxisAngle(PITCH_AXIS, s.pitch);
    v.quaternion.copy(qc).multiply(qb).multiply(qa);
    v.axis.set(0, 1, 0).applyQuaternion(v.quaternion);
    const d = derive(new Float64Array([s.px, s.py, s.vx, s.vy, s.m, 0, 0, 0, 0, 0, 0, 0, 0]));
    v.alt = d.alt;
    v.altASL = d.altASL;
    v.speed = s.speed;
    v.mach = s.mach;
    v.q = s.q;
    v.accelG = s.accelG;
    v.thrustMN = s.thrust / 1e6;
    v.throttle = s.throttle;
    v.prop = s.prop;
    v.gimbalP = s.gimbalP;
    v.gimbalY = s.gimbalY;
    v.pAmb = atmosphere(d.altASL).p;
    v.plume = plumeShape(v.pAmb, Math.max(0.0001, v.throttle || 1));
    v.plumeVac = plumeShape(v.pAmb, 1, true);
    v.downrange = R0 * d.theta;
    v.fpa = s.fpa;
    const hum = CONFIG.planet.humidityAt10km;
    v.vaporCone = hum * smoothstep(0.9, 0.99, s.mach) * (1 - smoothstep(1.12, 1.32, s.mach)) * smoothstep(2000, 5000, d.altASL) * (1 - smoothstep(16000, 20000, d.altASL));
    v.reentry = v.kind === 'booster' && t > CONFIG.physics.sepT + 20 && s.vy < 0
      ? smoothstep(800, 1300, s.speed) * smoothstep(72000, 58000, d.altASL) * smoothstep(16000, 26000, d.altASL)
      : 0;
    v.reentry = clamp(v.reentry, 0, 1);
  }
}
