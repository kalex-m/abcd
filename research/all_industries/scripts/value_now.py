"""Depressed valuations inside depressed industries -> data/value_report.json
Bargain score (fixed from backtest bt_value_eval.py): average within-industry rank of
  cheapness vs OWN 10y history + Survival pillar + brute-force quality, among companies passing every gate.
Value trap = cheap vs own history (>= 70th pct) but fails a gate (in backtest: -2.7%/yr, beat peers only 36%)."""
import json, numpy as np, pandas as pd
import load as L, compute as C, valhist as V

H = json.load(open(f"{L.R}/valhist.json")); M = json.load(open(f"{L.R}/metrics_now.json"))
SC = json.load(open(f"{L.R}/scores_now.json")); SE = json.load(open(f"{L.R}/sectors.json"))
BE = json.load(open(f"{L.R}/bt_value_eval.json")); WHY = json.load(open(f"{L.R}/depressed_why.json"))
KEY = {"gen": ("ebit5_ev", "EV / 5y-avg EBIT"), "auto": ("ey5", "Price / 5y-avg earnings"), "reit": ("ocf5_y", "Price / 5y-avg cash flow"), "bank": ("ey5", "Price / 5y-avg earnings"), "ins": ("ey5", "Price / 5y-avg earnings")}
OTHER = {"gen": [("sales_ev", "EV/Sales"), ("fcf5_y", "P/FCF 5y"), ("ey", "P/E")], "auto": [("ey", "P/E"), ("fcf5_y", "P/FCF 5y")], "reit": [("sales_ev", "EV/Sales"), ("ocf_y", "P/OCF")],
         "bank": [("ey", "P/E"), ("bp", "P/TBV")], "ins": [("ey", "P/E"), ("bp", "P/B")]}
def r(x, n=3): return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), n)

def band(h, y, window=120):
    """multiple (1/yield) now vs own 10y: p10, median, p90 relative to median; None if earnings negative now."""
    i = len(h["m"]) - 1; hist = [v for v in h[y][max(0, i - window):i + 1] if v is not None and v > 0]
    v = h[y][i]
    if len(hist) < 36: return None
    mult = 1 / np.array(hist); med = float(np.median(mult))
    out = {"med": r(med, 2), "p10": r(np.percentile(mult, 10) / med - 1), "p90": r(np.percentile(mult, 90) / med - 1),
           "now": r(1 / v, 2) if v and v > 0 else None, "rel": r((1 / v) / med - 1) if v and v > 0 else None}
    q = [(h["m"][k], 1 / h[y][k] if h[y][k] and h[y][k] > 0 else None) for k in range(max(0, i - window), i + 1, 3)]
    out["spark"] = [[m_, r(x, 2)] for m_, x in q]
    return out

def dd5(t):
    p = L.MSA[t].dropna(); return float(p.iloc[-1] / p.iloc[-60:].max() - 1)

inds_out = []; allrows = []
for ind, se in sorted(SE["ind"].items(), key=lambda kv: kv[1]["rel3"]):
    d = SC[ind]; kind = d["kind"]; tks = [t for t in d["tickers"] if t in H]
    rows = []
    for t in tks:
        h = H[t]; vk = h["kind"]; ch = V.cheapness(h)
        g = d["gates"][t]; ok = all(v[0] for v in g.values())
        rows.append({"t": t, "n": M[t]["_name"], "mc": r(M[t].get("mcap_usd_b"), 1), "own": r(ch["cheap"]) if ch else None,
                     "up": r(ch["upside"]) if ch and ch["upside"] is not None else None, "surv": r(d["pillars"][t][8]), "qual": r(d["win"][t]),
                     "peerv": r(d["pillars"][t][7]), "gok": ok, "g": {k: [v[0], v[1]] for k, v in g.items()}, "dd5": r(dd5(t)),
                     "key": band(h, KEY[vk][0]), "keyl": KEY[vk][1],
                     "oth": [[lbl, band(h, y)] for y, lbl in OTHER[vk]], "hist_from": h["m"][0]})
    df = pd.DataFrame([{"t": x["t"], "own": x["own"] if x["own"] is not None else 0.5, "surv": x["surv"], "qual": x["qual"]} for x in rows])
    for c in ("own", "surv", "qual"): df["r_" + c] = df[c].rank(pct=True)
    df["sq"] = df[["r_surv", "r_qual"]].mean(axis=1)   # survivor + quality (backtest best: +4.3%/yr, 59% hit)
    for x, b in zip(rows, df["sq"]):
        x["sq"] = r(b); x["trap"] = bool((x["own"] or 0) >= 0.7 and not x["gok"])
    passers = [x for x in rows if x["gok"]] or rows
    best = max(passers, key=lambda x: (x["sq"], x["qual"]))
    kmed = np.median([x["key"]["now"] for x in rows if x["key"] and x["key"]["now"]] or [np.inf])
    for x in rows: x["vs_peer_key"] = r(x["key"]["now"] / kmed - 1) if x["key"] and x["key"]["now"] and np.isfinite(kmed) else None
    # bargain = cheap vs own 10y history AND key multiple no higher than the industry median AND passes every gate
    cheap_ok = [x for x in rows if x["gok"] and (x["own"] or 0) >= 0.6 and x["vs_peer_key"] is not None and x["vs_peer_key"] <= 0]
    bargain = max(cheap_ok, key=lambda x: (x["sq"], x["own"])) if cheap_ok else None
    pick = bargain or best
    cheapest = max(rows, key=lambda x: x["own"] or 0)
    rows.sort(key=lambda x: -(x["own"] or 0))
    for x in rows: x.update({"ind": ind, "dep": se["depressed"], "sec": se["sector"]}); allrows.append(x)
    if not se["depressed"]: continue
    inds_out.append({"ind": ind, "sec": se["sector"], "rel3": r(se["rel3"]), "rel1": r(se["rel1"]), "dd": r(se["dd3y"]), "capi": r(se["capex_rev5"]),
                     "capint": se["capital_intensive"], "omt": r(se["om_ttm_med"]), "om5": r(se["om_5y_med"]), "yoy": r(se["rev_yoy_med"]),
                     "why": WHY.get(ind), "pick": pick["t"], "best": best["t"], "bargain": bargain["t"] if bargain else None,
                     "conv": bool(bargain and bargain["t"] == best["t"]), "cheapest": cheapest["t"], "cos": rows,
                     "ind_own": r(np.nanmedian([x["own"] for x in rows if x["own"] is not None]))})
