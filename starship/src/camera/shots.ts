import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Trajectory } from '../physics/staging';
import { catchBaseHeight } from '../physics/staging';
import { makeWarp } from '../timeline';
import { planarToWorld, DOWNRANGE } from '../vehicle/state';
import { bezier3, easeInOutSine, easeOutQuad } from './paths';
import { smoothstep, smootherstep, lerp, clamp, DEG } from '../util/math';

/**
 * Shot list (Section 11.2). Every pose is a pure function of (shot-local time, mission time) so any
 * frame can be rendered in isolation: pan lag is implemented by evaluating the target at a delayed
 * mission time, focus pulls the same way. Shot mission windows that depend on the simulated return
 * (boostback, catch) are keyed to physics events.
 */
export interface ShakeSpec {
  gain: number;
  handheld: boolean;
  close: number; // 0..1 weight of 20-60 Hz vibration
  thrustNorm: number; // delayed, normalised
  distance: number; // m to the source
  impulses: number[]; // ages (s) of impulsive events as heard at the camera
}

export interface CameraPose {
  position: THREE.Vector3; // true world
  target: THREE.Vector3; // true world
  up?: THREE.Vector3;
  roll?: number;
  focal: number; // mm
  fStop: number;
  focusDistance: number; // m
  evComp: number;
  shake: ShakeSpec | null;
  shakeTime: number;
  shadowFocus: THREE.Vector3;
  shadowExtent: number; // m half-size of the shadow box
  envProbe: THREE.Vector3;
  fade?: number;
  heat?: number;
  lensWater?: number;
  dof?: boolean;
  shutterAngle?: number;
  anamorphic?: number;
  flashGain?: number;
  whiteout?: number;
  blastShield?: boolean;
  near?: number;
  jitter?: [number, number];
}

export interface ShotState {
  index: number; // 0-based
  id: string;
  name: string;
  local: number; // s since the shot start
  duration: number;
  start: number; // cinematic start time
  mission: number;
}

interface ShotDef {
  id: string;
  name: string;
  duration: number;
  warp: [number, number][];
  pose: (local: number, mission: number, h: ShotHelpers) => CameraPose;
}

const G = -CONFIG.site.olmHeight; // grade height (m)
const SEA = G - CONFIG.planet.siteElevation;
const TOWER = new THREE.Vector3(CONFIG.site.tower.offset[0], 0, CONFIG.site.tower.offset[2]);
const SIDE = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), DOWNRANGE).normalize(); // out of plane

export class ShotHelpers {
  private readonly tmp = {} as ReturnType<Trajectory['booster']['at']>;
  constructor(readonly traj: Trajectory) {}

  /** Booster aft-centre position (true world) at mission time t. */
  boosterBase(t: number): THREE.Vector3 {
    const s = this.traj.booster.at(t, this.tmp);
    return planarToWorld(s.px, s.py);
  }
  boosterAxis(t: number): THREE.Vector3 {
    const s = this.traj.booster.at(t, this.tmp);
    return DOWNRANGE.clone().multiplyScalar(Math.sin(s.pitch)).add(new THREE.Vector3(0, Math.cos(s.pitch), 0));
  }
  boosterVel(t: number): THREE.Vector3 {
    const s = this.traj.booster.at(t, this.tmp);
    return DOWNRANGE.clone().multiplyScalar(s.vx).add(new THREE.Vector3(0, s.vy, 0));
  }
  shipBase(t: number): THREE.Vector3 {
    const s = this.traj.ship.at(t, this.tmp);
    return planarToWorld(s.px, s.py);
  }
  shipVel(t: number): THREE.Vector3 {
    const s = this.traj.ship.at(t, this.tmp);
    return DOWNRANGE.clone().multiplyScalar(s.vx).add(new THREE.Vector3(0, s.vy, 0));
  }
  shipAxis(t: number): THREE.Vector3 {
    const s = this.traj.ship.at(t, this.tmp);
    return DOWNRANGE.clone().multiplyScalar(Math.sin(s.pitch)).add(new THREE.Vector3(0, Math.cos(s.pitch), 0));
  }
  /** point along the booster axis, `along` metres from the aft end */
  boosterPoint(t: number, along: number): THREE.Vector3 {
    return this.boosterBase(t).addScaledVector(this.boosterAxis(t), along);
  }
  /** normalised booster thrust (0..1) at mission time t */
  thrustNorm(t: number): number {
    return clamp(this.traj.booster.at(t, this.tmp).thrust / (33 * 2.3e6), 0, 1.1) + (t < 0 && t > -8.2 ? ignitionThrust(t) : 0);
  }
  shake(camPos: THREE.Vector3, src: THREE.Vector3, mission: number, gain: number, handheld: boolean, close: number): ShakeSpec {
    const d = camPos.distanceTo(src);
    const td = mission - d / CONFIG.shock.speedOfSound;
    const ev = this.traj.events;
    const impulses = [td - -8.2, td - 0, td - ev.hotStage, td - ev.catchT];
    return { gain, handheld, close, thrustNorm: this.thrustNorm(td), distance: d, impulses };
  }
}

