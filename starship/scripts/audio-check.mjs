// Renders a stretch of the soundtrack offline and writes it to out/audio-check.wav (Section 12 check).
// Usage: node scripts/audio-check.mjs [--start 35 --end 95]
import fs from 'node:fs';
import { startServer, launch, openPage } from './browser.mjs';
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const start = Number(arg('start', 35)), end = Number(arg('end', 95));
const { server, url } = await startServer(5230);
const browser = await launch({ width: 320, height: 180 });
try {
  const { page } = await openPage(browser, url, { width: 320, height: 180, preset: 'low' });
  const n = Number(await page.evaluate((a, b) => window.__renderAudio(a, b), start, end));
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(await page.evaluate((k) => window.__audioChunk(k), i));
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync('out/audio-check.wav', Buffer.from(parts.join(''), 'base64'));
  const info = await page.evaluate(() => window.__info());
  fs.writeFileSync('out/audio-check.json', JSON.stringify({ start, end, shots: info.shots, events: info.events }, null, 1));
  console.log('wrote out/audio-check.wav');
} finally {
  await browser.close();
  await server.close();
}
