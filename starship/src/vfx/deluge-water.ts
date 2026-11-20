import { CONFIG } from '../config';
import type { EmitterDef } from './particles';

/**
 * Deluge water (Section 9.8): 24 cannon jets around the deluge plate firing inward and up (ballistic
 * droplet streams with drag), a spray / mist curtain where they meet the exhaust, and a rain-out zone
 * downwind where condensed steam falls back as heavy drops. Intensity follows the deluge flow.
 */
export function delugeEmitters(budget: number): EmitterDef[] {
  const s = CONFIG.site;
  const G = -s.olmHeight;
  const jets: EmitterDef = {
    name: 'deluge-jets', count: budget * 0.6, additive: false,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float L = 1.8 + 0.6 * r0.y;
  float a = mod(T * 1.0 + r0.x * L, L);
  float j = floor(r0.z * ${s.delugeJets.toFixed(1)});
  float ang = (j + 0.5) / ${s.delugeJets.toFixed(1)} * 6.2831853 + (r1.x - 0.5) * 0.05;
  vec3 p0 = vec3(cos(ang) * ${(s.delugePlateRadius + 0.6).toFixed(2)}, ${(G + 3.5).toFixed(2)}, sin(ang) * ${(s.delugePlateRadius + 0.6).toFixed(2)});
  vec3 dir = normalize(vec3(-cos(ang), 0.55 + 0.25 * r1.y, -sin(ang)) + (r1.xyz - 0.5) * 0.08);
  vec3 v0 = dir * ${CONFIG.deluge.jetSpeed.toFixed(1)} * (0.82 + 0.3 * r0.w);
  float tau = 1.2 + 2.5 * r1.z;
  pos = dragMotion(p0, v0, a, tau, windAt(5.0) * 0.5, 9.81);
  pos = bounce(pos, ${(G + 3.6).toFixed(2)}, 0.1);
  vel = dragVel(v0, a, tau, vec3(0.0), 9.81);
  size = 0.12 + 0.35 * r1.w + a * 0.25;
  vec3 c = litColor(vec3(0.82, 0.88, 0.95), pos, 0.6);
  col = vec4(c, 0.06 * (1.0 - a / L) * smoothstep(0.0, 0.1, a));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => ctx.snap.deluge,
  };
  const mist: EmitterDef = {
    name: 'deluge-mist', count: budget * 0.06, additive: false, puffy: true,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  float L = 6.0;
  float a = mod(T + r0.x * L, L);
  float ang = r0.y * 6.2831853;
  float r = 2.0 + 14.0 * r0.z;
  vec3 p0 = vec3(cos(ang) * r, ${(G + 4.0).toFixed(2)}, sin(ang) * r);
  vec3 v0 = vec3(cos(ang) * (4.0 + 10.0 * r1.x), 3.0 + 9.0 * r1.y, sin(ang) * (4.0 + 10.0 * r1.x));
  pos = dragMotion(p0, v0, a, 2.5, windAt(8.0), 0.4);
  vel = vec3(0.0);
  size = 1.0 + 1.5 * r1.z + a * 0.6;
  vec3 c = litColor(vec3(0.9, 0.92, 0.95), pos, 0.8);
  col = vec4(c, 0.03 * (1.0 - a / L) * smoothstep(0.0, 0.5, a));
  emis = 0.0;
  return true;
}`,
    update: (ctx) => ctx.snap.deluge,
  };
  const rain: EmitterDef = {
    name: 'rain-out', count: budget * 0.12, additive: false,
    glsl: /* glsl */ `
bool emit(float id, vec4 r0, vec4 r1, float T, out vec3 pos, out float size, out vec4 col, out vec3 vel, out float emis) {
  if (T < 2.0 || T > 45.0) return false;
  float L = 9.0;
  float a = mod(T + r0.x * L, L);
  vec3 w = windAt(60.0);
  vec3 c0 = vec3(0.0, ${(G + 70.0).toFixed(1)}, 0.0) + normalize(w + 1e-3) * (120.0 + 180.0 * r0.y) + vec3((r0.z - 0.5) * 220.0, 60.0 * r1.x, (r0.w - 0.5) * 220.0);
  vec3 v0 = vec3(0.0, -7.0 - 3.0 * r1.y, 0.0);
  pos = dragMotion(c0, v0, a, 0.8, w, 9.81);
  vel = dragVel(v0, a, 0.8, w, 9.81);
  if (pos.y < GRADE) return false;
  size = 0.05 + 0.06 * r1.z;
  col = vec4(litColor(vec3(0.75, 0.8, 0.85), pos, 0.3), 0.35);
  emis = 0.0;
  return true;
}`,
    update: (ctx) => (ctx.mission > 2 && ctx.mission < 45 ? 1 : 0),
  };
  // the fine mist curtain is carried by the volumetric phase-A puffs (smoke-gpu.ts); the sprite mist is kept
  // for the Low preset only, where volumetrics are coarse
  return budget < 50000 ? [jets, mist, rain] : [jets, rain];
}
