// Live-mode smoke test: click to begin, play, exercise the keyboard controls, and report console
// errors / warnings, frame times and JS heap growth (Sections 18e / 20). Report-only.
// Usage: node scripts/live-check.mjs [--seconds 20 --preset low --w 960 --h 540]
import { startServer, launch } from './browser.mjs';
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const seconds = Number(arg('seconds', 20)), W = Number(arg('w', 960)), H = Number(arg('h', 540)), preset = arg('preset', 'low');
const { server, url } = await startServer(5240);
const browser = await launch({ width: W, height: H });
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warn' || t === 'warning') logs.push(`[${t}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`${url}?preset=${preset}`, { waitUntil: 'load' });
await page.waitForFunction(() => [...document.querySelectorAll('div')].some((d) => d.textContent === 'CLICK TO BEGIN'), { timeout: 60000 });
await page.evaluate(() => [...document.querySelectorAll('div')].find((d) => d.textContent === 'CLICK TO BEGIN').click());
await page.waitForFunction(() => window.__engine && window.__engine.clock.playing, { timeout: 0, polling: 500 });
const heap0 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
const t0 = Date.now();
const keys = ['h', 'h', 'l', 'l', ']', '[', '4', 'Space', 'Space', '7', 'm', 'm', 'c', 'c'];
let k = 0;
while ((Date.now() - t0) / 1000 < seconds) {
  await new Promise((r) => setTimeout(r, 1000));
  if (k < keys.length) await page.keyboard.press(keys[k++]);
}
const st = await page.evaluate(() => ({ cin: window.__engine.clock.cin, frame: window.__engine.frame, heap: performance.memory ? performance.memory.usedJSHeapSize : 0 }));
console.log(`played ${seconds}s wall: cinematic t=${st.cin.toFixed(2)}s, frames=${st.frame}, ${(seconds * 1000 / Math.max(1, st.frame)).toFixed(0)} ms/frame (software GPU)`);
console.log(`JS heap: ${(heap0 / 1e6).toFixed(1)} MB -> ${(st.heap / 1e6).toFixed(1)} MB`);
const real = logs.filter((l) => !l.includes('GPU stall due to ReadPixels'));
console.log(real.length ? 'console problems:\n' + real.join('\n') : 'console: clean (no errors or warnings)');
await browser.close();
await server.close();
process.exit(real.length ? 1 : 0);
