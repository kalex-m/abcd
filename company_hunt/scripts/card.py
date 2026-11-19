#!/usr/bin/env python3
"""Company data card from the hunt's prepared data (EDGAR frames + yfinance).
Usage: python3 scripts/card.py TICKER [TICKER ...]"""
import sys, json, math
import pandas as pd
ROOT = "/home/user/abcd/company_hunt"
M = pd.read_csv(f"{ROOT}/triage/metrics.csv").set_index("ticker")
S = json.load(open(f"{ROOT}/data/sec/series.json"))
def f(x, pct=False, b=False):
    if x is None or (isinstance(x, float) and math.isnan(x)): return "n/a"
    if pct: return f"{x*100:.1f}%"
    if b: return f"${x/1e9:,.2f}B"
    return f"{x:,.2f}"
for t in sys.argv[1:]:
    if t not in M.index: print(f"## {t}: not in universe"); continue
    m = M.loc[t]; cik = str(int(m["cik"]))
    print(f"## {t} | {m['name']} | {m['sector']} / {m['industry']} | SIC {m.get('sic')} | CIK {cik} | country {m.get('country')}")
    print(f"price ${f(m['price'])} (2026-11-18) | mcap {f(m['mcap'], b=True)} | EV {f(m.get('ev'), b=True)} | ADV {f(m['adv_usd_3m'], b=True)} | analysts {m.get('n_analysts')} | insiders {f(m.get('insider_pct'), pct=True)} | short {f(m.get('short_pct_float'), pct=True)}")
    print(f"drawdown from 3y high {f(m['dd_from_3y_high'], pct=True)} | 1y {f(m['ret_1y'], pct=True)} | 3y {f(m['ret_3y'], pct=True)} | 5y {f(m['ret_5y'], pct=True)}")
    print(f"latest FY {m.get('last_fy')} (end {m.get('fy_end_date')}) src={m.get('src_fund')} | rev {f(m['rev'], b=True)} | GM {f(m['gm'], pct=True)} | OM {f(m['om'], pct=True)} (10y med {f(m['om_med_10y'], pct=True)}) | NI {f(m['ni'], b=True)}")
    print(f"OCF {f(m['ocf'], b=True)} | capex {f(m['capex'], b=True)} | FCF {f(m['fcf'], b=True)} | SBC {f(m['sbc'], b=True)} | FCF-SBC {f(m['fcf_sbc'], b=True)} | FCF yield {f(m['fcf_yield'], pct=True)} | FCF-SBC yield {f(m['fcf_sbc_yield'], pct=True)} | FCF/EV {f(m['fcf_ev_yield'], pct=True)}")
    print(f"cash+STI {f(m['cash_sti'], b=True)} | debt {f(m['debt'], b=True)} ({m.get('debt_src')}) | net cash {f(m['net_cash'], b=True)} | op leases {f(m.get('oplease'), b=True)} | pension funded status {f(m.get('pension_funded'), b=True)} | debt due 1-3y {f(m.get('mat_1_3y'), b=True)}")
    print(f"ROIC {f(m['roic'], pct=True)} (5y avg {f(m['roic_5y_avg'], pct=True)}) | int cover {f(m.get('int_cov'))}x | OCF/NI 5y {f(m.get('ocf_ni_5y'))} | shares 3y {f(m['shs_chg_3y'], pct=True)} 5y {f(m['shs_chg_5y'], pct=True)} | sh. yield {f(m['sh_yield'], pct=True)}")
    print(f"rev CAGR 3/5/10y {f(m['rev_cagr_3y'], pct=True)} / {f(m['rev_cagr_5y'], pct=True)} / {f(m['rev_cagr_10y'], pct=True)} | EPS CAGR 5y {f(m['eps_cagr_5y'], pct=True)} | FCF/sh CAGR 5y {f(m['fcfps_cagr_5y'], pct=True)} | worst rev yoy {f(m['rev_worst_yoy'], pct=True)}")
    print(f"P/E {f(m['pe_now'])} vs 10y med {f(m['pe_med_10y'])} | EV/EBIT {f(m['evebit_now'])} vs {f(m['evebit_med_10y'])} | P/FCF {f(m['pfcf_now'])} vs {f(m['pfcf_med_10y'])} | yf fwd P/E {f(m.get('pe_forward_yf'))}")
    print(f"3y restructuring/rev {f(m['restr_3y']/m['rev'] if m['rev'] else None, pct=True)} | 3y impairments {f(m['imp_3y'], b=True)} | 3y divestitures {f(m['divest_3y'], b=True)} | 5y acquisitions {f(m['acq_5y'], b=True)} | RPO {f(m.get('rpo'), b=True)} (yoy {f(m.get('rpo_growth'), pct=True)})")
    print(f"8-K 3y: Item 5.02 x{m.get('n_8k_502_3y')}, 2.01 x{m.get('n_8k_201_3y')}, 2.05 x{m.get('n_8k_205_3y')}, 2.06 x{m.get('n_8k_206_3y')} | Item 4.01/4.02 5y: {m.get('item_401_402_5y')} | Form 4s 3y: {m.get('n_form4_3y')} | 20-F filer: {m.get('is_20f')}")
    s = S.get(cik, {}).get("S", {})
    yrs = sorted(set(s.get("rev", {})) | set(s.get("ocf", {})))[-10:]
    if yrs:
        print("year      " + " ".join(f"{y:>8s}" for y in yrs))
        for k, lab in [("rev", "rev $B"), ("oi", "op inc"), ("ni", "net inc"), ("ocf", "OCF"), ("capex", "capex"), ("fcf", "FCF"), ("sbc", "SBC"), ("bb", "buyback"), ("div", "divs")]:
            row = s.get(k, {})
            print(f"{lab:9s} " + " ".join(f"{(row.get(y)/1e9):8.2f}" if row.get(y) is not None else f"{'-':>8s}" for y in yrs))
        sh = s.get("shs", {})
        print(f"{'dil shs M':9s} " + " ".join(f"{(sh.get(y)/1e6):8.0f}" if sh.get(y) else f"{'-':>8s}" for y in yrs))
    print(f"(source: EDGAR XBRL frames via data.sec.gov, calendar-aligned FY; yfinance market data 2026-11-18; FY columns are calendar-year frames)\n")
