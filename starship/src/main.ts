import * as THREE from 'three';
import { CONFIG, type PresetName } from './config';
import { Engine } from './engine';
import { Overlay } from './ui/overlay';
import { buildSystems, type BuiltSystems } from './systems';
import type { CameraPose } from './camera/shots';

/**
 * Entry: renderer boot, preset choice, loading, realtime loop, keyboard controls and the deterministic
 * record-mode API used by scripts/record.mjs and scripts/shots.mjs.
 */
const params = new URLSearchParams(location.search);
const RECORD = params.get('record') === '1';
const errors: string[] = [];
window.__errors = errors;
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));

function hasWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

async function boot(): Promise<void> {
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const ui = document.getElementById('ui') as HTMLDivElement;
  const overlay = new Overlay(document.body);
  const webgpu = 'gpu' in navigator;
  if (!hasWebGL2()) {
    overlay.message('This cinematic needs WebGL2 (or WebGPU). Your browser or GPU does not provide either. Try a recent Chrome, Edge, Firefox or Safari with hardware acceleration enabled.');
    errors.push('WebGL2 unavailable');
    return;
  }
  let preset = (params.get('preset') as PresetName) || 'high';
  if (!RECORD) preset = await overlay.waitForStart(preset, webgpu);
  overlay.showLoading();
  const width = RECORD ? Number(params.get('w') ?? 1280) : window.innerWidth;
  const height = RECORD ? Number(params.get('h') ?? 720) : window.innerHeight;
  const pr = RECORD ? 1 : Math.min(window.devicePixelRatio, CONFIG_PRESET_PR(preset));
  (window as unknown as { __bootStage: string }).__bootStage = 'engine';
  const engine = new Engine(canvas, { preset, record: RECORD, width, height, pixelRatio: pr });
  (window as unknown as { __bootStage: string }).__bootStage = 'systems';
  window.__engine = engine;
  let built: BuiltSystems;
  try {
    built = await buildSystems(engine, ui, (f, t) => { overlay.progress(f, t); (window as unknown as { __bootStage: string }).__bootStage = t; }, RECORD);
  } catch (e) {
    errors.push(String(e));
    overlay.message(`Startup failed: ${String(e)}`);
    throw e;
  }
  overlay.progress(1, 'ready');
  overlay.hide();
  const startShot = Number(params.get('shot') ?? 0);
  if (startShot > 0) engine.clock.seek(engine.shots.startOf(startShot - 1));
  if (params.get('t')) engine.clock.seek(Number(params.get('t')));

  if (RECORD) {
    setupRecordApi(engine, built);
    window.__ready = true;
    return;
  }

  engine.clock.playing = true;
  built.audio.start();
  setupControls(engine, built);
  window.addEventListener('resize', () => engine.setSize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, CONFIG_PRESET_PR(engine.presetName))));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { engine.clock.playing = false; built.audio.suspend(); }
  });
  let last = performance.now();
  const loop = (now: number) => {
    const dtWall = (now - last) / 1000;
    last = now;
    const dt = engine.freeFly ? 0 : engine.clock.tick(dtWall);
    built.freeFly.tick(dtWall);
    built.governor.begin();
    const ctx = engine.update(engine.clock.cin, dt);
    built.audio.update(ctx, engine.clock.playing && !document.hidden);
    built.hud.update(ctx, engine.clock);
    engine.render();
    built.governor.end();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function CONFIG_PRESET_PR(p: PresetName): number {
  return { low: 1, high: 1.5, ultra: 2 }[p];
}

function setupControls(engine: Engine, built: BuiltSystems): void {
  const shotKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const k = e.key;
    if (e.shiftKey && ['!', '@', '#'].includes(k)) {
      const p = (['low', 'high', 'ultra'] as PresetName[])[['!', '@', '#'].indexOf(k)];
      const u = new URL(location.href);
      u.searchParams.set('preset', p);
      u.searchParams.set('t', String(engine.clock.cin));
      location.href = u.toString();
      return;
    }
    const si = shotKeys.indexOf(k);
    if (si >= 0) {
      engine.freeFly = false;
      engine.cameraOverride = null;
      engine.clock.seek(engine.shots.startOf(si === 10 ? 10 : si));
      engine.clock.playing = true;
      return;
    }
    switch (k) {
      case ' ': engine.clock.playing = !engine.clock.playing; e.preventDefault(); break;
      case '.': engine.clock.playing = false; engine.clock.seek(engine.clock.cin + 1 / 60); break;
      case ',': engine.clock.playing = false; engine.clock.seek(engine.clock.cin - 1 / 60); break;
      case 'Home': engine.clock.seek(0); break;
      case 'End': engine.clock.seek(engine.clock.duration - 0.01); break;
      case '[': engine.clock.slower(); built.hud.toast(`SPEED ${engine.clock.speed}x`); break;
      case ']': engine.clock.faster(); built.hud.toast(`SPEED ${engine.clock.speed}x`); break;
      case 'h': case 'H': built.hud.toggle(); break;
      case 'l': case 'L': engine.letterbox = !engine.letterbox; break;
      case 'm': case 'M': built.audio.toggleMute(); built.hud.toast(built.audio.muted ? 'MUTED' : 'SOUND ON'); break;
      case 'v': case 'V': built.audio.toggleVoice(); built.hud.toast(built.audio.voice ? 'COUNTDOWN VOICE ON' : 'COUNTDOWN VOICE OFF'); break;
      case 'f': case 'F': built.freeFly.toggle(); break;
      case 'g': case 'G': case '`': built.debug.toggle(); break;
      case 'p': case 'P': photo(engine, built); break;
      case 'c': case 'C': built.hud.toggleCaptions(); break;
      default: break;
    }
  });
}

