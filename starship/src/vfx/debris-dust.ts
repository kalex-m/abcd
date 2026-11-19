import { CONFIG } from '../config';
import type { EmitterDef } from './particles';

/**
 * Debris and ejecta (Section 9.11): gravel, concrete chips, sand and paint flakes blasted from the pad
 * at liftoff (ballistic with drag, one bounce, restitution 0.2), embers glowing for the first ~1.5 s,
 * the radial "dust cannon" of tan grit along the plume outflow, and the landing-burn dust bloom at
 * the catch.
 */
export function debrisEmitters(budget: number, catchT: number): EmitterDef[] {
  const G = -CONFIG.site.olmHeight;
  const rest = CONFIG.debris.restitution.toFixed(2);
  const gravel: EmitterDef = {
    name: 'debris', count: budget * 0.55, additive: false,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = -1.0 + 6.0 * pow(r0.x, 1.8);
  float a = T - tb;
  if (a < 0.0 || a > 12.0) return false;
  float ang = r0.y * 6.2831853;
  vec3 p0 = vec3(cos(ang) * (2.0 + 10.0 * r0.z), ${(G + 1.0).toFixed(2)}, sin(ang) * (2.0 + 10.0 * r0.z));
  float sp = 20.0 + 75.0 * pow(r1.x, 1.5);
  vec3 v0 = vec3(cos(ang) * sp, 6.0 + 40.0 * r1.y * r1.y, sin(ang) * sp);
  float tau = mix(1.2, 7.0, r1.z);
  pos = dragMotion(p0, v0, a, tau, windAt(5.0), 9.81);
  pos = bounce(pos, GRADE + 0.05, ${rest});
  vel = dragVel(v0, a, tau, vec3(0.0), 9.81);
  size = mix(0.04, 0.25, r1.w * r1.w);
  vec3 alb = mix(vec3(0.28, 0.25, 0.22), vec3(0.55, 0.5, 0.42), r0.w);
  col = vec4(litColor(alb, pos, 0.2), 0.9 * (1.0 - smoothstep(8.0, 12.0, a)));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > -1.5 && ctx.mission < 13 ? 1 : 0),
  };
  const embers: EmitterDef = {
    name: 'embers', count: budget * 0.03, additive: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = -1.0 + 4.0 * r0.x;
  float a = T - tb;
  if (a < 0.0 || a > 4.0) return false;
  float ang = r0.y * 6.2831853;
  vec3 p0 = vec3(cos(ang) * 6.0 * r0.z, ${(G + 4.0).toFixed(2)}, sin(ang) * 6.0 * r0.z);
  float sp = 15.0 + 55.0 * r1.x;
  vec3 v0 = vec3(cos(ang) * sp, 10.0 + 35.0 * r1.y, sin(ang) * sp);
  pos = dragMotion(p0, v0, a, 1.5 + 2.0 * r1.z, windAt(10.0), 9.81);
  pos = bounce(pos, GRADE + 0.05, 0.3);
  vel = dragVel(v0, a, 2.0, vec3(0.0), 9.81);
  size = 0.04 + 0.08 * r1.w;
  float heat = exp(-a / ${CONFIG.debris.emberTime.toFixed(2)});
  col = vec4(mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.75, 0.4), heat) * 12.0 * heat, 1.0);
  emis = 1.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > -1.2 && ctx.mission < 7 ? 1 : 0),
  };
  const cannon: EmitterDef = {
    name: 'dust-cannon', count: Math.min(12000, budget * 0.06), additive: false, puffy: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = -3.0 + 9.0 * pow(r0.x, 1.4);
  float a = T - tb;
  if (a < 0.0 || a > 22.0) return false;
  float ang = r0.y * 6.2831853;
  float sp = ${CONFIG.smoke.dustRingSpeed.toFixed(1)} * (0.55 + 0.6 * r1.x);
  vec3 p0 = vec3(cos(ang) * 12.0, ${(G + 2.0).toFixed(2)}, sin(ang) * 12.0);
  vec3 v0 = vec3(cos(ang) * sp, 2.0 + 6.0 * r1.y, sin(ang) * sp);
  pos = dragMotion(p0, v0, a, 3.5, windAt(6.0), 0.3);
  pos.y = max(pos.y, GRADE + 1.0);
  vel = vec3(0.0);
  size = 3.0 + 4.0 * r1.z + a * 1.6;
  vec3 alb = vec3(0.62, 0.52, 0.4);
  col = vec4(litColor(alb, pos, 0.5), 0.22 * smoothstep(0.0, 0.6, a) * (1.0 - smoothstep(10.0, 22.0, a)));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > -3 && ctx.mission < 26 ? 1 : 0),
  };
  const landing: EmitterDef = {
    name: 'landing-dust', count: Math.min(8000, budget * 0.04), additive: false, puffy: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = ${(catchT - 12).toFixed(2)} + 13.0 * r0.x;
  float a = T - tb;
  if (a < 0.0 || a > 16.0) return false;
  float ang = r0.y * 6.2831853;
  vec3 p0 = vec3(cos(ang) * 10.0 * r0.z, ${(G + 3.0).toFixed(2)}, sin(ang) * 10.0 * r0.z);
  float sp = 10.0 + 35.0 * r1.x;
  vec3 v0 = vec3(cos(ang) * sp, 3.0 + 14.0 * r1.y, sin(ang) * sp);
  pos = dragMotion(p0, v0, a, 3.0, windAt(10.0), 0.2);
  pos.y = max(pos.y, GRADE + 1.0);
  vel = vec3(0.0);
  size = 2.0 + 3.0 * r1.z + a * 1.4;
  vec3 alb = mix(vec3(0.62, 0.52, 0.4), vec3(0.9, 0.9, 0.92), step(0.5, r1.w));
  col = vec4(litColor(alb, pos, 0.5), 0.2 * smoothstep(0.0, 0.5, a) * (1.0 - smoothstep(8.0, 16.0, a)));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (Math.abs(ctx.mission - catchT) < 20 ? 1 : 0),
  };
  return [gravel, embers, cannon, landing];
}
