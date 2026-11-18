"""Final picks + compact JSON for the report page.
Rule (fixed before looking at today's names; validated by backtest.py / bt_search.py):
  1. gates (image 3): FCF & revenue stable?  capital to survive?  not shrinking while the industry grows?
  2. normal industry   -> brute-force winner (most wins over 20,000 random weightings) among gate-passers
  3. depressed industry (3y basket return < SPY - 25pp) -> best Survival-tree score among gate-passers
     (ties within 0.03 broken by brute-force wins). Backtest: in depressed industries this beat peers +3.6%/yr, 62% hit."""
import json, numpy as np
import load as L, score as S

M = json.load(open(f"{L.R}/metrics_now.json")); SC = json.load(open(f"{L.R}/scores_now.json"))
SE = json.load(open(f"{L.R}/sectors.json")); BT = json.load(open(f"{L.R}/backtest_summary.json")); BS = json.load(open(f"{L.R}/backtest_search.json"))
BI = json.load(open(f"{L.R}/backtest_industries.json"))
WHY = json.load(open(f"{L.R}/depressed_why.json"))

def r(x, n=3): return None if x is None else round(float(x), n)
KEYS = {"gen": [("rev_cagr5", "Rev 5y CAGR", "pct"), ("om_ttm", "Op margin", "pct"), ("fcf_m_ttm", "FCF margin", "pct"), ("roic_avg5", "ROIC 5y", "pct"),
                ("nd_ebitda", "Net debt/EBITDA", "x"), ("fcf_yield", "FCF yield", "pct")],
        "bank": [("rev_cagr5", "Rev 5y CAGR", "pct"), ("eff_ratio", "Efficiency", "pct"), ("rotce_avg5", "ROTCE 5y", "pct"), ("tce_ta", "TCE/TA", "pct"),
                 ("htm_loss_tce", "HTM hole/TCE", "pct"), ("earn_yield", "Earnings yield", "pct")],
        "ins": [("rev_cagr5", "Rev 5y CAGR", "pct"), ("pbt_m_ttm", "Pretax margin", "pct"), ("loss_ratio", "Loss ratio", "pct"), ("roe_avg5", "ROE 5y", "pct"),
                ("debt_eq", "Debt/equity", "x"), ("earn_yield", "Earnings yield", "pct")]}
CYC = {"gen": [("rev_cagr5", "pct", "5y revenue CAGR"), ("om_ttm", "pct", "operating margin"), ("fcf_m_ttm", "pct", "FCF margin"),
               ("_netcash_usd_b", "usd", "net cash"), ("roic_avg5", "pct", "ROIC, 5y avg"), ("capex_rev5", "pct", "capex / revenue"), ("shs_chg5", "pct", "share count, 5y")],
       "bank": [("rev_cagr5", "pct", "5y revenue CAGR"), ("eff_ratio", "pct", "efficiency ratio"), ("roa_ttm", "pct", "return on assets"),
                ("tce_ta", "pct", "tangible equity / assets"), ("rotce_avg5", "pct", "ROTCE, 5y avg"), ("prov_rev", "pct", "credit cost / revenue"), ("nonint_share", "pct", "fee share of revenue")],
       "ins": [("prem_cagr5", "pct", "5y premium CAGR"), ("loss_ratio", "pct", "loss ratio"), ("ocf_rev_ttm", "pct", "op. cash flow / revenue"),
               ("eq_assets", "pct", "equity / assets"), ("roe_avg5", "pct", "ROE, 5y avg"), (None, "na", "no plant to fund"), ("roe_std10", "pct", "ROE volatility")]}
out_inds = []; picks = []
for sec_, inds in L.U.items():
    for ind, _ in inds.items():
        d = SC[ind]; se = SE["ind"][ind]; kind = d["kind"]; tks = d["tickers"]
        passed = [t for t in tks if all(v[0] for v in d["gates"][t].values())]
        pool = passed or tks
        win = d["win"]; sv = d["schemes"]["Survival (img 3)"]
        mc = max(pool, key=lambda t: (win[t], -d["avg_rank"][t]))
        best_sv = max(sv[t] for t in pool)
        sv_pick = max([t for t in pool if sv[t] >= best_sv - 0.03], key=lambda t: win[t])
        pick = sv_pick if se["depressed"] else mc
        rule = "Survival tree (depressed)" if se["depressed"] else "Brute-force winner"
        lopo = sum(1 for t in d["lopo"] if t == pick)
        sch = sum(1 for t in d["scheme_winner"].values() if t == pick)
        cos = []
        for t in d["order"]:
            m = M[t]
            cos.append({"t": t, "n": m["_name"], "mc": r(m.get("mcap_usd_b"), 1), "win": r(win[t], 3), "top3": r(d["top3"][t], 3),
                        "sv": r(sv[t]), "P": d["pillars"][t], "g": {k: [v[0], v[1]] for k, v in d["gates"][t].items()},
                        "k": [r(m.get(k), 4) for k, _, _ in KEYS[kind]], "fy": m.get("_last_fy"), "ny": m.get("_n_years"),
                        "rev": r(m.get("_rev_usd_b"), 1), "cyc": [r(m.get(k), 4) if k else None for k, _, _ in CYC[kind]], "fcf": r(m.get("_fcf_usd_b"), 1), "ni": r(m.get("_ni_usd_b"), 1)})
        bt = BI.get(ind, {})
        btp = [{"A": A, "pick": v["pick"], "pick_xs": r(v["fwd"][v["tickers"].index(v["pick"])] - v["ew"], 4)} for A, v in sorted(bt.items())]
        rec = {"ind": ind, "sec": sec_, "kind": kind, "pick": pick, "rule": rule, "mc": mc, "svp": sv_pick, "lopo": lopo, "sch": sch,
               "nsch": len(d["scheme_winner"]), "cycdef": [[f, l] for _, f, l in CYC[kind]], "keys": [[a, b] for _, a, b in KEYS[kind]], "cos": cos,
               "dep": se["depressed"], "nature": se["nature"], "rel1": r(se["rel1"]), "rel3": r(se["rel3"]), "dd": r(se["dd3y"]),
               "capi": r(se["capex_rev5"]), "capint": se["capital_intensive"], "cagr10": r(se["cagr10"]), "omt": r(se["om_ttm_med"]), "om5": r(se["om_5y_med"]),
               "yoy": r(se["rev_yoy_med"]), "agg": se["agg"], "basket": se["basket"], "why": WHY.get(ind), "bt": btp}
        out_inds.append(rec); picks.append((ind, pick))
meta = {"asof": str(L.DTR.index[-1].date()), "n_cos": len(M), "n_ind": len(out_inds), "n_sec": len(L.U), "spy": SE["spy"], "pillars": S.PILLARS,
        "schemes": list(S.SCHEMES), "bt": {"strategies": BT["strategies"], "ic": BT["ic"], "asof": BT["asof"], "n_obs": BT["n_obs"], "n_groups": BT["n_ind_periods"],
        "search": {k: BS[k] for k in ("is_best_mean", "oos_of_is_best", "oos_hit_of_is_best", "corr_is_oos", "best_w_mean", "depressed_n_groups", "depressed", "normal")}}}
json.dump({"meta": meta, "inds": out_inds}, open(f"{L.R}/report_data.json", "w"), separators=(",", ":"))
for ind, p in picks: print(f"{ind[:34]:34} {p}")
