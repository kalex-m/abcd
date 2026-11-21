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

## Interruption (about 12:40Z)
- The container restarted and killed all seven background agents (G5, G6, G7 builders; Phase 3 batches 1-4). Disk survived: all data, scripts and the G5 agent's partial segment pulls (80 companies in data/g5seg, results.json for 79). Nothing from Phase 3 had been written yet.
- Fix: all agent instructions now require append-as-you-go output and skip-if-done on restart. All seven relaunched ~13:00Z; G5 resumes from its saved segment data.
- Layer D (Perplexity Finance): asset hosts approved and added (pplx-next-static-public, frontend-cdn, r2cdn, edge). First automated page load rendered (ADBE: market cap $88.04B, trailing P/E 12.62, forward 8.43, matching yfinance), but subsequent loads hit a Cloudflare bot check that headless browsers cannot pass. Layer D status: intermittent. `scripts/pplx.js` kept; WebSearch used for leads where Perplexity refuses.
- Phase 4 instructions written (`kill_tests/P4_INSTRUCTIONS.md`): 10 gates with evidence, war-chest netting table, two UNVERIFIED gates = FAIL.

## Usage-limit stop and resume (2026-11-19 ~15:00Z -> 2026-11-21)
- All seven agents were stopped by the account's 5-hour usage limit (not a code failure). Disk intact. At the stop: Phase 3 had 59/77 G1-G4 names classified (17 advance); G5 had segment results for 79 companies; G6 had 1 SOTP written; G7 had evidence files for 165 companies but no ranking.
- Budget decision: from here at most 4 agents run at once; bulk work (Phase 3 leftovers, kill tests, verifiers, red teams) runs on the lighter Sonnet model; dossiers on the main model. The three ground agents were resumed with their context (cheaper than restarting) and told to finish from what they have; one Sonnet agent took the 16 unfinished G1-G4 Phase 3 names (triage/p3_batch_5.txt).
- Pipeline fix found by Phase 3 (EOG flagged DATA_ARTIFACT): oil & gas drilling capex sits under PaymentsToAcquireOilAndGasPropertyAndEquipment / PaymentsToExploreAndDevelopOilAndGasProperties, which the capex definition missed, so every E&P's FCF was overstated (EOG FCF $13B -> $3.9B). Added those tags, plus a guard: where EDGAR capex is zero/missing but D&A > 1% of revenue, capex = yfinance OCF - FCF (TTM), flagged capex_src=yf_implied_ttm (73 names, mostly REITs, utilities, COP, LLY, VZ).
- Re-ranked G1-G4 after the fix: G2 CELH -> TMUS, G3 TPL -> NVDA, G4 EOG -> PHM. The three dropped names were already Phase 3 rejects; TMUS, NVDA, PHM queued for Phase 3 (triage/p3_pending_g14.txt).
- Phase 3 G1-G4 tallies so far (59): DOWN_FOR_REASON 19, PRICED_IN 18, HURT 15, BORING 4, DATA_ARTIFACT 3. Advancing 17: CTVA, CE, NTES, APTV, DECK, EDU, AMP, FDS, OC, AYI, GGG, FIS, ACN, G, CRUS, ADBE, INTU.
- What Phase 3 taught: the cheapest quality names in this market are cheap mostly for real reasons. Packaged food (GIS, CPB, CAG, LW, TAP, BF-B) is volume decline, not a cycle. FICO's mortgage-score pricing power was ended by its regulator in 2026. NICE, Gartner, EPAM and Cognizant are seat- or hours-based models that AI agents shrink. The true tolls (V, MA, SPGI, MSCI) are fully priced.

