"""Robust evaluation of bt_value_rows.csv: log excess (annualised), median, hit rate; outliers can't dominate."""
import json, numpy as np, pandas as pd
import load as L
df = pd.read_csv(f"{L.R}/bt_value_rows.csv"); G = ["A", "ind"]
df["lf"] = np.log1p(df["fwd"]); df["lexc"] = (df["lf"] - df.groupby(G)["lf"].transform("mean")) / 2   # per year, 24m horizon
SIG = ["own_cheap", "upside", "dd5", "peer_value", "survival", "warchest", "quality", "surv_tree"]
for s in SIG: df["r_" + s] = df.groupby(G)[s].rank(pct=True)
combos = {"Cheap vs own history": ["own_cheap"], "Reversion upside": ["upside"], "Deepest 5y price drop": ["dd5"], "Cheap vs peers": ["peer_value"],
          "Survival": ["survival"], "War chest": ["warchest"], "Survival tree": ["surv_tree"], "Quality (brute force)": ["quality"],
          "Own-cheap + survival": ["own_cheap", "survival"], "Own-cheap + quality": ["own_cheap", "quality"], "Own-cheap + survival + quality": ["own_cheap", "survival", "quality"],
          "Upside + survival": ["upside", "survival"], "Upside + quality": ["upside", "quality"], "Survival + quality": ["survival", "quality"]}
def pick(d, cols, gated=False, which="max"):
    d = d.copy(); d["sc"] = d[["r_" + c for c in cols]].mean(axis=1)
    if gated: d = d[d["gate_ok"]]
    if d.empty: return None
    return d.loc[(d.groupby(G)["sc"].idxmax() if which == "max" else d.groupby(G)["sc"].idxmin())]
def st(p): return None if p is None or p.empty else {"lexc": float(p["lexc"].mean()), "med": float(p["exc"].median() / 2), "hit": float(p["beat"].mean()), "n": int(len(p)),
                                                     "lexc_is": float(p[p.A.str[:4].astype(int) <= 2020]["lexc"].mean()), "lexc_oos": float(p[p.A.str[:4].astype(int) > 2020]["lexc"].mean())}
out = {"dep": {}, "dep_gated": {}, "norm": {}, "dep_worst": {}}
D, N = df[df.dep], df[~df.dep]
for nm, c in combos.items():
    out["dep"][nm] = st(pick(D, c)); out["dep_gated"][nm] = st(pick(D, c, True)); out["norm"][nm] = st(pick(N, c)); out["dep_worst"][nm] = st(pick(D, c, which="min"))
# halves & traps (log excess)
q = D.groupby(G)["own_cheap"].rank(pct=True)
out["trap"] = {"cheap_half_pass": st(D[(q > .5) & D.survive_ok]), "cheap_half_fail": st(D[(q > .5) & ~D.survive_ok]),
               "dear_half": st(D[q <= .5]), "cheap_half": st(D[q > .5])}
# brute force weight search with log excess, fit 2017-20 test 2021-24
Dg = D.reset_index(drop=True); R = Dg[["r_" + s for s in SIG]].values; gid = Dg.groupby(G).ngroup().values; IS = Dg["A"].str[:4].astype(int).values <= 2020
rng = np.random.default_rng(9); W = rng.dirichlet(np.ones(len(SIG)) * 0.6, 6000)
def ev(w, m):
    d = pd.DataFrame({"g": gid, "s": R @ w, "x": Dg["lexc"].values, "b": Dg["beat"].values})[m]; t = d.loc[d.groupby("g")["s"].idxmax()]; return t["x"].mean(), t["b"].mean()
ins = np.array([ev(w, IS) for w in W]); oos = np.array([ev(w, ~IS) for w in W]); best = np.argsort(-ins[:, 0])[:60]
out["search"] = {"is_best": float(ins[best, 0].mean()), "oos_of_is_best": float(oos[best, 0].mean()), "oos_hit": float(oos[best, 1].mean()),
                 "oos_all_median": float(np.median(oos[:, 0])), "corr": float(np.corrcoef(ins[:, 0], oos[:, 0])[0, 1]), "best_w": dict(zip(SIG, W[best].mean(0).round(3).tolist())),
                 "n_is": int(len(set(gid[IS]))), "n_oos": int(len(set(gid[~IS])))}
out["n_dep_groups"] = int(D.groupby(G).ngroups); out["n_norm_groups"] = int(N.groupby(G).ngroups); out["asof"] = sorted(df.A.unique().tolist())
json.dump(out, open(f"{L.R}/bt_value_eval.json", "w"), indent=1)
f = lambda s: f"{s['lexc']*100:+5.1f}%/yr hit {s['hit']:.0%} (IS {s['lexc_is']*100:+.1f} OOS {s['lexc_oos']*100:+.1f})" if s else "-"
for nm in combos: print(f"{nm:31} DEP {f(out['dep'][nm])} | +GATES {f(out['dep_gated'][nm])} | NORM {f(out['norm'][nm])} | DEP worst {out['dep_worst'][nm]['lexc']*100:+.1f}")
print({k: f(v) for k, v in out["trap"].items()}); print(out["search"]); print(out["n_dep_groups"], out["n_norm_groups"])
