import * as THREE from 'three';
import { CONFIG, type QualityPreset, type PresetName } from './config';
import { Clock } from './clock';
import { Timeline, type Snapshot } from './timeline';
import { simulateMission, type Trajectory } from './physics/staging';
import { AtmosphereSky } from './sky/atmosphere-sky';
import { sunDirectionAt } from './sky/sun-moon-stars';
import { Composer, type ComposeParams, type VolumePass } from './post/composer';
import { SHARED } from './post/shared';
import { VehicleStates, type VehicleState } from './vehicle/state';
import { ShotList, type CameraPose, type ShotState } from './camera/shots';
import { CameraRig } from './camera/rig';
import { DEG, smoothstep, clamp } from './util/math';

/** Everything a system may read during an update. Systems never mutate it. */
export interface FrameContext {
  cin: number; // s cinematic time
  dtCin: number; // s
  mission: number; // s mission time T
  dtMission: number; // s
  shot: ShotState;
  snap: Snapshot;
  timeline: Timeline;
  traj: Trajectory;
  booster: VehicleState;
  ship: VehicleState;
  /** true-world position of the scene origin (m); scene coords = true - origin */
  origin: THREE.Vector3;
  camera: THREE.PerspectiveCamera;
  camTrue: THREE.Vector3;
  pose: CameraPose;
  sunDir: THREE.Vector3;
  sunColor: THREE.Vector3; // scene illuminance (rgb) at the camera
  sunElevationDeg: number;
  preset: QualityPreset;
  presetName: PresetName;
  record: boolean;
  cut: boolean;
  frame: number;
  safeFlashes: boolean;
  reduceMotion: boolean;
  /** mission time as heard/felt at a true-world point (sound travel delay from the pad) */
  delayed: (distance: number) => number;
}

export interface System {
  readonly name: string;
  update(ctx: FrameContext): void;
  dispose(): void;
}

export interface EngineOptions {
  preset: PresetName;
  record: boolean;
  width: number;
  height: number;
  pixelRatio: number;
}

export interface EngineHooks {
  smoke: VolumePass | null;
  clouds: VolumePass | null;
}

