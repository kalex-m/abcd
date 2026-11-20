import { createNoise2D, createNoise3D } from 'simplex-noise';
import { rngFor } from './rng';

const r2 = rngFor('noise2d');
const r3 = rngFor('noise3d');
/** Seeded 2D simplex noise in [-1, 1]. */
export const noise2 = createNoise2D(() => r2.next());
/** Seeded 3D simplex noise in [-1, 1]. */
export const noise3 = createNoise3D(() => r3.next());

/** Fractal Brownian motion of 2D simplex noise. */
export function fbm2(x: number, y: number, octaves = 5, lac = 2.0, gain = 0.5): number {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < octaves; i++) {
    s += a * noise2(x * f, y * f);
    f *= lac;
    a *= gain;
  }
  return s;
}

/** Ridged multifractal 2D noise in [0, ~1]. */
export function ridged2(x: number, y: number, octaves = 4): number {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2(x * f + 31.7 * i, y * f - 17.3 * i));
    s += a * n * n;
    f *= 2.1;
    a *= 0.5;
  }
  return s;
}

/**
 * The GLSL noise library shared by all shaders. Hash functions follow Dave Hoskins' "Hash without Sine";
 * gradient noise is Inigo Quilez' 3D gradient noise.
 */
export const GLSL_NOISE = /* glsl */ `
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
vec3 hash31(float p){ vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
vec4 hash41(float p){ vec4 p4 = fract(vec4(p) * vec4(.1031, .1030, .0973, .1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }

float vnoise2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
vec3 gradHash(vec3 p){ return normalize(hash33(p) * 2.0 - 1.0 + 1e-5); }
float gnoise3(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); vec3 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  float a = dot(gradHash(i+vec3(0,0,0)), f-vec3(0,0,0)); float b = dot(gradHash(i+vec3(1,0,0)), f-vec3(1,0,0));
  float c = dot(gradHash(i+vec3(0,1,0)), f-vec3(0,1,0)); float d = dot(gradHash(i+vec3(1,1,0)), f-vec3(1,1,0));
  float e = dot(gradHash(i+vec3(0,0,1)), f-vec3(0,0,1)); float g = dot(gradHash(i+vec3(1,0,1)), f-vec3(1,0,1));
  float h = dot(gradHash(i+vec3(0,1,1)), f-vec3(0,1,1)); float k = dot(gradHash(i+vec3(1,1,1)), f-vec3(1,1,1));
  return mix(mix(mix(a,b,u.x), mix(c,d,u.x), u.y), mix(mix(e,g,u.x), mix(h,k,u.x), u.y), u.z) * 1.6;
}
float fbm3(vec3 p, int oct){ float s = 0.0, a = 0.5; for(int i=0;i<8;i++){ if(i>=oct) break; s += a*gnoise3(p); p = p*2.03 + vec3(17.1, -3.7, 9.2); a *= 0.5; } return s; }
float fbm2(vec2 p, int oct){ float s = 0.0, a = 0.5; for(int i=0;i<10;i++){ if(i>=oct) break; s += a*(vnoise2(p)*2.0-1.0); p = mat2(1.6,1.2,-1.2,1.6)*p + 7.3; a *= 0.5; } return s; }
float worley3(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); float d = 1.0;
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec3 o = vec3(x,y,z); vec3 r = o + hash33(i+o) - f; d = min(d, dot(r,r)); }
  return sqrt(d); }
float worley2(vec2 p, out vec2 cellId){ vec2 i = floor(p); vec2 f = fract(p); float d = 8.0; cellId = i;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 o = vec2(x,y); vec2 h = hash22(i+o); vec2 r = o + h - f; float dd = dot(r,r); if(dd<d){ d = dd; cellId = i+o; } }
  return sqrt(d); }
vec3 curl3(vec3 p){
  const float e = 0.1;
  vec3 dx = vec3(e,0,0), dy = vec3(0,e,0), dz = vec3(0,0,e);
  float n1 = gnoise3(p+dy+vec3(31.4)), n2 = gnoise3(p-dy+vec3(31.4)), n3 = gnoise3(p+dz+vec3(-12.7)), n4 = gnoise3(p-dz+vec3(-12.7));
  float n5 = gnoise3(p+dz), n6 = gnoise3(p-dz), n7 = gnoise3(p+dx+vec3(31.4)), n8 = gnoise3(p-dx+vec3(31.4));
  float n9 = gnoise3(p+dx+vec3(-12.7)), n10 = gnoise3(p-dx+vec3(-12.7)), n11 = gnoise3(p+dy), n12 = gnoise3(p-dy);
  return vec3((n1-n2)-(n3-n4), (n5-n6)-(n7-n8), (n9-n10)-(n11-n12)) / (2.0*e);
}
`;