## Ground 5 and Ground 7 lists landed (2026-11-21)
- G5 Many-Weathers: 17 names, not 25 (`triage/ground_5.csv`, method in `scripts/p2_g5_score.py`). 89 companies examined with segment series from inline XBRL (FY2019/20-FY2025); big acquisition years excluded from segment growth; a real opposite move in a named slowdown (2020, 2022 or 2023) required. Drops: 25 share one hidden driver, 19 have co-moving segments, 9 single-segment, 7 one product split by region. Ranked: INTU, RJF, BNY, HIG, JPM (Alex's holding, kept as the reference model), ICE, BAC, ACGL, JNJ, TXT, PEP, MCO, C, ABT, MET, MKC, RTX. Key finding: the 17 offset in REVENUE (median segment growth correlation +0.02 vs +0.54 for the rest) but not in PROFIT (worst segment-profit year median -15.8%); at JPM revenue correlation -0.24 but profit-change correlation +0.64 because credit reserves hit every segment together. Only INTU, ACGL, TXT, MKC, ABT trade below their own history. 17 < 25 accepted as a finding, not padded.
- G7 Tide Supplier: 24 names (`triage/ground_7.csv`, `ground_7_supply_chains.md`). Five supported shifts: AI data-center buildout, electricity demand and grid rebuild, construction contractors, defense rearmament, energy security (gas, LNG, nuclear). Water, healthcare capacity and software "plumbing" tested and dropped. Hyperscaler capex $497B Jan-Sep 2026 (+93%). The AI-only suppliers are either priced (LITE +1,143% in 3y, CLS +765%, CRDO +576%) or cheap for a reason (MU on peak memory margins, SMCI, ORCL); the list therefore sits in the "second ring" with multiple buyers: BKR, HUBB, TDG, EME, HII, GD, DY, TT, ETN, LNG, NOC, RTX, KMI, CMI, J, EQIX, LHX, BWXT, LMT, GVA, CAT, NVT, CRS, POWL.
- Phase 3 batches 6-8 launched on Sonnet (G7 names + TMUS/NVDA/PHM; G5 names). G6 still running.

## Phase 3 status (2026-11-21)
- G1-G4: 75 classified (+3 re-rank additions). Advance: CTVA, CE, NTES, APTV, DECK, EDU, AMP, FDS, OC, AYI, GGG, FIS, ACN, G, CRUS, ADBE, INTU, MELI, NVR, MGM, BKNG, FUTU, CPRT (23). Re-rank additions: TMUS, NVDA advance; PHM HURT but N (still above its own P/E median on falling earnings).
- G7 (batches 6-7): advance BKR, HII, DY, CMI, LHX, GVA, CRS. PRICED_IN: HUBB, EME, GD, TT, ETN, NOC, RTX, KMI, J, EQIX, BWXT, LMT, CAT, NVT. LNG = DATA_ARTIFACT (8.9x P/E from non-cash derivative gains). Batches 6-7 used few tool calls (~1.6 per company, leaning on G7 evidence files); kill-test batch 3 instructed to re-verify their claims from filings.
- G5 (batch 8): advance TXT, ABT, PEP (PEP low conviction). PRICED_IN: JPM, BAC, C, BNY, RJF, HIG, MET, ICE, MCO, JNJ. MKC = DATA_ARTIFACT (Reverse Morris Trust with Unilever Foods). ACGL HURT but N (forward P/E above own median).
- JPM (Alex's holding) = PRICED_IN: 15x vs 10x own 10y median P/E, 2.9x tangible book at ~20% ROTCE, Q3 2026 net buybacks cut to $664M. Note: the batch-8 prompt framed JPM leadingly ("probably PRICED_IN if 15x vs 10x"); the verdict rests on the agent's own cited figures, but the framing is logged as a bias risk.
- Batch 7 also found: Jensen Huang resigned as NVIDIA CEO on 2026-11-12 (from news; kill test must confirm via 8-K Item 5.02).

## Phase 4 batch 2 result (2026-11-21)
- 11 tested, 1 survives: AYI (quality 7, mispricing clarity 3; near-zero net debt, ROIC-linked pay, 6 analysts, trades at its own 10y median multiples). Failures: CE (2,3,5,10), APTV (2,5,6,7,10), EDU (7,8,10), FDS (10), FIS (3,5,6,10), G (3 unverified + 10), ADBE (5,10), MELI (4,10), MGM (2,3,10), FUTU (7,8,10).
- Surprise: gate 10 failed for 10 of 11. The HURT names are well-covered bear cases (ADBE 33 analysts; FDS short 12.6%; MGM short 17.4%), so a thesis on them would be "the market is wrong about what it studied", which the brief rejects. MELI's and FUTU's screen FCF yields were customer-money flows (deposits funding loans; client cash), not owner cash.
- Data gap: Form 4 pulls for G, ADBE, MGM timed out under concurrent EDGAR load; marked "not verified" in those files.

## G6 list and the second pass (2026-11-21)
- G6 Hidden Room: 11 names (`triage/ground_6.csv`): HMC +57% conservative SOTP gap (motorcycles ¥439bn op profit in H1 FY26 worth more at 10x than all of Honda), BIDU +35% (cash/investments ~$26bn net of debt vs $23.6bn mcap), JD +57%, F +30% (Ford Pro ~$7bn EBIT under $4bn Model e loss), NWSA +12% (62% of REA), THC +11% (USPI); watch: L, EQH, LVS, BIO, BN. 19 fully valued, ~25 one-line checks. Short list accepted as a finding: conservative SOTP rarely leaves >10% on the table.
- Blind spot in my own Phase 2 screen: every ground scored "cheap vs own 10-year history", so spin-offs and reorganized companies (no history) were systematically excluded, yet spin-offs are a classic place where the market is not looking. Second pass (batch 10): MBGL (CARFAX), HONA, AMRZ, FDXF, SW, SOLV, VYLR (spin-offs), HLN (5 analysts), BIRK, MKL, CINF, RYAAY, DVA, INGM (low attention / net cash / insurers with portfolios). Chosen from the 45 exception names and a low-attention screen (<= 8 analysts, >= $8B, FCF-SBC yield >= 5%); foreign bank ADRs excluded because their low analyst counts are an ADR-line artifact.

## Second usage-limit stop (2026-11-21) and Phase 4 tally
- Kill tests done 31/32 (ACN pending). SURVIVE: AMP, AYI, GGG. FAIL: ADBE, APTV, BKNG, BKR, CE, CMI, CPRT, CRS, CRUS, CTVA, DECK, DY, EDU, FDS, FIS, FUTU, G, GVA, HII, INTU, LHX, MELI, MGM, NTES, NVDA, NVR, OC, TMUS. Most common failing gates: 10 (bear case fully studied) and 3 (war chest not real after netting).
- Survivors far below the 25 floor, so the brief's iteration loop applies. Widening = the second pass (spin-offs and low-attention names that the history-based screen missed) plus G6. Not widening further by loosening gates: an empty result is allowed and the default is rejection.
- Budget: all remaining agents on Sonnet, max 3 at once.
