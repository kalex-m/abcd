// Deterministic hash test (Section 18f): two independent record-mode sessions with the same seed must
// produce identical image hashes for frames 0, 100 and 1000 (60 fps cinematic frames).
// Usage: node scripts/determinism.mjs [--w 640 --h 360 --preset low]
import crypto from 'node:crypto';
import { startServer, launch, openPage, dataUrlToBuffer } from './browser.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const W = Number(arg('w', 640)), H = Number(arg('h', 360)), preset = arg('preset', 'low');
const frames = [0, 100, 1000];

async function session() {
  const { server, url } = await startServer(5220 + Math.floor(Math.random() * 50));
  const browser = await launch({ width: W, height: H });
  try {
    const { page } = await openPage(browser, url, { width: W, height: H, preset, extra: '&sub=1' });
    const out = [];
    for (const f of frames) {
      await page.evaluate((t) => window.__seekCin(t), f / 60);
      const png = dataUrlToBuffer(await page.evaluate(() => window.__capture()));
      out.push(crypto.createHash('sha256').update(png).digest('hex').slice(0, 16));
    }
    return out;
  } finally {
    await browser.close();
    await server.close();
  }
}

const a = await session();
const b = await session();
let ok = true;
frames.forEach((f, i) => {
  const same = a[i] === b[i];
  ok = ok && same;
  console.log(`frame ${String(f).padStart(4)}  ${a[i]}  ${b[i]}  ${same ? 'MATCH' : 'DIFF'}`);
});
process.exit(ok ? 0 : 1);
