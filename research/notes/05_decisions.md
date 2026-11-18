# Final selection rules (applied identically to all 7 industries)
1. Within-industry percentile scores on 5 pillars (Quality, Strength, Capital allocation, Growth, Valuation) using OWN metrics from SEC EDGAR XBRL (52 US filers), yfinance (prices, foreign filers), FMP (24-co cross-check). No analyst targets/ratings used.
2. 5 weighting schemes (Owner base 30/20/15/15/20, Value-first, Quality-first, Safety-first, Growth-first) + 1 industry stress test = 6 runs.
3. Explicit, evidence-based risk flags: -0.03 each (listed in scores.json/_flags).
4. Winner = best average rank across the 6 runs; tie (gap <0.5) broken by stress-test rank (user img2: survive the disruption?).
5. Durability gate (user img2 "Is FCF & revenue stable?"): a company guiding revenue DOWN / losing share structurally cannot be "best company" -> next in order.
Results: Banks JPM (5/6) | Oil&Gas EOG (6/6) | Semis ASML (5/6) | Hyperscalers MSFT (avg 1.67, never below #2) | Software ADBE (5/6) | Airlines DAL (tie w/ UAL, wins fuel stress) | Pharma LLY (NVO #1 on price but guides 2026 sales down -> gate)
Key primary-source finding: BAC HTM unrealized loss $103.9B = 52% of TBV (SEC XBRL Q3-26); JPM $25.9B (8%); WFC $43.3B (33%); USB $13.5B (31%).
