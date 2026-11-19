// Leak check (Section 20): seek across the whole cinematic twice and compare GPU resource counts and
// the JS heap after each pass. Report-only; exits non-zero if geometries/textures keep growing.
import { startServer, launch, openPage } from './browser.mjs';
const { server, url } = await startServer(5250);
const browser = await launch({ width: 320, height: 180 });
let code = 0;
try {
  const { page } = await openPage(browser, url, { width: 320, height: 180, preset: 'low', extra: '&sub=1' });
  const info = await page.evaluate(() => window.__info());
  const snaps = [];
  for (let pass = 0; pass < 3; pass++) {
    for (let t = 0; t < info.duration; t += info.duration / 24) await page.evaluate((c) => window.__renderAt({ cin: c, warm: 1 }), t);
    snaps.push(await page.evaluate(() => ({ mem: window.__engine.renderer.info.memory, heap: performance.memory ? performance.memory.usedJSHeapSize : 0 })));
    console.log(`pass ${pass + 1}: geometries ${snaps[pass].mem.geometries}, textures ${snaps[pass].mem.textures}, heap ${(snaps[pass].heap / 1e6).toFixed(1)} MB`);
  }
  if (snaps[2].mem.geometries > snaps[1].mem.geometries || snaps[2].mem.textures > snaps[1].mem.textures) code = 1;
} finally {
  await browser.close();
  await server.close();
}
process.exit(code);
