import { clamp } from './util/math';

/**
 * Master cinematic clock. Realtime mode accumulates wall-clock deltas scaled by `speed`; deterministic
 * (record) mode only advances through `step(dt)`, never reading the wall clock.
 */
export class Clock {
  cin = 0; // s cinematic time
  speed = 1;
  playing = false;
  readonly deterministic: boolean;
  duration: number;
  /** cinematic dt applied during the last advance (s) */
  lastDt = 0;
  private readonly speeds = [0.1, 0.25, 0.5, 1, 2, 4];

  constructor(duration: number, deterministic: boolean) {
    this.duration = duration;
    this.deterministic = deterministic;
  }

  /** Realtime advance with a wall-clock delta (s). Ignored in deterministic mode. */
  tick(dtWall: number): number {
    if (this.deterministic) return 0;
    const dt = this.playing ? clamp(dtWall, 0, 0.1) * this.speed : 0;
    this.advance(dt);
    return dt;
  }

  /** Deterministic advance by exactly dt seconds of cinematic time. */
  step(dt: number): void {
    this.advance(dt);
  }

  private advance(dt: number): void {
    this.lastDt = dt;
    this.cin = clamp(this.cin + dt, 0, this.duration);
    if (this.cin >= this.duration && !this.deterministic) this.playing = false;
  }

  seek(t: number): void {
    this.cin = clamp(t, 0, this.duration);
    this.lastDt = 0;
  }

  faster(): void {
    const i = this.speeds.indexOf(this.speed);
    this.speed = this.speeds[Math.min(this.speeds.length - 1, (i < 0 ? 3 : i) + 1)];
  }

  slower(): void {
    const i = this.speeds.indexOf(this.speed);
    this.speed = this.speeds[Math.max(0, (i < 0 ? 3 : i) - 1)];
  }
}
