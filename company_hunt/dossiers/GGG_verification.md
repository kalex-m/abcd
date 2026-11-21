# GGG verification (Phase 5 verifier, run 2026-11-21)

Sources: Q3-26 10-Q https://www.sec.gov/Archives/edgar/data/42888/000004288826000145/ggg-20260925.htm (filed 2026-10-21); FY25 10-K https://www.sec.gov/Archives/edgar/data/42888/000004288826000081/ggg-20251226.htm (filed 2026-02-17); XBRL company facts via edgar_tool; ASR 8-K https://www.sec.gov/Archives/edgar/data/42888/000119312526455736/d125383d8k.htm (2026-11-10); yfinance closes; `scripts/valuation.py` re-run.

| # | claim in dossier | dossier value | re-derived value | source (URL, date) | status |
|---|---|---|---|---|---|
| 1 | 2025 net sales | $2.24B | $2,236.6M | FY25 10-K, FY ended 2025-12-26 | MATCH |
| 2 | 2025 gross margin | 52.5% | 1,173.2/2,236.6 = 52.45% | FY25 10-K | MATCH |
| 3 | 2025 operating margin | 27.9% | 624.8/2,236.6 = 27.94% | FY25 10-K | MATCH |
| 4 | 2025 free cash | $0.64B | OCF 683.6 - capex 45.7 = $637.9M | FY25 10-K cash flow | MATCH |
| 5 | 2025 capex | about $51M | $45.7M (PP&E additions); 2022 $201.2M matches | FY25 10-K; XBRL PaymentsToAcquirePropertyPlantAndEquipment | MISMATCH (11% high) |
| 6 | D&A run-rate | about $104M a year | FY25 $107.4M; TTM $109.3M; 9M-26 $77.6M matches | FY25 10-K; Q3-26 10-Q | MISMATCH (minor, 5% low) |
| 7 | SBC | about $32M a year (1.4% of sales) | FY25 $34.3M (1.5%); TTM $33.4M; 2024 $31.9M | FY25 10-K | MISMATCH (minor) |
| 8 | TTM OCF | about $0.66B | 683.6 + 463.4 - 487.3 = $659.7M | 10-K and 10-Q | MATCH |
| 9 | 9M-26 OCF vs adjusted earnings | $463M = 116% | 463.4 / 400.6 = 115.7% | Q3-26 10-Q | MATCH |
| 10 | 9M-26 buyback | $463M | $462.9M | Q3-26 10-Q cash flow | MATCH |
| 11 | Cash, 2026-09-25 / 2025-12-26 | $140M / $624M; $122M offshore | $139.8M / $624.1M; $122M | Q3-26 10-Q | MATCH |
| 12 | Debt (notes payable + current + LT) | $0.135B | 29.98 + 0.68 + 103.80 = $134.5M | Q3-26 10-Q balance sheet | MATCH |
| 13 | Credit available / revolver | $668M; $750M revolver | $668M; $750M (expiry 2029-10-25 not checked) | Q3-26 10-Q MD&A | MATCH |
| 14 | ASR size and funding | $600M paid 2026-11-11, cash plus revolver | $600M to Bank of America on 2026-11-11, cash on hand plus revolver | ASR 8-K, 2026-11-10 | MATCH |
| 15 | Pro forma net position | about -$0.66B | 0.140 - 0.135 - 0.600 - 0.030 - 0.033 = -$0.658B; EBITDA TTM about $0.73B so about 0.9x | 10-Q, 10-K note 10 | MATCH |
| 16 | Valco Melton price | $462M cash, 2026-08-31 | Net assets acquired $462.0M (includes $25.4M acquired cash; $436M net of cash in the cash flow); date correct | Q3-26 10-Q note 11 | MATCH |
| 17 | US long-lived assets | $605M of $770M | $605.5M of $769.6M | Q3-26 10-Q note 2 | MATCH |
| 18 | 9M-26 segments (sales / op earnings) | Contractor 835/225, Industrial 754/235, Expansion 127/30; margins 26.9/31.1/23.6% | 835.4/224.6, 754.3/234.6, 127.4/30.1; 26.9/31.1/23.6% | Q3-26 10-Q note 2 | MATCH |
| 19 | Q3-26 margins | GM 50.5%, op 25.3%; Industrial 28.1% vs 33.8% | 296.2/586.4 = 50.5%; 148.1/586.4 = 25.3%; 74.5/264.6 = 28.1%; 80.7/238.6 = 33.8% | Q3-26 10-Q | MATCH |
| 20 | TTM operating earnings | $620M | 624.8 + 461.0 - 466.2 = $619.6M | 10-K, 10-Q | MATCH |
| 21 | Diluted EPS 2025; 163.0M diluted shares Q3-26; 160.4M shares at 2026-09-25 | $3.08; 163.0M; 160.4M | $3.08; 163.021M; common stock $160,368K at $1 par | 10-K; 10-Q | MATCH |
| 22 | Price 2026-11-18; Oct drop | $71.61; $81.81 to $69.28 (-15%) | $71.61; $81.81 (10-21) to $69.28 (10-22) = -15.3% | yfinance | MATCH |
| 23 | P/E | 22.0 vs 10-year median 28.1 | Price / GAAP diluted EPS = 23.2x; TTM EPS $3.10 gives 23.1x (yfinance 23.1). 22.0 is market cap / FY25 net income | triage card; 10-K | MISMATCH (definition) |
| 24 | P/FCF | 18.0 | 11.48B / 637.9M = 18.0 | 10-K; yfinance | MATCH |
| 25 | Reverse DCF, 9% / 8% / 10% | 8.4% / 5.4% / 11.2%; zero-growth $36 | Re-run: 8.4% / 5.4% / 11.2%; $36.13 | valuation.py | MATCH |
| 26 | DCF scenarios | bear $40, base $59, bull $73 (9%); base $70, bull $87 (8%) | $40.02, $59.07, $73.40; $70.07, $87.42 | valuation.py | MATCH |
| 27 | EPV / RI / DDM | $33 / $60 and $74 / $42 and $63 | EPV $32.72 with the dossier's EBIT 0.60B and tax 20%; RI $59.89 / $74.18; DDM $41.69 / $62.54 | valuation.py | MATCH |
| 28 | Fair value midpoint, margin of safety | $64; -11%; +5% at $75 | -10.6%; +4.7% | arithmetic | MATCH |
| 29 | Insider open-market sales and buy | $30.0M by 16 people; one buy 1,240 sh at $80.53 ($0.1M) | $30,036,658 by 14 distinct names; buy 1,240 sh at $80.53 ($99,857). Sheahan $1.07M, O'Shea $4.47M, Rothe $3.61M match | `insiders GGG 3`, run 2026-11-21 | MISMATCH (16 vs 14 people) |
| 30 | Pension plus retiree medical unfunded | $12.1M + $20.8M | $12.128M + $20.759M | FY25 10-K note 10 | MATCH |
| 31 | Dividends | $0.295 per quarter | $0.295 in Q3-26 | Q3-26 10-Q | MATCH |
| 32 | Q3 non-GAAP EPS | $0.81 adjusted vs $0.75 GAAP | GAAP $0.75 confirmed; adjusted per-share line not fully read ($131.3M adjusted earnings / 163.0M = $0.81) | Q3-26 10-Q | MATCH |

