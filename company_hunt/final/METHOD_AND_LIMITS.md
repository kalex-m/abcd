# Method and limits

Run 2026-11-19 to 2026-11-21. Prices are 2026-11-18 closes. Full chronology in `RUNLOG.md`.

## What was done

| Phase | Input → output | Where |
|---|---|---|
| 1 Universe | 10,398 EDGAR tickers → 6,470 exchange-listed common stocks → 2,083 with ADV ≥ $10M → **1,254** after the no-randoms rule (mcap ≥ $5B, ADV ≥ $20M, ≥ 5y filing history; 45 documented exceptions) | universe/ |
| 2 Triage | EDGAR XBRL frames (10y annual series per company) + yfinance. G1-G4 scored by script; G5, G6, G7 built by sub-agents with segment data, sum-of-the-parts and supply-chain maps. Lists: G1 25, G2 25, G3 25, G4 25, G5 17, G6 11, G7 24 | triage/ground_N.csv |
| 3 Why cheap | 140 names classified from filings: 59 priced in, 39 hurt, 23 down for a reason, 9 boring, 7 data artifact, 3 unseen → 44 advance | triage/why_cheap.csv |
| 4 Kill test | 44 ten-gate tests → **6 survive** (AMP, AYI, GGG, TXT, SW, MBGL) | kill_tests/SUMMARY.csv |
| 5 Dossiers | 6 dossiers (16 sections each), 6 coverage files, verification files | dossiers/ |
| 6 Red team | 6 independent attacks, written blind to the bull case, plus rebuttals | redteam/ |
| 7-8 | Ranking, scoreboard, report | final/ |

## Thresholds changed during the run (and why)

1. **Universe exceptions:** holding-company reorganizations, redomiciles and spin-offs of long-public businesses were admitted, with predecessor CIK history stitched in (XOM, BLK, BG and others). A naive 5-year CIK filter would have excluded ExxonMobil and BlackRock.
2. **Toll Road eligibility:** margin stability can substitute for "≤ 3 revenue down-years", so rails and pipelines are eligible. The ROIC floor was lowered to 8% because exchanges and rating agencies carry acquisition goodwill.
3. **Diversity cap:** max 4 names per industry and 4 China/HK names per ground list.
4. **Data fixes, each found by a later check:** trailing-twelve-month values leaking into annual frames (AMZN); missing debt tags (GM, F, CME); capitalized software missing from capex (FICO, NICE); oil and gas capex tags (EOG's FCF was overstated $13B → $3.9B); stock-split adjustment of historical share counts (TPL's 10y median P/E was 8x, actually 32x); a capex fallback guard (73 names flagged).
5. **Phase 3 classes added:** PRICED_IN and DATA_ARTIFACT, both rejections.
6. **Second pass:** with survivors far under the 25 floor, I widened to spin-offs and low-attention names that the history-based screen missed (14 names). That yielded one survivor (MBGL). I did not loosen the gates, because the brief makes rejection the default and allows empty grounds.
7. **Dossier count:** 6, not 20-24, because only 6 survived the kill test. Padding the list with failed names would have broken the kill test.

## Coverage (layers A-F), honest status

- **A EDGAR:** done for all finalists, but the 5-year 10-K reading was targeted greps, not full reads. Spin-offs (MBGL) and the 2024 merger (SW) have short standalone filing histories.
- **B Company IR sites:** **unreachable** (network policy). Fallback for every finalist: 8-K/6-K exhibits on EDGAR (EX-99 releases, supplemental data, investor-day decks). The IR "prior versions" diff was not possible.
- **C Transcripts:** fool.com reachable, but most dossiers read 1-3 calls, below the 4-call floor. Logged per company.
- **D Perplexity Finance:** intermittent. The asset hosts were approved; the first page load renders, then Cloudflare's bot check blocks headless browsers. Used for leads only, where it loaded.
- **E Market data:** yfinance, done.
- **F Regulatory dockets:** only SW had a live legal docket (DOJ containerboard probe); PACER and news sites were unreachable, so it was read through the 10-Q plus WebSearch.
- Full ledger: `COVERAGE_LEDGER.csv` (all 6 finalists, layers A-F).

## Limits that change confidence

- **Budget:** the account's 5-hour usage limit stopped all agents three times. After the first stop, bulk work (Phase 3 leftovers, kill tests, verifiers, red teams) ran on the lighter Sonnet model with at most 3-4 agents at once. Some Phase 3 batches (6-7) did light filing work and leaned on Ground 7 evidence files; kill tests re-verified their claims.
- **Kill-test timing:** gate 3 used Q3 2026 balance sheets. Three survivors added debt after quarter-end (Graco's $600M revolver-funded buyback, Acuity's $400M term loan, CARFAX's spin notes). The dossiers caught this; the kill-test files show pre-event numbers.
- **Insider data:** some Form 4 pulls timed out under concurrent EDGAR load (G, ADBE, MGM); foreign private issuers file none.
- **Segment correlations (G5):** 5-7 annual points, with no real credit bust in the window. They are clues, not proof.
- **A leading prompt:** the Phase 3 batch-8 prompt suggested JPM was "probably PRICED_IN". The verdict rests on the agent's own figures (15x vs 10x median, 2.9x tangible book), but the framing is a bias risk.
- **Verification:** all six dossiers verified by an independent agent (177 numbers re-derived from EDGAR/yfinance/valuation.py; 15 mismatches, all minor definitional or rounding issues, all fixed in the dossiers; TXT passed clean). Unverifiable items are listed in each `dossiers/*_verification.md` (e.g. AYI's Parameter deal price, SW's analyst target).
- **No FMP data was used anywhere.** The FMP connector was present in the session and was never called.

## Assumptions that drive the answer

Discount rate 9-10% (10% for AMP) with 2.5% terminal growth in every DCF (`scripts/valuation.py`). Owner cash = FCF minus stock-based compensation for operating companies. For AMP, owner cash = capital actually returned (about $4.0B), because its operating cash flow is distorted by derivative collateral. Peer multiples for spin-offs, named in each dossier.
