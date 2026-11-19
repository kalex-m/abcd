"""Phase 2: score each company on each of the seven grounds; write triage/ground_N.csv (top 25 + full ranked list).
Scores are averages of percentile ranks over transparent signals; eligibility gates first.
Usage: python3 scripts/p2_grounds.py [TOPN]
"""
import sys, json
import numpy as np, pandas as pd
ROOT = "/home/user/abcd/company_hunt"
TOP = int(sys.argv[1]) if len(sys.argv) > 1 else 25
M = pd.read_csv(f"{ROOT}/triage/metrics.csv")
M["sic"] = pd.to_numeric(M["sic"], errors="coerce")
fin = M["sic"].between(6000, 6411) & ~M["sic"].isin([6199, 6282, 6211, 6200, 6141])  # banks/insurers/REIT-like lenders
reit = M["sic"].isin([6798])
M["is_fin"] = fin.astype(int)
M["earn_yield"] = np.where(M["pe_now"] > 0, 1 / M["pe_now"], np.nan)
# cash yield: FCF yield for operating cos, earnings yield for balance-sheet businesses
M["cash_yield"] = np.where(fin, M["earn_yield"], M["fcf_sbc_yield"])
M["val_disc"] = M[["pe_vs_med", "evebit_vs_med", "pfcf_vs_med"]].min(axis=1)  # most-discounted of own-history multiples
M["val_disc_avg"] = M[["pe_vs_med", "evebit_vs_med", "pfcf_vs_med"]].mean(axis=1)
M["analysts_per_100b"] = M["n_analysts"] / (M["mcap"] / 1e11)
M["gm_hold"] = M["gm"] / M["gm_med_5y"]
M["om_vs_med"] = M["om"] - M["om_med_10y"]
M["om_stab"] = M["om_min_2019_25"] / M["om_med_10y"]
M["nd_ebitda_proxy"] = -M["net_cash"] / (M["oi"].clip(lower=1) * 1.25)
M["restr_rev"] = M["restr_3y"] / M["rev"]
M["imp_rev"] = M["imp_3y"] / M["rev"]
M["divest_mcap"] = M["divest_3y"] / M["mcap"]
M["invest_mcap"] = (M["eqmeth"].fillna(0) + M["lti"].fillna(0)) / M["mcap"]
M["eqinc_ni"] = M["eqinc"] / M["ni"].where(M["ni"] > 0)
def pr(s, asc=True):
    """percentile rank 0..1, higher = better; NaN -> 0.35 (mild penalty for missing)."""
    r = s.rank(pct=True, ascending=asc)
    return r.fillna(0.35)
def score(df, parts):
    return sum(w * pr(df[c], asc) for c, asc, w in parts) / sum(w for _, _, w in parts)

out = {}
# ---------- Ground 1: Bruised Essential ----------
g = M.copy()
hurt = (g["dd_from_3y_high"] <= -0.30) | (g["val_disc"] <= -0.35)
healthy = ((g["fcf"] > 0) | (fin & (g["ni"] > 0))) & (g["n_fcf_neg_10y"].fillna(0) <= 3) & (g["rev_vs_peak4y"].fillna(0) >= -0.35)
margin_ok = (g["gm_hold"].isna() | (g["gm_hold"] >= 0.85)) & (g["om"].isna() | (g["om"] > 0))
e = g[hurt & healthy & margin_ok & ~reit].copy()
e["score"] = score(e, [("dd_from_3y_high", False, 1.25), ("val_disc", False, 1.0), ("gm_hold", True, 0.75), ("cash_yield", True, 1.0),
                       ("roic_5y_avg", True, 0.5), ("om_med_10y", True, 0.5), ("netcash_mcap", True, 0.5), ("shs_chg_3y", False, 0.5)])
