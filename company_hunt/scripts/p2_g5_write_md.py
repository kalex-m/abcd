#!/usr/bin/env python3
"""Write triage/ground_5_segments.md from data/g5seg/results.json + triage/ground_5_all.csv (p2_g5_score.py).
The closing 'Why this list looks like this' paragraph lives in data/g5seg/why_g5.md and is appended if present."""
import json, math, os
import numpy as np, pandas as pd
ROOT = "/home/user/abcd/company_hunt"
R = json.load(open(f"{ROOT}/data/g5seg/results.json"))
A = pd.read_csv(f"{ROOT}/triage/ground_5_all.csv")

def pct(x, d=1):
    return "n/a" if x is None or (isinstance(x, float) and math.isnan(x)) else f"{x*100:+.{d}f}%"
def num(x, d=2):
    return "n/a" if x is None or (isinstance(x, float) and math.isnan(x)) else f"{x:.{d}f}"
def short(c, n=22): return c if len(c) <= n else c[:n - 1] + "~"

def table(level, growth=None, unit=1e6):
    yrs = sorted(level, key=int)
    segs = []
    for y in yrs:
        for c in level[y]:
            if c not in segs: segs.append(c)
    hdr = "| year | " + " | ".join(short(c) for c in segs) + " |"
    out = [hdr, "|" + "---|" * (len(segs) + 1)]
    for y in yrs:
        cells = []
        for c in segs:
            v = level[y].get(c)
            g = (growth or {}).get(y, {}).get(c) if growth else None
            s = "" if v is None else f"{v/unit:,.0f}"
            if g is not None and not (isinstance(g, float) and math.isnan(g)): s += f" ({g*100:+.0f}%)"
            cells.append(s)
        out.append(f"| {y} | " + " | ".join(cells) + " |")
    return "\n".join(out)

def section(x):
    t = x["ticker"]; r = R[t]
    head = f"### {t}, {x['name']}"
    if isinstance(x.get("rank"), float) and not math.isnan(x["rank"]): head += f" (rank {int(x['rank'])}, offset score {x['offset_score']:.1f})"
    elif not math.isnan(x["offset_score"]): head += f" (offset score {x['offset_score']:.1f}; {x['status']})"
    else: head += f" ({x['status']})"
    L = [head, ""]
    if r.get("status") != "ok":
        L += [f"No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. {x['note']}", ""]
        return "\n".join(L)
    L.append(f"Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: {', '.join(r['rev_tags'])}." +
             (f" Acquisition/divestiture years left out of growth: {', '.join(map(str, r['skip']))}." if r.get("skip") else ""))
    L += ["", table(r["level"], r["growth"]), ""]
    if r.get("plevel"):
        L += [f"Segment profit, $M ({', '.join(r['prf_tags'])}):", "", table(r["plevel"]), ""]
    else:
        L += ["Segment profit: not tagged by segment in a single-axis XBRL context (not verified).", ""]
    pairs = "; ".join(f"{a[:14]}/{b[:14]} {c:+.2f} (n={n})" for a, b, c, n in r.get("pairs", [])[:8]) or "no segment pair with 4+ common growth years"
    L.append(f"Correlation of segment revenue growth: {pairs}. Size-weighted mean {num(r.get('wmean_corr'))}; offset ratio {num(r.get('div_ratio'))} "
             f"(1 = segment waves line up, 0 = they cancel); average wave {pct(r.get('wave_amp'))}; segment-profit change correlation {num(r.get('mean_pcorr'))}. "
             f"Worst total segment revenue year {pct(r.get('worst_seg_total_yoy'))} ({r.get('worst_seg_total_year')}); worst total segment profit year "
             f"{pct(r.get('worst_prf_yoy'))} ({r.get('worst_prf_year', 'n/a')}); share of revenue that shrank in 2020/2022/2023 {num(r.get('weak_share'))}. "
             f"Slowdown years with a segment moving against another: {x.get('demo_years') if isinstance(x.get('demo_years'), str) and x.get('demo_years') else 'none'}.")
    L.append("")
    own = "net income" if x.get("owner_key") == "ni" else "free cash flow"
    val = f"P/E {num(x['pe_now'],1)} vs {num(x['pe_med_10y'],1)} own 10-year median (val_disc_avg {pct(x['val_disc_avg'],0)})" if not math.isnan(x["pe_now"]) else "P/E history not verified (metrics artifact)"
    verdict = "Kept." if x["status"] == "ranked" else f"Dropped: {x['status'].replace('dropped: ', '')}."
    L.append(f"Reading: {x['note']} Hidden common driver: {x['hidden_common_driver']}. Worst {own} year since 2019 {pct(x.get('owner_worst_yoy'),0)}, "
             f"EPS growth {pct(x['eps_cagr_5y'],1)} a year over 5 years; {val}. {verdict}")
    L.append("")
    return "\n".join(L)

