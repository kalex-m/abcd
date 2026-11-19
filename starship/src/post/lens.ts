import * as THREE from 'three';
import { rngFor } from '../util/rng';

/**
 * Lens imperfections: procedural lens-dirt texture (smudges + dust specks + a fingerprint arc) used to
 * modulate bloom, and GLSL for barrel/pincushion distortion, chromatic aberration and optical vignette.
 */
export function makeLensDirt(size = 512): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = 'rgb(40,40,40)';
  g.fillRect(0, 0, size, size);
  const r = rngFor('lensdirt');
  for (let i = 0; i < 60; i++) {
    const x = r.next() * size, y = r.next() * size, rad = r.range(20, 110);
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const a = r.range(0.03, 0.12);
    grd.addColorStop(0, `rgba(255,255,255,${a})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 400; i++) {
    const x = r.next() * size, y = r.next() * size, rad = r.range(0.6, 3.2);
    g.fillStyle = `rgba(255,255,255,${r.range(0.15, 0.5)})`;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let k = 0; k < 14; k++) {
    g.lineWidth = r.range(1, 3);
    g.beginPath();
    g.arc(size * 0.7, size * 0.35, 60 + k * 6, 2.2, 3.9);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export const LENS_GLSL = /* glsl */ `
// Brown-Conrady radial distortion; k > 0 barrel, k < 0 pincushion
vec2 lensDistort(vec2 uv, float k, float aspect) {
  vec2 c = uv - 0.5;
  c.x *= aspect;
  float r2 = dot(c, c);
  vec2 d = c * (1.0 + k * r2 + k * 0.5 * r2 * r2);
  d.x /= aspect;
  // rescale so the corners stay inside the frame
  float s = 1.0 + k * 0.25 * (aspect * aspect + 1.0) * 0.5;
  return d / s + 0.5;
}
`;