out[1] = e
# ---------- Ground 2: Mid-Rebuild ----------
g = M.copy()
signal = (g["restr_rev"] > 0.01) | (g["divest_mcap"] > 0.02) | (g["imp_rev"] > 0.02) | (g["n_8k_502_3y"] >= 3) | (g["n_8k_201_3y"] >= 1)
lagging = (g["ret_3y"] < 0.30) | (g["dd_from_3y_high"] <= -0.20)
ok = (g["ocf"] > 0)
e = g[signal & lagging & ok & ~reit].copy()
e["n502c"] = e["n_8k_502_3y"].clip(upper=6)
e["score"] = score(e, [("restr_rev", True, 1.0), ("divest_mcap", True, 0.75), ("imp_rev", True, 0.5), ("n502c", True, 0.75),
                       ("ocf_growth_vs_ni", True, 1.0), ("cash_yield", True, 1.0), ("ret_3y", False, 0.75), ("shs_chg_3y", False, 0.5),
                       ("val_disc", False, 0.75)])
out[2] = e
# ---------- Ground 3: Toll Road ----------
g = M.copy()
light = (g["capex_rev"] <= 0.10) | ((g["capex_rev"] <= 0.22) & (g["om_med_10y"] >= 0.33))
e = g[(g["om_med_10y"] >= 0.22) & light & ((g["n_rev_down_years"].fillna(9) <= 3) | (g["om_stab"].fillna(0) >= 0.8)) & (g["roic_5y_avg"].fillna(0) >= 0.08) &
      (g["n_fcf_neg_10y"].fillna(9) <= 1) & ~fin & ~reit].copy()
e["score"] = score(e, [("om_med_10y", True, 1.0), ("om_stab", True, 1.0), ("roic_5y_avg", True, 1.0), ("rev_cagr_5y", True, 0.75),
                       ("capex_rev", False, 0.5), ("fcf_margin_vol_10y", False, 0.75), ("val_disc_avg", False, 1.25), ("fcf_sbc_yield", True, 1.0)])
out[3] = e
# ---------- Ground 4: Quiet Vault ----------
g = M.copy()
vault = ((g["netcash_mcap"] >= -0.05) | (g["nd_ebitda_proxy"] <= 0.75)) & (g["fcf_ev_yield"] >= 0.05) & (g["n_fcf_neg_10y"].fillna(9) <= 1) & (g["shs_chg_5y"].fillna(0) <= 0.02)
e = g[vault & ~fin & ~reit].copy()
e["score"] = score(e, [("fcf_ev_yield", True, 1.25), ("fcf_sbc_yield", True, 0.75), ("netcash_mcap", True, 1.0), ("shs_chg_5y", False, 0.75),
                       ("fcfps_cagr_5y", True, 0.75), ("ret_3y", False, 0.75), ("analysts_per_100b", False, 0.5), ("fcf_margin_vol_10y", False, 0.5),
                       ("roic_5y_avg", True, 0.5)])
out[4] = e
# ---------- Ground 5: Many-Weathers ----------
g = M.copy()
steady = (g["n_rev_down_years"].fillna(9) <= 2) & (g["rev_cagr_10y"].fillna(-1) >= 0.03) & (g["mcap"] >= 10e9) & \
         ((g["om_min_2019_25"] > 0) | fin) & ((g["n_fcf_neg_10y"].fillna(9) <= 1) | fin) & (g["fcfps_down_years"].fillna(9) <= 4)
e = g[steady & ~reit].copy()
e["score"] = score(e, [("rev_yoy_vol", False, 1.0), ("rev_worst_yoy", True, 1.0), ("oi_worst_yoy", True, 1.0), ("fcf_margin_vol_10y", False, 0.5),
                       ("eps_cagr_5y", True, 0.75), ("roic_5y_avg", True, 0.5), ("val_disc_avg", False, 1.0), ("cash_yield", True, 0.75)])
