# Industry Champions (Nov 2026) — 50 industries, 342 companies

Report: `report/industry-champions.html` (data embedded). Sources: SEC EDGAR XBRL companyfacts + yFinance only (no FMP).

Pipeline (`scripts/`, run in order):
1. `sec_pull.py` — companyfacts for every ticker in `data/universe.json` (US-GAAP + IFRS), every fiscal year with first-filed date (point-in-time), TTM from 10-Q YTD math.
2. `yf_pull.py`, `yf_rev.py` — prices/total returns/market caps/splits, 20-F quarterlies, Total Revenue (referee for SEC revenue-tag choice).
3. `run_now.py` (metrics via `compute.py`) -> `run_score.py` (within-industry percentiles, 9 pillars, 20,000-run brute force, gates via `score.py`).
4. `backtest.py`, `bt_search.py` — point-in-time re-runs at Apr-2017/2019/2021/2023; weight search with out-of-sample test; depressed-industry test.
5. `sectors.py` — depressed-industry scan (3y vs S&P 500 < -25 pp), cycle vs disruption, capital intensity. Context notes: `data/depressed_why.json`.
6. `build_report.py` -> `render_html.py`.

Pick rule: gates (FCF & revenue stable, capital to survive, not shrinking while peers grow) -> normal industry: most brute-force wins; depressed industry: best survival-tree score (backtest: +2.8%/yr vs industry, 62% hit, n=29; cheapest -1.9%/yr).
