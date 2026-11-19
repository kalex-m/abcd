// Headless screenshot harness: reads shots.json and writes PNGs to out/shots/.
// Usage: npm run shots [-- --only name1,name2] [--w 1280 --h 720] [--preset high]
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage, dataUrlToBuffer } from './browser.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const width = Number(arg('w', 1280));
const height = Number(arg('h', 720));
const preset = arg('preset', 'high');
const only = arg('only', '');
const file = arg('file', 'shots.json');
const outDir = arg('out', 'out/shots');
const dbg = arg('dbg', '');
const list = JSON.parse(fs.readFileSync(file, 'utf8')).filter((s) => !only || only.split(',').includes(s.name));
fs.mkdirSync(outDir, { recursive: true });

const { server, url } = await startServer();
const browser = await launch({ width, height });
let code = 0;
try {
  const { page, logs } = await openPage(browser, url, { width, height, preset, extra: dbg ? `&dbg=${dbg}` : '' });
  for (const s of list) {
    const t0 = Date.now();
    await page.evaluate((o) => window.__renderAt(o), { mission: s.t, camera: s.camera, warm: s.warm ?? 3, cin: s.cin });
    const d = await page.evaluate(() => window.__capture());
    fs.writeFileSync(path.join(outDir, `${s.name}.png`), dataUrlToBuffer(d));
    console.log(`${s.name}  T${s.t >= 0 ? '+' : ''}${s.t}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  const info = await page.evaluate(() => window.__info());
  if (info.errors?.length) { console.log('page errors:', info.errors); code = 1; }
  if (logs.length) { console.log('console:\n' + logs.slice(0, 40).join('\n')); }
  console.log('renderer:', JSON.stringify(info.renderer), 'memory:', JSON.stringify(info.memory));
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
  await server.close();
}
process.exit(code);
