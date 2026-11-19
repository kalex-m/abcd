// Perplexity Finance reader (Layer D: leads and cross-checks only; verify against primary sources).
// Usage: NODE_PATH=$(npm root -g) node scripts/pplx.js TICKER [Tab]   Tab in: Overview|Financials|Earnings|Holders|Analysis
const { chromium } = require('playwright');
(async () => {
  const t = process.argv[2], tab = process.argv[3] || 'Overview';
  const b = await chromium.launch();
  const p = await b.newPage({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' });
  try { await p.goto(`https://www.perplexity.ai/finance/${t}`, { waitUntil: 'networkidle', timeout: 60000 }); } catch (e) {}
  await p.waitForTimeout(3000);
  if (tab !== 'Overview') {
    try { await p.getByText(tab, { exact: true }).first().click(); await p.waitForTimeout(5000); } catch (e) { console.log('# tab click failed', tab); }
  }
  let txt = await p.evaluate(() => document.body.innerText);
  const i = txt.indexOf('Perplexity Finance'); if (i > 0) txt = txt.slice(i);
  console.log(`# Perplexity Finance ${t} [${tab}] fetched ${new Date().toISOString()} url ${p.url()}`);
  console.log(txt.replace(/\n{2,}/g, '\n').slice(0, 15000));
  await b.close();
})();
