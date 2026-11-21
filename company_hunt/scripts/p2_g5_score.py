#!/usr/bin/env python3
"""Ground 5 (Many-Weathers): score and rank. Reads data/g5seg/results.json (p2_g5_analyze.py), triage/metrics.csv,
data/sec/series.json and data/g5seg/judgments_*.json (basis, hidden-driver severity, driver, note: my own reading).
Writes triage/ground_5_all.csv (every company examined), triage/ground_5.csv (top 25 + JPM reference) and
triage/ground_5_segments.md (per-company tables and readings).

offset_score (0-100) = 45 x Offset + 35 x Whole-held + 20 x Compounding - penalties
  Offset   = (0.5 s_ratio + 0.3 s_corr + 0.2 s_pcorr), shrunk toward 0.25 when segment waves are small (amp < 6%)
             s_ratio = (1 - offset_ratio)/0.6 ; s_corr = (0.6 - size-weighted mean corr of segment revenue growth)/1.2
             s_pcorr = same on segment-profit dollar changes (0.35 if not tagged)
  Whole    = 0.25 s(worst total segment revenue yoy: -15%..+5%) + 0.25 s(worst total segment profit yoy: -40%..+5%)
             + 0.20 s(worst owner-earnings yoy 2019+: FCF, or net income for balance-sheet businesses: -50%..+5%)
             + 0.15 s(10y FCF-margin vol (NI-margin vol for financials): 0..8%) + 0.15 s(revenue share that shrank in 2020/22/23: 0..60%)
  Compound = per-share growth: mean(fcfps_cagr_5y, eps_cagr_5y) for operating cos, eps_cagr_5y for financials; 0..15%
  Penalties: geography/vertical/channel segments of one product -15; hidden common driver severity 1 -4, 2 -10;
             thin sample (<5 growth years or no segment pair with 4+ common years) -10; no segments: not ranked.
All s() are linear and clipped to 0..1."""
import json, glob, math, re
import numpy as np, pandas as pd

ROOT = "/home/user/abcd/company_hunt"
R = json.load(open(f"{ROOT}/data/g5seg/results.json"))
M = pd.read_csv(f"{ROOT}/triage/metrics.csv").set_index("ticker")
S = {v["ticker"]: v for v in json.load(open(f"{ROOT}/data/sec/series.json")).values()}
J = {}
for f in sorted(glob.glob(f"{ROOT}/data/g5seg/judgments_*.json")): J.update(json.load(open(f)))
import importlib.util
spec = importlib.util.spec_from_file_location("an", f"{ROOT}/scripts/p2_g5_analyze.py"); an = importlib.util.module_from_spec(spec); spec.loader.exec_module(an)
FIN = {t for t, c in an.CFG.items() if c.get("fin")} - {"BRK-B"}   # BRK-B judged on free cash flow (its net income carries stock marks)

def clip(x, lo=0.0, hi=1.0): return float(min(hi, max(lo, x)))
def nz(x): return x is not None and not (isinstance(x, float) and math.isnan(x))
def lin(x, lo, hi): return clip((x - lo) / (hi - lo)) if nz(x) else np.nan

def owner_stats(t):
    s = S.get(t, {}).get("S", {})
    key = "ni" if t in FIN else "fcf"
    ser = {int(y): v for y, v in s.get(key, {}).items() if v is not None}
    yo = []
    for y in range(2019, 2027):
        if y in ser and y - 1 in ser and ser[y - 1] > 0:
            yo.append(max(-1.0, ser[y] / ser[y - 1] - 1))
    worst = min(yo) if yo else np.nan
    vol = np.nan
    if t in FIN:
        rev = {int(y): v for y, v in s.get("rev", {}).items() if v}
        m = [ser[y] / rev[y] for y in ser if y in rev and rev[y] > 0 and y >= 2015]
        vol = float(np.std(m, ddof=1)) if len(m) >= 5 else np.nan
    else:
        vol = M.at[t, "fcf_margin_vol_10y"] if t in M.index else np.nan
    return key, worst, vol

