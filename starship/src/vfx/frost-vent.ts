import * as THREE from 'three';
import { CONFIG } from '../config';
import type { EmitterDef } from './particles';

/**
 * Cryogenic venting (Sections 3.7, 9.13): dense LOX vapour leaving the booster / ship vents, spilling
 * out and sinking down along the hull because it is colder than the air; a low ground fog pooling
 * around the mount and drifting with the wind (T-90 .. T-8); relief-valve wisps at the tank farm; and
 * ice chips shed from the frosted belts at liftoff (tumbling glints trailing behind the vehicle).
 */
export function ventEmitters(budget: number, ports: THREE.Vector3[], tankVents: THREE.Vector3[], heading: number): EmitterDef[] {
  const G = -CONFIG.site.olmHeight;
  // vent ports are given in booster-local coordinates; rotate by the pad heading
  const portW = ports.map((p) => p.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), heading));
  const P = portW.map((p) => `vec3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`).join(', ');
  const TV = tankVents.map((p) => `vec3(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`).join(', ');
  const vent: EmitterDef = {
    name: 'lox-vent', count: Math.min(budget * 0.05, 30000), additive: false, puffy: true,
    glsl: /* glsl */ `
const vec3 PORTS[${portW.length}] = vec3[${portW.length}](${P});
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float L = 4.5 + 2.5 * r0.y;
  float a = mod(T + r0.x * L, L);
  int k = int(mod(id, ${portW.length.toFixed(1)}));
  vec3 port = PORTS[k];
  // ship vents: the same ports shifted up the stack (header and main tanks)
  if (r1.w > 0.6) port += vec3(0.0, ${CONFIG.vehicle.boosterHeight.toFixed(1)} + 8.0 * r1.z - port.y + 72.0 + 24.0 * step(0.8, r1.w), 0.0);
  vec3 outward = normalize(vec3(port.x, 0.0, port.z) + 1e-3);
  vec3 v0 = outward * (2.5 + 3.5 * r1.x) + vec3((r1.y - 0.5) * 1.5, -0.5, 0.0);
  vec3 p = dragMotion(port + outward * 0.3, v0, a, 1.6, windAt(port.y + 20.0) * 0.25, 3.2);
  // cold vapour hugs the hull: pull back towards the cylinder while sinking
  vec2 rad = p.xz;
  float rr = length(rad);
  float hug = smoothstep(0.0, 2.0, a) * 0.8;
  p.xz = rad / max(rr, 1e-3) * mix(rr, 4.8 + a * 0.6, hug);
  p.y = max(p.y, GRADE + 1.0);
  pos = p;
  vel = vec3(0.0);
  size = 0.4 + a * 0.45 + 0.6 * r0.z;
  col = vec4(litColor(vec3(0.92, 0.94, 0.97), pos, 0.35), 0.045 * smoothstep(0.0, 0.5, a) * pow(1.0 - a / L, 2.0));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => ctx.snap.ventLevel,
  };
  const fog: EmitterDef = {
    name: 'ground-fog', count: Math.min(2500, budget * 0.004), additive: false, puffy: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float L = 40.0;
  float a = mod(T + r0.x * L, L);
  float ang = r0.y * 6.2831853;
  float r = 6.0 + 30.0 * sqrt(r0.z);
  vec3 p0 = vec3(cos(ang) * r, ${(G + 0.8).toFixed(2)}, sin(ang) * r);
  pos = p0 + windAt(3.0) * 0.5 * a + vec3(cos(ang), 0.0, sin(ang)) * a * 1.2;
  pos.y = GRADE + 0.5 + 2.5 * r1.x + a * 0.05;
  vel = vec3(0.0);
  size = 6.0 + 10.0 * r1.y + a * 0.4;
  col = vec4(litColor(vec3(0.85, 0.88, 0.92), pos, 0.6), 0.035 * smoothstep(0.0, 4.0, a) * (1.0 - a / L));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission < -6 ? Math.min(1, ctx.snap.ventLevel * 1.2) * (1 - Math.max(0, (ctx.mission + 10) / 4)) : 0),
  };
  const wisps: EmitterDef = {
    name: 'tank-wisps', count: 1500, additive: false, puffy: true,
    glsl: /* glsl */ `
const vec3 TV[${tankVents.length}] = vec3[${tankVents.length}](${TV});
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float L = 7.0;
  float a = mod(T + r0.x * L, L);
  vec3 v = TV[int(mod(id, ${tankVents.length.toFixed(1)}))];
  pos = v + vec3(0.0, a * 1.2, 0.0) + windAt(v.y + 20.0) * a * 0.8 + (r1.xyz - 0.5) * a;
  vel = vec3(0.0);
  size = 0.4 + a * 0.45;
  col = vec4(litColor(vec3(0.95), pos, 0.6), 0.12 * (1.0 - a / L) * smoothstep(0.0, 0.5, a));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission < 30 ? 1 : 0.4),
  };
  const ice: EmitterDef = {
    name: 'ice-chips', count: CONFIG.vehicle.iceChips * 3, additive: false,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float tb = 0.0 + 12.0 * pow(r0.x, 1.3);
  float a = T - tb;
  if (a < 0.0 || a > 14.0) return false;
  vec3 vp = vehPos(0, tb);
  vec3 ax = vehAxis(0, tb);
  vec3 vv = (vehPos(0, tb + 0.05) - vp) * 20.0;
  float ang = r0.y * 6.2831853;
  vec3 radial = normalize(vec3(cos(ang), 0.0, sin(ang)));
  vec3 p0 = vp + ax * (8.0 + 38.0 * r0.z) + radial * 4.6;
  vec3 v0 = vv * 0.95 + radial * (2.0 + 4.0 * r1.x);
  pos = dragMotion(p0, v0, a, 4.0, windAt(p0.y + 20.0), 9.81);
  pos = bounce(pos, GRADE + 0.05, 0.15);
  vel = dragVel(v0, a, 4.0, vec3(0.0), 9.81);
  size = 0.12 + 0.35 * r1.y;
  float glint = pow(max(0.0, sin(a * (6.0 + 10.0 * r1.z) + r1.w * 20.0)), 16.0);
  vec3 c = litColor(vec3(0.9, 0.93, 0.97), pos, 0.3) + uSunColor * glint * 1.5;
  col = vec4(c, 0.85);
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > 0 && ctx.mission < 26 ? 1 : 0),
  };
  return [vent, fog, wisps, ice];
}
