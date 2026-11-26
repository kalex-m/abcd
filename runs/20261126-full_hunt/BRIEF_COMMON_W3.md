# Wave 3 common brief: industry mappers (run 20261126-full_hunt)

- Repo root `/home/user/abcd` (Linux, `python3`). Today 2026-11-26 (US Thanksgiving; last close 2026-11-25).
- Read `CLAUDE.md` sections 1, 2, 6.3 and 6.3.1 first. Helpers: `scripts/lib/edgar.py` (SEC, now with a real contact header), `scripts/lib/prices.py` (yFinance, last).
- Regime context: read `runs/20261126-full_hunt/regime.json` (short). Working read: **late Overheat in hard data, markets pricing a turn toward Slowdown**, confidence low-medium. Fed leaning to hike Dec 8–9; 10y 4.85%; HY spreads 3.72% and widening; Brent ~$91–95 after -18% in a month; dollar +4.8% over 3m; real consumer spending flat in October.
- Your routed leads: read `runs/20261126-full_hunt/routing.json` → `routed.<your-slug>` gives the lead IDs; full cards are in `runs/20261126-full_hunt/leads/*.json`. **Answer every routed lead's `ask_next`** (or mark it unanswerable with the reason). If a lead's evidence turns out wrong, say so.
- Source status: EDGAR, yFinance, Treasury, Fed, EIA, AAR, STB, CFTC, Federal Register, FDA, USTR, OFAC work. FRED and the BLS API were flaky (try once, then fall back). FERC/FCC/CourtListener block scripts (use WebSearch to find docket numbers and cite official URLs). Do not spoof browser user agents. **Never FMP.** Analyst opinions and price targets are not evidence.
- Every number carries a source URL and as-of date. Plain language.

## Outputs (atomic: write `.tmp`, then `mv`)
1. `runs/20261126-full_hunt/industries/<slug>.json`, a JSON object with exactly these keys:
```json
{
 "industry": "<slug>", "as_of": "2026-11-26", "complete": true,
 "how_money_flows": "plain-words paragraph",
 "value_chain": {
   "inputs": [{"input": "diesel fuel", "suppliers": ["..."], "concentration": "...", "signal_tags": ["oil"], "pass_through": "how/if cost passes to customers", "source": "url", "as_of": "..."}],
   "industry_layer": {"who_makes_what": "...", "chokepoints": ["..."], "capacity": "...", "locations": "...", "sources": ["url"]},
   "customers": [{"segment": "...", "big_buyers": ["..."], "share_of_revenue": "...", "signal_tags": ["ism", "rates"], "source": "url"}]
 },
 "cycle_position": {"capacity": "...", "pricing": "...", "inventories": "...", "capex": "...", "where_now": "...", "sources": ["url"]},
 "structure": {"concentration": "...", "pricing_power": "...", "barriers": "...", "regulation": "...", "sources": ["url"]},
 "key_numbers": [{"metric": "...", "why_it_matters": "...", "latest": "...", "prior": "...", "source": "url", "as_of": "..."}],
 "regime_sensitivity": {"boom": "...", "overheat": "...", "stagflation": "...", "slowdown": "..."},
 "companies": [{"ticker": "...", "name": "...", "company_type": "Stalwart|Fast grower|Slow grower|Cyclical|Turnaround|Asset play|Stronghold",
                "business_model": "one of CLAUDE.md 6.3.1", "triage": true, "why_listed": "routed lead | everyday brand | market cap | foreign peer",
                "market_cap_usd_bn": 0, "everyday_brand": false, "us_listed": true}],
 "lead_answers": [{"lead_id": "...", "answer": "...", "sources": ["url"], "as_of": "..."}],
 "feedback": [{"regime_signal": "...", "confirms_or_contradicts": "confirms|contradicts", "evidence": "...", "source": "url"}]
}
```
   - `companies`: every notable US-listed company, plus major foreign peers marked `"us_listed": false, "triage": false` (context only). **At most 20 with `"triage": true`**, chosen in order: names a routed lead points to, then well-known names and everyday brands, then the rest by market cap. Past the cap, list them with `"triage": false` (they stay on the map as `not_triaged`).
   - `feedback`: supplier or customer commentary from filings or calls that confirms or contradicts the regime read (CLAUDE.md 5 feedback loop).
2. `library/industries/<slug>-primer.md`: persistent learning material for Alex: what the industry is, how money flows, the cycle, the lingo (each term defined in a few words), the 3–5 numbers to watch, and what to watch next. If the file exists, edit and extend it rather than overwrite. End with `<!-- COMPLETE -->`.

Validate: `python3 scripts/lib/validate.py check runs/20261126-full_hunt/industries/<slug>.json library/industries/<slug>-primer.md` must print OK twice.

## Final reply
Under 150 words: the triage list (tickers, in priority order), the 2–3 most important findings, and any part unreachable. Do not paste your files.
