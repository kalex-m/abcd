"""Phase 1d: apply the no-randoms rule and write universe/universe.csv + universe/drop_log.csv.
Stage A (pre): python3 scripts/p1_universe.py pre   -> data/yf/pre_candidates.txt (ADV >= $10M, rough mcap >= $2B or unknown)
Stage B (final): python3 scripts/p1_universe.py final [MCAP_FLOOR] [ADV_FLOOR]
"""
import sys, json, os
import pandas as pd, numpy as np
ROOT = "/home/user/abcd/company_hunt"
stage = sys.argv[1]
px = pd.read_csv(f"{ROOT}/data/yf/px_stats.csv")
FR = f"{ROOT}/data/sec/frames"
def dei_shares():
    sh = {}
    for p in ("CY2025Q3I", "CY2025Q4I", "CY2026Q1I", "CY2026Q2I", "CY2026Q3I", "CY2026Q4I"):
        fn = f"{FR}/dei_EntityCommonStockSharesOutstanding_shares_{p}.json"
        if os.path.exists(fn):
            for k, v in json.load(open(fn)).items(): sh[k] = v[0]
    return sh
if stage == "pre":
    sh = dei_shares()
    px["cik"] = px["cik"].astype("Int64").astype(str)
    px["dei_shares"] = px["cik"].map(sh)
    px["mcap_rough"] = px["price"] * px["dei_shares"]
    c = px[(px["adv_usd_3m"] >= 10e6) & ((px["mcap_rough"].isna()) | (px["mcap_rough"] >= 2e9))]
    open(f"{ROOT}/data/yf/pre_candidates.txt", "w").write("\n".join(c["ticker"]))
    open(f"{ROOT}/data/yf/pre_ciks.txt", "w").write("\n".join(sorted(set(c["cik"]))))
    print("rows px", len(px), "adv>=10M", int((px["adv_usd_3m"] >= 10e6).sum()), "pre candidates", len(c))
    sys.exit()
MC = float(sys.argv[2]) if len(sys.argv) > 2 else 5e9
ADV = float(sys.argv[3]) if len(sys.argv) > 3 else 20e6
info = json.load(open(f"{ROOT}/data/yf/info.json"))
subs = json.load(open(f"{ROOT}/data/sec/submissions.json"))
cand = [l.strip() for l in open(f"{ROOT}/data/yf/pre_candidates.txt") if l.strip()]
px = px.set_index("ticker")
EXC = {k: v for k, v in json.load(open(f"{ROOT}/universe/exceptions.json")).items() if not k.startswith("_")}
MANUAL_MCAP = {"KOF": 25.0e9, "TX": 9.3e9}  # yfinance .info missing; fast_info marketCap 2026-11-19
for t, v in MANUAL_MCAP.items():
    info.setdefault(t, {})["marketCap"] = v; info[t]["quoteType"] = "EQUITY"
drops = []; keep = []
today = pd.Timestamp("2026-11-19")
for t in cand:
    p = px.loc[t]; i = info.get(t, {}); cik = str(int(p["cik"])); s = subs.get(cik, {})
    qt = i.get("quoteType"); mcap = i.get("marketCap")
    reason = None
    if qt and qt not in ("EQUITY",): reason = f"quoteType {qt}"
    elif s.get("sic") in ("6770",): reason = "blank check / SPAC (SIC 6770)"
    elif s.get("sic") in ("6221",) and "trust" in (s.get("name") or "").lower(): reason = "commodity trust"
    elif mcap is None: reason = "no yfinance market cap"
    elif mcap < MC: reason = f"mcap < {MC/1e9:.0f}B"
    elif p["adv_usd_3m"] < ADV: reason = f"ADV < {ADV/1e6:.0f}M"
    else:
        ff = s.get("first_filing") or "9999"
        hist_ok = ff <= "2021-11-19"
        first_px = p["first_px_date"]
        if not hist_ok and t not in EXC: reason = f"filing history < 5y (first EDGAR filing {ff})"
    if reason:
        drops.append({"ticker": t, "name": i.get("longName") or p["edgar_name"], "reason": reason, "mcap": mcap, "adv": p["adv_usd_3m"]}); continue
    keep.append(t)
# collapse dual share classes: keep the most liquid line per CIK
rows = []
for t in keep:
    p = px.loc[t]; i = info.get(t, {}); cik = str(int(p["cik"])); s = subs.get(cik, {})
    rows.append({"ticker": t, "cik": cik, "name": i.get("longName") or p["edgar_name"], "exchange": p["exchange"],
                 "sector": i.get("sector"), "industry": i.get("industry"), "sic": s.get("sic"), "sic_desc": s.get("sicDescription"),
                 "country": i.get("country"), "filer_category": s.get("category"), "first_filing": s.get("first_filing"),
                 "fy_end": s.get("fiscalYearEnd"), "price": p["price"], "mcap": i.get("marketCap"), "ev_yf": i.get("enterpriseValue"),
                 "adv_usd_3m": p["adv_usd_3m"], "dd_from_3y_high": p["dd_from_3y_high"], "dd_from_52w_high": p["dd_from_52w_high"],
                 "ret_1y": p["ret_1y"], "ret_3y": p["ret_3y"], "ret_5y": p["ret_5y"], "n_analysts": i.get("numberOfAnalystOpinions"),
                 "insider_pct": i.get("heldPercentInsiders"), "inst_pct": i.get("heldPercentInstitutions"), "short_pct_float": i.get("shortPercentOfFloat"),
                 "pe_trailing_yf": i.get("trailingPE"), "pe_forward_yf": i.get("forwardPE"), "fcf_yf": i.get("freeCashflow"), "div_yield_yf": i.get("dividendYield"),
                 "rev_yf": i.get("totalRevenue"), "currency": i.get("currency"), "fin_currency": i.get("financialCurrency"),
                 "is_20f": 1 if "20-F" in (s.get("latest") or {}) else 0, "n_8k_502_3y": (s.get("items_8k_3y") or {}).get("5.02", 0),
                 "n_8k_201_3y": (s.get("items_8k_3y") or {}).get("2.01", 0), "n_8k_205_3y": (s.get("items_8k_3y") or {}).get("2.05", 0),
                 "n_8k_206_3y": (s.get("items_8k_3y") or {}).get("2.06", 0), "n_form4_3y": s.get("n_form4_3y"),
                 "item_401_402_5y": json.dumps(s.get("item_401_402_5y") or []), "exception": (EXC.get(t) or {}).get("why", ""), "pred_cik": (EXC.get(t) or {}).get("pred") or "", "summary": (i.get("longBusinessSummary") or "")[:300]})
U = pd.DataFrame(rows)
before = len(U)
U = U.sort_values("adv_usd_3m", ascending=False).drop_duplicates("cik", keep="first")
dual = before - len(U)
os.makedirs(f"{ROOT}/universe", exist_ok=True)
U.sort_values("mcap", ascending=False).to_csv(f"{ROOT}/universe/universe.csv", index=False)
D = pd.DataFrame(drops); D.to_csv(f"{ROOT}/universe/drop_log.csv", index=False)
print("candidates", len(cand), "kept", len(U), "dual-class collapsed", dual)
print(D["reason"].str.replace(r"\(first EDGAR filing.*", "", regex=True).value_counts().to_string())
