// Deterministic offline capture: steps the master clock by exactly 1/fps per frame (no wall clock),
// renders through Puppeteer + Chromium, pipes PNG frames to ffmpeg (H.264 CRF 14 / ProRes 422 HQ) and
// muxes the offline-rendered soundtrack.
// Usage: npm run record -- --res 3840x2160 --fps 60 --out out/starship.mp4 [--shot N] [--start s --end s]
//                         [--preset ultra] [--sub 8] [--prores] [--no-audio]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { startServer, launch, openPage, dataUrlToBuffer } from './browser.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
const [W, H] = arg('res', '1920x1080').split('x').map(Number);
const fps = Number(arg('fps', 60));
const preset = arg('preset', 'ultra');
const sub = Number(arg('sub', 8));
const prores = flag('prores');
let out = arg('out', prores ? 'out/starship.mov' : 'out/starship.mp4');
const noAudio = flag('no-audio');

async function ffmpegPath() {
  try { const m = await import('ffmpeg-static'); if (m.default && fs.existsSync(m.default)) return m.default; } catch { /* fall through */ }
  return 'ffmpeg';
}

const { server, url } = await startServer(5210);
const browser = await launch({ width: W, height: H });
let code = 0;
try {
  const { page, logs } = await openPage(browser, url, { width: W, height: H, preset, extra: `&sub=${sub}&fps=${fps}` });
  const info = await page.evaluate(() => window.__info());
  let start = Number(arg('start', 0));
  let end = Number(arg('end', info.duration));
  const shot = arg('shot', null);
  if (shot !== null) {
    const s = info.shots[Number(shot) - 1];
    if (!s) throw new Error(`no shot ${shot}`);
    start = s.start; end = s.start + s.duration;
  }
  end = Math.min(end, info.duration);
  const frames = Math.max(1, Math.round((end - start) * fps));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let wav = null;
  if (!noAudio) {
    console.log('rendering audio offline ...');
    const n = Number(await page.evaluate((a, b) => window.__renderAudio(a, b), start, end));
    const parts = [];
    for (let i = 0; i < n; i++) parts.push(await page.evaluate((k) => window.__audioChunk(k), i));
    wav = path.join(path.dirname(out), `${path.basename(out, path.extname(out))}.wav`);
    fs.writeFileSync(wav, Buffer.from(parts.join(''), 'base64'));
  }
  const ff = await ffmpegPath();
  const vcodec = prores
    ? ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le']
    : ['-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  const ffArgs = [
    '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    ...(wav ? ['-i', wav] : []),
    ...vcodec,
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    ...(wav ? ['-c:a', prores ? 'pcm_s24le' : 'aac', ...(prores ? [] : ['-b:a', '320k']), '-shortest'] : []),
    out,
  ];
  const proc = spawn(ff, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  proc.stderr.on('data', (d) => (ffErr = (ffErr + d).slice(-4000)));
  const done = new Promise((res) => proc.on('close', res));
  await page.evaluate((t) => window.__seekCin(t), Math.max(0, start - 1 / fps));
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((dt) => window.__step(dt), 1 / fps);
    const png = dataUrlToBuffer(await page.evaluate(() => window.__capture()));
    if (!proc.stdin.write(png)) await new Promise((r) => proc.stdin.once('drain', r));
    if (f % 10 === 0 || f === frames - 1) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\rframe ${f + 1}/${frames}  ${(el / (f + 1)).toFixed(2)} s/frame  eta ${((frames - f - 1) * el / (f + 1) / 60).toFixed(1)} min   `);
    }
  }
  proc.stdin.end();
  const rc = await done;
  console.log(`\nffmpeg exit ${rc}`);
  if (rc !== 0) { console.error(ffErr); code = 1; }
  const errs = await page.evaluate(() => window.__errors);
  if (errs.length) { console.error('page errors', errs); code = 1; }
  if (logs.length) console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 20).join('\n'));
  console.log(`wrote ${out}`);
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
  await server.close();
}
process.exit(code);
