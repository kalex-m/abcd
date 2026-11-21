# TXT verification (Phase 5), checked 2026-11-21

Sources: Q3-26 10-Q https://www.sec.gov/Archives/edgar/data/0000217346/000021734626000044/txt-20261003.htm (filed 2026-10-29); Q3-26 EX-99.1 .../000021734626000043/q320268-kex991.htm; FY25 10-K .../000021734626000006/txt-20260103.htm (filed 2026-02-11); 8-K 2026-11-18 .../000110465926129345/tm2629751d1_8k.htm; yfinance; `edgar_tool.py segments/facts/insiders`; `scripts/valuation.py`.

| # | claim | dossier | re-derived | source | status |
|---|---|---|---|---|---|
| 1 | Close 2026-11-18 / 11-20 | 82.79 / 79.62 | 82.79 / 79.62 | yfinance | MATCH |
| 2 | Shares; short interest; 52w range | 169.4M; 5.0%; 71.87-101.57 | 169.40M (10-Q cover 169,399,979); 5.02%; 71.87-101.57 | yfinance, 10-Q | MATCH |
| 3 | Segment rev/profit 2019-2025 (Aviation, Bell, Systems, Industrial, eAviation) | table | XBRL segments identical (e.g. Aviation 5,955/694; Bell 4,282/363; Systems 1,247/175; Industrial 3,213/145; eAv -63) | 10-Ks | MATCH (2019-2021 profit not re-derived: segments tool returns only revenue for those years) |
| 4 | 9M-26 vs 9M-25 revenue: Aviation 4,709/4,217; Bell 3,077/3,025; Systems 1,045/933; Industrial 2,399/2,392 | as stated | identical | EX-99.1 | MATCH |
| 5 | 9M profit: Aviation 498/464, Bell 223/262, Systems 143/125, Industrial 137/115 | as stated | identical | EX-99.1 | MATCH |
| 6 | Margins Aviation 10.6%, Bell 7.2%, Systems 13.7%/14.0%, Bell 8.5% | as stated | 498/4,709 = 10.6; 223/3,077 = 7.2; 143/1,045 = 13.7; 175/1,247 = 14.0; 363/4,282 = 8.5 | calc | MATCH |
| 7 | Q3 backlog Aviation $8.0B; jets 51 vs 42; total backlog $19.0B | as stated | 8.0 / 51 vs 42; 8.0+7.6+3.5 = 19.1 | EX-99.1 | MATCH (rounding) |
| 8 | 2025 total revenue; OCF; capex; FCF | 14.8B; -; 0.38B; 0.93B | 14,799; 1,312; 383; FCF 929 | 10-K | MATCH |
| 9 | 2025 SBC | $0.08B | 81M | XBRL AllocatedShareBasedCompensationExpense | MATCH |
| 10 | 2025 A&D+Finance segment profit / revenue | 1.22B / 11.6B | 694+363+175+49-63 = 1,218; 5,955+4,282+1,247+75+27 = 11,586 | XBRL | MATCH |
| 11 | Cash Mfg 1.61 + Finance 0.09 | 1.70 | 1,610 + 86 | 10-Q BS | MATCH |
| 12 | Mfg debt 0.355 + 3.11 = 3.47; Finance debt 0.34; equity 8.12 | as stated | 355 + 3,110; 339; 8,116 | 10-Q BS | MATCH |
| 13 | Inventories 4.86B, +583M | as stated | 4,861 vs 4,278 | 10-Q | MATCH |
| 14 | Pension: assets 9.56B, PBO 6.92B, surplus 2.64B, retiree med -0.11 | as stated | 9,559; 6,918; 2,641; -111 | 10-K note | MATCH |
| 15 | Non-service pension income 9M-26; LIFO 9M-26 | 210; 116 | 210; 116 | EX-99.1 | MATCH |
| 16 | 9M-26 repurchases | $616M, 7.0M sh, ~$88 | 616 (cash flow); 616/7.0 = 88 (share count not separately re-derived) | 10-Q | MATCH |
| 17 | Industrial sale: $1.2B cash, ~$1.1B net, impairment $350-400M, 35M-share authorisation, outside date 2027-11-18, close H1 2027 | as stated | all in 8-K (authorisation dated 2026-11-11) | 8-K 2026-11-18 | MATCH |
| 18 | Insiders: sells $89.9M, buy $0.99M (Kennedy 10,300 @ $95.98 on 2026-05-01); Donnelly 37.4M + 21.6M; Atherton 0.75M | as stated | $89,881,597 / $988,594; same per-name | `insiders TXT 3` | MATCH |
| 19 | Adjusted EPS guide; Q3 adj EPS | 6.60 mid; - | 6.55-6.65; Q3 1.76; mfg cash flow guide 800-900M | EX-99.1 | MATCH |
| 20 | Core EPS ~4.60 and P/E 12.5x / 18x | as stated | 6.60-0.71 LIFO-1.27 pension = 4.62; 82.79/6.60 = 12.5; /4.60 = 18.0 | calc | MATCH |
| 21 | Mfg net debt to capital 19% | 19% | (3.47-1.61)/(1.86+8.12) = 18.6% | calc | MATCH |
| 22 | valuation.py: reverse DCF 6.1% (3.1% at 8%, 8.8% at 10%), zero-growth $44 | as stated | 6.1 / 3.1 / 8.8 / $44.21 | valuation.py | MATCH |
| 23 | Scenarios bear 47 / base 83 / bull 122; sensitivity grid | as stated | 46.63 / 82.50 / 122.26; grid identical | valuation.py | MATCH |
| 24 | EV 15.4B; EPV ex-pension $37 | as stated | 14.02B mcap + 1.4 = 15.4B; 0.88B x 0.79 / 9% = 7.72B less 1.4B = $37.3 | calc | MATCH |
| 25 | Buyback sizing: 35M = ~20% of count; $1.1B = ~13M sh, 8% | as stated | 20.7%; 13.4M; 7.9% | calc | MATCH |
| 26 | Own ROIC ~7% | ~7% | 1.05B x 0.8 / 11.6B = 7.2% | calc | MATCH |
| 27 | Q3 buybacks $239M at ~$82; 2020 segment profit 1,270 to 751; call quotes; MV-75 charge ranges | as stated | not re-derived | | UNVERIFIABLE |

## Mismatches
None above tolerance. Minor: Section 8 and 6 are consistent with the inputs. "Aviation profit fell 96% in 2020" (449 to 16 = -96%) is consistent with the dossier's own table.

VERIFICATION: PASS (all match or immaterial; 2019-2021 segment profit and call-derived figures not re-derived)