def val(t):
    if t not in M.index: return (np.nan,) * 3
    r = M.loc[t]
    pe, pem = r["pe_now"], r["pe_med_10y"]
    if not (nz(pe) and nz(pem)) or pe > 200 or pe <= 0 or pem < 3 or pem > 200: pe = pem = np.nan
    if t in FIN: vd = pe / pem - 1 if nz(pe) else np.nan
    else:
        xs = [r[c] for c in ("pe_vs_med", "evebit_vs_med", "pfcf_vs_med") if nz(r[c]) and abs(r[c]) < 5]
        vd = float(np.mean(xs)) if xs and nz(pe) else (float(np.mean(xs)) if xs else np.nan)
    return pe, pem, vd

rows = []
for t, r in R.items():
    basis, sev, driver, note = J[t]
    pe, pem, vd = val(t)
    name = M.at[t, "name"] if t in M.index else t
    base = dict(ticker=t, name=name, basis=basis, sev=sev, hidden_common_driver=driver, note=note, pe_now=pe, pe_med_10y=pem, val_disc_avg=vd,
                fcfps_cagr_5y=M.at[t, "fcfps_cagr_5y"] if t in M.index else np.nan, eps_cagr_5y=M.at[t, "eps_cagr_5y"] if t in M.index else np.nan,
                sector=M.at[t, "sector"] if t in M.index else "", industry=M.at[t, "industry"] if t in M.index else "", is_fin=int(t in FIN))
    if r.get("status") != "ok" or basis == "none":
        base.update(offset_score=np.nan, status="dropped: single reportable segment", n_segments=1, years_covered="")
        rows.append(base); continue
    yrs = r["years"]
    okpairs = [p for p in r.get("pairs", []) if p[3] >= 4]
    thin = r["n_obs"] < 5 or not okpairs
    corr, ratio, amp, pcorr = r.get("wmean_corr"), r.get("div_ratio"), r.get("wave_amp"), r.get("mean_pcorr")
    s_ratio = lin(1 - ratio, 0, 0.6) if nz(ratio) else 0.25
    s_corr = lin(0.6 - corr, 0, 1.2) if nz(corr) else 0.35
    s_pcorr = lin(0.6 - pcorr, 0, 1.2) if nz(pcorr) else 0.35
    raw = 0.5 * s_ratio + 0.3 * s_corr + 0.2 * s_pcorr
    af = clip((amp or 0) / 0.06, 0.2, 1.0)
    offset = raw * af + 0.25 * (1 - af)
    key, ow, vol = owner_stats(t)
    wt, wp, sh = r.get("worst_seg_total_yoy"), r.get("worst_prf_yoy"), r.get("weak_share")
    parts = [(0.25, lin(wt, -0.15, 0.05)), (0.25, lin(wp, -0.40, 0.05)), (0.20, lin(ow, -0.50, 0.05)),
             (0.15, lin(0.08 - vol, 0, 0.08) if nz(vol) else np.nan), (0.15, lin(0.6 - sh, 0, 0.6) if nz(sh) else np.nan)]
    whole = sum(w * (v if nz(v) else 0.35) for w, v in parts)
    g = [x for x in ([base["eps_cagr_5y"]] if t in FIN else [base["fcfps_cagr_5y"], base["eps_cagr_5y"]]) if nz(x)]
    comp = lin(float(np.mean(g)), 0, 0.15) if g else 0.3
    pen = (15 if basis in ("geo", "vertical", "channel") else 0) + {0: 0, 1: 4, 2: 10}[sev] + (10 if thin else 0)
    score = 45 * offset + 35 * whole + 20 * comp - pen
    # demonstrated offset: in a named slowdown (2020, 2022, 2023) a segment with >=10% share shrank by 2%+ while another
    # >=10% segment grew, with a gap of 8+ points
    demo = [y for y in an.STRESS if r.get(f"spread_{y}") and r[f"spread_{y}"][0] <= -0.02 and r[f"spread_{y}"][1] > 0
            and r[f"spread_{y}"][1] - r[f"spread_{y}"][0] >= 0.08]
    if t == "HON": status = "dropped: offsetting segments separated (Solstice 2025, Honeywell Aerospace 2026)"
    elif t == "ROP": status = "dropped: its only slowdown offset (2020) came from industrial segments sold in 2022"
    elif basis in ("geo", "vertical", "channel"): status = "dropped: one product split by map/channel/vertical"
    elif thin: status = "dropped: thin sample"
    elif sev >= 2: status = "dropped: one hidden common driver (the trap)"
    elif offset < 0.30: status = "dropped: segment waves line up or are too small (offset < 0.30)"
    elif not demo: status = "dropped: no segment moved against another in 2020/2022/2023"
    else: status = "ranked"
    base["demo_years"] = ",".join(map(str, demo))
    base["offset_sub"] = round(offset, 3)
    base.update(offset_score=round(score, 1), status=status, n_segments=r["n_segments_latest"], years_covered=f"{yrs[0]}-{yrs[-1]}",
                n_growth_years=r["n_obs"], mean_seg_growth_corr=corr, offset_ratio=ratio, wave_amp=amp, mean_segprofit_corr=pcorr,
                worst_total_rev_yoy=wt, worst_total_rev_year=r.get("worst_seg_total_year"), worst_total_segprofit_yoy=wp, worst_prf_year=r.get("worst_prf_year"),
                weak_segment_share=sh, owner_key=key, owner_worst_yoy=ow, margin_vol=vol, rev_worst_yoy_10y=M.at[t, "rev_worst_yoy"] if t in M.index else np.nan,
                oi_worst_yoy_10y=M.at[t, "oi_worst_yoy"] if t in M.index else np.nan, fcf_margin_vol_10y=M.at[t, "fcf_margin_vol_10y"] if t in M.index else np.nan,
                c_offset=round(45 * offset, 1), c_whole=round(35 * whole, 1), c_comp=round(20 * comp, 1), penalty=pen,
                source_10k_urls=";".join(r.get("src_urls", [])))
    rows.append(base)

