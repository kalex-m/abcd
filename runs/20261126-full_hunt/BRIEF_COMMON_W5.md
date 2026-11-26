# Wave 5 common brief: deep dive (run 20261126-full_hunt)

- Repo root `/home/user/abcd` (Linux, `python3`). Run date 2026-11-26 (last market close 2026-11-25).
- Read `CLAUDE.md` sections 1.1, 1.3, 2 and 6.5 (your layer's row) first. Helpers: `scripts/lib/edgar.py`, `scripts/lib/prices.py`.
- Context (read only these): the company's triage file `runs/20261126-full_hunt/triage/<TICKER>.json` (its reads, `the_mistake`, `what_makes_market_notice`, `coverage_notes`), and `runs/20261126-full_hunt/regime.json`. Do **not** read other deep-dive layers: each layer is independent.
- Regime: late Overheat in hard data, markets pricing a turn toward Slowdown (Fed leaning to hike Dec 8–9; 10y 4.85%; HY spreads 3.72% and widening; real consumer spending flat in October; dollar +4.8% over 3m).
- Source status: EDGAR, yFinance, Treasury, Fed and most company IR sites work; some IR sites return 403 or captchas (mark `unreachable` with the reason); CourtListener, FERC and FCC block scripts (use WebSearch to find docket numbers, cite official URLs). Do not spoof browser user agents. **Never FMP.** Analyst views and price targets are not evidence.
- Scratch files: only your own folder `/tmp/claude-0/-home-user-abcd/972a45b1-c2d4-550c-82a7-8ab8c6b660c3/scratchpad/dd-<TICKER>-<layer>/`.

## Your job
Work **every item** in your layer's row of CLAUDE.md 6.5, explicitly. Your purpose is to **test the triage's mistake and catalyst**, not to re-describe the company: hunt for what confirms it, and especially for what breaks it.

## Output
`runs/20261126-full_hunt/deepdive/<TICKER>/<layer>.md`, written atomically (`.tmp`, then `mv`), at most about 1,500 words, in this order:
1. `## Summary for main thread` (at most 150 words): the 3 findings that matter most and one line `Thesis impact: supports | weakens | breaks | neutral`.
2. `## Findings`: each as **fact → source URL (as-of date) → what it means → confidence**.
3. `## Coverage`: a table with every item in your layer's 6.5 row marked `covered`, `nothing_found` or `unreachable` (with reason). Never present partial coverage as complete.
4. `## Feedback`: supplier/customer/management commentary that confirms or contradicts the regime read (with source), or "none".
5. Last line exactly: `<!-- COMPLETE -->`

Validate: `python3 scripts/lib/validate.py check runs/20261126-full_hunt/deepdive/<TICKER>/<layer>.md` must print OK.

## Final reply
Under 80 words: the thesis impact and the single most important finding. Do not paste the file.
