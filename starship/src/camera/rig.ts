import * as THREE from 'three';
import { CONFIG } from '../config';
import { computeShake } from './shake';
import type { CameraPose } from './shots';

/**
 * Physical camera model: full-frame sensor, focal length -> vertical FOV, f-stop / focus / shutter / ISO
 * (EV100 reported), lens distortion by focal length, subtle lens breathing on focus pulls, layered shake
 * applied about a pivot behind the sensor for handheld shots.
 */
export class CameraRig {
  focal = 35; // mm
  fStop = 2.8;
  focus = 100; // m
  evComp = 0;
  distortion = 0;
  ev100 = 0;
  private readonly tmpQ = new THREE.Quaternion();
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor(readonly camera: THREE.PerspectiveCamera) {}

  /** Vertical FOV (deg) for a focal length (mm) on the configured sensor. */
  static fovFor(focalMm: number): number {
    return (2 * Math.atan(CONFIG.camera.sensor[1] / (2 * focalMm)) * 180) / Math.PI;
  }

  apply(pose: CameraPose, origin: THREE.Vector3, _dt: number, _cut: boolean, _mission: number, reduceMotion: boolean): void {
    const cam = this.camera;
    this.focal = pose.focal;
    this.fStop = pose.fStop;
    this.focus = pose.focusDistance;
    this.evComp = pose.evComp;
    // lens breathing: focusing closer narrows the field slightly
    const breathing = 1 + 0.015 * Math.min(1, 30 / Math.max(this.focus, 1));
    cam.fov = CameraRig.fovFor(this.focal * breathing);
    cam.near = pose.near ?? CONFIG.camera.near;
    cam.updateProjectionMatrix();
    if (pose.jitter) {
      // sub-pixel jitter for record-mode accumulation (anti-aliasing)
      cam.projectionMatrix.elements[8] += pose.jitter[0];
      cam.projectionMatrix.elements[9] += pose.jitter[1];
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    }
    // wide lenses barrel, long lenses slight pincushion
    this.distortion = this.focal < 35 ? (35 - this.focal) / 35 * 0.09 : -Math.min(0.02, (this.focal - 35) / 2000);
    const shutterS = (CONFIG.camera.shutterAngle / 360) / CONFIG.camera.fps;
    this.ev100 = Math.log2((this.fStop * this.fStop) / shutterS) - Math.log2(CONFIG.camera.iso / 100);

    const pos = pose.position.clone().sub(origin);
    const tgt = pose.target.clone().sub(origin);
    cam.position.copy(pos);
    cam.up.copy(pose.up ?? new THREE.Vector3(0, 1, 0));
    cam.lookAt(tgt);
    if (pose.roll) {
      this.tmpQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), pose.roll);
      cam.quaternion.multiply(this.tmpQ);
    }
    // shake
    const sh = pose.shake;
    if (sh && sh.gain > 0) {
      const g = sh.gain * (reduceMotion ? 0.5 : 1);
      const o = computeShake(pose.shakeTime, sh.thrustNorm, sh.distance, sh.impulses, sh.handheld, sh.close, g);
      this.euler.set(o.pitch, o.yaw, o.roll);
      this.tmpQ.setFromEuler(this.euler);
      if (sh.handheld) {
        // rotate about a pivot 0.1 m behind the sensor
        const back = new THREE.Vector3(0, 0, 0.1).applyQuaternion(cam.quaternion);
        const pivot = cam.position.clone().add(back);
        cam.quaternion.multiply(this.tmpQ);
        const nb = new THREE.Vector3(0, 0, 0.1).applyQuaternion(cam.quaternion);
        cam.position.copy(pivot).sub(nb);
        cam.position.add(new THREE.Vector3(o.dx, o.dy, o.dz).applyQuaternion(cam.quaternion));
      } else {
        cam.quaternion.multiply(this.tmpQ);
      }
    }
    cam.updateMatrixWorld(true);
  }
}
