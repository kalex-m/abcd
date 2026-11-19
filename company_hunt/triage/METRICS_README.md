# metrics.csv column guide

Source: SEC EDGAR XBRL frames API (`data.sec.gov/api/xbrl/frames`), pulled 2026-11-19. One value per filer per calendar-aligned period, last-filed fact wins. "Latest FY" (`last_fy`) is the most recent calendar-year frame with data (CY2026 = fiscal years ending roughly Jul-Dec 2026 that are already filed; otherwise CY2025). Balance sheet = latest quarterly instant frame (`bs_period`, e.g. CY2026Q3I = around 30 Sep 2026). Market data (price, mcap) = yfinance, close of 2026-11-18.

| column | meaning |
|---|---|
| rev, gp, oi, ni, ocf, capex, sbc | latest-FY revenue, gross profit, operating income, net income, operating cash flow, capex, stock-based comp (USD) |
| fcf | ocf - capex |
| fcf_sbc | fcf - sbc (owner cash after paying staff in stock) |
| fcf_yield / fcf_sbc_yield | fcf / mcap, fcf_sbc / mcap |
| fcf_ev_yield | fcf / enterprise value (mcap + debt - cash - short-term investments) |
| net_cash | cash + short-term investments - total debt (latest balance sheet; leases excluded) |
| netcash_mcap | net_cash / mcap |
| roic | after-tax operating income / (equity + debt - cash), latest; roic_5y_avg = 5 prior years |
| gm, om, fcf_margin | gross, operating, FCF margin, latest FY |
| gm_med_5y, om_med_10y | own medians; gm_hold = gm / gm_med_5y |
| om_min_2019_25 | worst operating margin 2019-2025 (downturn test) |
| fcf_margin_vol_10y | std dev of FCF margin over up to 10 years |
| rev_cagr_3y/5y/10y, eps_cagr_5y, fcfps_cagr_5y | compound growth, per-share where stated |
| rev_worst_yoy, oi_worst_yoy, n_rev_down_years | worst single-year revenue / operating-income change; count of down years |
| shs_chg_3y / 5y | change in diluted share count (negative = buybacks win) |
| sh_yield | (dividends + buybacks) / mcap, latest FY |
| pe_now, evebit_now, pfcf_now | current multiples on latest FY |
| pe_med_10y etc. | median of year-end multiples 2016-latest (price at fiscal year end x diluted shares) |
| *_vs_med | now / own median - 1 (negative = cheaper than its own history) |
| val_disc | most negative of the three *_vs_med; val_disc_avg = their average |
| restr_rev, imp_rev, divest_mcap | 3y restructuring charges / revenue, 3y impairments / revenue, 3y divestiture proceeds / mcap |
| n_8k_502_3y, n_8k_201_3y | count of 8-Ks with Item 5.02 (officer/director changes), 2.01 (completed acquisition/disposal) in 3y |
| ocf_growth_vs_ni | 2y OCF growth minus 2y net income growth (positive = cash improving faster than GAAP) |
| invest_mcap | (equity-method + long-term investments) / mcap; eqinc_ni = equity-method income / net income |
| rpo_growth, rpo_rev | remaining performance obligations (contracted backlog) growth y/y and RPO / revenue |
| cash_yield | fcf_sbc_yield for operating companies; earnings yield for banks/insurers |
| n_analysts | yfinance analyst count (attention proxy only) |
| item_401_402_5y | 8-Ks with Item 4.01 (auditor change) or 4.02 (non-reliance/restatement) in 5y |

Caveats: frames mix tag choices across companies; banks' revenue = net interest income + non-interest income when no Revenues tag; IFRS 20-F filers have no us-gaap frames (yfinance fallback, flagged `src_fund=yf`).