/** before release the integrator holds the vehicle; thrust builds per the ignition envelope */
function ignitionThrust(t: number): number {
  return smoothstep(-8.2, -4, t) * 0.0; // integrator samples already include the held thrust
}

function pose(p: Partial<CameraPose> & Pick<CameraPose, 'position' | 'target' | 'focal'>): CameraPose {
  return {
    fStop: 4, focusDistance: p.position.distanceTo(p.target), evComp: 0, shake: null, shakeTime: 0,
    shadowFocus: new THREE.Vector3(0, 0, 0), shadowExtent: 300, envProbe: new THREE.Vector3(0, 60, 0),
    ...p,
  };
}

export class ShotList {
  readonly defs: ShotDef[];
  readonly starts: number[] = [];
  readonly duration: number;
  readonly helpers: ShotHelpers;
  private readonly warps: ((x: number) => number)[];

  constructor(traj: Trajectory) {
    this.helpers = new ShotHelpers(traj);
    const ev = traj.events;
    const cT = ev.catchT;
    const catchH = catchBaseHeight();
    const pinY = catchH + CONFIG.vehicle.boosterHeight - CONFIG.vehicle.hotStageHeight - CONFIG.vehicle.gridFinBelowHotStage - CONFIG.vehicle.catchPinBelowFins;

    this.defs = [
      {
        id: '1', name: 'Pre-dawn establishing', duration: 22, warp: [[0, -90], [22, -30]],
        pose: (l, m, h) => {
          const u = easeInOutSine(l / 22);
          const p0 = new THREE.Vector3(-938, G + 3.0, 1018), p3 = new THREE.Vector3(-916, G + 3.2, 996);
          const pos = bezier3(p0, p0.clone().lerp(p3, 0.33).add(new THREE.Vector3(2, 0.1, 0)), p0.clone().lerp(p3, 0.66).add(new THREE.Vector3(-1, 0.1, 0)), p3, u);
          const tgt = new THREE.Vector3(0, 38 + 10 * u, 0);
          return pose({
            position: pos, target: tgt, focal: 35, fStop: 2.8, focusDistance: pos.distanceTo(tgt), evComp: 0.2,
            shake: { ...h.shake(pos, new THREE.Vector3(), m, 0.22, true, 0), thrustNorm: 0 }, shakeTime: l,
            shadowFocus: new THREE.Vector3(-300, 0, 300), shadowExtent: 900, envProbe: new THREE.Vector3(0, 60, 0),
          });
        },
      },
      {
        id: '2', name: 'Tower detail pan', duration: 13, warp: [[0, -30], [13, -17]],
        pose: (l, m, h) => {
          const u = smootherstep(0, 13, l);
          const pos = new THREE.Vector3(-82 + 3 * u, G + 1.7, 108 - 2 * u);
          const tgtA = TOWER.clone().add(new THREE.Vector3(4, -6, 4));
          const tgtB = TOWER.clone().add(new THREE.Vector3(10, CONFIG.site.tower.carriageParkHeight, 5));
          const tgtC = new THREE.Vector3(0, 98, 0);
          const tgt = u < 0.55 ? tgtA.clone().lerp(tgtB, smootherstep(0, 0.55, u)) : tgtB.clone().lerp(tgtC, smootherstep(0.55, 1, u));
          const focus = lerp(13, pos.distanceTo(tgtC), smootherstep(0.25, 0.75, u));
          return pose({
            position: pos, target: tgt, focal: 85, fStop: 2.0, focusDistance: focus, evComp: 0.2,
            shake: h.shake(pos, new THREE.Vector3(), m, 0.7, true, 0), shakeTime: l + 100,
            shadowFocus: new THREE.Vector3(-30, 0, 30), shadowExtent: 220,
          });
        },
      },
      {
        id: '3', name: 'Base ignition, low angle', duration: 23, warp: [[0, -17], [14, -6.6], [23, 0]],
        pose: (l, m, h) => {
          const pos = new THREE.Vector3(43, G + 1.1, 42);
          const up = smoothstep(-8.5, -2, m);
          const tgt = new THREE.Vector3(0, 6 + 14 * up, 0);
          const ign = smoothstep(-8.4, -7.6, m);
          return pose({
            position: pos, target: tgt, focal: 24, fStop: 4, focusDistance: 58, evComp: lerp(0.1, -1.0, ign),
            shake: h.shake(pos, new THREE.Vector3(0, -10, 0), m, 1.8, false, 1), shakeTime: l + 200,
            shadowFocus: new THREE.Vector3(10, 0, 10), shadowExtent: 120, heat: 1.5,
            lensWater: clamp(smoothstep(-6, -2, m) * 0.9, 0, 1), anamorphic: 0.25,
          });
        },
      },
      {
        id: '4', name: 'Remote long-lens liftoff', duration: 37, warp: [[0, 0], [10, 5.2], [37, 25]],
        pose: (l, m, h) => {
          const pos = new THREE.Vector3(150, G + 3 + 2.6, 1590);
          const lag = 0.8;
          const tm = m - lag;
          const tgt = h.boosterPoint(tm, 58 + 12 * smoothstep(0, 6, tm)).add(new THREE.Vector3(0, -8 * (1 - smoothstep(0, 4, tm)), 0));
          return pose({
            position: pos, target: tgt, focal: 300, fStop: 5.6, focusDistance: pos.distanceTo(h.boosterPoint(m - 0.3, 60)), evComp: -0.4,
            shake: h.shake(pos, new THREE.Vector3(), m, 1.2, false, 0), shakeTime: l + 300,
            shadowFocus: new THREE.Vector3(0, 0, 0), shadowExtent: 450, heat: 2.2, anamorphic: 0.2,
          });
        },
      },
      {
        id: '5', name: 'Tower-top departure', duration: 15, warp: [[0, 3], [15, 14]],
        pose: (l, m, h) => {
          const pos = TOWER.clone().add(new THREE.Vector3(6.5, 121, 5.5));
          const tgt = h.boosterPoint(m - 0.25, 8).add(new THREE.Vector3(0, -4, 0));
          const white = smoothstep(13.6, 15, l);
          return pose({
            position: pos, target: tgt, focal: 14, fStop: 5.6, focusDistance: 30, evComp: -1.3,
            shake: h.shake(pos, h.boosterBase(m), m, 3.0, false, 1), shakeTime: l + 400,
            shadowFocus: new THREE.Vector3(-10, 0, 0), shadowExtent: 160, shutterAngle: 300, heat: 1.2,
            whiteout: white, flashGain: 0.4, blastShield: true, dof: false, near: 0.05,
          });
        },
      },
      {
        id: '6', name: 'Chase alongside', duration: 35, warp: [[0, 15], [35, 38]],
        pose: (l, m, h) => {
          const tm = m - 0.12;
          const mid = h.boosterPoint(tm, 62);
          const ang = (128 + 3 * l) * DEG;
          const dist = 170 + 40 * smoothstep(0, 35, l);
          const off = new THREE.Vector3(Math.sin(ang) * dist, -55 + 25 * smoothstep(0, 35, l), -Math.cos(ang) * dist);
          const pos = mid.clone().add(off);
          const tgt = h.boosterPoint(m, 12);
          const focal = lerp(42, 30, smootherstep(4, 30, l));
          return pose({
            position: pos, target: tgt, focal, fStop: 4, focusDistance: pos.distanceTo(tgt), evComp: -0.3,
            shake: { gain: 0.45, handheld: true, close: 0.3, thrustNorm: 0.35, distance: 150, impulses: [] }, shakeTime: l + 500,
            shadowFocus: h.boosterPoint(m, 60), shadowExtent: 160, envProbe: h.boosterPoint(m, 60), heat: 0.6,
          });
        },
      },
      {
        id: '7', name: 'Transonic vapor cone', duration: 20, warp: [[0, ev.mach1 - 5], [20, ev.mach1 + 15]],
        pose: (l, m, h) => {
          const pos = DOWNRANGE.clone().multiplyScalar(4000).add(new THREE.Vector3(0, SEA + 3.5, 0)).addScaledVector(SIDE, 600);
          const tgt = h.boosterPoint(m - 0.5, 100);
          return pose({
            position: pos, target: tgt, focal: 600, fStop: 8, focusDistance: pos.distanceTo(tgt), evComp: 0.1,
            shake: h.shake(pos, h.boosterBase(m), m, 0.6, false, 0), shakeTime: l + 600,
            shadowFocus: h.boosterPoint(m, 60), shadowExtent: 160, envProbe: h.boosterPoint(m, 60), heat: 0.8,
          });
        },
      },
      {
        id: '8', name: 'Hot staging macro', duration: 35, warp: [[0, 150], [7, 157], [27, 161], [35, 165]],
        pose: (l, m, h) => {
          const tref = Math.min(m, ev.sep + 0.5);
          const ring = h.boosterPoint(m, CONFIG.vehicle.boosterHeight - 1.6);
          const ax = h.boosterAxis(tref);
          const vel = h.boosterVel(tref).normalize();
          const side = new THREE.Vector3().crossVectors(ax, SIDE).normalize();
          const push = smootherstep(1, 8, l);
          const pull = smootherstep(26, 35, l);
          const along = lerp(lerp(95, 14, push), 60, pull);
          const lat = lerp(lerp(45, 30, push), 170, pull);
          const pos = ring.clone().addScaledVector(ax, along).addScaledVector(SIDE, lat).addScaledVector(side, lerp(18, 8, push));
          pos.addScaledVector(vel, -0.0);
          const tgt = ring.clone().addScaledVector(ax, lerp(-6, 1.5, push) + 22 * pull);
          const focal = lerp(lerp(70, 35, push), 30, pull);
          return pose({
            position: pos, target: tgt, focal, fStop: 5.6, focusDistance: pos.distanceTo(ring), evComp: -0.6,
            shake: { gain: 0.35 + 1.5 * Math.exp(-Math.max(0, m - ev.hotStage) * 1.5) * (m > ev.hotStage ? 1 : 0), handheld: true, close: 0.5, thrustNorm: 0.4, distance: 60, impulses: [m - ev.hotStage, m - ev.sep] },
            shakeTime: l + 700, shadowFocus: ring, shadowExtent: 120, envProbe: ring, flashGain: 0.35, up: ax.clone(), heat: 0.4,
          });
        },
      },
      {
        id: '9', name: 'Booster flip and boostback', duration: 25, warp: [[0, 165], [25, 200]],
        pose: (l, m, h) => {
          const c = h.boosterPoint(m, 36);
          // slightly below the booster looking out towards the horizon: Earth curvature in frame
          const pos = c.clone().addScaledVector(SIDE, 125 + 35 * smoothstep(0, 25, l)).add(new THREE.Vector3(0, -40, 0)).addScaledVector(DOWNRANGE, -30);
          const focal = lerp(26, 40, smootherstep(2, 22, l));
          return pose({
            position: pos, target: c.clone().add(new THREE.Vector3(0, 8, 0)), focal, fStop: 5.6, focusDistance: pos.distanceTo(c), evComp: -0.3,
            shake: { gain: 0.3, handheld: true, close: 0.2, thrustNorm: 0.3, distance: 120, impulses: [] }, shakeTime: l + 800,
            shadowFocus: c, shadowExtent: 110, envProbe: c, heat: 0.3,
          });
        },
      },
      {
        id: '10', name: 'Ship to space, Earth limb', duration: 20, warp: [[0, 250], [20, 420]],
        pose: (l, m, h) => {
          const sp = h.shipBase(m);
          const v = h.shipVel(m).normalize();
          const back = lerp(2500, 12000, easeOutQuad(l / 20));
          const upL = sp.clone().add(new THREE.Vector3(0, 6_371_000, 0)).normalize();
          // to the south of the ship, slightly ahead and above: ship + trailing plume fan against the dark
          // upper atmosphere with the curved limb low in frame
          const pos = sp.clone().addScaledVector(SIDE, back).addScaledVector(v, back * 0.25).addScaledVector(upL, back * 0.18);
          const tgt = sp.clone().addScaledVector(v, -back * 0.18).addScaledVector(upL, -back * 0.12);
          return pose({
            position: pos, target: tgt, focal: 35, fStop: 8, focusDistance: back, evComp: -0.2, up: upL,
            shake: { gain: 0.15, handheld: true, close: 0, thrustNorm: 0, distance: 1000, impulses: [] }, shakeTime: l + 900,
            shadowFocus: sp, shadowExtent: 80, envProbe: sp, dof: false, heat: 0,
          });
        },
      },
      {
        id: '11', name: 'Catch: landing burn', duration: 15, warp: [[0, cT - 21], [11, cT - 4], [15, cT]],
        pose: (l, m, h) => {
          const pos = TOWER.clone().add(new THREE.Vector3(24, G + 1.7, 196));
          const tm = m - 0.6;
          const tgt = h.boosterPoint(tm, 36).lerp(new THREE.Vector3(-6, catchH + 30, 0), smoothstep(cT - 10, cT, tm));
          return pose({
            position: pos, target: tgt, focal: 100, fStop: 4, focusDistance: pos.distanceTo(h.boosterPoint(m, 36)), evComp: -0.5,
            shake: h.shake(pos, h.boosterBase(m), m, 1.0, false, 0.2), shakeTime: l + 1000,
            shadowFocus: new THREE.Vector3(-10, 0, 0), shadowExtent: 220, envProbe: new THREE.Vector3(0, catchH + 30, 0), heat: 1.2,
          });
        },
      },
      {
        id: '11B', name: 'Catch: on the arms', duration: 10, warp: [[0, cT], [3, cT + 1.6], [10, cT + 7]],
        pose: (l, m, h) => {
          const close = new THREE.Vector3(-14, pinY + 2.5, 24);
          const wide = new THREE.Vector3(-55, 25, 250);
          const u = smootherstep(1.6, 10, l);
          const pos = close.clone().lerp(wide, u);
          const tgt = new THREE.Vector3(-4.5, pinY, 0).lerp(new THREE.Vector3(-18, 60, 0), u);
          const focal = lerp(35, 45, u);
          return pose({
            position: pos, target: tgt, focal, fStop: 4, focusDistance: pos.distanceTo(tgt), evComp: -0.3,
            shake: h.shake(pos, new THREE.Vector3(0, pinY, 0), m, 0.9, true, 0.5), shakeTime: l + 1100,
            shadowFocus: new THREE.Vector3(-12, catchH, 0), shadowExtent: 160, envProbe: new THREE.Vector3(0, pinY, 0),
            fade: 1 - smoothstep(7, 10, l), heat: 0.5,
          });
        },
      },
    ];
    let acc = 0;
    for (const d of this.defs) {
      this.starts.push(acc);
      acc += d.duration;
    }
    this.duration = acc;
    this.warps = this.defs.map((d) => makeWarp(d.warp));
  }

