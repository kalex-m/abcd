# Phase 5 instructions: the deep dossier

Read /home/user/abcd/company_hunt/AGENT_BRIEF.md first and obey it. You write ONE dossier: `dossiers/TICKER.md`, 1,500-3,000 words plus tables. Every number carries a date and a source (EDGAR URL with filing date, yfinance with date, transcript URL). Write the file section by section as you go (the container can restart; on start, read what exists and continue from the first missing section).

## Inputs
- `python3 scripts/card.py TICKER`; `triage/why_cheap.csv` row; `kill_tests/TICKER.md` (the gates it passed; do not repeat them, build on them).
- Toolkit: `scripts/edgar_tool.py` (filings, text, fts, facts, tags, insiders, holders, exhibits, segments), `scripts/valuation.py` (reverse DCF, scenarios, EPV, RI, DDM, sensitivity; use the `=` form for negatives: `--bear=-0.03,0.85`), `scripts/pplx.js` (Perplexity Finance; intermittent, leads only), WebSearch, fool.com transcripts.

## Depth floor (mandatory reading, record each in the coverage ledger)
- Layer A (EDGAR): 10-K for the last 5 fiscal years (business, risk factors, MD&A, segment note, debt and lease notes, commitments and contingencies, related parties, subsequent events: grep each), 10-Q for the last 8 quarters (at least MD&A trend lines), 8-K earnings releases EX-99 for the last 8 quarters (`exhibits TICKER 8 --item 2.02`), DEF 14A for the last 3 years (pay design, metrics, ownership, related-party), S-1/S-3/424B if any capital raises, SC 13D/13G (`holders`), Forms 4 for 3 years (`insiders TICKER 3`), 8-K Items 4.01/4.02 (card), and full-text searches for "strategic review", "impairment", "going concern", "material weakness", "customer concentration" (`fts ... --ticker`).
- Layer B (company IR): IR sites are NOT reachable from this sandbox. Fallback: EX-99.2/99.3 exhibits (supplemental data, slide decks, investor-day decks filed on EDGAR), plus WebSearch snippets. Diff restated series: compare the latest 10-K/supplement figures for prior years against the originally reported figures in the older filings.
- Layer C (transcripts): last 4-8 earnings calls. Try fool.com (WebSearch "<company> Q3 2026 earnings call transcript fool.com", then WebFetch or curl the fool.com URL). Read the Q&A: what gets dodged, what language changed, what is no longer mentioned. If fool.com lacks them, use WebSearch snippets and say so.
- Layer D (Perplexity Finance): try `NODE_PATH=$(npm root -g) node scripts/pplx.js TICKER` once; if blocked by the bot check, record "unreachable (Cloudflare bot check)".
- Layer E (market data): yfinance (price history, short interest, institutional holders: `python3 -c "import yfinance as yf; t=yf.Ticker('X'); print(t.institutional_holders); print(t.info.get('shortPercentOfFloat'))"`).
- Layer F (regulatory docket): only if a pending deal or review exists (e.g. STB for rail at www.stb.gov, FERC, NRC, FCC, bank regulators, FTC/DOJ via WebSearch and www.federalregister.gov).

Append one line per layer to `dossiers/TICKER_coverage.csv` with header `company,layer,status,source_url,date_accessed,note` (status = done / empty / unreachable / fallback). The main agent merges these into COVERAGE_LEDGER.csv.

## The 16 sections (all required; if a section truly has nothing, one line saying so and why)
1. **The one-paragraph truth**: what the business is and how it really makes money. No marketing language.
2. **Inside the company**: leadership and incentives (from the proxy), strategy and the operating changes actually underway, capital-allocation philosophy, organisational shifts, what management emphasises now vs 3 years ago (compare shareholder letters / call language).
3. **The economics**: segment and product-line series (restated series from supplements where possible; `segments` tool), unit economics, margins, returns on capital, cash conversion, maintenance vs growth capex (estimate maintenance capex as depreciation or as the company states it), working capital.
4. **The war chest, audited**: table netting cash and liquid assets against debt maturities, leases, pensions, litigation, commitments. State the real net position.
5. **Ground(s) and evidence**: which of the seven grounds and the specific evidence. G5: segment growth correlation table. G6: conservative SOTP with explicit assumptions. G7: supply-chain map and who captures the margin.
6. **What the market is pricing**: reverse DCF from `valuation.py` (state inputs); is the implied path too pessimistic, fair, or too optimistic, and why.
7. **Your own valuation**: several methods and the spread (DCF bear/base/bull, EPV, RI or Graham cross-check where relevant, DDM for dividend payers, SOTP where relevant). The assumptions that matter most and the sensitivity grid. Fair-value range and margin of safety vs the 2026-11-18 price.
8. **The thesis in one sentence, and why the market is not seeing it** (something the market is not looking at, not a hunch).
9. **The industry picture**: where the industry is going, who wins and loses, where this company sits.
10. **Regulatory docket** (Layer F) if applicable; else one line.
11. **Disclosure diffs**: what changed in restated series, risk factors and guidance language vs prior filings (diff the risk-factor headings of the latest 10-K vs 2-3 years earlier; note added/removed risks).
12. **Insider and ownership behaviour**: Forms 4 (buys/sells, at what prices), 13D/G, who is new on the register.
13. **Catalysts and timeline**: what would make the market notice, and when; and the slow-compounding case if no catalyst ever arrives.
14. **What would make this thesis wrong**: specific observable facts with metrics and thresholds that force a sell.
15. **Coverage statement**: one line per layer A-F: done / empty / unreachable / fallback, and what that means for confidence.
16. **Confidence score 1-10** with the two biggest unknowns.

Also add, at the very top, a 5-line summary box: ticker, ground(s), price and date, fair-value range, margin of safety, confidence.

Voice: plain, direct, your own reading, numbers everywhere, no disclaimers, no "analysts say". Analysis paragraphs: one fairly long numbers-dense paragraph ending on a clear takeaway sentence. Never FMP. No tree metaphors, no biblical terms. Reply in 3-6 lines when done (fair value range, margin of safety, confidence, anything that should send the company back to the kill test).
