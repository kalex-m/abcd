import { CONFIG } from '../config';

/**
 * Shared atmosphere GLSL (Hillaire 2020, "A Scalable and Production Ready Sky and Atmosphere Rendering
 * Technique"). Units inside: kilometres, planet centred. Transmittance LUT uses Bruneton's (r, mu)
 * parametrisation; sky-view LUT uses Hillaire's non-linear latitude mapping.
 */
const pl = CONFIG.planet;
const f = (n: number) => n.toFixed(8);
const v3 = (a: [number, number, number], s: number) => `vec3(${f(a[0] * s)}, ${f(a[1] * s)}, ${f(a[2] * s)})`;

export const ATMOS_GLSL = /* glsl */ `
#ifndef ATMOS_INCLUDED
#define ATMOS_INCLUDED
#define A_PI 3.14159265359
const float RG = ${f(pl.skyRadius / 1000)};
const float RT = ${f(pl.skyTop / 1000)};
const vec3 RAY_SCAT = ${v3(pl.rayleighScattering, 1000)};
const float MIE_SCAT = ${f(pl.mieScattering * 1000)};
const float MIE_EXT = ${f(pl.mieExtinction * 1000)};
const vec3 OZONE_ABS = ${v3(pl.ozoneAbsorption, 1000)};
const float RAY_H = ${f(pl.rayleighScale / 1000)};
const float MIE_H = ${f(pl.mieScale / 1000)};
const float MIE_G = ${f(pl.mieG)};
const vec3 GROUND_ALBEDO = ${v3(pl.groundAlbedo, 1)};

uniform sampler2D tTransmittance;
uniform sampler2D tMultiScat;

// nearest/farthest intersection distances of a ray with a centred sphere, (-1,-1) on miss
vec2 raySphere(vec3 ro, vec3 rd, float R) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - R * R;
  float d = b * b - c;
  if (d < 0.0) return vec2(-1.0);
  float s = sqrt(d);
  return vec2(-b - s, -b + s);
}

void mediumAt(float h, out vec3 scatR, out float scatM, out vec3 ext) {
  float dR = exp(-max(h, 0.0) / RAY_H);
  float dM = exp(-max(h, 0.0) / MIE_H);
  float dO = max(0.0, 1.0 - abs(h - 25.0) / 15.0);
  scatR = RAY_SCAT * dR;
  scatM = MIE_SCAT * dM;
  ext = scatR + vec3(MIE_EXT * dM) + OZONE_ABS * dO;
}

vec2 transmittanceUV(float r, float mu) {
  float H = sqrt(RT * RT - RG * RG);
  float rho = sqrt(max(0.0, r * r - RG * RG));
  float disc = r * r * (mu * mu - 1.0) + RT * RT;
  float d = max(0.0, -r * mu + sqrt(max(disc, 0.0)));
  float dmin = RT - r, dmax = rho + H;
  return vec2((d - dmin) / max(dmax - dmin, 1e-4), rho / H);
}

vec3 getTransmittance(float r, float mu) {
  if (r > RT) {
    // outside the atmosphere: rays that miss the shell are unattenuated
    float disc = r * r * (mu * mu - 1.0) + RT * RT;
    if (disc < 0.0 || mu > 0.0) return vec3(1.0);
    float t = -r * mu - sqrt(disc);
    float r2 = sqrt(r * r + t * t + 2.0 * r * t * mu);
    float mu2 = (r * mu + t) / r2;
    r = RT - 1e-3; mu = mu2;
  }
  return texture2D(tTransmittance, transmittanceUV(r, mu)).rgb;
}

vec3 getMultiScat(float r, float muS) {
  vec2 uv = vec2(clamp(muS * 0.5 + 0.5, 0.0, 1.0), clamp((r - RG) / (RT - RG), 0.0, 1.0));
  return texture2D(tMultiScat, uv).rgb;
}

float phaseRayleigh(float c) { return 3.0 / (16.0 * A_PI) * (1.0 + c * c); }
float phaseMie(float c, float g) {
  float g2 = g * g;
  return 3.0 / (8.0 * A_PI) * ((1.0 - g2) * (1.0 + c * c)) / ((2.0 + g2) * pow(max(1.0 + g2 - 2.0 * g * c, 1e-4), 1.5));
}

// Sun visibility from a point (planet shadow + transmittance)
vec3 sunTransmittance(vec3 p, vec3 sunDir) {
  float r = length(p);
  vec3 up = p / r;
  float muS = dot(up, sunDir);
  vec2 hit = raySphere(p, sunDir, RG);
  if (hit.x > 0.0) return vec3(0.0);
  return getTransmittance(r, muS);
}

/**
 * Single + approximated multiple scattering integration along ro + t*rd for t in [0, tMax] (km).
 * Returns in-scattered luminance per unit sun illuminance in L and the transmittance in T.
 */
void integrateAtmos(vec3 ro, vec3 rd, vec3 sunDir, float tMax, int steps, bool addGround, out vec3 L, out vec3 T) {
  L = vec3(0.0); T = vec3(1.0);
  vec2 top = raySphere(ro, rd, RT);
  if (top.y <= 0.0) return;
  float tStart = max(top.x, 0.0);
  vec2 gnd = raySphere(ro, rd, RG);
  float tEnd = top.y;
  bool hitsGround = gnd.x > 0.0;
  if (hitsGround) tEnd = min(tEnd, gnd.x);
  tEnd = min(tEnd, tMax);
  if (tEnd <= tStart) return;
  float cosT = dot(rd, sunDir);
  float pR = phaseRayleigh(cosT);
  float pM = phaseMie(cosT, MIE_G);
  float tPrev = tStart;
  for (int i = 0; i < 64; i++) {
    if (i >= steps) break;
    // quadratic distribution concentrates samples near the camera
    float x = (float(i) + 0.3) / float(steps);
    float t = mix(tStart, tEnd, x * x);
    float dt = t - tPrev;
    tPrev = t;
    vec3 p = ro + rd * t;
    float r = length(p);
    float h = r - RG;
    vec3 sR; float sM; vec3 ext;
    mediumAt(h, sR, sM, ext);
    vec3 Ts = sunTransmittance(p, sunDir);
    vec3 ms = getMultiScat(r, dot(p / r, sunDir));
    vec3 S = sR * (pR * Ts + ms) + sM * (pM * Ts + ms);
    vec3 stepT = exp(-ext * dt);
    vec3 Sint = (S - S * stepT) / max(ext, vec3(1e-6));
    L += T * Sint;
    T *= stepT;
  }
  if (addGround && hitsGround && gnd.x <= tMax) {
    vec3 p = ro + rd * gnd.x;
    vec3 n = normalize(p);
    float nl = max(dot(n, sunDir), 0.0);
    L += T * sunTransmittance(p + n * 1e-3, sunDir) * nl * GROUND_ALBEDO / A_PI;
  }
}

// Sky-view LUT parametrisation (Hillaire 2020, UvToSkyViewLutParams / inverse)
vec2 skyViewParamsToUV(bool intersectGround, float viewZenithCos, float lightViewCos, float r) {
  float vHorizon = sqrt(max(r * r - RG * RG, 0.0));
  float cosBeta = vHorizon / r;
  float beta = acos(clamp(cosBeta, -1.0, 1.0));
  float zenithHorizonAngle = A_PI - beta;
  float viewZenith = acos(clamp(viewZenithCos, -1.0, 1.0));
  vec2 uv;
  if (!intersectGround) {
    float coord = viewZenith / zenithHorizonAngle;
    coord = 1.0 - coord;
    coord = sqrt(max(coord, 0.0));
    coord = 1.0 - coord;
    uv.y = coord * 0.5;
  } else {
    float coord = (viewZenith - zenithHorizonAngle) / beta;
    coord = sqrt(max(coord, 0.0));
    uv.y = coord * 0.5 + 0.5;
  }
  float coordX = -lightViewCos * 0.5 + 0.5;
  coordX = sqrt(max(coordX, 0.0));
  uv.x = coordX;
  return uv;
}
#endif
`;
