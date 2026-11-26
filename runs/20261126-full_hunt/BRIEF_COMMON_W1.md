# Wave 1 common brief (run 20261126-full_hunt)

- Repo root: `/home/user/abcd` (Linux, use `python3`). Today is **2026-11-26** (Thursday, US Thanksgiving: markets closed; last trading close 2026-11-25; Friday 11-27 is a half day).
- Read `CLAUDE.md` sections 1, 2, 4, 5 and 7 before you start (not the whole file).
- Helpers: `scripts/lib/edgar.py` (SEC with required User-Agent, rate limit, cache: `edgar.submissions`, `edgar.companyfacts`, `edgar.recent_filings`, `edgar.full_text_search`, `edgar.annual_series`) and `scripts/lib/prices.py` (yFinance with retry and daily cache: `prices.history`, `prices.quote`). Import with `sys.path.insert(0, "scripts/lib")`.
- Known source status (bootstrap smoke test, 2026-11-26): working = EDGAR, yFinance, Treasury yields CSV (home.treasury.gov) and fiscaldata auctions API, Fed press feed, BEA site, Census site, EIA site, CFTC Socrata API, Cboe VIX CSV, Federal Register API, USTR, OFAC, STB, FDA. **Unreachable** = FRED (connection closed; try once, then fall back), BLS API (daily keyless quota hit; BLS site blocks bots, so use WebSearch/WebFetch on official release text, or cite the release via another official page), FERC, FCC (403), CourtListener (401). Mark any layer you can't reach as `unreachable` with the reason. Do not spoof browser user agents.
- **Never use FMP** (no FMP website, no FMP MCP tools). Perplexity is cross-check only. Analyst opinions, price targets and news narratives are context at most, never evidence.
- Every fact carries a source URL and an as-of date. No source, no fact.
- Plain language. Define any unavoidable term in a few words.
- Research only. No trading or account actions.

## Outputs (write both, atomically: write `<path>.tmp`, then `mv` to the final path)
1. `runs/20261126-full_hunt/wave1/<agent>.md`: your findings. Keep it tight (aim for under 1,500 words). Each finding is written as **fact → source → what it means → confidence**. End the file with a final line exactly `<!-- COMPLETE -->`.
2. `runs/20261126-full_hunt/leads/<agent>.json`: a JSON **array** of lead cards (CLAUDE.md section 5 schema, all keys present: lead_id, agent, signal, evidence[{fact,source,as_of}], travels_to[{industry,link,direction}], so_what, ask_next, tickers_named, strength, confidence). Use `lead_id` = `L-20261126-<agent>-<n>`. Set `strength` to `one_lane` (the main thread upgrades confirmed leads). At most 8 cards; zero is fine if nothing qualifies.

Validate before finishing: `python3 scripts/lib/validate.py check runs/20261126-full_hunt/wave1/<agent>.md runs/20261126-full_hunt/leads/<agent>.json` must print OK twice.

## Industries
No industries are configured yet. Name any industry a lead travels to (use short slugs like `railroads`, `payments`, `homebuilders`, `banks`, `airlines`, `oil-gas`, `software`, `semiconductors`, `p-c-insurance`, `utilities`, `staples`, `trucking`). The defaults if Alex picks nothing are railroads, payments, homebuilders.

## Prior view (from an earlier run on 2026-11-18, partly sourced from FMP and news, so **unverified**: confirm or break it from primary sources)
- Oil shock from the US–Iran conflict and Strait of Hormuz disruption: Brent peaked about $126 in late April 2026, about $92 on Nov 17–18. Jet fuel at records in October.
- Fed (Chair Warsh): +25bp to 3.75–4.00% on 2026-09-16, hold on 2026-10-28 with two dissents for a hike, December 8–9 meeting with hike odds reported high.
- Treasuries around Nov 17: 2y ~4.80%, 10y ~5.10%, 30y ~5.46%. 30-year mortgage ~7.0–7.3%.
- Energy best sector YTD; communication services worst. Software sold off on AI-agent seat-compression fears (CRM, NOW, ADBE down hard mid-November).
- Homebuilder sentiment lowest since 2012; heavy incentives. Berkshire bought Taylor Morrison (deal announced 2026-05-31), doubled Lennar, added Delta, kept cutting BAC and COF, and is buying back its own stock.
- Working regime guess: **Stagflation leaning** (growth slowing, inflation pushed up by energy and tariffs), confidence low.

## Final reply to the main thread
Reply in **under 150 words**: the 3 most important findings, the number of lead cards, and any layer marked unreachable. Do not paste your files.
