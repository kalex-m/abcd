# AYI verification (Phase 5 verifier, run 2026-11-21)

Sources: FY2026 10-K https://www.sec.gov/Archives/edgar/data/1144215/000114421526000052/ayi-20260831.htm (filed 2026-10-23); Q4 FY26 8-K EX-99.1 https://www.sec.gov/Archives/edgar/data/1144215/000114421526000047/ayi-20261001x8xk_ex991.htm (2026-10-01); DEF 14A https://www.sec.gov/Archives/edgar/data/1144215/000114421525000104/ayi-20251211.htm (2025-12-11); 8-K credit amendment https://www.sec.gov/Archives/edgar/data/1144215/000110465926130602/tm2630326d1_8k.htm (2026-11-20); 13G/A 2026-05-07; yfinance; `valuation.py` re-run; `insiders AYI 3`.

| # | claim in dossier | dossier value | re-derived value | source | status |
|---|---|---|---|---|---|
| 1 | FY26 net sales | $4,641.8M | $4,641.8M | 10-K MD&A | MATCH |
| 2 | FY26 GAAP operating profit | $713.7M | $713.7M | 10-K | MATCH |
| 3 | FY26 OCF | $825.6M | $825.6M (XBRL and cash flow) | 10-K | MATCH |
| 4 | ABL sales / op profit / margin | $3,576M / $623.5M / 17.4% | $3,576.4M / $623.5M / 17.4% | 10-K segment table | MATCH |
| 5 | AIS sales / GM / op margin | $1,107M / 61.3% / 16.9% | $1,106.6M / 61.3% / 16.9% | 10-K | MATCH |
| 6 | Adjusted AIS op profit; margin | $255.0M; 23.0% | $255.0M; 255.0/1,106.6 = 23.0% | EX-99.1 | MATCH |
| 7 | ABL adjusted op profit, FY26 vs FY25 | $646.0M vs $662.3M (-2.5%); Q4 -7.1% | $646.0M vs $662.3M (-2.5%); Q4 $179.8M vs $193.6M (-7.1%) | EX-99.1 | MATCH |
| 8 | Adjusted op profit / adjusted EPS / GAAP EPS | $828.7M / $19.90 / $17.05 | $828.7M / $19.90 / $17.05 | EX-99.1; 10-K | MATCH |
| 9 | Tariff refunds | $51.3M total ($38.2M ABL; $44.9M in Q4) | $51.3M total; $38.2M ABL (+$13.1M AIS); Q4 $44.9M | EX-99.1 | MATCH |
| 10 | AIS Q4 sales and growth | $297.6M, +$42.4M, +16.6% | $297.6M, +$42.4M, +16.6% (Q4 FY25 $255.2M) | EX-99.1 | MATCH |
| 11 | QSC cash consideration | $1,240.7M | $1,240.7M, closed 2025-01-01 | 10-K acquisitions note | MATCH |
| 12 | Cash 2026-08-31; notes; borrowings | $636.3M; $500M 2.15% due 12/2030; $200M repaid 2026-09-10 | $636.3M; $500M notes (carried $497.4M); $200.0M credit-agreement borrowing, repaid 2026-09-10 (Note 17) | 10-K | MATCH |
| 13 | Goodwill, intangibles, equity, 84% | $1,493.5M; $1,001.5M; $2,974.3M; 84% | same; (1,493.5 + 1,001.5)/2,974.3 = 83.9% | 10-K balance sheet | MATCH |
| 14 | Inventory release; receivables | -$76.3M ($526.7M to $450.4M); +$38.2M | Balance-sheet change $76.3M and $38.2M (cash-flow lines $74.7M and $37.8M) | 10-K | MATCH |
| 15 | SBC; capex; D&A | $49.5M; $70-80M; about $155M | $49.5M; $77.7M; $156.4M | 10-K | MATCH |
| 16 | Pension unfunded | -29.0 domestic, -6.7 intl | -$29.0M, -$6.7M | 10-K pension note | MATCH |
| 17 | Net position before Parameter | about -$0.21B | 636.3 - 200 - 500 - 111.5 - 35.7 = -$210.9M (lease split 28.3 + 83.2: only the 28.3 current line seen) | 10-K | MATCH |
| 18 | Shares outstanding | 29.7M | 29,695,521 at 2026-10-20 | 10-K cover | MATCH |
| 19 | Price 2026-11-18; 2026-11-20 | $326.51; $310.49 | $326.51; $310.49 | yfinance | MATCH |
| 20 | GAAP trailing P/E | 18.2x (vs median 18.2x) | Price / FY26 diluted EPS $17.05 = 19.2x. 18.2x equals market cap / net income ($9.70B / $531.3M) | 10-K; triage card | MISMATCH (definition) |
| 21 | Reverse DCF at 9% / 10% / 8%; zero-growth | 3.0% / 5.7% / 0.2%; $222 | 3.0% / 5.7% / 0.2%; $222.45 | valuation.py | MATCH |
| 22 | DCF bear / base / bull; base at 10% | $220 / $386 / $508; $333 | $219.71 / $386.26 / $507.78; $332.87 | valuation.py | MATCH |
| 23 | EPV; RI; DDM | $202; $324; $43 | $202.24; $324.49; $42.80 | valuation.py | MATCH |
| 24 | Sensitivity grid | 8% row 287-647 ... 11% row 189-403 | identical in all 24 cells | valuation.py | MATCH |
| 25 | SOTP equity $/sh (bear / base / bull) and implied AIS multiple | $232 / $302 / $348; 17.8x | $232 / $302 / $348; implied AIS 17.8x ((9.70 + 0.21 + 1.10 - 6.25)/0.268) | arithmetic from dossier inputs | MATCH |
| 26 | Pro forma net position; EBITDA | about -$0.9B; about $890M | -0.21 - 0.675 = -$0.885B; adjusted op profit 828.7 + non-acquisition D&A about 63 = about $892M | 10-K | MATCH |
| 27 | Insider sells/buys | sells $30.1M; buys $0.41M; Ashe 43,464 sh $13.9M (28 trades); Goldman $8.2M; Holcom $6.7M; Mills $1.4M | $30,148,878; $412,597; same per-person values; four buys at $248.91, $282.98, $288.83, $302.32 | `insiders AYI 3` | MATCH |
| 28 | CEO pay and pay ratio | $12.5M; 640:1 | $12,500,683; 640 to 1 | DEF 14A | MATCH |
| 29 | ROIC payout | 18.3% vs 10.7% WACC; 200% payout; 162% rTSR | 18.3%; 10.7%; 7.7 pts; 200%; 162% | DEF 14A | MATCH |
| 30 | Insider group ownership; BlackRock | 911,064 sh (2.9%); 9.0% | 911,064 (2.9%); 2,755,217 (9.0%) | DEF 14A | MATCH |
| 31 | FMR stake | 12.0% (3,649,251 sh) at 2026-04-30; 5.0% (1,548,583) before; 13G/A 2026-05-07 | 3,649,250.59 sh, 12.0%, event 2026-04-30; prior 1,548,583 / 5.0% in proxy | 13G/A | MATCH |
| 32 | New $400M delayed-draw loan | 8-K 2026-11-20; MRC Springfield buyer is Acuity Intelligent Spaces US Inc. | Credit amendment defines "Project Sentinel": Acuity Intelligent Spaces US Inc. to buy MRC Springfield Intermediate Inc., agreement dated 2026-10-23; $400M amount not grepped | 8-K ex-10.1 | MATCH (amount not re-read) |

UNVERIFIABLE on EDGAR: Parameter Technologies at $675M, 16x forward / 22x trailing EBITDA, about $100M 2027 sales at about 40% margin (no 8-K for the 2026-10-26 deal exists; the dossier already says it relied on WebSearch snippets; the $675M price and the Parameter = MRC Springfield link both rest on non-primary sources; the 8-K confirms a Project Sentinel deal dated 2026-10-23, not its price). Also not checked: FY2020-24 segment series, FY27 guidance ranges, 14.8% share-count cut, 10-year CAGR and median-margin card figures, call quotes.

## Mismatches and required changes
1. Section 5 sentence "at 18.2x trailing GAAP P/E against a 10-year median of 18.2x": price over GAAP diluted EPS is 19.2x ($326.51 / $17.05). 18.2x is market cap over net income. Either say "19.2x" or define it as market cap / net income; on a like-for-like basis the median comparison should use the same definition (not re-derived). The "not cheap" conclusion stands.

Everything else, including the SOTP, valuation outputs and the Parameter-related balance-sheet maths, re-derives.

VERIFICATION: FIX NEEDED (1 mismatch, a definition issue, immaterial to the verdict; Parameter price UNVERIFIABLE from primary sources)
