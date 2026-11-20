import seedrandom from 'seedrandom';
import { CONFIG } from '../config';

/** Deterministic RNG wrapper. Same seed + same call order = same stream. */
export class Rng {
  private prng: seedrandom.PRNG;
  constructor(seed: string) {
    this.prng = seedrandom(seed);
  }
  /** Uniform in [0, 1). */
  next(): number {
    return this.prng();
  }
  /** Uniform in [a, b). */
  range(a: number, b: number): number {
    return a + (b - a) * this.prng();
  }
  /** Integer in [a, b]. */
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
  /** Standard normal via Box-Muller. */
  gauss(): number {
    const u = Math.max(1e-9, this.prng());
    const v = this.prng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.prng() * arr.length)];
  }
}

/** Create a named sub-stream so systems do not perturb each other's sequences. */
export function rngFor(name: string): Rng {
  return new Rng(`${CONFIG.seed}:${name}`);
}

/** Stateless integer hash -> [0,1). Mirrors `hash11` in the GLSL library. */
export function hash1(n: number): number {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
