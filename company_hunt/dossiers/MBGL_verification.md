# MBGL verification (Phase 5 verifier, run 2026-11-21)

Sources: Q3 2026 10-Q https://www.sec.gov/Archives/edgar/data/2090312/000209031226000035/mbgl-20260930.htm (filed 2026-11-12); Q3 release EX-99.1 https://www.sec.gov/Archives/edgar/data/2090312/000209031226000034/mbgl-20260930x8kexx991.htm (2026-11-12); Form 10 information statement https://www.sec.gov/Archives/edgar/data/2090312/000110465926066592/tm2528763d9_ex99-1.htm (2026-05-27); 13G (Eagle) filed 2026-11-16; `insiders MBGL 3`; yfinance; `valuation.py` re-run.

| # | claim in dossier | dossier value | re-derived value | source | status |
|---|---|---|---|---|---|
| 1 | Q3 2026 revenue; growth | $478M (+7.4%) | CARFAX 313 + B2B 164 = $478M vs $445M = +7.4% | 10-Q segment revenue note | MATCH |
| 2 | 9M 2026 revenue | $1,401M (+7%); CARFAX 923 (+8%); B2B 477 (+6%) | $1,401M vs $1,304M; 923 vs 855; 477 vs 449 | 10-Q | MATCH |
| 3 | 2025 revenue (carve-out) | $1,750M (CARFAX 1,142; B2B 608) | $1,750M; 2024 $1,613M; 2023 $1,485M (segment split not re-read) | Form 10 | MATCH |
| 4 | Adjusted EBITDA 2025 / 2024 / 2023 | 711 / 658 / 598 | 711 / 658 / 598 | Form 10 | MATCH |
| 5 | 9M 2026 and Q3 adjusted EBITDA | 581; Q3 195 (+2%), 41% margin | 581; 195 vs 191 (+2.1%); 41% | 10-Q MD&A | MATCH |
| 6 | Segment adjusted EBITDA | 9M CARFAX 446 (48%), B2B 147 (31%); Q3 153 (49%), 45 (27%); Q3-25 B2B 52 (34%) | identical | 10-Q MD&A | MATCH |
| 7 | 9M 2026 FCF vs 9M 2025 | $363M vs $361M; Q3 $186M | $363M vs $361M; Q3 $186M (OCF 394, capex 31) | Q3 release exhibit | MATCH |
| 8 | FCF series 2025 / 2024 / 2023 | 460 / 410 / 380 | 461 / 412 / 375 | Form 10 | MISMATCH (2023 off 1.3%; 2024 and 2025 within rounding) |
| 9 | Kill-test correction: "$461M vs $412M" were wrong 9M figures | stated in the header paragraph | $461M and $412M are the Form 10 full-year 2025 and 2024 FCF, i.e. correct annual numbers; the dossier's own 9M figures ($363M vs $361M) are right | Form 10; Q3 release | MISMATCH (wording; the kill test mislabelled period, the figures were not wrong) |
| 10 | Cash; goodwill; intangibles; equity | $351M; $8,845M; $3,566M; $9,827M | $351M; $8,845M; $3,566M; $9,827M | 10-Q balance sheet | MATCH |
| 11 | Notes | $650M 5.05% 2029; $650M 5.45% 2031; $700M 6.05% 2036; carrying $1,981M; fair value $1.9B | identical | 10-Q Note 4 | MATCH |
| 12 | Standalone interest and first coupon | about $111M a year; about $60M first coupon 2026-12-15 | 32.8 + 35.4 + 42.4 = $110.6M; coupon from 2026-05-29 to 12-15 about $60M | arithmetic on Note 4 | MATCH |
| 13 | Capex; depreciation; unearned revenue | $31M (9M-26), $16M (9M-25); depreciation $15M a year; unearned $87M | $31M, $16M; 9M depreciation $11M (about $15M annualised); $87M | 10-Q | MATCH |
| 14 | Q3 net income; amortization | $42M; $74M a quarter | $42M; $74M | 10-Q | MATCH |
| 15 | Shares outstanding; subscription share | 294.84M; 81% | 294,844,592 at 2026-11-09; 81% ($389M of $478M) | 10-Q | MATCH |
| 16 | Guidance and capital return | FY26 revenue $1,870-1,885M, adj. EBITDA $750-760M (prior $745-760M); $800M buyback, $350-450M by end-2027; $0.06 dividend | identical (tax-rate guide of 32% not found in text read) | Q3 release | MATCH |
| 17 | Invested capital and return | $11.5B; 4.8% on $0.55B; 6.3% at $8.7B EV | 9,827 + 1,981 - 351 = $11.46B; 0.55/11.46 = 4.8%; EV 7.06 + 1.72 = $8.78B gives 6.3% | arithmetic | MATCH |
| 18 | Net debt | about -$1,720M | 650 + 650 + 700 + 73 (non-current lease, not re-read) - 351 = $1,722M | 10-Q | MATCH |
| 19 | Price 2026-11-18; 2026-09-30; 2026-11-16; 2026-11-20 | $23.93; $17.15; $24.04; $22.63 | $23.93; $17.15; $24.04; $22.63 (+40% from 9/30 to 11/16 confirmed) | yfinance | MATCH |
| 20 | Reverse DCF at 9% / 8% / 10%; zero-growth | 4.0% / 1.1% / 6.6%; $13.45 | 4.0% / 1.1% / 6.6%; $13.45 | valuation.py | MATCH |
| 21 | DCF bear / base / bull at 9%; base and bear at 8% | $18.10 / $27.48 / $33.28; $33.72 / $22.41 | $18.10 / $27.48 / $33.28; $33.72 / $22.41 | valuation.py | MATCH |
| 22 | EPV; DDM | $14.31; $12.84 | $14.31; $12.84 | valuation.py | MATCH |
| 23 | Sensitivity grid | e.g. 8%: 22/27/34/41; 11%: 12/16/19/24 | identical in every cell shown | valuation.py | MATCH |
| 24 | Peer-multiple values | $23.7 / $29.1 / $34.4 at 11x / 13x / 15x of $790M | 23.7 / 29.1 / 34.4 | arithmetic | MATCH |
| 25 | SOTP | $26.4 (13x/9x); $30.5 (15x/10x) | 13x/9x: (7,735 + 1,755 - 1,720)/294.84 = $26.35 (MATCH); 15x/10x: (8,925 + 1,950 - 1,720)/294.84 = $31.05 | arithmetic on dossier inputs | MISMATCH ($30.5 should be $31.0; 1.8%) |
| 26 | 2027 owner cash | about $435M, $1.47 per share, 6.2% yield | 435/294.84 = $1.475; 1.47/23.93 = 6.1% | arithmetic | MATCH (6.1% rounds to 6.2% only if rounded up; immaterial) |
| 27 | Insider buy | Peek 50,000 sh, $0.98M, 2026-08-11 to 08-13, $19.50-19.87; no sales | 10,000 + 25,000 @ $19.50, 15,000 @ $19.87; $980,566; sells $0 | `insiders MBGL 3` | MATCH |
| 28 | Eagle 13G | 8.18%, 24.11M shares, 2026-11-16 | 8.18%, 24,112,912 sh | 13G | MATCH |
| 29 | Net leverage | 2.2x net, 2.7x gross | net 1.65/0.744 (TTM EBITDA 711 + 581 - 548 = 744) = 2.2x; gross 2.0/0.744 = 2.7x | arithmetic | MATCH |

