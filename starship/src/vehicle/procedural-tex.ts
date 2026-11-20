import * as THREE from 'three';
import { CONFIG } from '../config';
import { GLSL_NOISE } from '../util/noise';
import { FullscreenQuad, passMaterial } from '../post/fsquad';

/**
 * GPU-generated hull maps in physical-size cylindrical UV space (u = arc length around, v = height):
 * albedo (rgb), ORM (r AO, g roughness, b metalness) and tangent-space normal. Features: per-can sheet
 * tint, circumferential weld beads with heat-affected bands, staggered vertical seams, oil-canning,
 * brushed grain along the circumference, Voronoi scratches, gravity streaks. Results are cached in
 * IndexedDB keyed by the generator version and size (record mode always regenerates).
 */
export interface HullMaps {
  albedo: THREE.Texture;
  orm: THREE.Texture;
  normal: THREE.Texture;
}

const GEN = /* glsl */ `
${GLSL_NOISE}
uniform float uMode; // 0 albedo, 1 orm, 2 normal
uniform vec2 uSize; // metres (circumference, height)
uniform float uRing; // m
uniform float uSeed;
uniform float uSeams;
uniform float uBooster;
uniform vec3 uAlbedo;
uniform vec2 uRoughRange;
uniform float uRough;
uniform float uHAZ;
uniform float uBead;
varying vec2 vUv;

// distance (m) to the nearest circumferential weld and the index of the can
float ringDist(float y, out float can) { can = floor(y / uRing); float f = y - can * uRing; return min(f, uRing - f); }
// distance (m) to the nearest vertical seam of this can (seams staggered by 120 deg + jitter)
float seamDist(float x, float can) {
  float d = 1e9;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uSeams) break;
    float base = (float(i) / uSeams + fract(can * 0.3333) + (hash11(can * 7.1 + float(i) + uSeed) - 0.5) * 0.06) * uSize.x;
    float dx = abs(mod(x - base + uSize.x * 0.5, uSize.x) - uSize.x * 0.5);
    d = min(d, dx);
  }
  return d;
}
// height field (m) used for the normal map
float hgt(vec2 p) {
  float can; float rd = ringDist(p.y, can);
  float sd = seamDist(p.x, can);
  float bead = uBead * exp(-pow(rd / (0.011), 2.0)) + uBead * 0.8 * exp(-pow(sd / 0.01, 2.0));
  // oil canning: low-frequency waviness that vanishes at the welds
  float edge = smoothstep(0.0, 0.25, rd) * smoothstep(0.0, 0.35, sd);
  float oil = ${CONFIG.vehicle.oilCanAmplitude.toFixed(4)} * gnoise3(vec3(p.x * 0.55, p.y * 1.1, can * 3.1 + uSeed)) * edge;
  oil += ${(CONFIG.vehicle.oilCanAmplitude * 0.5).toFixed(4)} * gnoise3(vec3(p.x * 1.7, p.y * 2.3, can + 11.0 + uSeed)) * edge;
  // brushed grain along the circumference
  float grain = 0.00004 * (vnoise2(vec2(p.x * 3.0, p.y * 900.0)) - 0.5);
  return bead + oil + grain;
}
void main() {
  vec2 p = vUv * uSize; // metres
  float can; float rd = ringDist(p.y, can);
  float sd = seamDist(p.x, can);
  float h = p.y / uSize.y; // 0..1 along the stage
  if (uMode < 0.5) {
    vec3 a = uAlbedo;
    // per-can sheet tint (different coils of 30X stainless)
    vec3 ht = hash31(can * 13.7 + uSeed);
    a *= 0.94 + 0.08 * ht.x;
    a += vec3(-0.01, 0.0, 0.012) * (ht.y - 0.5) * 2.0;
    // heat-affected zone: straw / blue temper colours beside the weld
    float haz = exp(-pow(rd / ${CONFIG.vehicle.weldHAZ.toFixed(3)}, 2.0)) + 0.8 * exp(-pow(sd / ${(CONFIG.vehicle.weldHAZ * 0.8).toFixed(3)}, 2.0));
    vec3 temper = mix(vec3(0.70, 0.62, 0.45), vec3(0.45, 0.48, 0.62), smoothstep(0.3, 1.0, haz));
    a = mix(a, temper, clamp(haz, 0.0, 1.0) * 0.45);
    float bead = exp(-pow(rd / 0.011, 2.0)) + exp(-pow(sd / 0.01, 2.0));
    a = mix(a, a * 0.82, clamp(bead, 0.0, 1.0));
    // gravity streaks and stains (long vertical wavelengths)
    float streak = vnoise2(vec2(p.x * 2.2, p.y * 0.08 + uSeed)) * vnoise2(vec2(p.x * 0.7 + 5.0, p.y * 0.03));
    a *= 1.0 - 0.12 * smoothstep(0.25, 0.6, streak);
    // light rust-brown stains low on the booster (legs / clamps) and scuffs
    float rust = smoothstep(0.65, 0.85, fbm3(vec3(p * 0.6, uSeed), 4) * 0.5 + 0.5) * (1.0 - smoothstep(0.0, 0.18, h)) * uBooster;
    a = mix(a, vec3(0.42, 0.28, 0.17), rust * 0.35);
    // polished spots: faint blue-grey
    float pol = smoothstep(0.7, 0.9, vnoise2(p * 0.4 + uSeed));
    a = mix(a, a * vec3(0.96, 0.99, 1.04), pol);
    gl_FragColor = vec4(clamp(a, 0.0, 1.0), 1.0);
  } else if (uMode < 1.5) {
    float r = uRough + (vnoise2(p * 0.35 + uSeed) - 0.5) * (uRoughRange.y - uRoughRange.x) * 0.8;
    r += (hash11(can * 3.3 + uSeed) - 0.5) * 0.08;
    // scratches: thin Voronoi-cell edges stretched along random directions
    vec2 cid;
    float w = worley2(vec2(p.x * 4.0, p.y * 1.2), cid);
    float sc = smoothstep(0.03, 0.0, abs(w - 0.45)) * step(0.82, hash12(cid));
    r -= sc * 0.12;
    float bead = exp(-pow(rd / 0.011, 2.0)) + exp(-pow(sd / 0.01, 2.0));
    r += bead * 0.15;
    float streak = vnoise2(vec2(p.x * 2.2, p.y * 0.08 + uSeed)) * vnoise2(vec2(p.x * 0.7 + 5.0, p.y * 0.03));
    r += 0.1 * smoothstep(0.25, 0.6, streak);
    float ao = 1.0 - 0.25 * exp(-pow(rd / 0.03, 2.0)) * 0.6;
    gl_FragColor = vec4(ao, clamp(r, uRoughRange.x, uRoughRange.y), 1.0, 1.0);
  } else {
    float e = 0.004;
    float hc = hgt(p);
    float hx = hgt(p + vec2(e, 0.0));
    float hy = hgt(p + vec2(0.0, e));
    vec3 n = normalize(vec3(-(hx - hc) / e, -(hy - hc) / e, 1.0));
    gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
  }
}`;

