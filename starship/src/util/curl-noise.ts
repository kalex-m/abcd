import { noise3 } from './noise';

/**
 * Divergence-free curl of a 3-component simplex potential (Bridson 2007). Used on the CPU by the
 * smoke puff reference model and tests; the GLSL twin is `curl3` in GLSL_NOISE.
 */
export function curl3(x: number, y: number, z: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const e = 0.1;
  const p1 = (a: number, b: number, c: number) => noise3(a + 31.4, b + 31.4, c + 31.4);
  const p2 = (a: number, b: number, c: number) => noise3(a - 12.7, b - 12.7, c - 12.7);
  const p3 = (a: number, b: number, c: number) => noise3(a, b, c);
  const dP3dy = (p3(x, y + e, z) - p3(x, y - e, z)) / (2 * e);
  const dP2dz = (p2(x, y, z + e) - p2(x, y, z - e)) / (2 * e);
  const dP1dz = (p1(x, y, z + e) - p1(x, y, z - e)) / (2 * e);
  const dP3dx = (p3(x + e, y, z) - p3(x - e, y, z)) / (2 * e);
  const dP2dx = (p2(x + e, y, z) - p2(x - e, y, z)) / (2 * e);
  const dP1dy = (p1(x, y + e, z) - p1(x, y - e, z)) / (2 * e);
  out[0] = dP3dy - dP2dz;
  out[1] = dP1dz - dP3dx;
  out[2] = dP2dx - dP1dy;
  return out;
}