UNVERIFIABLE or not re-run: SPGI 10-K segment XBRL (the `segments` tool returns no segment facts for SPGI, so the 2022-2025 Mobility revenue series 1,142 / 1,484 / 1,609 / 1,747 and operating profit 378 vs 339 were not re-derived; the Form 10 carve-out 1,750 / 1,613 / 1,485 do match); 2025 interest of $13M; BlackRock 11.3% and Vanguard 13G percentages; CFO call statements (cash taxes $80-90M above provision, 150bp standalone margin cost, $100M one-time cost, 32% tax guide); peer EV/EBITDA multiples and the "11.7x" for MBGL (my EV / TTM EBITDA gives 11.8x); analyst count 12; short interest 4.3%.

## Mismatches and required changes
1. SOTP upper case (section 5 and the section 7 SOTP row): at 15x CARFAX and 10x B2B the value is $31.05 per share, not $30.5. Change "$30.5" to "$31" and the row "$26.4-30.5 / +10% / +27%" to "$26.4-31.1 / +10% / +30%". The fair-value range top of $31 already covers this, so nothing else moves.
2. Header paragraph: "nine-month 2026 free cash flow was $363M vs $361M ..., not $461M vs $412M". The $461M and $412M figures are the Form 10 full-year FCF for 2025 and 2024 (the dossier's own table uses them). Reword to say the kill test compared full-year with nine-month figures, rather than implying 461/412 were wrong numbers.
3. FCF row in the section 3 table: 2023 is $375M (Form 10), not 380; 2024 and 2025 can be written 412 and 461.

VERIFICATION: FIX NEEDED (3 mismatches, all minor; none changes the verdict)
