"""Within-industry scoring: percentile ranks -> 5 pillars -> 5 weighting schemes -> stress scenarios (trial & error).
Outputs research/data/scores.json"""
import json, copy
R = "/home/user/abcd/research/data"
M = json.load(open(f"{R}/metrics.json"))
IND = {"bank": ["JPM","BAC","WFC","C","GS","MS","USB","PNC","COF"], "oil": ["XOM","CVX","COP","EOG","OXY","SHEL","TTE","BP"],
       "semi": ["NVDA","TSM","AVGO","AMD","ASML","MU","INTC","QCOM"], "hyper": ["MSFT","AMZN","GOOGL","META","ORCL","AAPL"],
       "soft": ["ADBE","CRM","NOW","INTU","SAP","PLTR","WDAY"], "air": ["DAL","UAL","AAL","LUV","ALK","JBLU"],
       "pharma": ["LLY","JNJ","ABBV","MRK","PFE","BMY","AMGN","NVO"]}
# (metric, direction, cap) per pillar; derived metrics computed below
P = {
 "bank": {"Q": [("rotce",1),("eff",-1),("ppnr_assets",1),("ni_cv",-1)], "S": [("htm_loss_tbv",-1),("aoci_tbv",1),("prov_rev",-1),("cet1",1)],
          "A": [("shs_cagr",-1),("payout",1)], "G": [("ni_growth",1)], "V": [("earn_yield",1),("p_etbv",-1)]},
 "oil": {"Q": [("roic",1),("om5",1),("fcf_m5",1),("fcf_m_min",1)], "S": [("nd_ebitda",-1),("int_cov",1)],
         "A": [("shs_cagr",-1),("div_cov",1)], "G": [("rev_cagr",1)], "V": [("fcf_y_norm",1),("pe_norm",-1),("oe_y_strict",1)]},
 "semi": {"Q": [("roic",1),("om",1),("om5",1),("fcf_ni",1)], "S": [("nd_ebitda",-1),("fcf_neg_yrs",-1)],
          "A": [("shs_cagr",-1),("sbc_rev",-1)], "G": [("rev_yoy_q",1),("rev_cagr",1)], "V": [("pe_norm",-1),("oe_y_strict",1),("fcf_y_norm",1)]},
 "hyper": {"Q": [("roic",1),("om",1),("om5",1)], "S": [("nd_ebitda",-1),("capex_ocf",-1),("ext_fin",-1)],
           "A": [("shs_cagr",-1),("fcf_ni",1)], "G": [("rev_yoy_q",1),("rev_cagr",1)], "V": [("oe_y_strict",1),("oe_y_maint",1),("pe_norm",-1)]},
 "soft": {"Q": [("om",1),("fcf_m",1),("roic",1)], "S": [("nd_ebitda",-1)], "A": [("shs_cagr",-1),("sbc_rev",-1)],
          "G": [("rev_yoy_q",1),("rule40",1)], "V": [("oe_y_strict",1),("pe_norm",-1)]},
 "air": {"Q": [("om",1),("om5",1),("fcf_m5",1),("roic",1)], "S": [("nd_ebitda",-1),("eq_pos",1),("liq_rev",1),("fcf_m_min",1)],
         "A": [("shs_cagr",-1)], "G": [("rev_yoy_q",1)], "V": [("oe_y_maint",1),("ev_ebitda",-1)]},
 "pharma": {"Q": [("om5",1),("fcf_m",1),("roic",1)], "S": [("nd_ebitda",-1)], "A": [("shs_cagr",-1),("div_cov",1)],
            "G": [("rev_yoy_q",1),("rev_cagr",1),("loe_safe",1)], "V": [("fcf_y",1),("pe_norm",-1),("oe_y_strict",1)]},
}
SCHEMES = {"Owner (base)": {"Q":.30,"S":.20,"A":.15,"G":.15,"V":.20}, "Value-first": {"Q":.20,"S":.15,"A":.10,"G":.10,"V":.45},
           "Quality-first": {"Q":.45,"S":.20,"A":.15,"G":.10,"V":.10}, "Safety-first": {"Q":.25,"S":.40,"A":.15,"G":.05,"V":.15},
           "Growth-first": {"Q":.25,"S":.10,"A":.10,"G":.40,"V":.15}}
