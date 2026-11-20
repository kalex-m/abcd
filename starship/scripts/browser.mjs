// Shared Puppeteer + Vite helpers for the shots harness, the recorder and the determinism test.
import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

/** Locate a Chromium binary: $CHROME_PATH, a preinstalled Playwright Chromium, or Puppeteer's own. */
export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const roots = ['/opt/pw-browsers'];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    for (const d of fs.readdirSync(r)) {
      const p = path.join(r, d, 'chrome-linux64', 'chrome');
      if (d.startsWith('chromium-') && fs.existsSync(p)) return p;
    }
  }
  return undefined; // puppeteer default
}

export async function startServer(port = 5199) {
  const server = await createServer({ server: { port, strictPort: false, open: false }, logLevel: 'error', clearScreen: false });
  await server.listen();
  const addr = server.resolvedUrls?.local?.[0] ?? `http://localhost:${port}/`;
  return { server, url: addr };
}

export async function launch({ width, height }) {
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    protocolTimeout: 0,
    args: [
      '--enable-unsafe-webgpu', '--use-angle=default', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
      '--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required',
      `--window-size=${width},${height}`,
    ],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
  });
  return browser;
}

export async function openPage(browser, url, { width, height, preset = 'high', extra = '' }) {
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning' || t === 'warn') logs.push(`[${t}] ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.setDefaultTimeout(0);
  await page.goto(`${url}?record=1&w=${width}&h=${height}&preset=${preset}${extra}`, { waitUntil: 'load', timeout: 0 });
  await page.waitForFunction('window.__ready === true || (window.__errors && window.__errors.length > 0)', { timeout: 0, polling: 250 });
  const errs = await page.evaluate('window.__errors');
  if (errs && errs.length) throw new Error('page errors: ' + errs.join('\n'));
  return { page, logs };
}

export function dataUrlToBuffer(d) {
  return Buffer.from(d.split(',')[1], 'base64');
}
