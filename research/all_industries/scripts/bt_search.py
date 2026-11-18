"""Trial & error on the backtest panel: brute-force 5,000 pillar-weight vectors on 2017+2019 (in-sample),
keep the top 1%, then test them on 2021+2023 (out-of-sample). Also: does Survival/War-chest win inside DEPRESSED industries?"""
import json, numpy as np, pandas as pd
import load as L, score as S
df = pd.read_csv(f"{L.R}/backtest_rows.csv")
P = df[[f"P_{p}" for p in S.PILLARS]].values
grp = df.groupby(["A", "ind"]).ngroup().values
IS = df["A"].isin(["2017-04-03", "2019-04-01"]).values
rng = np.random.default_rng(3); W = rng.dirichlet(np.ones(9) * 0.7, 5000)
def pick_exc(w, mask):
    s = P @ w; d = pd.DataFrame({"g": grp, "s": s, "x": df["exc"].values, "b": df["beat_med"].values})[mask]
    top = d.loc[d.groupby("g")["s"].idxmax()]
    return top["x"].mean(), top["b"].mean()
res = np.array([pick_exc(w, IS) for w in W]); oos = np.array([pick_exc(w, ~IS) for w in W])
best = np.argsort(-res[:, 0])[:50]
out = {"is_best_mean": float(res[best, 0].mean()), "oos_of_is_best": float(oos[best, 0].mean()), "oos_hit_of_is_best": float(oos[best, 1].mean()),
       "oos_all_mean": float(oos[:, 0].mean()), "corr_is_oos": float(np.corrcoef(res[:, 0], oos[:, 0])[0, 1]),
       "best_w_mean": dict(zip(S.PILLARS, W[best].mean(0).round(3).tolist())),
       "is_dist": np.percentile(res[:, 0], [5, 50, 95]).round(4).tolist(), "oos_dist": np.percentile(oos[:, 0], [5, 50, 95]).round(4).tolist()}
# depressed industries at A: trailing-3y equal-weight return vs SPY
spy = L.MTR["SPY"].dropna()
def trail(t, A):
    s = L.MTR[t].dropna(); s0 = s[s.index <= pd.Timestamp(A) - pd.DateOffset(years=3)]; s1 = s[s.index <= pd.Timestamp(A)]
    return (s1.iloc[-1] / s0.iloc[-1] - 1) if len(s0) and len(s1) else np.nan
dep = {}
for (A, ind), g in df.groupby(["A", "ind"]):
    r = np.nanmean([trail(t, A) for t in g["t"]]); sp = trail("SPY", A); dep[(A, ind)] = r - sp
df["rel3y"] = [dep[(a, i)] for a, i in zip(df["A"], df["ind"])]
D = df[df["rel3y"] < -0.25]
def best_by(col, d):
    top = d.loc[d.groupby(["A", "ind"])[col].idxmax()]; return float(top["exc"].mean()), float(top["beat_med"].mean()), int(len(top))
out["depressed_n_groups"] = int(D.groupby(["A", "ind"]).ngroups)
out["depressed"] = {c: best_by(c, D) for c in ["P_Survival", "P_WarChest", "P_Value", "P_FCF", "P_Capital", "win", "S_Survival (img 3)", "S_Buffett owner"]}
out["normal"] = {c: best_by(c, df[df["rel3y"] >= -0.25]) for c in ["P_Survival", "P_WarChest", "P_Value", "P_FCF", "win"]}
json.dump(out, open(f"{L.R}/backtest_search.json", "w"), indent=1)
print(json.dumps(out, indent=1))
