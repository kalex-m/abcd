"""Cross-check EDGAR-derived latest-FY figures against yfinance annual statements for the same fiscal year.
Usage: python3 scripts/p2_xcheck.py 1 2 3 4   -> triage/xcheck_ground_N.csv + summary printed
EDGAR wins on disagreement; flags > 5% gaps for logging."""
import sys, json, pandas as pd, numpy as np
ROOT = "/home/user/abcd/company_hunt"
M = pd.read_csv(f"{ROOT}/triage/metrics.csv").set_index("ticker")
Y = json.load(open(f"{ROOT}/data/yf/yf_fund.json"))
S = json.load(open(f"{ROOT}/data/sec/series.json"))
PAIRS = [("rev", "ai", "Total Revenue"), ("ni", "ai", "Net Income"), ("ocf", "ac", "Operating Cash Flow"), ("capex", "ac", "Capital Expenditure")]
allrows = []
for g in sys.argv[1:]:
    G = pd.read_csv(f"{ROOT}/triage/ground_{g}.csv")
    rows = []
    for t in G["ticker"].head(25):
        if t not in M.index: continue
        m = M.loc[t]; y = Y.get(t, {})
        if m.get("src_fund") == "yf":
            rows.append({"ground": g, "ticker": t, "note": "yfinance is the only source (IFRS/40-F filer); EDGAR XBRL not in us-gaap frames"}); continue
        cik = str(int(m["cik"])); ly = int(m["last_fy"]) if pd.notna(m["last_fy"]) else None
        ends = S.get(cik, {}).get("S", {}).get("ends", {})
        fye = ends.get(str(ly)) if ly else None
        r = {"ground": g, "ticker": t, "edgar_fy_end": fye}
        for k, sec, row in PAIRS:
            ev = m.get(k)
            yv = None
            ser = (y.get(sec) or {}).get(row) or {}
            if fye:
                # yfinance column date = fiscal period end; match within 20 days
                for d, v in ser.items():
                    if v is not None and abs((pd.Timestamp(d) - pd.Timestamp(fye)).days) <= 20: yv = abs(v) if k == "capex" else v
            r[f"{k}_edgar"] = ev; r[f"{k}_yf"] = yv
            r[f"{k}_gap"] = (yv / ev - 1) if (yv is not None and ev and pd.notna(ev) and ev != 0) else None
        gaps = [abs(r[f"{k}_gap"]) for k, _, _ in PAIRS if r.get(f"{k}_gap") is not None]
        r["max_abs_gap"] = max(gaps) if gaps else None
        r["flag"] = "CHECK" if (gaps and max(gaps) > 0.05) else ("no yf match" if not gaps else "ok")
        rows.append(r)
    D = pd.DataFrame(rows); D.to_csv(f"{ROOT}/triage/xcheck_ground_{g}.csv", index=False)
    allrows.append(D)
    print(f"G{g}: n={len(D)} ok={int((D.get('flag')=='ok').sum())} check={int((D.get('flag')=='CHECK').sum())} nomatch={int((D.get('flag')=='no yf match').sum())} yf-only={int(D.get('note').notna().sum()) if 'note' in D else 0}")
    for _, r in D[D.get("flag") == "CHECK"].iterrows():
        print("   ", r["ticker"], {k: round(r[f"{k}_gap"], 3) for k, _, _ in PAIRS if pd.notna(r.get(f"{k}_gap"))})