# Documented estimates (not from Wall St): share of current revenue facing loss-of-exclusivity by ~2030 (my estimate from patent calendars)
LOE = {"LLY":0.05,"JNJ":0.20,"ABBV":0.12,"MRK":0.50,"PFE":0.30,"BMY":0.45,"AMGN":0.25,"NVO":0.15}
# Software: share of revenue tied to per-seat pricing exposed to AI-agent compression (my estimate)
SEAT = {"ADBE":0.60,"CRM":0.70,"NOW":0.45,"INTU":0.25,"SAP":0.35,"PLTR":0.05,"WDAY":0.75}
GUIDE = {"NVO": -0.03, "LLY": 0.40}  # company FY26 guidance (NVO adj sales 0 to -6% CER; LLY $91-92B vs $65.2B)
# Explicit risk flags (each -0.03 off weighted total). Evidence in research/notes.
FLAGS = {
 "NVDA": ["CEO Jensen Huang resigned amid investigation (Nov-26)", "OCF/NI fell to ~70% TTM; receivables +$40B in 2 qtrs", "~$35B 'strategic investments' into customers (vendor financing)", "New export limits on remote chip access"],
 "AMD": ["OpenAI warrants up to 160M sh (~10% dilution)", "Q3-26 OCF $1.2B vs NI $2.4B (inventory/AR build)"],
 "INTC": ["+30% share dilution since 2021, still loss-making"], "MU": ["Record-peak margins in most cyclical segment (memory)"],
 "TSM": ["Taiwan geopolitical concentration"], "ASML": ["China export-control dependency"], "AVGO": ["Customer concentration + VMware debt"], "QCOM": ["Apple modem loss"],
 "ORCL": ["FCF -$28.7B TTM, debt $156B", "Sold $20B equity via ATM"], "AMZN": ["FCF negative; +$125B debt in 4 qtrs"], "GOOGL": ["Raised $37B common + $19B mandatory pref + ATM; ~$97B debt"],
 "META": ["Teen-safety liabilities: $9.9B charge, up to $18.6B AG deal, $25B NM penalty (appeal)"], "MSFT": ["Commercial backlog concentrated in OpenAI"], "AAPL": ["Search-default payments (~$20B/yr) antitrust risk; no AI infra moat"],
 "COF": ["Card credit + Discover integration"],
 "PNC": ["Loans to nonbank financials ~21% of loans (FDIC/Q1-26) - private-credit stress (record 6.1% default rate)"],
 "GS": ["Bank-sub NDFI exposure >300% of equity (Q1-26)"], "MS": ["Bank-sub NDFI exposure >300% of equity (Q1-26)"],
 "BAC": ["$104B HTM unrealized loss = 52% of TBV (SEC, Q3-26); rates rising again"], "BP": ["Strategy U-turns; buybacks suspended in 2026"],
 "ADBE": ["Generative-AI substitution of creative seats"], "CRM": ["Seat exposure + acquisitive (Informatica)"], "WDAY": ["Seat exposure (HR/finance users)"], "PLTR": ["~50x sales; govt concentration"],
 "AAL": ["Negative equity; interest coverage <1x"], "JBLU": ["Distress: negative FCF, ND/EBITDA >60x"], "ALK": ["Hawaiian integration + Q3 loss"], "LUV": ["Profit propped by asset sales/sale-leasebacks"],
 "PFE": ["Dividend ~83% of FCF into patent cliff"], "NVO": ["Guiding sales DOWN in 2026; GLP-1 share loss to LLY"], "JNJ": ["Talc litigation charge (Q3-26 ~$5.8B)"],
}
EXTFIN = {"MSFT":0.05,"AMZN":0.74,"GOOGL":0.88,"META":0.40,"ORCL":0.74,"AAPL":0.0}  # (debt+equity raised TTM)/OCF, from cash-flow data + filings
def derive(c, ind):
    d = dict(c)
    if ind == "bank":
        d["ptbv_per_rotce"] = (c["ptbv"] / (c["rotce"] * 100)) if c.get("ptbv") and c.get("rotce") else None
        nh = c.get("ni_hist") or []
        nh = [v for k, v in (c.get("ni_hist") or []) if k >= "2021-06-01"]
        d["ni_growth"] = ((c.get("ni_common") or c.get("ni")) / nh[0]) ** (1 / max(len(nh) - 0.25, 1)) - 1 if nh and nh[0] > 0 else None
    else:
        if ind == "soft": d["rule40"] = (c.get("rev_yoy_q") or 0) + (c.get("fcf_m") or 0)
        if ind == "air":
            d["eq_pos"] = 1 if (c.get("eq") or 0) > 0 else 0
            d["liq_rev"] = (c.get("cash") or 0) / c["rev"] if c.get("rev") else None
            d["ev_ebitda"] = c["ev"] / c["ebitda"] if (c.get("ebitda") or 0) > 0 else 99
        if ind == "pharma":
            d["loe_safe"] = 1 - LOE.get(c["t"], 0.2)
            if c["t"] in GUIDE: d["rev_yoy_q"] = GUIDE[c["t"]]
        if ind == "hyper": d["ext_fin"] = EXTFIN.get(c["t"], 0)
        if d.get("fcf_ni") is not None: d["fcf_ni"] = min(d["fcf_ni"], 1.5)
    return d