  /** Shot state at cinematic time cin. */
  at(cin: number): ShotState {
    let i = this.defs.length - 1;
    while (i > 0 && cin < this.starts[i]) i--;
    const d = this.defs[i];
    const local = clamp(cin - this.starts[i], 0, d.duration);
    return { index: i, id: d.id, name: d.name, local, duration: d.duration, start: this.starts[i], mission: this.warps[i](local) };
  }

  /** Cinematic time of the first frame of shot index i. */
  startOf(i: number): number {
    return this.starts[clamp(i, 0, this.defs.length - 1)];
  }

  pose(s: ShotState, _ctx: unknown): CameraPose {
    return this.defs[s.index].pose(s.local, s.mission, this.helpers);
  }

  /** Find a cinematic time whose mission time equals `mission` (first shot that covers it). */
  cinForMission(mission: number): number {
    for (let i = 0; i < this.defs.length; i++) {
      const w = this.defs[i].warp;
      if (mission >= w[0][1] && mission <= w[w.length - 1][1]) {
        let lo = 0, hi = this.defs[i].duration;
        for (let k = 0; k < 40; k++) {
          const mid = (lo + hi) / 2;
          if (this.warps[i](mid) < mission) lo = mid; else hi = mid;
        }
        return this.starts[i] + (lo + hi) / 2;
      }
    }
    return 0;
  }
}