Not verified: Valco Melton at about 3.2x sales and about 18x EBITDA (acquired-business revenue and EBITDA are not in the filing text I read); peer margins (the dossier itself says they were not re-verified); fool.com call quotes; holder percentages (yfinance only).

## Mismatches and required changes
1. Capex: 2025 PP&E additions were $45.7M, not about $51M. Section 3 sentence "Capex fell from $201M (2022...) to about $51M (2025)" should read "$46M". The $0.64B FCF is correct and already uses 45.7. Normalised owner cash ($0.53B) is unaffected.
2. D&A: use about $107M for 2025 and about $109M for TTM, not "about $104M". Section 3 sentence "depreciation and amortization is running at about $104M a year" and the EBITDA of about $0.72B (should be about $0.73B). Maintenance capex logic is unchanged.
3. SBC: FY25 is $34.3M (1.5% of sales), TTM $33.4M. Section 3 "about $32M a year (1.4% of sales)" should say about $33-34M (1.5%). Normalised owner cash would be about $0.53B either way (0.66 - 0.10 - 0.03).
4. P/E 22.0 (section 5): that figure is market cap over net income. On price over diluted EPS it is 23.2x (23.1x TTM). The text should say 23x, or state the definition. The gap to the 10-year median (28.1) is somewhat smaller than stated on a like-for-like basis if the median used the same definition; not checked.
5. Section 12: "by 16 people" should read 14 distinct insiders (16 appears to count name/title rows).

VERIFICATION: FIX NEEDED (5 mismatches, all minor; none changes the conclusion)
