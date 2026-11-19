/**
 * Film emulation helpers: luminance-dependent animated grain (strongest in mid-tones, as film),
 * blue-noise-like triangular dither for banding-free gradients.
 */
export const GRAIN_GLSL = /* glsl */ `
float grainHash(vec2 p, float t) { vec3 p3 = fract(vec3(p.xyx + t) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 filmGrain(vec3 c, vec2 fragCoord, float frame, float amount) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float w = amount * (1.0 - smoothstep(0.2, 1.0, l)) * smoothstep(0.0, 0.2, l) * 0.55 + amount * 0.12;
  float n = grainHash(fragCoord * 0.71, frame * 1.618) + grainHash(fragCoord * 1.37 + 7.0, frame * 2.414) - 1.0;
  return c + n * w * vec3(1.0, 0.97, 0.94);
}
vec3 ditherTri(vec3 c, vec2 fragCoord, float frame) {
  float a = grainHash(fragCoord, frame * 0.37 + 1.0);
  float b = grainHash(fragCoord + 17.0, frame * 0.53 + 3.0);
  return c + (a + b - 1.0) / 255.0;
}
`;