A = pd.DataFrame(rows).sort_values("offset_score", ascending=False, na_position="last")
# diversity cap as in the other grounds: at most 4 per yfinance industry in the top 25
picks, ic, bumped = [], {}, []
for _, x in A[A.status == "ranked"].iterrows():
    ind = x["industry"] or "?"
    if ic.get(ind, 0) >= 4: bumped.append(x["ticker"]); continue
    picks.append(x["ticker"]); ic[ind] = ic.get(ind, 0) + 1
    if len(picks) >= 25: break
A["rank"] = A["ticker"].map({t: i + 1 for i, t in enumerate(picks)})
A["in_top25"] = A["ticker"].isin(picks).astype(int)
A.loc[A.ticker.isin(bumped), "status"] = "ranked (bumped by 4-per-industry cap)"
A.to_csv(f"{ROOT}/triage/ground_5_all.csv", index=False)
top = A[A.in_top25 == 1].sort_values("rank")
if "JPM" not in picks: top = pd.concat([top, A[A.ticker == "JPM"]])
def one_line(x):
    n = x["note"]
    if x["ticker"] == "JPM" or x["ticker"] in ("BAC", "C", "WFC", "PNC"): pass
    return n
top = top.assign(one_line_note=top.apply(one_line, axis=1))
cols = ["ticker", "name", "offset_score", "mean_seg_growth_corr", "n_segments", "years_covered", "worst_total_rev_yoy", "worst_total_segprofit_yoy",
        "weak_segment_share", "fcfps_cagr_5y", "val_disc_avg", "pe_now", "pe_med_10y", "hidden_common_driver", "one_line_note", "source_10k_urls"]
out = top[cols].copy()
for c in ["mean_seg_growth_corr", "worst_total_rev_yoy", "worst_total_segprofit_yoy", "weak_segment_share", "fcfps_cagr_5y", "val_disc_avg"]:
    out[c] = out[c].astype(float).round(3)
for c in ["pe_now", "pe_med_10y"]: out[c] = out[c].astype(float).round(1)
out.to_csv(f"{ROOT}/triage/ground_5.csv", index=False)
print("bumped by cap:", bumped)
print(A[["ticker", "offset_score", "status", "rank", "c_offset", "c_whole", "c_comp", "penalty", "industry"]].to_string())
