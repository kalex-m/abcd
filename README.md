# Seven Industry Champions (Nov 2026)

Independent equity research: best company in 7 industries (52 companies), built from primary data.

- Report (interactive): `research/report/seven-industry-champions.html`
- Winners: JPM (banks), EOG (oil & gas), ASML (semis), MSFT (hyperscalers), ADBE (software), DAL (airlines), LLY (pharma)
- Pipeline (`research/scripts/`): `sec_pull.py` (SEC EDGAR XBRL), `brk_13f.py` + `brk_analyze.py` (Berkshire 13F history),
  `bank_htm.py` (held-to-maturity losses), `yf_pull.py` / `yf_bs.py` (yfinance), `compute.py` (own metrics),
  `score.py` (5 weighting schemes + stress tests + risk flags), `valuation.py` (reverse DCF), `build_data.py` + `template.html` (report)
- Notes and decision rules: `research/notes/`

## Investment Hunt system (bootstrapped 2026-11-26)

Operating manual: `CLAUDE.md` (single source of truth; read every session).

- Agents: `.claude/agents/` (17: 6 Wave-1 scanners, industry-mapper, triage-analyst, 8 deep-dive layers, red-team)
- State: `config.json`, `RUN_STATE.json` (main thread only), `logs/events.log`
- Helpers: `scripts/lib/edgar.py` (SEC, UA + 0.15s rate limit + cache), `prices.py` (yFinance, retry + daily cache + staleness),
  `validate.py` (sentinel/schema checks, atomic writes, `reconcile` for section 8.3), `charts.py` (house SVG style)
- Auto-resume (Windows): `scripts/register-task.ps1` once, then `scripts/resume.ps1` runs every 20 min
- Smoke test: `python scripts/smoke_test.py` → `logs/smoke-test.json`
- FMP is denied in `.claude/settings.json` (domain + MCP server)
