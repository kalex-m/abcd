"""Score every industry now -> data/scores_now.json"""
import json, numpy as np
import load as L, compute as C, score as S
M = json.load(open(f"{L.R}/metrics_now.json"))
out = {}
for sec, inds in L.U.items():
    for ind, tks in inds.items():
        tks = [t for t in tks if t in M]; kind = C.kind_of(ind)
        rows = [M[t] for t in tks]
        r = S.score_industry(rows, kind)
        med = {k: float(np.median([M[t][k] for t in tks if M[t].get(k) is not None])) for k in ("rev_yoy_ttm", "rev_cagr5")}
        G = {t: S.gates(M[t], kind, ind, med) for t in tks}
        passed = [i for i, t in enumerate(tks) if all(v[0] for v in G[t].values())]
        order = sorted(range(len(tks)), key=lambda i: (-r["win"][i], r["avg_rank"][i]))
        pick = next((i for i in order if i in passed), order[0])
        sch_win = {nm: tks[int(np.argmax(s))] for nm, s in r["schemes"].items()}
        out[ind] = {"sector": sec, "kind": kind, "tickers": tks, "order": [tks[i] for i in order], "pick": tks[pick],
                    "mc_leader": tks[order[0]], "win": dict(zip(tks, r["win"].round(4).tolist())), "top3": dict(zip(tks, r["top3"].round(4).tolist())),
                    "avg_rank": dict(zip(tks, r["avg_rank"].round(2).tolist())),
                    "pillars": {t: r["P"][i].round(3).tolist() for i, t in enumerate(tks)},
                    "pillars_h": {h: {t: P[i].round(3).tolist() for i, t in enumerate(tks)} for h, P in r["P_h"].items()},
                    "schemes": {nm: dict(zip(tks, s.round(3).tolist())) for nm, s in r["schemes"].items()}, "scheme_winner": sch_win,
                    "lopo": [tks[i] for i in r["lopo"]], "gates": G, "metric_names": r["metrics"],
                    "pct": {t: dict(zip(r["metrics"], r["M"][i].round(3).tolist())) for i, t in enumerate(tks)}}
json.dump(out, open(f"{L.R}/scores_now.json", "w"))
for ind, d in out.items():
    w = d["win"]; o = d["order"]
    gl = [t for t in o[:3] if not all(v[0] for v in d["gates"][t].values())]
    print(f"{ind[:34]:34} PICK {d['pick']:5} | " + " ".join(f"{t}:{w[t]:.0%}" for t in o[:4]) + (f" | gate-fail {gl}" if gl else "") + f" | schemes {sorted(set(d['scheme_winner'].values()))}")
