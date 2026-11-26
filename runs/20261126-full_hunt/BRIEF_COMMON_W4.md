# Wave 4 common brief: triage (run 20261126-full_hunt)

- Repo root `/home/user/abcd` (Linux, `python3`). Today 2026-11-26 (US Thanksgiving; last close 2026-11-25).
- Read `CLAUDE.md` sections 1.1, 1.3, 2, 6.4 and 6.4.1 first. Helpers: `scripts/lib/edgar.py` (`recent_filings`, `companyfacts`, `annual_series`, `full_text_search`) and `scripts/lib/prices.py` (`quote`, `history`).
- Context to read (only these, keep it bounded): `runs/20261126-full_hunt/regime.json`; from `runs/20261126-full_hunt/industries/<industry>.json` read `value_chain` (signal tags), `key_numbers`, `regime_sensitivity`, and your company's entry in `companies`; and any routed lead in `runs/20261126-full_hunt/routing.json` → `ranked_leads` whose `tickers` include yours (answer its `ask_next` inside the relevant read).
- Regime: **late Overheat in hard data, markets pricing a turn toward Slowdown** (Fed leaning to hike Dec 8–9; 10y 4.85%; HY spreads 3.72% and widening; Brent ~$91–95, -18% in a month; dollar +4.8% over 3m; real consumer spending flat in October).
- Scratch files: use only your own folder `/tmp/claude-0/-home-user-abcd/972a45b1-c2d4-550c-82a7-8ab8c6b660c3/scratchpad/triage-<TICKER>/` (other agents run in parallel; never write to a shared scratch path).
- **Never FMP.** Do not spoof browser user agents. Analyst views, price targets and news narratives are not evidence.

## Sources, in this order (price last)
1. Latest 10-K (business, segments, risk factors, MD&A, auditor report). 2. Last 4 10-Qs (use XBRL companyfacts for the numbers; read MD&A text selectively). 3. Latest earnings release (8-K EX-99.1) and presentation (EX-99.2 or IR site). 4. IR fact sheet or supplemental data if one exists. 5. DEF 14A for pay and insider ownership. 6. 8-K item scan for red flags (4.01, 4.02, 5.02), NT filings, and CORRESP/UPLOAD comment letters in the last 3 years. 7. yFinance for price and market data **last**.
Foreign filers (CP, CNI and similar) file 40-F/6-K instead of 10-K/10-Q: use those and say so in `coverage`.

## Scoring (all 17 reads: 1–5, where **5 is always best for an owner**)
- Read 13 Durability: 5 = very durable, gaining relevance. Read 14 Red flags: 5 = clean, no flags; 1 = unresolved accounting flags.
- Read 17 Price: 5 = price leaves a big cushion against what the business can plausibly deliver; 1 = price assumes more than it can deliver.
- Each read: `score` (int), `evidence` (one plain line, with the number), `source` (URL), `as_of` (date).
- Read 7 (Supply chain) must name the critical inputs, their suppliers and concentration, single points of failure, and whether the company can pass cost increases on, linked to the industry's signal tags.
- Read 17 (Price): a simple reverse DCF. What owner free-cash-flow growth over 10 years justifies today's enterprise value at a 10% discount rate (10y 4.85% + ~5% equity premium) and 3% terminal growth? Compare with the company's own last-5-year FCF growth. **Banks:** replace the DCF with what return on tangible equity today's price/tangible book implies at a 10% cost of equity (residual-income logic), versus the bank's actual ROTCE. Add multiples (P/E, EV/EBITDA or P/TBV) vs the company's own 5-year range and 2–3 peers.

## Ratings and status (CLAUDE.md 1.3 and 6.4.1)
- `business_quality` A/B/C/D (how good the business is; slow-moving) and `attractiveness_now` high/medium/low (quality against today's price in today's regime). Never mix them.
- `regime_grid`: "+", "0" or "-" for each of boom, overheat, stagflation, slowdown.
- Status: **dropped** if any kill-switch rule holds; **survived** only if quality ≥ B, the price leaves a cushion, there's an identifiable mistake, and a plausible reason the market will notice; otherwise **watch**. Dropped and watch are fine and useful. Don't inflate.
- `the_mistake`: what the market misreads, in one or two plain sentences, or null. `what_makes_market_notice`: the catalyst with a date if known, or null.
- `feedback`: supplier or customer commentary that confirms or contradicts the regime read (with source), or [].
- `coverage`: keys `10-K`, `10-Q`, `earnings_release`, `presentation`, `ir_fact_sheet`, `def14a`, `red_flag_scan`, `price`, each `covered`, `nothing_found` or `unreachable` (add a short reason in `coverage_notes`).

## Output
`runs/20261126-full_hunt/triage/<TICKER>.json`, written atomically (`.tmp`, then `mv`), the CLAUDE.md 6.4 schema plus `"as_of": "2026-11-26"`, `"price_used": {"price": .., "as_of": .., "source": ..}`, `"coverage_notes": {}` and `"complete": true`.
Validate: `python3 scripts/lib/validate.py check runs/20261126-full_hunt/triage/<TICKER>.json` must print OK (it checks 17 reads n=1..17, integer scores 1–5, a source on every read, status and quality enums, coverage values).

## Final reply
Under 80 words: status, quality, attractiveness, the mistake in one line (or "none"), and any layer unreachable. Do not paste the file.