function photo(engine: Engine, built: BuiltSystems): void {
  built.hud.setVisible(false);
  const [w, h] = [engine.width, engine.height];
  engine.setSize(w, h, 2);
  engine.update(engine.clock.cin, 0);
  engine.render();
  engine.renderer.domElement.toBlob((b) => {
    if (!b) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `starbase-${engine.clock.cin.toFixed(2)}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    engine.setSize(w, h, Math.min(window.devicePixelRatio, 1.5));
    built.hud.setVisible(true);
  }, 'image/png');
}

interface CamSpec {
  pos: [number, number, number];
  target: [number, number, number] | 'booster' | 'ship' | 'pad';
  focal?: number;
  fStop?: number;
  ev?: number;
}

function setupRecordApi(engine: Engine, built: BuiltSystems): void {
  const sub = Number(new URLSearchParams(location.search).get('sub') ?? CONFIG.record.accumulationSubframes);
  const fps = Number(new URLSearchParams(location.search).get('fps') ?? 60);
  const finish = () => new Promise<void>((r) => { engine.renderer.getContext().finish(); requestAnimationFrame(() => r()); });
  const renderCin = (cin: number, accumulate: boolean) => {
    if (!accumulate || sub <= 1) {
      engine.update(cin, 1 / fps);
      engine.render();
      return;
    }
    const shutter = CONFIG.camera.shutterAngle / 360 / fps;
    for (let i = 0; i < sub; i++) {
      const t = cin - shutter * 0.5 + (shutter * (i + 0.5)) / sub;
      engine.update(t, shutter / sub);
      const ctx = engine.ctx;
      const jx = (halton(i + 1, 2) - 0.5) * 2 / engine.internalSize[0];
      const jy = (halton(i + 1, 3) - 0.5) * 2 / engine.internalSize[1];
      ctx.pose.jitter = [jx, jy];
      engine.rig.apply(ctx.pose, engine.origin, 0, false, ctx.mission, false);
      engine.render(null, { index: i, count: sub });
    }
  };
  window.__step = async (dt: number) => {
    engine.clock.step(dt);
    renderCin(engine.clock.cin, true);
    built.hud.update(engine.ctx, engine.clock);
    await finish();
  };
  window.__seekCin = async (t: number) => {
    engine.clock.seek(t);
    for (let i = 0; i < CONFIG.record.warmupFrames; i++) renderCin(t, false);
    await finish();
  };
  window.__renderAt = async (o) => {
    let cin = o.cin ?? 0;
    if (o.mission !== undefined && o.cin === undefined) cin = engine.shots.cinForMission(o.mission);
    engine.missionOverride = o.mission !== undefined ? o.mission : null;
    const cam = o.camera as CamSpec | string | undefined;
    if (typeof cam === 'string' && cam.startsWith('shot')) {
      const idx = Math.max(0, engine.shots.defs.findIndex((d) => `shot${d.id}` === cam));
      const def = engine.shots.defs[idx];
      // find local time in that shot matching the mission time
      const start = engine.shots.startOf(idx);
      let best = start, bestErr = 1e9;
      for (let k = 0; k <= 400; k++) {
        const c = start + (def.duration * k) / 400;
        const err = Math.abs(engine.shots.at(Math.min(c, start + def.duration - 1e-3)).mission - (o.mission ?? 0));
        if (err < bestErr) { bestErr = err; best = c; }
      }
      cin = Math.min(best, start + def.duration - 1e-3);
      engine.cameraOverride = null;
      engine.missionOverride = o.mission ?? null;
    } else if (cam && typeof cam === 'object') {
      engine.cameraOverride = (ctx) => {
        const base = engine.shots.pose(ctx.shot, ctx);
        const tgt = cam.target === 'booster' ? ctx.booster.position.clone().addScaledVector(ctx.booster.axis, 40)
          : cam.target === 'ship' ? ctx.ship.position.clone().addScaledVector(ctx.ship.axis, 25)
          : cam.target === 'pad' ? new THREE.Vector3(0, 20, 0) : new THREE.Vector3(...cam.target);
        const pos = new THREE.Vector3(...cam.pos);
        const p: CameraPose = { ...base, position: pos, target: tgt, focal: cam.focal ?? 35, fStop: cam.fStop ?? 8, focusDistance: pos.distanceTo(tgt), evComp: cam.ev ?? 0, shake: null, shadowFocus: tgt.clone(), shadowExtent: 300, envProbe: tgt.clone(), fade: 1, whiteout: 0, blastShield: false };
        return p;
      };
    } else {
      engine.cameraOverride = null;
    }
    engine.clock.seek(cin);
    const warm = o.warm ?? CONFIG.record.warmupFrames;
    for (let i = 0; i < warm; i++) {
      engine.update(cin, i === 0 ? 0 : 1 / 60);
      engine.render();
    }
    built.hud.update(engine.ctx, engine.clock);
    await finish();
  };
  window.__capture = async () => engine.renderer.domElement.toDataURL('image/png');
  (window as unknown as Record<string, unknown>).__probeTex = (which: string) => {
    const c = engine.composer as unknown as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tex = (which.split('.').reduce((o: any, k) => o[k], c) as THREE.WebGLRenderTarget).texture;
    const rt = new THREE.WebGLRenderTarget(64, 36, { type: THREE.FloatType });
    const m = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy*0.5+0.5; gl_Position = vec4(position.xy,0.,1.); }',
      fragmentShader: 'uniform sampler2D tD; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tD, vUv); }',
      uniforms: { tD: { value: tex } }, depthTest: false,
    });
    engine.composer.quad.render(engine.renderer, m, rt);
    const buf = new Float32Array(64 * 36 * 4);
    engine.renderer.readRenderTargetPixels(rt, 0, 0, 64, 36, buf);
    const col: string[] = [];
    for (let y = 0; y < 36; y += 5) col.push(`${buf[(y * 64 + 32) * 4].toFixed(3)},${buf[(y * 64 + 32) * 4 + 1].toFixed(3)},${buf[(y * 64 + 32) * 4 + 2].toFixed(3)}`);
    return col.join(' | ');
  };
  (window as unknown as Record<string, unknown>).__probeDepth = () => {
    const rt = new THREE.WebGLRenderTarget(64, 36, { type: THREE.FloatType });
    const m = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy*0.5+0.5; gl_Position = vec4(position.xy,0.,1.); }',
      fragmentShader: 'uniform sampler2D tD; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tD, vUv).r, 0., 0., 1.); }',
      uniforms: { tD: { value: engine.composer.hdrMS.depthTexture } }, depthTest: false,
    });
    engine.composer.quad.render(engine.renderer, m, rt);
    const buf = new Float32Array(64 * 36 * 4);
    engine.renderer.readRenderTargetPixels(rt, 0, 0, 64, 36, buf);
    const col: number[] = [];
    for (let y = 0; y < 36; y += 3) col.push(buf[(y * 64 + 32) * 4]);
    return col;
  };
  window.__renderAudio = async (start: number, end: number) => built.audio.renderOffline(start, end);
  window.__info = () => ({
    duration: engine.shots.duration, shots: engine.shots.defs.map((d, i) => ({ id: d.id, name: d.name, start: engine.shots.startOf(i), duration: d.duration })),
    events: engine.traj.events, renderer: engine.renderer.info.render, memory: engine.renderer.info.memory, errors,
  });
}

function halton(i: number, b: number): number {
  let f = 1, r = 0;
  while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); }
  return r;
}

boot().catch((e) => {
  errors.push(String(e));
  console.error(e);
});
