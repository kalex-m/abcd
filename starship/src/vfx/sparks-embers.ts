import { CONFIG } from '../config';
import type { EmitterDef } from './particles';
import { boosterLayout } from '../vehicle/engines-layout';
import { boosterAscentWindows } from '../physics/engine-schedule';

/**
 * Sparks: torch-igniter showers at each booster engine (40 ms before light-up, staggered per the
 * ignition sequence), staging debris glints (metal flakes with specular sparkle), and the shower of
 * sparks when the chopstick arms close on the catch pins.
 */
export function sparkEmitters(budget: number, catchT: number, pinY: number): EmitterDef[] {
  const slots = boosterLayout();
  const on = boosterAscentWindows().on;
  // pack engine positions + light-up times into a constant table
  const table = slots.map((s, i) => `vec4(${s.x.toFixed(3)}, ${s.z.toFixed(3)}, ${on[i].toFixed(3)}, 0.0)`).join(',\n  ');
  const igniter: EmitterDef = {
    name: 'igniter-sparks', count: Math.min(budget * 0.03, 33 * 120), additive: true,
    glsl: /* glsl */ `
const vec4 ENG[33] = vec4[33](
  ${table}
);
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  int e = int(mod(id, 33.0));
  vec4 eg = ENG[e];
  float tb = eg.z - 0.06 + 0.25 * r0.x;
  float a = T - tb;
  if (a < 0.0 || a > 0.9) return false;
  vec3 p0 = vec3(eg.x, -0.6, eg.y);
  vec3 v0 = vec3((r1.x - 0.5) * 20.0, -25.0 - 30.0 * r1.y, (r1.z - 0.5) * 20.0);
  pos = dragMotion(p0, v0, a, 0.5, vec3(0.0), 9.81);
  vel = dragVel(v0, a, 0.5, vec3(0.0), 9.81);
  size = 0.02 + 0.03 * r0.w;
  float k = exp(-a / 0.2);
  col = vec4(vec3(1.0, 0.82, 0.5) * 22.0 * k, 1.0);
  emis = 1.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > -8.5 && ctx.mission < -5 ? 1 : 0),
  };
  const staging: EmitterDef = {
    name: 'staging-flakes', count: Math.min(budget * 0.005, 2500), additive: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = ${CONFIG.physics.hotStageT.toFixed(2)} + 1.8 * r0.x;
  float a = T - tb;
  if (a < 0.0 || a > 6.0) return false;
  vec3 c = vehPos(0, tb) + vehAxis(0, tb) * ${CONFIG.vehicle.boosterHeight.toFixed(1)};
  vec3 vb = (vehPos(0, tb + 0.1) - vehPos(0, tb)) * 10.0;
  float ang = r0.y * 6.2831853;
  vec3 ax = vehAxis(0, tb);
  vec3 side = normalize(cross(ax, vec3(0.0, 0.0, 1.0)));
  vec3 side2 = cross(ax, side);
  vec3 radial = side * cos(ang) + side2 * sin(ang);
  vec3 v0 = vb + radial * (30.0 + 90.0 * r1.x) + ax * (r1.y - 0.5) * 40.0;
  pos = c + radial * 4.6 + v0 * a;
  vel = v0 - vb;
  size = 0.02 + 0.04 * r1.z;
  float glint = pow(max(0.0, sin(a * (20.0 + 30.0 * r1.w) + r0.z * 30.0)), 12.0);
  float hot = exp(-a / 0.8);
  col = vec4(mix(vec3(1.0, 0.5, 0.15) * 5.0 * hot, vec3(1.0) * 9.0 * glint, 0.5), 1.0);
  emis = 1.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > CONFIG.physics.hotStageT - 0.5 && ctx.mission < CONFIG.physics.hotStageT + 9 ? 1 : 0),
  };
  const catchSparks: EmitterDef = {
    name: 'catch-sparks', count: 700, additive: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = ${(catchT - 0.2).toFixed(2)} + 0.9 * r0.x;
  float a = T - tb;
  if (a < 0.0 || a > 2.5) return false;
  float side = r0.y < 0.5 ? -1.0 : 1.0;
  vec3 p0 = vec3((r0.z - 0.5) * 2.0, ${(pinY).toFixed(2)}, side * 5.6);
  vec3 v0 = vec3((r1.x - 0.5) * 18.0, 2.0 + 10.0 * r1.y, side * (3.0 + 10.0 * r1.z));
  pos = dragMotion(p0, v0, a, 1.5, vec3(0.0), 9.81);
  vel = dragVel(v0, a, 1.5, vec3(0.0), 9.81);
  size = 0.02 + 0.03 * r1.w;
  col = vec4(vec3(1.0, 0.7, 0.35) * 14.0 * exp(-a / 0.5), 1.0);
  emis = 1.0;
  return true;
}`,
    update: (ctx) => (Math.abs(ctx.mission - catchT) < 4 ? 1 : 0),
  };
  return [igniter, staging, catchSparks];
}
