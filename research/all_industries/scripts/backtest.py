"""Point-in-time trial & error: would this exact method have picked winners in the past?
For as-of dates A: use only SEC facts FIRST FILED <= A, market cap at A (yfinance split-adjusted price x SEC share count),
score every industry, then measure total return (yfinance, dividends reinvested) from A to today vs the industry equal-weight.
Caveat: universe = today's large caps (survivorship bias) -> absolute returns flattered; within-industry RELATIVE test is the point."""
import json, numpy as np, pandas as pd
import load as L, compute as C, score as S

ASOF = ["2017-04-03", "2019-04-01", "2021-04-01", "2023-04-03"]
END = L.MTR.index[-1]
def px(df, t, at):
    if t not in df: return None
    s = df[t].dropna(); s = s[s.index <= pd.Timestamp(at)]
    return float(s.iloc[-1]) if len(s) and (pd.Timestamp(at) - s.index[-1]).days < 40 else None
def last(df, t):
    s = df[t].dropna() if t in df else []
    return float(s.iloc[-1]) if len(s) else None

rows_out = []; ind_out = {}
for A in ASOF:
    yrs = (END - pd.Timestamp(A)).days / 365.25
    for sec_, inds in L.U.items():
        for ind, tks in inds.items():
            kind = C.kind_of(ind); recs = []
            for t in tks:
                r = L.sec(t)
                if not r: continue
                p0, p1 = px(L.MTR, t, A), last(L.MTR, t); s0, s1 = px(L.MSA, t, A), last(L.MSA, t)
                if not all([p0, p1, s0, s1]): continue
                cur = r["unit"].get("rev") or "USD"
                cA = C.Co(r, kind, A, None, L.fx(cur, A), L.splits(t)); cN = C.Co(r, kind, None, None, 1, L.splits(t))
                if len(cA.years) < 3: continue
                shA, shN = cA.ann("shs"), cN.ann("shs")
                ratio = (shA[-1][1] / shN[-1][1]) if shA and shN and shN[-1][1] else 1.0
                mcA = L.mcap(t) * (s0 / s1) * ratio
                m = C.metrics(r, kind, asof=A, mcap_usd=mcA, fx=L.fx(cur, A), splits=L.splits(t), ind=ind)
                fwd = (p1 / p0) ** (1 / yrs) - 1
                recs.append((t, m, fwd))
            if len(recs) < 3: continue
            res = S.score_industry([m for _, m, _ in recs], kind, n_draw=6000, seed=11)
            med = {k: float(np.median([m[k] for _, m, _ in recs if m.get(k) is not None] or [0])) for k in ("rev_yoy_ttm", "rev_cagr5")}
            fw = np.array([f for _, _, f in recs]); ew = fw.mean(); md = np.median(fw)
            G = [all(v[0] for v in S.gates(m, kind, ind, med).values()) for _, m, _ in recs]
            order = sorted(range(len(recs)), key=lambda i: (-res["win"][i], res["avg_rank"][i]))
            pick = next((i for i in order if G[i]), order[0])
            ind_out.setdefault(ind, {})[A] = {"tickers": [t for t, _, _ in recs], "fwd": fw.round(4).tolist(), "win": res["win"].round(3).tolist(),
                                             "mc_leader": recs[order[0]][0], "pick": recs[pick][0], "ew": round(float(ew), 4)}
            for i, (t, m, f) in enumerate(recs):
                rows_out.append({"A": A, "ind": ind, "t": t, "fwd": f, "exc": f - ew, "beat_med": f > md, "win": float(res["win"][i]),
                                 "is_leader": i == order[0], "is_pick": i == pick, "gate": G[i], "n": len(recs),
                                 **{f"P_{p}": float(res["P"][i][j]) for j, p in enumerate(S.PILLARS)},
                                 **{f"S_{k}": float(v[i]) for k, v in res["schemes"].items()}})
    print(A, "done", flush=True)
df = pd.DataFrame(rows_out)
df.to_csv(f"{L.R}/backtest_rows.csv", index=False)
json.dump(ind_out, open(f"{L.R}/backtest_industries.json", "w"))

# ---- evaluation ----
def spearman(a, b):
    ra, rb = pd.Series(a).rank(), pd.Series(b).rank()
    return ra.corr(rb)
ic = {}
for p in S.PILLARS:
    vals = df.groupby(["A", "ind"]).apply(lambda g: spearman(g[f"P_{p}"], g["fwd"]) if len(g) >= 4 else np.nan, include_groups=False)
    ic[p] = {"all": float(vals.mean()), **{a: float(vals.loc[a].mean()) for a in ASOF}}
def pick_stats(mask_fn, label):
    out = {}
    for a in ASOF + ["all"]:
        d = df if a == "all" else df[df["A"] == a]
        sel = d[mask_fn(d)]
        out[a] = {"xs": float(sel["exc"].mean()), "hit": float(sel.beat_med.mean()), "n": int(len(sel))}
    return label, out
strategies = dict([
    pick_stats(lambda d: d.is_pick, "Brute-force winner + gates"),
    pick_stats(lambda d: d.is_leader, "Brute-force winner (no gates)"),
])
for k in S.SCHEMES:
    col = f"S_{k}"
    strategies[f"Scheme: {k}"] = pick_stats(lambda d, col=col: d.groupby(["A", "ind"])[col].transform("max") == d[col], k)[1]
# brute-force top-3 vs bottom-3 spread
def rankcol(d): return d.groupby(["A", "ind"])["win"].rank(ascending=False, method="first")
df["wrank"] = rankcol(df)
strategies["Brute-force LAST place"] = pick_stats(lambda d: d.wrank == d.groupby(["A", "ind"])["wrank"].transform("max"), "last")[1]
# out-of-sample weight fit: fit pillar weights on 2017+2019 ICs, test 2021+2023
fit = np.array([max(0.0, np.nanmean([ic[p][a] for a in ASOF[:2]])) for p in S.PILLARS]) + 0.02
fit = fit / fit.sum()
df["S_fit"] = sum(df[f"P_{p}"] * w for p, w in zip(S.PILLARS, fit))
oos = pick_stats(lambda d: d.groupby(["A", "ind"])["S_fit"].transform("max") == d["S_fit"], "fit")[1]
full_fit = np.array([max(0.0, ic[p]["all"]) for p in S.PILLARS]) + 0.02; full_fit = full_fit / full_fit.sum()
summary = {"asof": ASOF, "end": str(END.date()), "ic": ic, "strategies": strategies,
           "fit_weights_2017_2019": dict(zip(S.PILLARS, fit.round(3).tolist())), "fit_oos": oos,
           "fit_weights_all": dict(zip(S.PILLARS, full_fit.round(3).tolist())),
           "n_obs": int(len(df)), "n_ind_periods": int(df.groupby(["A", "ind"]).ngroups)}
json.dump(summary, open(f"{L.R}/backtest_summary.json", "w"), indent=1)
print(json.dumps({k: {a: (round(v[a]["xs"], 4), round(v[a]["hit"], 2)) for a in v} for k, v in strategies.items()}, indent=0))
print("IC", {p: round(v["all"], 3) for p, v in ic.items()})
print("fit 17/19 ->", summary["fit_weights_2017_2019"], "OOS:", {a: (round(v["xs"], 4), round(v["hit"], 2)) for a, v in oos.items()})