/**
 * Single Engine object: owns renderer, scenes, clock, timeline, physics and the system registry.
 * Update order: Clock -> Timeline -> Physics(state lookup) -> Camera -> systems (vehicle, VFX, site) ->
 * Audio (external) -> Render.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly fxScene = new THREE.Scene();
  readonly heatScene = new THREE.Scene();
  readonly world = new THREE.Group(); // origin-relative static world (site, terrain)
  readonly camera: THREE.PerspectiveCamera;
  readonly clock: Clock;
  readonly traj: Trajectory;
  readonly timeline: Timeline;
  readonly shots: ShotList;
  readonly rig: CameraRig;
  readonly sky: AtmosphereSky;
  readonly composer: Composer;
  readonly sun: THREE.DirectionalLight;
  readonly vehicles: VehicleStates;
  readonly systems: System[] = [];
  readonly hooks: EngineHooks = { smoke: null, clouds: null };
  readonly preset: QualityPreset;
  presetName: PresetName;
  readonly record: boolean;
  readonly origin = new THREE.Vector3();
  frame = 0;
  safeFlashes = false;
  reduceMotion = false;
  letterbox = false;
  freeFly = false;
  photoMode = false;
  ctx!: FrameContext;
  private lastShotIndex = -1;
  private lastEnvUpdate = -1e9;
  private lastMission = -1e9;
  private prevBooster = new THREE.Vector3();
  private prevShip = new THREE.Vector3();
  private lastCin = 0;
  private dynamicScale = 1;
  width: number;
  height: number;
  private pixelRatio: number;
  onAfterUpdate: ((ctx: FrameContext) => void) | null = null;
  /** Overrides the shot camera (shots harness / free-fly). */
  cameraOverride: ((ctx: FrameContext) => CameraPose) | null = null;
  missionOverride: number | null = null;

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions) {
    this.preset = { ...(CONFIG_PRESETS()[opts.preset]) };
    this.presetName = opts.preset;
    this.record = opts.record;
    this.width = opts.width;
    this.height = opts.height;
    this.pixelRatio = opts.pixelRatio;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, logarithmicDepthBuffer: true, powerPreference: 'high-performance',
      preserveDrawingBuffer: opts.record, alpha: false, stencil: false,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.info.autoReset = true;

    this.camera = new THREE.PerspectiveCamera(40, opts.width / opts.height, CONFIG.camera.near, CONFIG.camera.far);
    this.camera.layers.enable(5);
    this.camera.layers.enable(6);
    this.scene.add(this.camera);
    this.scene.add(this.world);
    this.fxScene.matrixWorldAutoUpdate = true;

    this.traj = simulateMission();
    this.timeline = new Timeline(this.traj.events);
    this.shots = new ShotList(this.traj);
    this.clock = new Clock(this.shots.duration, opts.record);
    this.rig = new CameraRig(this.camera);
    this.vehicles = new VehicleStates(this.traj);

    this.sky = new AtmosphereSky(this.renderer, this.preset.envMapSize);
    this.scene.add(this.sky.dome);

    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.preset.shadowMapSize, this.preset.shadowMapSize);
    this.sun.shadow.bias = -0.0002;
    this.sun.shadow.normalBias = 0.04;
    this.sun.shadow.radius = 2;
    this.scene.add(this.sun, this.sun.target);

    this.composer = new Composer(this.renderer, this.preset, this.sky);
    this.setSize(opts.width, opts.height, opts.pixelRatio);
  }

  register(s: System): void {
    this.systems.push(s);
  }

  setSize(w: number, h: number, pr: number): void {
    this.width = w;
    this.height = h;
    this.pixelRatio = pr;
    const scale = this.record ? 1 : this.preset.renderScale * this.dynamicScale;
    const iw = Math.max(2, Math.floor(w * pr * scale));
    const ih = Math.max(2, Math.floor(h * pr * scale));
    this.renderer.setSize(iw, ih, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(iw, ih);
    this.hooks.smoke?.setSize(Math.floor(iw * this.preset.volumetricScale), Math.floor(ih * this.preset.volumetricScale));
    this.hooks.clouds?.setSize(Math.floor(iw * this.preset.volumetricScale), Math.floor(ih * this.preset.volumetricScale));
  }

  /** Adaptive-resolution governor hook. */
  setDynamicScale(s: number): void {
    const c = clamp(s, 0.6, 1);
    if (Math.abs(c - this.dynamicScale) < 0.01) return;
    this.dynamicScale = c;
    this.setSize(this.width, this.height, this.pixelRatio);
  }

  get internalSize(): [number, number] {
    return [this.composer.width, this.composer.height];
  }

  /** Build the frame context for cinematic time `cin` and run every system. */
  update(cin: number, dtCin: number): FrameContext {
    const shot = this.shots.at(cin);
    const mission = this.missionOverride ?? shot.mission;
    const cut = shot.index !== this.lastShotIndex || Math.abs(mission - this.lastMission) > 2.5 || dtCin < 0;
    this.lastShotIndex = shot.index;
    const dtMission = cut ? 0 : mission - this.lastMission;
    this.lastMission = mission;
    const snap = this.timeline.at(mission, this.safeFlashes);
    this.vehicles.update(mission, snap);
    const booster = this.vehicles.booster;
    const ship = this.vehicles.ship;

    // sun
    const s = sunDirectionAt(mission);
    const sunDir = new THREE.Vector3(...s.dir);

    // camera pose (shot or override), in true world coordinates
    const partial = { cin, mission, booster, ship, shot, snap, traj: this.traj, sunDir } as unknown as FrameContext;
    const pose = this.cameraOverride ? this.cameraOverride(partial) : this.shots.pose(shot, partial);
    // floating origin: rebase when the camera is far from the current origin
    const camTrue = pose.position.clone();
    if (camTrue.distanceTo(this.origin) > 10_000 || (camTrue.length() < 5000 && this.origin.lengthSq() > 0)) {
      const next = camTrue.length() < 5000 ? new THREE.Vector3() : new THREE.Vector3(Math.round(camTrue.x / 1000) * 1000, Math.round(camTrue.y / 1000) * 1000, Math.round(camTrue.z / 1000) * 1000);
      this.origin.copy(next);
      this.composer.motionBlur.reset();
    }
    this.world.position.copy(this.origin).negate();
    this.rig.apply(pose, this.origin, dtCin, cut, mission, this.reduceMotion);

    const camAltM = camTrue.y + CONFIG.site.olmHeight + CONFIG.planet.siteElevation;
    const T = AtmosphereSky.cpuTransmittance(Math.max(1, camAltM), sunDir.y);
    const E = CONFIG.lighting.sunIlluminanceTOA * CONFIG.lighting.luxScale;
    const sunColor = new THREE.Vector3(T[0] * E, T[1] * E, T[2] * E);

    const ctx: FrameContext = {
      cin, dtCin, mission, dtMission, shot, snap, timeline: this.timeline, traj: this.traj, booster, ship,
      origin: this.origin, camera: this.camera, camTrue, pose, sunDir, sunColor, sunElevationDeg: s.elevation,
      preset: this.preset, presetName: this.presetName, record: this.record, cut, frame: this.frame,
      safeFlashes: this.safeFlashes, reduceMotion: this.reduceMotion,
      delayed: (d: number) => mission - d / CONFIG.shock.speedOfSound,
    };
    this.ctx = ctx;

    // shared uniforms
    SHARED.uTime.value = cin;
    SHARED.uMission.value = mission;
    SHARED.uSunDirW.value.copy(sunDir);
    SHARED.uSunColor.value.copy(sunColor);
    SHARED.uCamPosW.value.copy(this.camera.position);
    SHARED.uOrigin.value.copy(this.origin);
    SHARED.uGroundY.value = -CONFIG.site.olmHeight;

    // sky + lights
    const camXZ = new THREE.Vector2(camTrue.x / 1000, camTrue.z / 1000);
    const starAmount = (1 - smoothstep(-6, 1.5, s.elevation)) * 1.0 + smoothstep(25_000, 60_000, camAltM) * 3.0;
    this.sky.update(this.renderer, sunDir, camAltM / 1000, camXZ, cin, starAmount * CONFIG.sky.starBrightness);
    this.updateSun(ctx);
    for (const sys of this.systems) sys.update(ctx);
    this.updateEnv(ctx);
    this.composer.setTwilight(s.elevation < 1.0 ? 1 : 0);
    this.onAfterUpdate?.(ctx);
    return ctx;
  }

  private updateSun(ctx: FrameContext): void {
    const c = ctx.sunColor;
    const m = Math.max(c.x, c.y, c.z, 1e-6);
    this.sun.color.setRGB(c.x / m, c.y / m, c.z / m, THREE.LinearSRGBColorSpace);
    this.sun.intensity = m;
    this.sun.visible = ctx.sunDir.y > -0.02;
    // shadow box focused on the shot's shadow target
    const focus = ctx.pose.shadowFocus.clone().sub(this.origin);
    const half = ctx.pose.shadowExtent;
    const sh = this.sun.shadow.camera as THREE.OrthographicCamera;
    sh.left = -half; sh.right = half; sh.top = half; sh.bottom = -half;
    sh.near = 1; sh.far = half * 6 + 2000;
    sh.updateProjectionMatrix();
    // snap the light position to shadow texels to avoid shimmering
    const texel = (2 * half) / this.preset.shadowMapSize;
    const dist = half * 3 + 800;
    const lp = focus.clone().addScaledVector(ctx.sunDir, dist);
    lp.x = Math.round(lp.x / texel) * texel;
    lp.z = Math.round(lp.z / texel) * texel;
    this.sun.position.copy(lp);
    this.sun.target.position.copy(lp).addScaledVector(ctx.sunDir, -dist);
    this.sun.target.updateMatrixWorld();
  }

  private updateEnv(ctx: FrameContext): void {
    const fiery = ctx.booster.thrustMN > 1 || ctx.ship.thrustMN > 1 || ctx.snap.hotStageFire > 0;
    const interval = fiery ? CONFIG.lighting.envFireUpdateInterval : CONFIG.lighting.envUpdateInterval;
    if (ctx.cut || ctx.cin - this.lastEnvUpdate > interval || ctx.cin < this.lastEnvUpdate) {
      const at = ctx.pose.envProbe.clone().sub(this.origin);
      this.scene.environment = this.sky.captureEnv(this.renderer, at);
      this.lastEnvUpdate = ctx.cin;
    }
  }

  /** Render the current context to the canvas (or to a target). */
  render(target: THREE.WebGLRenderTarget | null = null, accumulate?: { index: number; count: number }): void {
    const ctx = this.ctx;
    const pose = ctx.pose;
    const dispB = ctx.booster.position.clone().sub(this.prevBooster);
    const dispS = ctx.ship.position.clone().sub(this.prevShip);
    if (ctx.cut) { dispB.set(0, 0, 0); dispS.set(0, 0, 0); }
    this.prevBooster.copy(ctx.booster.position);
    this.prevShip.copy(ctx.ship.position);
    const camPos = this.camera.position;
    const p: ComposeParams = {
      scene: this.scene, fxScene: this.fxScene, heatScene: this.heatScene, camera: this.camera,
      smoke: this.hooks.smoke, clouds: this.hooks.clouds,
      cloudsInFront: ctx.camTrue.y + CONFIG.site.olmHeight > CONFIG.sky.cloudBase,
      dispBooster: dispB, dispShip: dispS,
      vehicleDist: [ctx.booster.position.clone().sub(this.origin).distanceTo(camPos), ctx.ship.position.clone().sub(this.origin).distanceTo(camPos)],
      focal: this.rig.focal, fStop: this.rig.fStop, focus: this.rig.focus, sensorH: CONFIG.camera.sensor[1],
      shutter: (pose.shutterAngle ?? CONFIG.camera.shutterAngle) / 360,
      evComp: this.rig.evComp, fade: pose.fade ?? 1, letterbox: this.letterbox, distortion: this.rig.distortion,
      frame: this.frame, cut: ctx.cut, dt: Math.max(1 / 240, Math.abs(ctx.cin - this.lastCin)),
      heat: pose.heat ?? 1, lensWater: pose.lensWater ?? 0, flash: ctx.snap.sepFlash * (pose.flashGain ?? 0.4),
      enableMotionBlur: true, enableDof: pose.dof !== false, anamorphic: pose.anamorphic ?? 0.12,
      accumulate: !!accumulate,
    };
    this.lastCin = ctx.cin;
    const hdr = this.composer.renderHDR(p);
    if (accumulate) {
      this.composer.accumulate(hdr, 1 / accumulate.count, accumulate.index === 0);
      if (accumulate.index === accumulate.count - 1) this.composer.present(this.composer.accumRT.texture, p, target);
    } else {
      this.composer.present(hdr, p, target);
    }
    this.frame++;
  }

  dispose(): void {
    for (const s of this.systems) s.dispose();
    this.composer.dispose();
    this.sky.dispose();
    this.renderer.dispose();
  }
}

import { PRESETS } from './config';
function CONFIG_PRESETS(): typeof PRESETS {
  return PRESETS;
}

export { DEG };
