"""Depressed-industry scan (image 3): price stress (yfinance) + fundamental stress (SEC aggregates),
cycle vs long-term disruption heuristics, capital intensity. -> data/sectors.json"""
import json, numpy as np, pandas as pd
import load as L, compute as C

M = json.load(open(f"{L.R}/metrics_now.json"))
END = L.MTR.index[-1]
def ret(t, years):
    s = L.MTR[t].dropna(); s0 = s[s.index <= END - pd.DateOffset(years=years)]
    return float(s.iloc[-1] / s0.iloc[-1] - 1) if len(s0) else np.nan
spy = {y: ret("SPY", y) for y in (1, 3, 5)}
out = {}
for sec_, inds in L.U.items():
    for ind, tks in inds.items():
        tks = [t for t in tks if t in M]; kind = C.kind_of(ind)
        r = {y: float(np.nanmean([ret(t, y) for t in tks])) for y in (1, 3, 5)}
        # equal-weight daily basket drawdown from 3y high
        d = L.DTR[[t for t in tks if t in L.DTR]].dropna(how="all")
        b = (d / d.bfill().iloc[0]).mean(1)
        dd = float(b.iloc[-1] / b.max() - 1)
        hi52 = [float(L.DTR[t].dropna().iloc[-1] / L.DTR[t].dropna().iloc[-252:].max() - 1) for t in tks if t in L.DTR]
        # SEC aggregates in USD (current FX) by fiscal year
        agg = {}
        for t in tks:
            rec = L.sec(t); fx = L.fx(rec["unit"].get("rev") or "USD")
            c = C.Co(rec, kind, None, L.FST.get(t), fx, L.splits(t))
            fy = {e[:4] if e[5:7] > "03" else str(int(e[:4]) - 1): e for e in c.years}
            for y, e in fy.items():
                if int(y) < 2012: continue
                a = agg.setdefault(y, {"rev": 0, "oi": 0, "fcf": 0, "capex": 0, "n": 0})
                rv = c.val("rev", e); oi = c.val("oi", e); oc = c.val("ocf", e); cx = c.val("capex", e)
                if rv is None: continue
                a["rev"] += rv * fx; a["oi"] += (oi or 0) * fx; a["fcf"] += ((oc or 0) - abs(cx or 0)) * fx; a["capex"] += abs(cx or 0) * fx; a["n"] += 1
        ys = sorted(y for y in agg if agg[y]["n"] >= max(2, len(tks) - 1))
        ser = [(y, agg[y]) for y in ys]
        rev = [a["rev"] for _, a in ser]; om = [a["oi"] / a["rev"] for _, a in ser]; fcfm = [a["fcf"] / a["rev"] for _, a in ser]
        capi = np.mean([a["capex"] / a["rev"] for _, a in ser[-5:]]) if ser else np.nan
        yoy = [rev[i] / rev[i - 1] - 1 for i in range(1, len(rev))]
        declines = sum(1 for x in yoy if x < -0.03)
        recovered = 0  # declines later fully recovered
        for i in range(1, len(rev)):
            if rev[i] < rev[i - 1] * 0.97 and any(rev[j] >= rev[i - 1] for j in range(i + 1, len(rev))): recovered += 1
        cagr10 = (rev[-1] / rev[-11]) ** 0.1 - 1 if len(rev) >= 11 else ((rev[-1] / rev[0]) ** (1 / (len(rev) - 1)) - 1 if len(rev) > 3 else np.nan)
        om5 = float(np.mean(om[-6:-1])) if len(om) >= 6 else np.nan
        # current TTM aggregates from metrics
        rev_ttm = sum(M[t].get("_rev_usd_b") or 0 for t in tks); yoy_ttm = float(np.nanmedian([M[t].get("rev_yoy_ttm") if M[t].get("rev_yoy_ttm") is not None else np.nan for t in tks]))
        om_ttm = float(np.nanmedian([M[t].get("om_ttm") if M[t].get("om_ttm") is not None else (M[t].get("pbt_m_ttm") if M[t].get("pbt_m_ttm") is not None else np.nan) for t in tks]))
        om_med5 = float(np.nanmedian([M[t].get("om_avg5") if M[t].get("om_avg5") is not None else (M[t].get("pbt_m_avg5") if M[t].get("pbt_m_avg5") is not None else np.nan) for t in tks]))
        rel3 = r[3] - spy[3]; rel1 = r[1] - spy[1]
        price_stress = rel3 < -0.25 or dd < -0.25 or rel1 < -0.25
        fund_stress = (om_ttm < 0.8 * om_med5 if om_med5 and om_med5 > 0 else False) or yoy_ttm < -0.02
        depressed = rel3 < -0.25  # same definition as the backtest
        # cycle vs disruption heuristic
        if not (price_stress or fund_stress): nature = "Not depressed"
        elif fund_stress and recovered >= 2 and (cagr10 or 0) > 0.01: nature = "Cycle"
        elif not fund_stress and price_stress: nature = "Fear / disruption risk (fundamentals intact)"
        elif (cagr10 or 0) <= 0.02 and om_ttm < om_med5: nature = "Structural pressure"
        else: nature = "Cycle" if recovered >= 1 else "Mixed"
        out[ind] = {"sector": sec_, "n": len(tks), "ret1": r[1], "ret3": r[3], "ret5": r[5], "rel1": rel1, "rel3": rel3, "rel5": r[5] - spy[5],
                    "dd3y": dd, "med_off_52wh": float(np.median(hi52)), "rev_yoy_med": yoy_ttm, "om_ttm_med": om_ttm, "om_5y_med": om_med5,
                    "cagr10": cagr10, "declines": declines, "recovered": recovered, "capex_rev5": float(capi),
                    "capital_intensive": bool(capi > 0.08), "price_stress": bool(price_stress), "fund_stress": bool(fund_stress),
                    "depressed": bool(depressed), "nature": nature,
                    "agg": {"years": ys, "rev_b": [round(a["rev"] / 1e9, 1) for _, a in ser], "om": [round(x, 4) for x in om], "fcfm": [round(x, 4) for x in fcfm]},
                    "basket": [round(float(x), 4) for x in b.resample("W").last().values]}
json.dump({"spy": spy, "end": str(END.date()), "ind": out}, open(f"{L.R}/sectors.json", "w"))
for ind, v in sorted(out.items(), key=lambda kv: kv[1]["rel3"]):
    print(f"{ind[:32]:32} rel3 {v['rel3']:+.0%} rel1 {v['rel1']:+.0%} dd {v['dd3y']:+.0%} | yoy {v['rev_yoy_med']:+.1%} om {v['om_ttm_med']:.1%} vs5y {v['om_5y_med']:.1%} | cagr10 {v['cagr10']:+.1%} decl {v['declines']} rec {v['recovered']} capi {v['capex_rev5']:.0%} | {'DEPRESSED ' if v['depressed'] else ''}{v['nature']}")
