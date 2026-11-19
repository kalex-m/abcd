// Highlight reel: renders several cinematic excerpts in one session (deterministic stepping), each
// with its own offline soundtrack rendered with a pre-roll (so rumble lag and propagation delays are
// already established), trims and concatenates them, and muxes an H.264 + AAC preview.
// Usage: node scripts/reel.mjs [--res 640x360 --fps 24 --preset low --out out/reel.mp4 --segments "3:5.5,46.5:50.5"]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { startServer, launch, openPage, dataUrlToBuffer } from './browser.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const [W, H] = arg('res', '640x360').split('x').map(Number);
const fps = Number(arg('fps', 24));
const preset = arg('preset', 'low');
const out = arg('out', 'out/reel.mp4');
const PREROLL = 5;
const DEFAULT = '3:5.5,26:28,46.5:50.5,58:62.5,97:99,118:120.5,149.5:151.5,178:182.5,201:203,228:230.5,258.5:263';
const segments = arg('segments', DEFAULT).split(',').map((s) => s.split(':').map(Number));

/** Parse a 24-bit PCM WAV produced by the app; returns { sr, ch, data: Buffer of frames }. */
function readWav(buf) {
  const sr = buf.readUInt32LE(24), ch = buf.readUInt16LE(22);
  let o = 12;
  while (o < buf.length - 8) {
    const id = buf.toString('ascii', o, o + 4), len = buf.readUInt32LE(o + 4);
    if (id === 'data') return { sr, ch, data: buf.subarray(o + 8, o + 8 + len) };
    o += 8 + len;
  }
  throw new Error('no data chunk');
}
function wavHeader(sr, ch, bytes) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + bytes, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * ch * 3, 28); h.writeUInt16LE(ch * 3, 32); h.writeUInt16LE(24, 34); h.write('data', 36); h.writeUInt32LE(bytes, 40);
  return h;
}
/** 10 ms linear fades at both ends of a 24-bit PCM block (click-free hard cuts). */
function fadeEdges(data, sr, ch) {
  const frames = data.length / (3 * ch), n = Math.min(Math.floor(sr * 0.01), frames >> 1);
  for (let i = 0; i < n; i++) for (const f of [i, frames - 1 - i]) for (let c = 0; c < ch; c++) {
    const o = (f * ch + c) * 3;
    let v = data[o] | (data[o + 1] << 8) | (data[o + 2] << 16);
    if (v & 0x800000) v -= 0x1000000;
    v = Math.round(v * (i / n));
    const x = v & 0xffffff;
    data[o] = x & 0xff; data[o + 1] = (x >> 8) & 0xff; data[o + 2] = (x >> 16) & 0xff;
  }
}

const { server, url } = await startServer(5270);
const browser = await launch({ width: W, height: H });
let code = 0;
try {
  const { page } = await openPage(browser, url, { width: W, height: H, preset, extra: `&sub=1&fps=${fps}` });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  // soundtrack: one offline render per excerpt with pre-roll, trimmed and concatenated
  const pcm = [];
  let sr = 48000, ch = 2;
  for (const [a, b] of segments) {
    const s0 = Math.max(0, a - PREROLL);
    const n = Number(await page.evaluate((x, y) => window.__renderAudio(x, y), s0, b));
    const parts = [];
    for (let i = 0; i < n; i++) parts.push(await page.evaluate((k) => window.__audioChunk(k), i));
    const w = readWav(Buffer.from(parts.join(''), 'base64'));
    sr = w.sr; ch = w.ch;
    const frameBytes = 3 * ch;
    const skip = Math.round((a - s0) * sr) * frameBytes;
    const len = Math.round((b - a) * fps) / fps * sr;
    const block = Buffer.from(w.data.subarray(skip, skip + Math.round(len) * frameBytes));
    fadeEdges(block, sr, ch);
    pcm.push(block);
    console.log(`audio ${a}-${b}s done`);
  }
  const all = Buffer.concat(pcm);
  const wav = out.replace(/\.[^.]+$/, '.wav');
  fs.writeFileSync(wav, Buffer.concat([wavHeader(sr, ch, all.length), all]));
  // video
  let ff = 'ffmpeg';
  try { const m = await import('ffmpeg-static'); if (m.default && fs.existsSync(m.default)) ff = m.default; } catch { /* system ffmpeg */ }
  const proc = spawn(ff, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-shortest', out],
  { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  proc.stderr.on('data', (d) => (ffErr = (ffErr + d).slice(-4000)));
  const done = new Promise((r) => proc.on('close', r));
  const total = segments.reduce((acc, [a, b]) => acc + Math.round((b - a) * fps), 0);
  let k = 0;
  const t0 = Date.now();
  for (const [a, b] of segments) {
    await page.evaluate((c) => window.__renderAt({ cin: c, warm: 2 }), a - 1 / fps);
    const frames = Math.round((b - a) * fps);
    for (let f = 0; f < frames; f++, k++) {
      await page.evaluate((dt) => window.__step(dt), 1 / fps);
      const png = dataUrlToBuffer(await page.evaluate(() => window.__capture()));
      if (!proc.stdin.write(png)) await new Promise((r) => proc.stdin.once('drain', r));
      if (k % 12 === 0 || k === total - 1) {
        const el = (Date.now() - t0) / 1000;
        console.log(`frame ${k + 1}/${total}  ${(el / (k + 1)).toFixed(2)} s/frame  eta ${((total - k - 1) * el / (k + 1) / 60).toFixed(1)} min`);
      }
    }
  }
  proc.stdin.end();
  const rc = await done;
  if (rc !== 0) { console.error(ffErr); code = 1; } else console.log(`wrote ${out}`);
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
  await server.close();
}
process.exit(code);
