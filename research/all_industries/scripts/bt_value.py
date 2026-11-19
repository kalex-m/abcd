"""Trial & error #2: inside DEPRESSED industries, does buying the stock that is cheap versus ITS OWN history work?
16 point-in-time start dates (every 6 months, Mar-2017 .. Sep-2024), fixed 24-month forward total return vs the industry
equal-weight. Signals are rank-normalised inside each industry; brute-force weight search is fitted on 2017-2020 and
tested on 2021-2024. Output: data/bt_value_rows.csv, data/bt_value_summary.json"""
import json, numpy as np, pandas as pd
import load as L, compute as C, score as S, valhist as V

H = json.load(open(f"{L.R}/valhist.json"))
MTR = L.MTR; SPY = MTR["SPY"].dropna()
ASOF = [pd.Timestamp(f"{y}-{m:02d}-01") for y in range(2017, 2025) for m in (3, 9)]
HZN = 24

def tr(t, a, b):
    s = MTR[t].dropna() if t in MTR else None
    if s is None or a not in s.index or b not in s.index: return None
    return float(s[b] / s[a] - 1)

rows = []
for A in ASOF:
    B = A + pd.DateOffset(months=HZN); A3 = A - pd.DateOffset(years=3)
    if B > MTR.index[-1]: continue
    Aend = A + pd.offsets.MonthEnd(0); key = str(A.date())[:7]
    spy3 = tr("SPY", A3, A)
    for sec_, inds in L.U.items():
        for ind, tks in inds.items():
            kind = C.kind_of(ind); recs = []
            for t in tks:
                r = L.sec(t); h = H.get(t)
                if not r or not h or key not in h["m"]: continue
                f = tr(t, A, B)
                if f is None: continue
                cA = C.Co(r, kind, str(Aend.date()), None, 1.0, L.splits(t))
                if len(cA.years) < 3: continue
                i = h["m"].index(key); ch = V.cheapness(h, i)
                if ch is None: continue
                mc = h["mcap"][i] * 1e9
                m = C.metrics(r, kind, asof=str(Aend.date()), mcap_usd=mc, fx=L.fx(r["unit"].get("rev") or "USD", Aend), splits=L.splits(t), ind=ind)
                p = L.MSA[t].dropna(); p = p[p.index <= A]; dd5 = float(p.iloc[-1] / p.iloc[-60:].max() - 1) if len(p) >= 24 else None
                recs.append((t, m, f, ch, dd5, tr(t, A3, A)))
            if len(recs) < 4: continue
            b3 = np.nanmean([x[5] for x in recs if x[5] is not None]) if any(x[5] is not None for x in recs) else np.nan
            rel3 = b3 - spy3 if spy3 is not None else np.nan
            res = S.score_industry([x[1] for x in recs], kind, n_draw=2000, seed=5)
            med = {k: float(np.median([x[1][k] for x in recs if x[1].get(k) is not None] or [0])) for k in ("rev_yoy_ttm", "rev_cagr5")}
            fw = np.array([x[2] for x in recs]); ew = fw.mean(); md = np.median(fw)
            for j, (t, m, f, ch, dd5, _) in enumerate(recs):
                g = S.gates(m, kind, ind, med)
                rows.append({"A": key, "ind": ind, "t": t, "dep": bool(rel3 < -0.25), "rel3": rel3, "fwd": f, "exc": f - ew, "beat": f > md,
                             "own_cheap": ch["cheap"], "upside": ch["upside"] if ch["upside"] is not None else 0.0, "dd5": -(dd5 or 0),
                             "peer_value": float(res["P"][j][7]), "survival": float(res["P"][j][8]), "warchest": float(res["P"][j][3]),
                             "quality": float(res["win"][j]), "surv_tree": float(res["schemes"]["Survival (img 3)"][j]),
                             "gate_ok": all(v[0] for v in g.values()), "survive_ok": g.get("survive", (True,))[0], "n": len(recs)})
    print(key, "rows", len(rows), flush=True)
df = pd.DataFrame(rows)
df.to_csv(f"{L.R}/bt_value_rows.csv", index=False)

SIG = ["own_cheap", "upside", "dd5", "peer_value", "survival", "warchest", "quality", "surv_tree"]
G = ["A", "ind"]
for s in SIG: df["r_" + s] = df.groupby(G)[s].rank(pct=True)
combos = {
    "Cheap vs own history": ["own_cheap"], "Reversion upside": ["upside"], "Deepest price drop": ["dd5"], "Cheap vs peers": ["peer_value"],
    "Survival": ["survival"], "Survival tree": ["surv_tree"], "Quality (brute force)": ["quality"],
    "Own-cheap + survival": ["own_cheap", "survival"], "Own-cheap + quality": ["own_cheap", "quality"],
    "Own-cheap + survival + quality": ["own_cheap", "survival", "quality"], "Upside + survival": ["upside", "survival"],
    "Own-cheap + war chest": ["own_cheap", "warchest"],
}
def pick(d, cols, gated=False):
    d = d.copy(); d["sc"] = d[["r_" + c for c in cols]].mean(1)
    if gated: d = d[d["gate_ok"]]
    if d.empty: return None
    return d.loc[d.groupby(G)["sc"].idxmax()]
