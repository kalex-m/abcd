import { CONFIG } from '../config';
import { DEG, table } from '../util/math';

/**
 * NOAA solar position algorithm (Meeus-based, as published in the NOAA Solar Calculator spreadsheet).
 * Returns elevation and azimuth (deg, azimuth clockwise from north) for a UTC date at lat/lon.
 */
export function solarPosition(date: Date, latDeg: number, lonDeg: number): { elevation: number; azimuth: number } {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const jc = (jd - 2451545) / 36525;
  const geomMeanLong = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  const geomMeanAnom = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const ecc = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const m = geomMeanAnom * DEG;
  const eqCtr = Math.sin(m) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + Math.sin(2 * m) * (0.019993 - 0.000101 * jc) + Math.sin(3 * m) * 0.000289;
  const trueLong = geomMeanLong + eqCtr;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * jc) * DEG);
  const meanObliq = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
  const obliqCorr = meanObliq + 0.00256 * Math.cos((125.04 - 1934.136 * jc) * DEG);
  const decl = Math.asin(Math.sin(obliqCorr * DEG) * Math.sin(appLong * DEG));
  const y = Math.tan((obliqCorr / 2) * DEG) ** 2;
  const L0 = geomMeanLong * DEG;
  const eqTime = 4 / DEG * (y * Math.sin(2 * L0) - 2 * ecc * Math.sin(m) + 4 * ecc * y * Math.sin(m) * Math.cos(2 * L0) - 0.5 * y * y * Math.sin(4 * L0) - 1.25 * ecc * ecc * Math.sin(2 * m));
  const utcMinutes = (jd + 0.5 - Math.floor(jd + 0.5)) * 1440;
  const trueSolarTime = (((utcMinutes + eqTime + 4 * lonDeg) % 1440) + 1440) % 1440;
  const hourAngle = trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180;
  const lat = latDeg * DEG;
  const cosZen = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle * DEG);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZen)));
  let elevation = 90 - zenith / DEG;
  // atmospheric refraction (NOAA approximation)
  const e = elevation;
  let refr = 0;
  if (e > 85) refr = 0;
  else if (e > 5) refr = 58.1 / Math.tan(e * DEG) - 0.07 / Math.tan(e * DEG) ** 3 + 0.000086 / Math.tan(e * DEG) ** 5;
  else if (e > -0.575) refr = 1735 + e * (-518.2 + e * (103.4 + e * (-12.79 + e * 0.711)));
  else refr = -20.772 / Math.tan(e * DEG);
  elevation += refr / 3600;
  let az: number;
  const sinZ = Math.sin(zenith);
  if (Math.abs(sinZ) < 1e-9) az = 180;
  else {
    const c = (Math.sin(lat) * Math.cos(zenith) - Math.sin(decl)) / (Math.cos(lat) * sinZ);
    const a = Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
    az = hourAngle > 0 ? (a + 180) % 360 : (540 - a) % 360;
  }
  return { elevation, azimuth: az };
}

/** Local date of the sun model at mission time t (s), including the cinematic pre-roll offset. */
export function sunDateAt(missionT: number): Date {
  const base = new Date(CONFIG.time.localISO).getTime();
  const offMin = missionT <= 0 ? table(CONFIG.time.preRollSunOffsetMin, missionT) : missionT / 60;
  return new Date(base + offMin * 60000);
}

/** World-space unit sun direction (x east, y up, z south) at mission time t. */
export function sunDirectionAt(missionT: number): { dir: [number, number, number]; elevation: number; azimuth: number } {
  const { elevation, azimuth } = solarPosition(sunDateAt(missionT), CONFIG.time.latDeg, CONFIG.time.lonDeg);
  const el = elevation * DEG, az = azimuth * DEG;
  return { dir: [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)], elevation, azimuth };
}

/**
 * Procedural star field + Milky Way band (GLSL). Stars: hashed cells on a cube-sphere grid with a
 * magnitude distribution; twinkle scintillation scales with the airmass below the twinkle altitude.
 */
export const STARS_GLSL = /* glsl */ `
vec3 starField(vec3 rd, float time, float twinkle) {
  vec3 col = vec3(0.0);
  vec3 a = abs(rd);
  vec2 uv; float face;
  if (a.x > a.y && a.x > a.z) { uv = rd.yz / a.x; face = rd.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y > a.z) { uv = rd.xz / a.y; face = rd.y > 0.0 ? 2.0 : 3.0; }
  else { uv = rd.xy / a.z; face = rd.z > 0.0 ? 4.0 : 5.0; }
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 180.0 : 420.0;
    vec2 g = uv * scale;
    vec2 cell = floor(g);
    vec2 f = fract(g);
    vec3 h = hash33(vec3(cell, face * 17.0 + float(layer) * 101.0));
    float present = step(layer == 0 ? 0.93 : 0.975, h.z);
    vec2 c = h.xy * 0.8 + 0.1;
    float d = length(f - c);
    float mag = pow(hash13(vec3(cell, face + 3.0)), 9.0);
    float tw = 1.0 + twinkle * 0.6 * sin(time * (8.0 + h.x * 20.0) + h.y * 40.0);
    float b = present * mag * tw * smoothstep(0.12, 0.0, d) * (layer == 0 ? 6.0 : 1.5);
    vec3 tint = mix(vec3(1.0, 0.85, 0.7), vec3(0.75, 0.85, 1.0), h.x);
    col += b * tint;
  }
  // Milky Way: noisy band around a tilted great circle
  vec3 gp = normalize(vec3(0.3, 0.55, -0.78));
  float band = exp(-pow(dot(rd, gp) / 0.16, 2.0));
  float n = fbm3(rd * 6.0, 4) * 0.5 + 0.5;
  float dust = smoothstep(0.35, 0.7, fbm3(rd * 11.0 + 4.0, 3) * 0.5 + 0.5);
  col += vec3(0.55, 0.6, 0.7) * band * n * (1.0 - 0.7 * dust) * 0.08;
  return col;
}
`;
