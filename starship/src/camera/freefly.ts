import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Engine } from '../engine';
import type { CameraPose } from './shots';

/** Free-fly camera (toggle F): WASD + mouse look (pointer lock), Q/E down/up, Shift fast, wheel = focal length. */
export class FreeFly {
  active = false;
  private pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private focal = 35;
  private keys = new Set<string>();

  constructor(private engine: Engine) {
    window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('mousemove', (e) => {
      if (!this.active || document.pointerLockElement !== engine.renderer.domElement) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - e.movementY * 0.0022));
    });
    window.addEventListener('wheel', (e) => {
      if (!this.active) return;
      this.focal = Math.max(10, Math.min(1200, this.focal * Math.exp(-e.deltaY * 0.001)));
    }, { passive: true });
    engine.renderer.domElement.addEventListener('click', () => {
      if (this.active) engine.renderer.domElement.requestPointerLock();
    });
  }

  toggle(): void {
    this.active = !this.active;
    this.engine.freeFly = this.active;
    if (this.active) {
      const c = this.engine.camera;
      this.pos.copy(c.position).add(this.engine.origin);
      const d = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion);
      this.yaw = Math.atan2(-d.x, -d.z);
      this.pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
      this.focal = this.engine.rig.focal;
      this.engine.clock.playing = false;
      this.engine.cameraOverride = (ctx) => this.pose(ctx);
    } else {
      this.engine.cameraOverride = null;
      document.exitPointerLock?.();
    }
  }

  private pose(ctx: Parameters<NonNullable<Engine['cameraOverride']>>[0]): CameraPose {
    const dir = new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
    const base = this.engine.shots.pose(ctx.shot, ctx);
    return { ...base, position: this.pos.clone(), target: this.pos.clone().add(dir.multiplyScalar(100)), focal: this.focal, fStop: 8, focusDistance: 100, shake: null, fade: 1, whiteout: 0, blastShield: false, up: undefined, roll: 0, shadowFocus: this.pos.clone().add(dir), envProbe: this.pos.clone() };
  }

  tick(dt: number): void {
    if (!this.active) return;
    const fast = this.keys.has('shift');
    const sp = (fast ? CONFIG.camera.freeFlyFast : CONFIG.camera.freeFlySpeed) * dt;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    if (this.keys.has('w')) this.pos.addScaledVector(fwd, sp);
    if (this.keys.has('s')) this.pos.addScaledVector(fwd, -sp);
    if (this.keys.has('d')) this.pos.addScaledVector(right, sp);
    if (this.keys.has('a')) this.pos.addScaledVector(right, -sp);
    if (this.keys.has('e')) this.pos.y += sp;
    if (this.keys.has('q')) this.pos.y -= sp;
    this.engine.update(this.engine.clock.cin, 0);
  }
}
