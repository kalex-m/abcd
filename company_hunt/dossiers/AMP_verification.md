# AMP verification (Phase 5), checked 2026-11-21

Sources: Q3-26 ER https://www.sec.gov/Archives/edgar/data/820027/000082002726000050/q32026er.htm (filed 2026-10-29); Q3-26 10-Q .../000082002726000054/amp-20260930.htm (2026-10-30); FY25 10-K .../000082002726000011/amp-20251231.htm; 2026 proxy .../000110465926032725/amp-20260429xdef14a.htm; yfinance; `edgar_tool.py insiders/segments`; `scripts/valuation.py`.

| # | claim | dossier | re-derived | source | status |
|---|---|---|---|---|---|
| 1 | Close 2026-11-18 / 11-20 | 501.42 / 480.29 | 501.42 / 480.29 | yfinance | MATCH |
| 2 | 52w high / short interest / analysts | 572.56 / 4.3% / 11 | 572.56 / 4.27% / 11 | yfinance | MATCH |
| 3 | AOCI 9/30/26 vs 12/31/25 | -2.642B / -0.892B | -2,642 / -892 | 10-Q balance sheet | MATCH |
| 4 | Q3 OCI hit; equity 6.366B to 5.110B | -1.366B; 6.366 to 5.110 | -1,366; 6,366 (7/1/26) to 5,110 | 10-Q equity stmt | MATCH |
| 5 | Debt to capital 39.6% vs 32.4% | 39.6 / 32.4 | 39.6 / 32.4 | ER p.22 | MATCH |
| 6 | AWM distribution exp / net rev | 1,911 / 3,371 (57%) | 1,911 / 3,371 = 56.7% | ER p.11 | MATCH |
| 7 | Wrap / total client assets / AUM / sweep | 729 / 1.23T / 743 / 27.0 | 728.9 / 1,231 / 742.6 / 27.0 | ER | MATCH |
| 8 | Segment pretax 2019-2025 (AWM, AM, RPS, Corp) and AWM share 65% vs 52% | table | identical to XBRL segments; 64.7% / 52.1% | 10-Ks via `segments` | MATCH |
| 9 | Q3-26 adj op EPS / ex-unlocking; TTM 44.42 | 11.26 / 12.07 / 44.42 | 11.26 / 12.07; 10.83+11.26+11.07+11.26 = 44.42 | ER p.1,24 | MATCH |
| 10 | P/E 11.3x, 10.4x | 11.3 / 10.4 | 501.42/44.42 = 11.29; /48.28 = 10.39 | calc | MATCH |
| 11 | TTM adj op earnings | 4.16B | 4,164 (ex-unlock 4,238) | ER p.27 | MATCH |
| 12 | **Adjusted ROE ex-AOCI 56.2% TTM** | 56.2% | adjusted operating = **55.3%**; 56.2% is the ex-unlocking measure; equity ex-AOCI 7,536 matches | ER p.27 | MISMATCH (definition) |
| 13 | Capital returned Q3 / TTM | 1,026 / 3.94B | 1,026; 1,050+936+932+1,026 = 3,944 | ER p.9 | MATCH |
| 14 | Shares out Q3-26 / Q3-25 / Q2-26 | 87.0 / 93.1 / 88.4 | same | ER | MATCH |
| 15 | Net rev per advisor; recruits; AM margin; AM pretax | 1.24M +13%; 79; 45.7%; 308 | same | ER | MATCH |
| 16 | AFS amortised cost vs FV | 55.82B vs 52.67B, -3.15B | 55,822 vs 52,672 (-3,150 net; gross losses 3,256) | 10-Q Note 5 | MATCH |
| 17 | Senior notes list/total; nothing due until 2028 | 3.35B | 600+300+500+750+750+450 = 3,350; 2026 notes repaid 9/15/26 | 10-Q Note 11 | MATCH |
| 18 | Parent liquidity; revolver | 1.00B; 1.0B to Nov 2029 | 1.0B; 1.0B Nov 2029 | 10-Q liquidity | MATCH |
| 19 | RiverSource Life capital | 2.378B vs 2.729B; req 522 | 2,378 vs **2,731** (10-Q); 522 | 10-Q reg. capital | MATCH (rounding) |
| 20 | Parent op cash flow 2025; SBC; leases | 3.87B; 0.21B; 0.28B | 3,871; 206; 276 | FY25 10-K | MATCH |
| 21 | Consolidated OCF | 8.3B | 8,323 | FY25 10-K | MATCH |
| 22 | Buyback authorisation | 5.5B to 2028-09-30 | same, board 2026-09-29 | 10-Q | MATCH |
| 23 | Proxy: pay ratio 232:1, bonus 155%, PSU 145%, say-on-pay 89%, Cracchiolo 86,666 sh/200,844 opts/194,821 DSU | as stated | all found | DEF 14A | MATCH |
| 24 | Vanguard 14.3% | 14.3% | 14.3%, but proxy cites a 13G/A as of 2023-12-29 (stale) | DEF 14A | MATCH (stale basis) |
| 25 | Insiders: zero buys, $161.4M sold; Cracchiolo 159,190/$65.9M; Berman 54,422/$26.7M; Truscott 54,202/$24.9M | as stated | $161,397,531 sold; all per-name figures match | `insiders AMP 3` | MATCH |
| 26 | TTM segment pretax for EPV: AWM 3,805, AM 1,148, RPS 790 | as stated | 926+951+939+989; 293+273+274+308; 190+202+198+200 | ER quarterly | MATCH |
| 27 | valuation.py: reverse DCF -2.3%, -7.6% (8%), 0.0% (11%), zero-growth $460 | as stated | -2.3 / -7.6 / -0.0 / $459.77 | valuation.py | MATCH |
| 28 | Scenarios bear/base/bull; EPV; sensitivity grid | 386 / 799 / 1,046; 488 | 386.33 / 799.45 / 1,046.46; 487.62; grid identical | valuation.py | MATCH |
| 29 | Market cap, buyback 12.6%, 9.0% yield | 43.5B; 12.6%; 9.0% | 87.0M x 501.42 = 43.6B; 5.5/43.6 = 12.6%; 3.94/43.6 = 9.0% | calc | MATCH |
| 30 | Excess capital $2.0B, available liquidity $2.3B, "not making changes" quotes | call | UNVERIFIABLE (call transcript not re-fetched; no EDGAR exhibit) | | UNVERIFIABLE |

