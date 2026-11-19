import { CONFIG } from '../config';
import type { EmitterDef } from './particles';

/**
 * Ascent exhaust trail (Section 9.3): puffs released behind the plume along the actual trajectory
 * (positions at birth from the trajectory texture), then advected by the wind at their altitude, so the
 * column bends with the shear and the jet stream; width grows as w0 + 0.12 * age^0.9 (faster in thin
 * air); orange-tinted while young, then light grey; fades with age and altitude.
 */
export function contrailEmitter(): EmitterDef {
  const c = CONFIG.contrail;
  return {
    name: 'contrail', count: c.puffs, additive: false, puffy: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = 2.0 + 150.0 * (id + r0.x) / N_PARTICLES;
  float a = T - tb;
  if (a < 0.0 || a > ${c.life.toFixed(1)}) return false;
  vec3 vp = vehPos(0, tb);
  vec3 ax = vehAxis(0, tb);
  float alt = vp.y + ${CONFIG.site.olmHeight.toFixed(1)};
  float behind = 30.0 + 90.0 * r0.y + alt * 0.004;
  vec3 side = normalize(cross(ax, vec3(0.3, 0.1, 0.9)));
  vec3 side2 = cross(ax, side);
  float ang = r0.z * 6.2831853;
  vec3 p0 = vp - ax * behind + (side * cos(ang) + side2 * sin(ang)) * 4.0 * r0.w;
  float thin = 1.0 + alt / 9000.0;
  float w = ${c.w0.toFixed(1)} + ${c.growth.toFixed(3)} * pow(a, ${c.growthExp.toFixed(2)}) * 40.0 * thin;
  pos = p0 + windAt(alt) * a + (side * cos(ang) + side2 * sin(ang)) * w * 0.4 * r1.x + vec3(0.0, -a * 0.15, 0.0);
  vel = vec3(0.0);
  size = w * (0.8 + 0.4 * r1.y);
  float young = exp(-a / 2.5);
  vec3 alb = mix(vec3(0.82, 0.8, 0.78), vec3(1.0, 0.7, 0.45), young * 0.6);
  float altFade = 1.0 - smoothstep(35000.0, 55000.0, alt);
  float alpha = 0.3 * smoothstep(0.0, 0.8, a) * (1.0 - smoothstep(${(c.life * 0.4).toFixed(1)}, ${c.life.toFixed(1)}, a)) * altFade / (1.0 + a * 0.02);
  col = vec4(litColor(alb, pos, 0.75), alpha);
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > 2 ? 1 : 0),
  };
}