const DB = 'starbase-cache';
const STORE = 'tex';
const VERSION = 'hull-v3';

function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await idb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => resolve((r.result as Uint8Array) ?? null);
    r.onerror = () => resolve(null);
  });
}

async function idbPut(key: string, data: Uint8Array): Promise<void> {
  const db = await idb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function toTexture(data: Uint8Array, w: number, h: number, srgb: boolean): THREE.DataTexture {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.NoColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * Generate (or load from cache) the three hull maps for a stage.
 * @param size [circumference m, height m]
 */
export async function generateHullMaps(renderer: THREE.WebGLRenderer, name: string, size: [number, number], longEdge: number, booster: boolean, useCache: boolean): Promise<HullMaps> {
  const h = longEdge;
  const w = Math.max(256, Math.pow(2, Math.round(Math.log2((longEdge * size[0]) / size[1]))));
  const quad = new FullscreenQuad();
  const v = CONFIG.vehicle;
  const mat = passMaterial(GEN, {
    uMode: { value: 0 }, uSize: { value: new THREE.Vector2(size[0], size[1]) }, uRing: { value: v.ringHeight },
    uSeed: { value: booster ? 3.7 : 9.1 }, uSeams: { value: v.seamsPerRing }, uBooster: { value: booster ? 1 : 0 },
    uAlbedo: { value: new THREE.Vector3(...v.steelAlbedo) }, uRoughRange: { value: new THREE.Vector2(...v.steelRoughnessRange) },
    uRough: { value: v.steelRoughness }, uHAZ: { value: v.weldHAZ }, uBead: { value: v.weldBeadHeight },
  });
  const out: THREE.Texture[] = [];
  const pending: Promise<void>[] = [];
  for (let mode = 0; mode < 3; mode++) {
    const key = `${VERSION}:${name}:${w}x${h}:${mode}`;
    const data = useCache ? await idbGet(key) : null;
    if (data && data.length === w * h * 4) {
      out.push(toTexture(data, w, h, mode === 0));
      continue;
    }
    const rt = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.UnsignedByteType, depthBuffer: false, generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping,
    });
    rt.texture.anisotropy = 8;
    mat.uniforms.uMode.value = mode;
    quad.render(renderer, mat, rt);
    out.push(rt.texture);
    if (useCache) {
      // asynchronous (PBO + fence) readback so the cache write never stalls the GPU
      pending.push(
        renderer.readRenderTargetPixelsAsync(rt, 0, 0, w, h, new Uint8Array(w * h * 4)).then((buf) => idbPut(key, buf as Uint8Array)).catch(() => undefined),
      );
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  void Promise.all(pending);
  mat.dispose();
  quad.dispose();
  return { albedo: out[0], orm: out[1], normal: out[2] };
}
