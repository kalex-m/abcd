"""Assemble compact JSON for the report page."""
import json, csv
R = "/home/user/abcd/research/data"
M = json.load(open(f"{R}/metrics.json")); S = json.load(open(f"{R}/scores.json")); V = json.load(open(f"{R}/valuation.json"))
BRK = json.load(open(f"{R}/sec/brk_summary.json")); HTM = json.load(open(f"{R}/sec/bank_htm.json")); MK = json.load(open(f"{R}/yf/market.json"))
WIN = {"bank":"JPM","oil":"EOG","semi":"ASML","hyper":"MSFT","soft":"ADBE","air":"DAL","pharma":"LLY"}
NAMES = {"bank":"Banks","oil":"Oil & Gas","semi":"Semiconductors","hyper":"Hyperscalers & AI platforms","soft":"Application software","air":"Airlines","pharma":"Big pharma"}
rows = list(csv.reader(open(f"{R}/yf/closes.csv"))); hdr = rows[0]; data = [r for r in rows[1:] if r and r[0] >= "2025-11-18"]
def r4(x, n=4):
    return None if x is None else round(float(x), n)
def pxs(t):
    i = hdr.index(t) if t in hdr else None
    if i is None: return []
    pts = [(r[0], float(r[i])) for r in data if r[i]]
    if not pts: return []
    b = pts[0][1]; step = max(1, len(pts) // 52)
    return [[d, round(p / b * 100, 1)] for d, p in pts[::step]] + [[pts[-1][0], round(pts[-1][1] / b * 100, 1)]]
KEYS_NF = ["px","mcap","rev","rev_yoy_q","rev_cagr","om","om5","fcf_m","fcf_m5","fcf_m_min","roic","nd_ebitda","int_cov","pe","pe_norm","fcf_y","oe_y_strict","oe_y_maint","capex_ocf","sbc_rev","shs_cagr","div_cov","ret_1y","ret_ytd","dd_hi","arch","arch_label","net_debt","fcf","ni","oe_strict","oe_maint","ev"]
KEYS_B = ["px","mcap","rotce","ptbv","p_etbv","pe","eff","prov_rev","aoci_tbv","htm_loss","htm_loss_tbv","tbv","etbv","payout","shs_cagr","cet1","ret_1y","ret_ytd","dd_hi","earn_yield","ni_common","rev"]
out = {"asof": "2026-11-18", "industries": {}, "winners": WIN}
for ind, sc in S.items():
    if ind.startswith("_"): continue
    runs = {**{k: v["rank"] for k, v in sc["schemes"].items()}, **{"STRESS: " + k: v["rank"] for k, v in sc["stress"].items()}}
    base = sc["schemes"]["Owner (base)"]["scores"]
    comps = []
    for t in sc["robust_order"]:
        c = M[t]; keys = KEYS_B if ind == "bank" else KEYS_NF
        d = {"t": t, "name": c["name"]}
        for k in keys:
            v = c.get(k); d[k] = r4(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else v
        d["score"] = r4(base[t]["total"]); d["pillars"] = {p: r4(x, 3) for p, x in base[t]["pillars"].items()}
        d["wins"] = sc["wins"][t]; d["avgrank"] = r4(sc["avgrank"][t], 2); d["flags"] = S["_flags"].get(t, [])
        d["val"] = {k: (r4(v) if isinstance(v, (int, float)) else v) for k, v in V.get(t, {}).items() if k in ("g_strict","g_maint","g_norm","impl_rotce_tbv","impl_rotce_etbv","rotce","erotce")}
        iv = V.get(t, {}).get("iv_vs_mcap"); d["iv_base"] = r4(iv["base"]) if iv else None
        d["px1y"] = pxs(t)
        if ind != "bank":
            d["hist"] = {"rev": [[k[:4], round(v, 2)] for k, v in c["ann"].get("rev", [])], "fcf": [[k[:4], round(v, 2)] for k, v in c.get("fcf_hist", [])]}
        comps.append(d)
    out["industries"][ind] = {"name": NAMES[ind], "winner": WIN[ind], "runs": runs, "n_runs": sc["n_runs"], "companies": comps,
                              "pillars": S["_pillars"][ind]}
out["schemes"] = S["_schemes"]; out["loe"] = S["_loe"]; out["seat"] = S["_seat"]; out["extfin"] = S["_extfin"]
q = BRK["quarters"]
out["brk"] = {"q": q, "total": [round(BRK["total"][x] / 1e9, 1) for x in q], "banks": [round(BRK["bank_val"][x] / 1e9, 1) for x in q],
              "bank_share": [round(BRK["bank_share"][x] * 100, 1) for x in q],
              "pos": {k: {"sh": [round(BRK["pos"][k][x][0] / 1e6, 1) for x in q], "val": [round(BRK["pos"][k][x][1] / 1e9, 2) for x in q]} for k in ["BAC","C","COF","USB","NU","AXP","AAPL","GOOGL","DAL","LEN","CVX","OXY","CB","UNH","KO","MCO"]}}
out["htm"] = {t: {"loss": round((v.get("htm_loss") or 0) / 1e9, 1), "tbv": round(M[t]["tbv"], 1), "pct": round(M[t]["htm_loss_tbv"] * 100, 1)} for t, v in HTM.items()}
out["mkt"] = {k: {"px": r4(MK[k].get("lastPrice"), 2), "hi": r4(MK[k].get("yearHigh"), 2), "lo": r4(MK[k].get("yearLow"), 2)} for k in ["BZ=F","CL=F","^TNX","SPY","^GSPC","XLE","XLK","XLF","XLV","IGV","SMH","JETS","ITB","BRK-B","KO"]}
sect = {}
for k in ["SPY","XLE","XLK","XLF","XLV","IGV","SMH","JETS","ITB","BRK-B"]:
    i = hdr.index(k); ytd = [float(r[i]) for r in rows[1:] if r and r[0] >= "2026-01-02" and r[i]]
    sect[k] = round((ytd[-1] / ytd[0] - 1) * 100, 1) if ytd else None
out["sect_ytd"] = sect
json.dump(out, open(f"{R}/report_data.json", "w"), separators=(",", ":"))
import os; print("bytes", os.path.getsize(f"{R}/report_data.json")); print("sector YTD", sect)
for ind, d in out["industries"].items():
    w = [c for c in d["companies"] if c["t"] == d["winner"]][0]
    print(ind, d["winner"], "wins", w["wins"], "/", d["n_runs"], "avgrank", w["avgrank"], "order", [c["t"] for c in d["companies"]])