def stats(p):
    if p is None or p.empty: return None
    yrs = {a: (float(g["exc"].mean())) for a, g in p.groupby("A")}
    return {"exc": float(p["exc"].mean()), "hit": float(p["beat"].mean()), "n": int(len(p)), "by_A": yrs}
out = {"asof": sorted(df["A"].unique().tolist()), "horizon_m": HZN, "n_rows": int(len(df)),
       "n_dep_groups": int(df[df.dep].groupby(G).ngroups), "n_norm_groups": int(df[~df.dep].groupby(G).ngroups), "dep": {}, "norm": {}, "dep_gated": {}}
for nm, cols in combos.items():
    out["dep"][nm] = stats(pick(df[df.dep], cols)); out["norm"][nm] = stats(pick(df[~df.dep], cols))
    out["dep_gated"][nm] = stats(pick(df[df.dep], cols, True))
# quintile spread inside depressed groups for own_cheap
D = df[df.dep].copy()
D["q"] = D.groupby(G)["own_cheap"].rank(pct=True)
out["dep_cheap_top_half"] = float(D[D.q > 0.5]["exc"].mean()); out["dep_cheap_bottom_half"] = float(D[D.q <= 0.5]["exc"].mean())
# value-trap check: cheap vs own history but FAILS survival gate
out["dep_cheap_fail_survive"] = stats(D[(D.q > 0.5) & (~D.survive_ok)].assign(beat=lambda x: x.beat))
out["dep_cheap_pass_survive"] = stats(D[(D.q > 0.5) & (D.survive_ok)])
# brute-force weight search (depressed only): fit 2017-2020, test 2021-2024
Dg = df[df.dep].reset_index(drop=True)
R = Dg[["r_" + s for s in SIG]].values; gid = Dg.groupby(G).ngroup().values
IS = Dg["A"].str[:4].astype(int).values <= 2020
rng = np.random.default_rng(9); W = rng.dirichlet(np.ones(len(SIG)) * 0.6, 6000)
def evalw(w, mask):
    s = R @ w; d = pd.DataFrame({"g": gid, "s": s, "x": Dg["exc"].values, "b": Dg["beat"].values})[mask]
    top = d.loc[d.groupby("g")["s"].idxmax()]; return top["x"].mean(), top["b"].mean()
ins = np.array([evalw(w, IS) for w in W]); oos = np.array([evalw(w, ~IS) for w in W])
best = np.argsort(-ins[:, 0])[:60]
out["search"] = {"is_best": float(ins[best, 0].mean()), "oos_of_is_best": float(oos[best, 0].mean()), "oos_hit_of_is_best": float(oos[best, 1].mean()),
                 "corr_is_oos": float(np.corrcoef(ins[:, 0], oos[:, 0])[0, 1]), "best_w": dict(zip(SIG, W[best].mean(0).round(3).tolist())),
                 "oos_median_all": float(np.median(oos[:, 0])), "n_is_groups": int(len(set(gid[IS]))), "n_oos_groups": int(len(set(gid[~IS])))}
# signal-level ICs in depressed groups
out["ic_dep"] = {s: float(Dg.groupby(G).apply(lambda g: g[s].rank().corr(g["fwd"].rank()) if len(g) >= 4 else np.nan, include_groups=False).mean()) for s in SIG}
json.dump(out, open(f"{L.R}/bt_value_summary.json", "w"), indent=1)
print("dep groups", out["n_dep_groups"], "norm groups", out["n_norm_groups"])
for nm in combos:
    a, b, c = out["dep"][nm], out["dep_gated"][nm], out["norm"][nm]
    print(f"{nm:32} DEP {a['exc']*100:+5.1f}% hit {a['hit']:.0%} | DEP+gates {b['exc']*100:+5.1f}% {b['hit']:.0%} | NORMAL {c['exc']*100:+5.1f}% {c['hit']:.0%}")
print("cheap top half vs bottom half (dep):", round(out["dep_cheap_top_half"], 4), round(out["dep_cheap_bottom_half"], 4))
print("cheap & fail survive:", out["dep_cheap_fail_survive"] and {k: out["dep_cheap_fail_survive"][k] for k in ("exc", "hit", "n")}, "cheap & pass:", {k: out["dep_cheap_pass_survive"][k] for k in ("exc", "hit", "n")})
print("search", {k: v for k, v in out["search"].items()})
print("IC dep", {k: round(v, 3) for k, v in out["ic_dep"].items()})
