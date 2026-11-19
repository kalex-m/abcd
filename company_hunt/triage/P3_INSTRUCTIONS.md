# Phase 3 instructions: "Why is it cheap?" (the narrative-blindness test)

Read /home/user/abcd/company_hunt/AGENT_BRIEF.md first and obey it.

For EVERY ticker in your batch file, find the real reason the stock is where it is, from primary sources, and classify it. One row per ticker. No "unknown" rows: if the reason is not obvious, dig into the filings until you find it.

## Steps per company (budget ~6-10 tool calls each; go deeper only where the answer is unclear)
1. `python3 scripts/card.py TICKER` : price action, multiples vs own history, 10-year EDGAR series.
2. Primary sources: latest 10-Q or 10-K (MD&A and risk factors: `python3 scripts/edgar_tool.py filings TICKER 10-Q 1` then `text URL --grep "decline|decrease|headwind|competition|guidance|outlook|customers|volume|pricing" --ctx 300 --max 6000`), and the latest earnings release (`python3 scripts/edgar_tool.py exhibits TICKER 2 --item 2.02`, then read EX-99.1 with `text URL --max 12000`). Look for: guidance cuts, organic growth, volume vs price, churn/retention, customer losses, new competitors, regulation, litigation, management changes.
3. Context: one or two WebSearch queries (e.g. "<company> stock decline 2026 why") to learn what event moved the stock; then confirm the substance in the filings. Treat news as leads, not as the answer.
4. Decide what the market is pricing and whether it is right.

## Classes (pick exactly one)
- `HURT` = Hurt, not broken: a cycle, rate shock, one-off event or temporary cost problem; demand and the business model are intact. Potentially interesting.
- `BORING` = Boring, not weak: ignored, no catalyst, low attention; the business is fine and compounding. Potentially interesting.
- `UNSEEN` = The market is pricing the surface, not the structure (a change inside the business that the reported numbers or the narrative do not show yet). Potentially interesting.
- `DOWN_FOR_REASON` = shrinking demand, lost or eroding moat, bad management, accounting problems, structural substitution. REJECT. (Standing example: Zoom was rejected because there is less use for it than ever. A business losing relevance is down for a reason, even if it is cheap and profitable today.)
- `PRICED_IN` = not actually mispriced: the stock already trades at or above its own history for a reason everyone sees (e.g. a famous toll road at a full multiple). REJECT for this hunt, note it.
- `DATA_ARTIFACT` = the screen picked it up because of a data quirk (spin-off, merger, currency, one-time gain, captive-finance debt). Say what the quirk is and whether the real numbers would still qualify; classify the real situation if you can, otherwise REJECT.

Be harsh. Default is rejection. For software and IT services names, the central question is whether AI agents and automation shrink the customer's need for the product (seats, hours, licences) or merely change how it is delivered; answer it with evidence (net revenue retention, seat counts, organic growth trend, pricing, customer commentary), not with opinion.

## Output
Append one row per ticker to `triage/why_cheap_part_<N>.csv` (N = your batch number) with header:
`ticker,name,grounds,classification,advance(Y/N),one_line_reason,evidence,key_numbers,sources,date_checked`
- `one_line_reason`: one plain sentence, the real reason the price is where it is.
- `evidence`: 2-4 sentences of facts with numbers and dates from primary sources (quote figures, e.g. "organic revenue -3% in Q3 FY26 (10-Q filed 2026-10-30)").
- `key_numbers`: compact, e.g. "P/E 12 vs 46 10y median; FCF yield 11%; NRR 108%".
- `sources`: semicolon-separated URLs (EDGAR document URLs, fool.com transcript URLs, news URLs used as leads).
Quote fields that contain commas. Also write `triage/why_cheap_part_<N>.md` with one short paragraph per company (your reading, plain language, ending on the verdict) so later phases can see your reasoning.
When finished, reply in 3-6 lines: counts per class and which names advance.
