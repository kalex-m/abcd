/**
 * GPU frame timer using EXT_disjoint_timer_query_webgl2. Falls back to CPU frame deltas when the
 * extension is unavailable. Reports a 30-frame moving average in milliseconds.
 */
export class GpuTimer {
  private ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private gl: WebGL2RenderingContext;
  private pending: WebGLQuery[] = [];
  private active: WebGLQuery | null = null;
  private samples: number[] = [];
  private lastCpu = performance.now();
  readonly supported: boolean;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as GpuTimer['ext'];
    this.supported = !!this.ext;
  }

  begin(): void {
    if (!this.ext || this.active) return;
    const q = this.gl.createQuery();
    if (!q) return;
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
    this.active = q;
  }

  end(): void {
    const now = performance.now();
    if (!this.ext) {
      this.push(now - this.lastCpu);
      this.lastCpu = now;
      return;
    }
    if (this.active) {
      this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
      this.pending.push(this.active);
      this.active = null;
    }
    const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    while (this.pending.length) {
      const q = this.pending[0];
      if (!this.gl.getQueryParameter(q, this.gl.QUERY_RESULT_AVAILABLE)) break;
      const ns = this.gl.getQueryParameter(q, this.gl.QUERY_RESULT) as number;
      if (!disjoint) this.push(ns / 1e6);
      this.gl.deleteQuery(q);
      this.pending.shift();
    }
  }

  private push(ms: number): void {
    this.samples.push(ms);
    if (this.samples.length > 30) this.samples.shift();
  }

  /** Moving-average frame time in ms (0 until samples exist). */
  get average(): number {
    if (!this.samples.length) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  dispose(): void {
    for (const q of this.pending) this.gl.deleteQuery(q);
    this.pending = [];
  }
}
