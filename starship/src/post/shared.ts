import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * Uniforms shared by reference between the composer and every FX / volumetric material, so that a
 * single per-frame update reaches all shaders. GLSL helpers for log-depth linearisation, soft particles
 * and smoke/cloud transmittance lookups live in SHARED_GLSL.
 */
export const SHARED = {
  tDepth: { value: null as THREE.Texture | null },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uLogFar: { value: Math.log2(CONFIG.camera.far + 1) }, // log2(far + 1)
  uTime: { value: 0 }, // s cinematic (for noise animation)
  uMission: { value: 0 }, // s mission time
  uSunDirW: { value: new THREE.Vector3(0, 1, 0) },
  uSunColor: { value: new THREE.Vector3(1, 1, 1) }, // scene radiometric units (illuminance)
  uAmbient: { value: new THREE.Vector3(0.2, 0.25, 0.3) }, // sky irradiance / pi approx, scene units
  uAmbientGround: { value: new THREE.Vector3(0.05, 0.05, 0.05) },
  tSmokeSlices: { value: null as THREE.Texture | null },
  tCloudSlices: { value: null as THREE.Texture | null },
  uSliceDist: { value: new THREE.Vector3(100, 250, 600) }, // m, camera distances of the T slices
  uPlumeLightPos: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, // scene coordinates (m)
  uPlumeLightCol: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, // scene units * m^2
  uCamPosW: { value: new THREE.Vector3() }, // camera position in scene (origin-relative) coordinates
  uOrigin: { value: new THREE.Vector3() }, // true-world position of the scene origin (m)
  uGroundY: { value: -CONFIG.site.olmHeight }, // m, true world height of the grade
  uExposure: { value: 1 },
};

export type SharedUniforms = typeof SHARED;

export const SHARED_GLSL = /* glsl */ `
uniform sampler2D tDepth;
uniform vec2 uResolution;
uniform float uLogFar;
uniform float uTime;
uniform float uMission;
uniform vec3 uSunDirW;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform vec3 uAmbientGround;
uniform sampler2D tSmokeSlices;
uniform sampler2D tCloudSlices;
uniform vec3 uSliceDist;
uniform vec3 uPlumeLightPos[3];
uniform vec3 uPlumeLightCol[3];
uniform vec3 uCamPosW;
uniform vec3 uOrigin;
uniform float uGroundY;

// view-space distance along -z from a logarithmic depth value
float linearDepth(float d) { return d >= 0.999999 ? 1e9 : exp2(d * uLogFar) - 1.0; }
float sceneDepthAt(vec2 screenUv) { return linearDepth(texture2D(tDepth, screenUv).r); }

// Transmittance of smoke and clouds between the camera and view distance dist (piecewise-linear in slices)
// s.rgb: transmittance at uSliceDist.xyz; s.a holds the low-res depth used by the upsampler
float sliceT(vec4 s, float dist) {
  if (dist <= uSliceDist.x) return mix(1.0, s.x, dist / uSliceDist.x);
  if (dist <= uSliceDist.y) return mix(s.x, s.y, (dist - uSliceDist.x) / (uSliceDist.y - uSliceDist.x));
  if (dist <= uSliceDist.z) return mix(s.y, s.z, (dist - uSliceDist.y) / (uSliceDist.z - uSliceDist.y));
  return s.z;
}
float volumeTransmittance(vec2 screenUv, float dist) {
  return sliceT(texture2D(tSmokeSlices, screenUv), dist) * sliceT(texture2D(tCloudSlices, screenUv), dist);
}
// Illumination at a scene-space point from the three plume lights (inverse-square with soft radius)
vec3 plumeLightAt(vec3 pScene, float softR) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    vec3 d = uPlumeLightPos[i] - pScene;
    float r2 = dot(d, d) + softR * softR;
    c += uPlumeLightCol[i] / r2;
  }
  return c;
}
`;

/**
 * Pure additive blending for emissive FX (rgb += src.rgb, alpha untouched). three's AdditiveBlending
 * scales by source alpha, which emissive volumes leave at 0.
 */
export const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;

/** Premultiplied-alpha "over" blending for lit particles / smoke billboards in the FX layer. */
export const PREMULT = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
} as const;