intro = f"""# Ground 5: The Many-Weathers, segment evidence (Phase 2, run 2026-11-19, written 2026-11-21)

What was tested: does a company have several revenue streams that move in different directions when the economy turns, so the whole holds and compounds (JPMorgan is the model)? Source: business-segment facts in the inline XBRL of each company's last six 10-K filings on EDGAR (fiscal 2018 to fiscal 2025/26), pulled with `scripts/p2_g5_fetch.py`, analysed with `scripts/p2_g5_analyze.py`, scored with `scripts/p2_g5_score.py`. Market data and per-share growth from `triage/metrics.csv` (split-adjusted, capex incl. capitalized software). Every 10-K URL used is in `triage/ground_5.csv` / `triage/ground_5_all.csv`.

How growth is read: each year-pair comes from the newest single filing that reports both years, so a reorganization never creates fake growth. Years dominated by a big acquisition or divestiture are left out (named under each table; e.g. Cigna 2019 Express Scripts, CVS 2019 Aetna, Fiserv 2019-20 First Data, S&P Global 2022 IHS Markit, Schwab 2021 TD Ameritrade); in the total for that year the bought segment is held at its median clean growth (or flat), so purchases neither inflate nor vanish.

Measures: (1) size-weighted mean pairwise correlation of segment revenue growth; (2) offset ratio, a year-by-year diversification ratio: each segment's growth minus its own average is its 'wave'; ratio = size of the wave left in the total / size it would be if every segment swung the same way (1 = waves line up, 0 = they cancel; survives reorganizations); (3) the same correlation on segment-profit dollar changes, which is where hidden shared drivers (credit reserves, cost trend) show up; (4) worst total segment revenue and segment profit year; (5) share of revenue in segments that shrank in 2020, 2022 and 2023; (6) worst free-cash-flow year since 2019 (net income for banks and insurers) and 10-year margin volatility; (7) 5-year per-share growth. offset_score = 45 x offset + 35 x whole-held + 20 x compounding, minus penalties (one product split by map -15, hidden driver -4/-10, thin sample -10); weights are in the script header.

Gates for the list (all must pass): at least two business segments with 5+ clean growth years; no single hidden driver dominating (severity 2 = the trap); offset sub-score of 0.30 or more; and in at least one named slowdown (2020, 2022, 2023) a segment with 10%+ of revenue shrank 2%+ while another 10%+ segment grew, 8+ points apart. Diversity cap: 4 per yfinance industry (it bound nowhere).

Honest limits: 5-7 annual growth points per company is a small sample; one correlation of -0.5 on six points is not significant and I treat it as a clue, not proof. The period holds one recession (2020, cushioned by stimulus) and one rate shock (2022-23), and no real credit cycle, so offsets in banks and insurers have not been tested by a credit bust. Segment profit is untagged for some insurers (PGR, TRV in part) and marked not verified.

"""

order = ["ranked"] + [s for s in A.status.unique() if s != "ranked"]
with open(f"{ROOT}/triage/ground_5_segments.md", "w") as f:
    f.write(intro)
    top = A[A.status == "ranked"].sort_values("rank")
    f.write("## The list\n\n| rank | ticker | offset score | seg-growth corr | offset ratio | worst seg revenue yr | worst seg profit yr | shrinking share | EPS 5y | P/E now vs 10y median |\n|---|---|---|---|---|---|---|---|---|---|\n")
    for _, x in top.iterrows():
        f.write(f"| {int(x['rank'])} | {x['ticker']} | {x['offset_score']:.1f} | {num(x['mean_seg_growth_corr'])} | {num(x['offset_ratio'])} | {pct(x['worst_total_rev_yoy'])} | "
                f"{pct(x['worst_total_segprofit_yoy'])} | {num(x['weak_segment_share'])} | {pct(x['eps_cagr_5y'])} | {num(x['pe_now'],1)} vs {num(x['pe_med_10y'],1)} |\n")
    f.write("\nJPM is Alex's holding (overlap): it ranks on its own numbers and serves as the reference model.\n\n")
    for st in order:
        sub = A[A.status == st].sort_values(["rank", "offset_score"], ascending=[True, False])
        f.write(f"## {'Kept (ranked)' if st == 'ranked' else st[0].upper() + st[1:]} ({len(sub)})\n\n")
        for _, x in sub.iterrows():
            f.write(section(x) + "\n")
            f.flush()
    if os.path.exists(f"{ROOT}/data/g5seg/why_g5.md"):
        f.write(open(f"{ROOT}/data/g5seg/why_g5.md").read())
print("written", len(A))
