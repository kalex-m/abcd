import * as THREE from 'three';

/** Camera path helpers: Catmull-Rom / cubic Bezier evaluation and easing. */

/** Centripetal Catmull-Rom through points, parameter u in [0, 1] over the whole path. */
export function catmullRom(points: THREE.Vector3[], u: number, out = new THREE.Vector3()): THREE.Vector3 {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return out.copy(curve.getPoint(Math.min(1, Math.max(0, u))));
}

/** Cubic Bezier between p0 and p3 with control points p1, p2. */
export function bezier3(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const u = 1 - t;
  return out
    .copy(p0).multiplyScalar(u * u * u)
    .addScaledVector(p1, 3 * u * u * t)
    .addScaledVector(p2, 3 * u * t * t)
    .addScaledVector(p3, t * t * t);
}

export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * Math.min(1, Math.max(0, t))) - 1) / 2;
export const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);
export const easeInQuad = (t: number): number => t * t;
