# SW verification (Phase 5), checked 2026-11-21

Sources: Q3-26 10-Q https://www.sec.gov/Archives/edgar/data/2005951/000162828026069766/smur-20260930.htm (filed 2026-11-04); Q3-26 EX-99.1 .../000110465926119345/tm2628367d1_ex99-1.htm (8-K 2026-10-28); FY25 10-K .../000162828026012555/smur-20251231.htm (2026-02-27); DEF 14A .../000110465926026094/sw-20260501xdef14a.htm; yfinance closes; `edgar_tool.py facts/insiders/segments`; `scripts/valuation.py` (rerun with the dossier's exact flags).

| # | claim | dossier | re-derived | source | status |
|---|---|---|---|---|---|
| 1 | Close 2026-11-18 / 11-20; 11-03 and 11-04 | 40.33 / 37.70; 42.97 -> 44.72 | 40.33 / 37.70; 42.97 / 44.72 | yfinance | MATCH |
| 2 | Q3-26 net sales / adj EBITDA / margin / OCF | 8,161 / 1,205 / 14.8% / 874 | identical | EX-99.1 | MATCH |
| 3 | 9M-26 net sales; 9M OCF vs 9M-25 | 23.90B; 1.84B vs 2.20B | 23,904; 1,843 vs 2,197 | EX-99.1 | MATCH |
| 4 | 9M-26 consolidated adj EBITDA and margin 14.3% (9M-25 16.0%) | 14.3% / 16.0% | 3,421 / 23,904 = 14.3%; 3,767 / 23,599 = 16.0% | EX-99.1 | MATCH |
| 5 | **Table row "SK / SW segment adj. EBITDA", 9M 2026** | 3.60 | segments sum 2,061+1,180+359 = 3,600, but consolidated adjusted EBITDA is **3,421** (after about -$179M corporate). Same for 2025: 5.10 is the segment sum, consolidated is 4.94 | EX-99.1 | MATCH on segment definition; MISMATCH risk (see below) |
| 6 | Segment 9M adj EBITDA NA 2,061 vs 2,347; EMEA/APAC 1,180 vs 1,180; LATAM 359 vs 354; segment sales 14,104 / 8,433 / 1,687 | as stated | identical (sales sum 24,224 matches release total) | EX-99.1 | MATCH |
| 7 | 2025 GAAP operating income; OCF; SBC | 1.72B; 3.39B; 0.14B | 1,719; 3,392; 139 | FY25 10-K XBRL | MATCH |
| 8 | 2025 net sales 31.18B | 31.18B | quarterly sum 7,656+7,940+8,003+7,580 = 31,179 | quarterly releases | MATCH |
| 9 | Cash; current debt; non-current debt | 0.72; 0.84; 13.21 | 723; 842; 13,207 | Q3-26 release BS | MATCH |
| 10 | Operating leases | 1.10B (2025-12-31) | 1,095 | FY25 10-K lease note | MATCH |
| 11 | Net position headline | -14.43B | 0.723 - 0.842 - 13.207 - 1.095 = -14.42 | calc | MATCH |
| 12 | Pension prepaid 0.71 vs liabilities 0.67 | as stated | 712 vs 668 | Q3-26 release | MATCH |
| 13 | Receivables sold 0.609B; supplier finance 0.357B; CMPC 0.42B; Brazil R$820M ($158M) | as stated | 609; 357; 420; R$820M = $158M | 10-Q Notes 1, 9, 14, 15 | MATCH |
| 14 | DOJ grand jury subpoena 2026-09-22, N.D. Ill., containerboard | as stated | confirmed verbatim | 10-Q Note 14 | MATCH |
| 15 | Undrawn committed facilities 4.56B (2025-12-31) | 4.56B | 4,560 | FY25 10-K | MATCH |
| 16 | EV / market cap / dividend | 35.58B; 524.5M sh; $1.81 | mcap 21.15B + 14.43 = 35.58B; $0.4523 x 4 = $1.81 | valuation.py, release | MATCH |
| 17 | valuation.py: reverse DCF 8.4% (6.9% at 8%, 12.5% at 10%), zero-growth $7.93 | as stated | 8.4 / 6.9 / 12.5 / $7.93 | valuation.py | MATCH |
| 18 | Scenarios bear/base/bull; EPV; DDM | $3 / $37 / $73; $9.50; $28 | 2.56 / 36.95 / 72.67; 9.50; 28.40 | valuation.py | MATCH (bear rounds $2.56 to $3) |
| 19 | Sensitivity grid (8%/9%/10% rows) | as stated | identical | valuation.py | MATCH |
| 20 | EV/EBITDA grid and per-turn values | $24 / $39 / $64; $6.70 per $0.5B; $9.50 per turn | 24.0 / 39.2 / 64.0; 6.67; 9.53 | calc | MATCH |
| 21 | Net debt / $4.7B guide | 2.8x before leases | (14.05 debt - 0.72) / 4.7 = 2.84; implied Q4 = 4.7 - 3.421 = 1.28B | calc | MATCH |
| 22 | Insiders: sells $10.59M, buy $0.60M (Finan 15,180 @ $39.21, 2025-05-06); Smurfit $4.29M + $2.06M; Mayer 1.37; Bowles 1.33 + 0.51; Sellier 0.78; Henao 0.22 | as stated | $10,593,401 / $595,182; all per-name match | `insiders SW 3` | MATCH |
| 23 | DEF 14A: Tony Smurfit 1,602,433 sh (~$65M); Vanguard 11.73%, BlackRock 7.93%, Capital Research 6.89% | as stated | identical; 1.602M x 40.33 = $64.6M | DEF 14A | MATCH |
| 24 | Dividend yield 4.5%; antitrust (c) $8-11/sh | as stated | 1.81/40.33 = 4.5%; 4-6B / 524.5M = $7.6-11.4 | calc | MATCH |
| 25 | **Antitrust expected cost $1.2B = $2.20/sh** | 1.2B; $2.20 | with the dossier's own scenario ranges and 60/30/10 weights the midpoint gives 0.6x0.2 + 0.3x1.5 + 0.1x5 = $1.07B ($2.04/sh); $1.2B / 524.5M = $2.29/sh, not $2.20 | calc | MISMATCH (immaterial, 4-8%) |
| 26 | Mean analyst target $53.85, 15 analysts, short interest 5.3% / 24.4M sh | as stated | yfinance info blocked by a crumb error on rerun | | UNVERIFIABLE |
| 27 | Antitrust case facts (Artuso, Kleen $354M settlement), MTP deck figures (ROCE ~8% to 15%, $7B 2030), call quotes, WestRock FY2019-23 series | as stated | not re-derived | | UNVERIFIABLE |

## Mismatches
1. Section 1: "Segment adjusted EBITDA ... was $5.10B in 2025" and the Section 3 table label "SK / SW segment adj. EBITDA" (2025 5.10, 9M 2026 3.60) are sums of the three regional segments before corporate costs. Consolidated adjusted EBITDA is $4.94B (2025) and $3.42B (9M-26). The dossier uses the consolidated figures for margins (15.8%, 14.3%) and guidance ($4.7B), so the table and Section 1 should say "before corporate costs", otherwise the 9M-26 margin (14.3%) cannot be reproduced from the 3.60 shown (3.60/23.90 = 15.1%). Suggested fix: add a row "Consolidated adj. EBITDA: 4.94 (2025), 3.42 (9M-26)".
2. Section 4/7: "probability-weighted $1.2B, or $2.20 a share" should read "about $1.1-1.2B, or $2.05-2.30 a share" ($1.2B over 524.5M shares is $2.29). The $36 post-charge value stays within rounding.

VERIFICATION: FIX NEEDED (2 mismatches, both definitional or immaterial; headline valuation numbers all reproduce)
