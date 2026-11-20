/** Small pure math helpers. All angles in radians unless the name says Deg. */

export const DEG = Math.PI / 180;
export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
export const saturate = (x: number): number => clamp(x, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number): number => saturate((x - a) / (b - a));
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = invLerp(a, b, x);
  return t * t * (3 - 2 * t);
};
export const smootherstep = (a: number, b: number, x: number): number => {
  const t = invLerp(a, b, x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const expoOut = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Cubic-bezier easing (CSS style) solved by Newton iterations. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dsx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(clamp(t, 0, 1));
  };
}

/** Piecewise-linear table lookup over sorted [x, y] pairs. */
export function table(pairs: readonly (readonly [number, number])[], x: number): number {
  if (x <= pairs[0][0]) return pairs[0][1];
  for (let i = 1; i < pairs.length; i++) {
    if (x <= pairs[i][0]) {
      const [x0, y0] = pairs[i - 1];
      const [x1, y1] = pairs[i];
      return lerp(y0, y1, (x - x0) / (x1 - x0));
    }
  }
  return pairs[pairs.length - 1][1];
}

/**
 * Cubic Hermite spline through keys [x, y] with Catmull-Rom/monotone tangents. C1 continuous.
 * Used by the time-warp curves.
 */
export function hermiteKeys(keys: readonly (readonly [number, number])[]): (x: number) => number {
  const n = keys.length;
  const m: number[] = new Array(n).fill(0);
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  m[0] = d[0] ?? 0;
  m[n - 1] = d[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else m[i] = (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]); // harmonic mean keeps monotonicity
  }
  return (x: number) => {
    if (x <= keys[0][0]) return keys[0][1] + m[0] * (x - keys[0][0]);
    if (x >= keys[n - 1][0]) return keys[n - 1][1] + m[n - 1] * (x - keys[n - 1][0]);
    let i = 0;
    while (i < n - 2 && x > keys[i + 1][0]) i++;
    const x0 = keys[i][0], x1 = keys[i + 1][0], h = x1 - x0;
    const t = (x - x0) / h;
    const t2 = t * t, t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * keys[i][1] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * keys[i + 1][1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

/** Exponential smoothing factor for a time constant tau (s) over dt (s). */
export const damp = (tau: number, dt: number): number => (tau <= 0 ? 1 : 1 - Math.exp(-dt / tau));

/** Blackbody colour (linear sRGB, normalised so max = 1) for a temperature in Kelvin. */
export function blackbody(k: number): [number, number, number] {
  // Fit of the Planckian locus (Tanner Helland), converted to linear.
  const t = k / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const toLin = (c: number) => Math.pow(clamp(c, 0, 255) / 255, 2.2);
  const out: [number, number, number] = [toLin(r), toLin(g), toLin(b)];
  const mx = Math.max(...out, 1e-6);
  return [out[0] / mx, out[1] / mx, out[2] / mx];
}