def pct_rank(vals, v, direction):
    xs = [x for x in vals if x is not None]
    if v is None or not xs: return 0.35
    if len(xs) == 1: return 0.6
    below = sum(1 for x in xs if (x < v if direction > 0 else x > v)); eq = sum(1 for x in xs if x == v) - 1
    return (below + 0.5 * eq) / (len(xs) - 1)
def score_ind(ind, comps, scheme_w, pillars=None):
    pillars = pillars or P[ind]
    D = {t: derive(comps[t], ind) for t in IND[ind] if t in comps}
    out = {}
    for t, d in D.items():
        ps = {}
        for p, mets in pillars.items():
            rs = [pct_rank([D[u].get(m) for u in D], d.get(m), s) for m, s in mets]
            ps[p] = sum(rs) / len(rs)
        raw = sum(scheme_w[p] * ps[p] for p in ps)
        out[t] = {"pillars": ps, "raw": raw, "flags": len(FLAGS.get(t, [])), "total": raw - 0.03 * len(FLAGS.get(t, []))}
    rank = sorted(out, key=lambda t: -out[t]["total"])
    for i, t in enumerate(rank): out[t]["rank"] = i + 1
    return out, rank
def stress(ind, comps):
    """Return stressed copies of metrics for industry-specific downside scenarios."""
    S = {}
    cs = copy.deepcopy(comps)
    if ind == "oil":   # Brent back to ~$65: earnings -> worst-year FCF margin, pe at 5y-avg margin -20%
        for t in IND[ind]:
            c = cs[t]
            if c.get("fcf_m_min") is not None and c.get("rev"):
                c["oe_y_strict"] = c["fcf_m_min"] * c["rev"] * 0.75 / c["mcap"]; c["fcf_y_norm"] = c["oe_y_strict"]
        S["Brent $65 / refining normalizes"] = cs
    elif ind == "semi":  # AI capex -30%: AI-levered revenue drops; memory hit hardest
        cut = {"NVDA":0.35,"AVGO":0.25,"MU":0.55,"TSM":0.20,"AMD":0.25,"ASML":0.15,"INTC":0.10,"QCOM":0.05}
        for t in IND[ind]:
            c = cs[t]; k = cut[t]
            if c.get("rev") and c.get("om"):
                new_rev = c["rev"] * (1 - k); new_om = max(c["om"] - k * 0.5, 0.02)
                c["pe_norm"] = c["mcap"] / (new_rev * new_om * 0.82); c["oe_y_strict"] = (new_rev * new_om * 0.82 * 0.8) / c["mcap"]; c["rev_yoy_q"] = -k
        S["AI capex -30% (memory -55%)"] = cs
    elif ind == "hyper":  # capex earns nothing extra: value only on strict owner earnings, growth halves
        for t in IND[ind]:
            c = cs[t]; c["oe_y_maint"] = c.get("oe_y_strict"); c["rev_yoy_q"] = (c.get("rev_yoy_q") or 0) / 2
        S["AI capex earns no excess return"] = cs
    elif ind == "soft":  # seat compression: revenue haircut by seat exposure x 30%
        for t in IND[ind]:
            c = cs[t]; h = SEAT[t] * 0.30
            c["rev_yoy_q"] = (c.get("rev_yoy_q") or 0) - h; c["oe_y_strict"] = (c.get("oe_y_strict") or 0) * (1 - 1.5 * h)
            c["rule40"] = None
        S["AI agents cut seats 30%"] = cs
    elif ind == "air":  # fuel +20%: ~5pts margin hit
        for t in IND[ind]:
            c = cs[t]; rev = c.get("rev") or 0; hit = 0.05 * rev
            c["om"] = (c.get("om") or 0) - 0.05; c["ebitda"] = (c.get("ebitda") or 0) - hit
            c["nd_ebitda"] = c["net_debt"] / c["ebitda"] if c["ebitda"] > 0 else 50
            c["oe_y_maint"] = ((c.get("oe_maint") or 0) - hit) / c["mcap"] if c.get("mcap") else None
        S["Jet fuel +20% more"] = cs
    elif ind == "pharma":  # LOE: lose 60% of at-risk revenue at same margins
        for t in IND[ind]:
            c = cs[t]; h = LOE[t] * 0.6
            c["fcf_y"] = (c.get("fcf_y") or 0) * (1 - h); c["oe_y_strict"] = (c.get("oe_y_strict") or 0) * (1 - h)
            if c.get("pe_norm"): c["pe_norm"] = c["pe_norm"] / (1 - h)
            c["rev_yoy_q"] = (c.get("rev_yoy_q") or 0) - h / 4
        S["Patent cliff hits (60% of LOE revenue lost)"] = cs
    elif ind == "bank":  # credit cycle: provisions x2.5 (min 1.5% of revenue extra) after tax
        for t in IND[ind]:
            c = cs[t]; extra = max((c.get("prov") or 0) * 1.5, 0.015 * (c.get("rev") or 0)) * 0.78
            nic = (c.get("ni_common") or c.get("ni") or 0) - extra
            c["rotce"] = nic / c["tbv"] if c.get("tbv") else None; c["earn_yield"] = nic / c["mcap"] if c.get("mcap") else None
            c["prov_rev"] = (c.get("prov_rev") or 0) * 2.5
        S["Credit cycle: provisions x2.5"] = cs
    return S