out[5] = e
# ---------- Ground 6: Hidden Room (quant flags only; agent adds judgment) ----------
g = M.copy()
flag = (g["invest_mcap"] >= 0.10) | (g["eqinc_ni"] >= 0.10) | (g["industry"].fillna("").str.contains("Conglomerates"))
e = g[flag & ~fin & (g["ocf"] > 0)].copy()
e["score"] = score(e, [("invest_mcap", True, 1.0), ("eqinc_ni", True, 1.0), ("val_disc_avg", False, 1.0), ("cash_yield", True, 0.75), ("ret_3y", False, 0.5)])
out[6] = e
# ---------- Ground 7: Tide Supplier ----------
TIDE_IND = ["Electrical Equipment", "Specialty Industrial Machinery", "Engineering & Construction", "Utilities", "Semiconductor Equipment",
            "Copper", "Aluminum", "Specialty Chemicals", "Chemicals", "Building Products", "Industrial Distribution", "Electronic Components",
            "Communication Equipment", "Scientific & Technical Instruments", "Software - Infrastructure", "Uranium", "Oil & Gas Equipment",
            "Oil & Gas Midstream", "Rental & Leasing", "Pollution & Treatment", "Metal Fabrication", "Information Technology Services",
            "Semiconductors", "Computer Hardware", "Trucking", "Integrated Freight", "Waste Management", "Security & Protection",
            "Tools & Accessories", "Steel", "Other Industrial Metals", "Conglomerates", "Aerospace & Defense", "Farm & Heavy Construction"]
g = M.copy()
ind = g["industry"].fillna("").apply(lambda s: any(k in s for k in TIDE_IND))
e = g[ind & (g["ocf"] > 0) & (g["rev_cagr_3y"].fillna(-1) > 0.03) & ~fin & ~reit].copy()
e["score"] = score(e, [("rpo_growth", True, 1.0), ("rpo_rev", True, 0.5), ("rev_cagr_3y", True, 1.0), ("om_vs_med", True, 0.75),
                       ("roic", True, 0.75), ("val_disc_avg", False, 1.25), ("ret_3y", False, 0.5), ("fcf_sbc_yield", True, 0.5)])
out[7] = e
NAMES = {1: "Bruised Essential", 2: "Mid-Rebuild", 3: "Toll Road", 4: "Quiet Vault", 5: "Many-Weathers", 6: "Hidden Room", 7: "Tide Supplier"}
COLS = ["ticker", "name", "sector", "industry", "country", "mcap", "price", "score", "dd_from_3y_high", "ret_3y", "val_disc", "val_disc_avg", "pe_now", "pe_med_10y",
        "evebit_now", "evebit_med_10y", "pfcf_now", "pfcf_med_10y", "fcf", "fcf_sbc", "fcf_sbc_yield", "fcf_ev_yield", "cash_yield", "net_cash", "netcash_mcap",
        "roic", "roic_5y_avg", "gm", "gm_hold", "om", "om_med_10y", "rev", "rev_cagr_3y", "rev_cagr_5y", "rev_cagr_10y", "rev_worst_yoy", "oi_worst_yoy",
        "shs_chg_3y", "shs_chg_5y", "sh_yield", "n_analysts", "analysts_per_100b", "restr_rev", "divest_mcap", "imp_rev", "n_8k_502_3y", "ocf_growth_vs_ni",
        "invest_mcap", "eqinc_ni", "rpo_growth", "rpo_rev", "last_fy", "is_20f"]
CHINA = {"China", "Hong Kong", "Macau"}
def capped(e, n, ind_cap=4, cn_cap=4):
    picks, ic, cn = [], {}, 0
    for _, r in e.iterrows():
        ind = r.get("industry") or "?"
        is_cn = (r.get("country") in CHINA)
        if ic.get(ind, 0) >= ind_cap or (is_cn and cn >= cn_cap): continue
        picks.append(r["ticker"]); ic[ind] = ic.get(ind, 0) + 1; cn += is_cn
        if len(picks) >= n: break
    return picks
summary = {}
for k, e in out.items():
    e = e.sort_values("score", ascending=False)
    pick = capped(e, TOP)
    e["in_top"] = e["ticker"].isin(pick).astype(int)
    e[[c for c in COLS if c in e.columns]].to_csv(f"{ROOT}/triage/ground_{k}_full.csv", index=False)
    e[e["in_top"] == 1][[c for c in COLS if c in e.columns]].to_csv(f"{ROOT}/triage/ground_{k}_quant.csv", index=False)
    summary[k] = {"eligible": len(e), "top": pick}
    print(f"G{k} {NAMES[k]}: eligible {len(e)} | top: {', '.join(pick)}")
json.dump(summary, open(f"{ROOT}/triage/ground_summary.json", "w"), indent=1)
