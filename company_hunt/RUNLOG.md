# RUNLOG: The Deep Company Hunt

Run date: 2026-11-19 (UTC). Working folder: `company_hunt/`.

## Phase 0: Setup

- 09:35Z Repo has a prior project (`research/`, Seven Industry Champions) with SEC XBRL and yfinance scripts. Reusing ideas, not data; this hunt pulls fresh data.
- 09:37Z Tool check: Python 3.13, pandas 3.0.5, numpy 2.5.3, requests 2.34.2, lxml, bs4. Installed yfinance 1.8.0 (+curl_cffi). yfinance live: AAPL $352.45, last bar 2026-11-18.
- 09:38Z Network check: data.sec.gov, www.sec.gov, efts.sec.gov = 200. Yahoo via yfinance = OK. Company IR sites, fool.com, perplexity.ai, stb.gov, google = blocked by environment network policy.
- 09:39Z Requested and got approval to add www.perplexity.ai, www.fool.com, www.stb.gov, www.federalregister.gov to allowed hosts. Company IR domains are still blocked; plan: add finalists' IR hosts in one batch at Phase 5; fallback for Layer B = 8-K EX-99 exhibits (earnings releases, supplemental data, slide decks filed on EDGAR) plus WebSearch snippets. Any IR page not read directly is marked "fallback" in the ledger.
- WebSearch tool works (separate path). FMP: never used (rule).
- 09:58Z Perplexity Finance pages are JavaScript-rendered and need pplx-next-static-public.perplexity.ai and frontend-cdn.perplexity.ai (blocked). Plan: request these plus finalists' IR domains in one batch at Phase 5. Until then Layer D is "unreachable".
- 09:50Z Phase 1 started: 6,470 candidate tickers (NYSE/Nasdaq/CBOE, preferreds/warrants/units/rights removed) from EDGAR company_tickers_exchange.json (10,398 rows). 10y daily prices via yfinance in 33 chunks. EDGAR XBRL frames pull (one call per concept-year, all filers) running in parallel for Phase 2.

## Phase 1 checkpoint (10:35Z)
- Start: 10,398 EDGAR ticker rows -> 6,470 NYSE/Nasdaq/CBOE common-stock tickers (OTC, preferreds, warrants, units, rights removed) -> 6,416 with price history.
- ADV >= $10M and rough EDGAR market cap >= $2B (or unknown): 2,083 pre-candidates. yfinance .info pulled for all (7 errors); EDGAR submissions pulled for 2,042 CIKs.
- No-randoms filters (drop log `universe/drop_log.csv`): mcap < $5B 694; ETF 42; filing history < 5y 33 (after exceptions); ADV < $20M 28; no market cap 21 (mostly preferred/note lines); commodity trusts 3. Dual share classes collapsed to the most liquid line: 8.
- Exceptions (45, `universe/exceptions.json`): holding-company reorganizations/redomiciles whose history sits under a predecessor CIK (XOM, BLK, BG, DINO, FERG, AU, PNFP, VNOM; predecessor XBRL stitched in), and spin-offs of long-public businesses or famous brands with long private histories (GEV, GEHC, HLN, ULS, MBGL=CARFAX, VYLR=Pioneer seeds, ARM, MDLN, etc.). Excluded on the same review: recent tech IPOs (Cerebras, Rubrik, Netskope, SailPoint, Quantinuum, Figure), and names a street person or industry pro would not know (Arxis, Octave, Madison Air, Janus Living, LandBridge...).
- Manual market caps (yfinance .info missing, fast_info used): KOF $25.0B, TX $9.3B.
- RESULT: 1,254 companies in `universe/universe.csv` (median mcap $17.2B; 170 are 20-F filers). Sectors: Tech 206, Financials 195, Industrials 192, Healthcare 153, Consumer Cyclical 136, Materials 74, Energy 73, Real Estate 65, Staples 60, Utilities 52, Communication 46.
- Surprise: the 2026 tape is full of new legal entities (ExxonMobil Holdings, CARFAX spun from S&P Global, Honeywell Aerospace, Corteva's seed spin "Vylor", FedEx Freight). A naive 5-year CIK filter would have thrown out XOM and BlackRock.

## Phase 2 progress (11:25Z)
- Metrics engine: EDGAR XBRL frames (1,100+ concept-period calls) -> 10-year annual series per CIK -> `triage/metrics.csv` (1,254 rows; 1,085 with us-gaap XBRL; 184 IFRS/40-F filers filled from yfinance statements with FX conversion, flagged `src_fund=yf`).
- Fixes found along the way (all logged because they change rankings):
  1. Frames "annual" periods include trailing-twelve-month values that some companies (Amazon) report in 10-Qs. Latest FY now = latest year with both revenue and operating cash flow.
  2. Debt tags missing for GM, F, CME, OMC, AMP, DHI (net cash was fiction). Debt now filled from yfinance totalDebt only when EDGAR debt is missing or < 20% of yfinance (276 names, column debt_src). A 50% rule was tried first and rejected because yfinance debt includes leases (MSFT $35B -> $134B).
  3. Capex now includes capitalized software (PaymentsToDevelopSoftware, PaymentsForSoftware); cross-check showed FICO, NICE, FIS, MKTX FCF overstated without it.
  4. Split adjustment: historical multiples mixed split-adjusted prices with unadjusted XBRL share counts (TPL showed a fake 8x historical P/E; now 32x). 290 universe names split since 2014; share counts adjusted where a split ratio brings the count in line with post-split years.
- Grounds 1-4 scored by script (shared data; spawning four agents to re-run one script would add nothing). Grounds 5-7 handed to three sub-agents because they need document-level work (segment series and correlations; sum-of-the-parts; supply-chain maps). Added `edgar_tool.py segments` (inline-XBRL segment extractor) for them.
- Diversity cap added: max 4 names per yfinance industry and 4 China/HK names per ground's top 25, so one theme (software, China internet) cannot fill a list.
- Toll Road rule changed: margin stability (worst 2019-25 margin >= 80% of 10y median) can substitute for "<= 3 revenue down-years", so cyclical-volume tolls (rails, pipelines) are eligible. ROIC floor 8% (exchanges and rating agencies carry acquisition goodwill).
- Cross-check (25 per ground, G1-G4): 82/100 rows within 5% on revenue, NI, OCF and capex after fix 3; rest explained (currency translation FUTU/NTES, excise-tax revenue MO/TAP, NCI attribution CF/CZR). EDGAR kept. Detail `triage/xcheck_ground_N.csv`.
- Surprise: the 2026 market has repriced application software and IT services hard (ADBE 12x vs 46x own median, FICO 17x vs 50x, INTU 18x vs 51x, NICE 8x vs 41x). Ground 1 is mostly one question: cycle or substitution.
- Phase 3 started early on the 77 unique G1-G4 names (4 agents) while G5-G7 lists are built. Added a 5th and 6th Phase 3 class: PRICED_IN (true quality at a full multiple, not mispriced) and DATA_ARTIFACT (screen quirk), both reject.