others = sorted([x for x in allrows if not x["dep"] and x["own"] is not None and x["own"] >= 0.85 and x["gok"]], key=lambda x: -x["own"])[:14]
dep_all = [x for x in allrows if x["dep"]]
bt = pd.read_csv(f"{L.R}/bt_value_rows.csv"); G = ["A", "ind"]
bt["lexc"] = (np.log1p(bt.fwd) - bt.groupby(G)["fwd"].transform(lambda x: np.log1p(x).mean())) / 2
for c_ in ("survival", "quality"): bt["r_" + c_] = bt.groupby(G)[c_].rank(pct=True)
Db = bt[bt.dep]; ladder = []
for thr in (0, 0.5, 0.6, 0.7, 0.8, 0.9):
    d_ = Db[(Db.gate_ok) & (Db.own_cheap >= thr)].copy()
    if d_.empty: continue
    d_["sc"] = d_[["r_survival", "r_quality"]].mean(axis=1); p_ = d_.loc[d_.groupby(G).sc.idxmax()]
    ladder.append({"thr": thr, "lexc": r(p_.lexc.mean(), 4), "hit": r(p_.beat.mean()), "n": int(len(p_))})
q_ = Db.groupby(G)["own_cheap"].rank(pct=True); cheap = Db[Db.own_cheap >= 0.7]
buckets = {"Cheap, fails a gate": cheap[~cheap.gate_ok], "Cheap, passes gates": cheap[cheap.gate_ok], "Not cheap, passes gates": Db[(Db.own_cheap < 0.7) & Db.gate_ok]}
buck = [{"l": k, "lexc": r(v.lexc.mean(), 4), "hit": r(v.beat.mean()), "n": int(len(v))} for k, v in buckets.items()]
meta = {"ladder": ladder, "buckets": buck, "asof": str(L.DTR.index[-1].date()), "n_dep": len(inds_out), "n_cos": len(dep_all),
        "n_cheap": sum(1 for x in dep_all if (x["own"] or 0) >= 0.7), "n_trap": sum(1 for x in dep_all if x["trap"]),
        "bt": BE, "spy3": SE["spy"]["3"] if "3" in SE["spy"] else SE["spy"].get(3)}
json.dump({"meta": meta, "inds": inds_out, "others": others}, open(f"{L.R}/value_report.json", "w"), separators=(",", ":"))
print(meta["n_dep"], "depressed industries,", meta["n_cos"], "companies,", meta["n_cheap"], "cheap vs own history,", meta["n_trap"], "traps")
for i in inds_out:
    p = next(x for x in i["cos"] if x["t"] == i["pick"])
    print(f"{i['ind'][:30]:30} BARGAIN {str(i['bargain']):5} BEST {i['best']:5} conv {i['conv']} own {p['own']} up {p['up']} key {p['key'] and p['key']['now']} vs med {p['key'] and p['key']['med']} | cheapest {i['cheapest']} | traps {[x['t'] for x in i['cos'] if x['trap']]}")
print("others:", [(x["t"], x["own"]) for x in others])