res = {}
for ind in IND:
    comps = {t: M[t] for t in IND[ind] if t in M}
    r = {"schemes": {}, "stress": {}}
    for sn, w in SCHEMES.items():
        o, rank = score_ind(ind, comps, w); r["schemes"][sn] = {"rank": rank, "scores": o}
    for sn, cs in stress(ind, comps).items():
        o, rank = score_ind(ind, cs, SCHEMES["Owner (base)"]); r["stress"][sn] = {"rank": rank, "scores": o}
    wins = {}; avgrank = {}
    allruns = list(r["schemes"].values()) + list(r["stress"].values())
    for t in comps:
        wins[t] = sum(1 for run in allruns if run["rank"][0] == t)
        avgrank[t] = sum(run["rank"].index(t) + 1 for run in allruns) / len(allruns)
    r["wins"] = wins; r["avgrank"] = avgrank; r["n_runs"] = len(allruns)
    r["robust_order"] = sorted(comps, key=lambda t: (avgrank[t], -wins[t]))
    res[ind] = r
    base = r["schemes"]["Owner (base)"]
    print(f"\n{ind}: base rank {base['rank']}")
    print("  wins/runs:", {t: f"{wins[t]}/{len(allruns)}" for t in r['robust_order']})
    print("  avg rank:", {t: round(avgrank[t], 2) for t in r['robust_order']})
    for sn, run in r["stress"].items(): print(f"  stress[{sn}]: {run['rank'][:4]}")
    top = r["robust_order"][0]; pl = base["scores"][top]["pillars"]
    print("  top pillars:", top, {k: round(v, 2) for k, v in pl.items()})
res["_flags"] = FLAGS; res["_loe"] = LOE; res["_seat"] = SEAT; res["_extfin"] = EXTFIN; res["_guide"] = GUIDE; res["_schemes"] = SCHEMES
res["_pillars"] = {k: {p: [m for m, s in v] for p, v in d.items()} for k, d in P.items()}
json.dump(res, open(f"{R}/scores.json", "w"))
