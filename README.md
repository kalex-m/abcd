# Research

- **NEW: Industry Champions, all 50 industries (SEC EDGAR + yFinance only):** `research/all_industries/` (report: `research/all_industries/report/industry-champions.html`)

# Seven Industry Champions (Nov 2026)

Independent equity research: best company in 7 industries (52 companies), built from primary data.

- Report (interactive): `research/report/seven-industry-champions.html`
- Winners: JPM (banks), EOG (oil & gas), ASML (semis), MSFT (hyperscalers), ADBE (software), DAL (airlines), LLY (pharma)
- Pipeline (`research/scripts/`): `sec_pull.py` (SEC EDGAR XBRL), `brk_13f.py` + `brk_analyze.py` (Berkshire 13F history),
  `bank_htm.py` (held-to-maturity losses), `yf_pull.py` / `yf_bs.py` (yfinance), `compute.py` (own metrics),
  `score.py` (5 weighting schemes + stress tests + risk flags), `valuation.py` (reverse DCF), `build_data.py` + `template.html` (report)
- Notes and decision rules: `research/notes/`