## Mismatches / notes
1. Section 3, "Adjusted ROE ex-AOCI was 56.2% TTM on $7.54B of equity ex-AOCI (Q3-26 ER p.27)". Correct: 55.3% adjusted operating ROE ex-AOCI (GAAP-based 55.2%); 56.2% is ex-unlocking. Change to "55.3% (56.2% excluding unlocking)". Immaterial to the thesis.
2. Section 4 "Real net position: Parent debt of $3.55B" mixes $3.35B senior notes (parent) with $0.2B FHLB (subsidiary, 'not verified'). Parent senior debt is $3.35B, so net parent debt is about $2.35B, not $2.5B. Section 3 says "parent debt is only $3.5B"; correct is $3.35B. Small.
3. Section 3 takeaway "roughly a fifth of AWM profit is still rate spread" conflicts with the dossier's own $387M of spread vs $989M pretax (39%, pre-cost). The "a fifth" is the effect of halving it. Reword.
4. Section 1 "$4.06B of net dividends" vs the parent cash-flow statement "dividends received from subsidiaries" $4,245M (2025). I did not locate a $4.06B "net" table; the figure is plausibly net of capital contributions, so I mark it not verified.

VERIFICATION: FIX NEEDED (1 definition mismatch, 2 small wording issues; thesis numbers hold)
