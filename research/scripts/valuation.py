"""Own valuation (no Wall St targets): reverse DCF implied 10y growth; 3-scenario intrinsic value; bank implied ROTCE."""
import json
R = "/home/user/abcd/research/data"
M = json.load(open(f"{R}/metrics.json")); S = json.load(open(f"{R}/scores.json"))
r, gT, N = 0.09, 0.03, 10   # cost of equity: 10y UST 5.07% + ~4% ERP; terminal 3%
def pv(cf0, g):
    v, cf = 0.0, cf0
    for i in range(1, N + 1):
        cf *= (1 + g); v += cf / (1 + r) ** i
    tv = cf * (1 + gT) / (r - gT); return v + tv / (1 + r) ** N
def implied_g(cf0, target):
    if not cf0 or cf0 <= 0 or not target: return None
    lo, hi = -0.5, 1.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if pv(cf0, mid) > target: hi = mid
        else: lo = mid
    return (lo + hi) / 2
out = {}
for t, c in M.items():
    if c["ind"] == "bank":
        rr, gg = 0.10, 0.04
        out[t] = {"impl_rotce_tbv": c["ptbv"] * (rr - gg) + gg if c.get("ptbv") else None,
                  "impl_rotce_etbv": c["p_etbv"] * (rr - gg) + gg if c.get("p_etbv") else None,
                  "rotce": c.get("rotce"), "erotce": (c.get("ni_common") or c.get("ni")) / c["etbv"] if c.get("etbv") else None}
        continue
    mcap = c["mcap"]; strict = c.get("oe_strict"); maint = c.get("oe_maint")
    fm5 = c.get("fcf_m5"); rev = c.get("rev")
    norm = (fm5 * rev - (c.get("sbc") or 0)) if (fm5 is not None and rev) else None
    o = {"g_strict": implied_g(strict, mcap), "g_maint": implied_g(maint, mcap), "g_norm": implied_g(norm, mcap)}
    # 3-scenario IV on the more conservative positive base
    base_cf = min([x for x in (strict, maint, norm) if x and x > 0], default=None)
    if t in ("ORCL", "AMZN", "GOOGL") and (strict or 0) <= 0: base_cf = None
    hist_g = c.get("rev_cagr") or 0.03
    scen = {"bear": max(min(hist_g * 0.25, 0.04), -0.03), "base": max(min(hist_g * 0.6, 0.15), 0.0), "bull": max(min(hist_g * 1.0, 0.25), 0.03)}
    OVR = {"NVO": {"bear": -0.04, "base": 0.0, "bull": 0.05}, "MU": {"bear": -0.05, "base": 0.03, "bull": 0.08}, "BP": {"bear": -0.03, "base": 0.0, "bull": 0.02},
           "SHEL": {"bear": -0.03, "base": 0.0, "bull": 0.02}, "TTE": {"bear": -0.03, "base": 0.0, "bull": 0.02}}
    if t in OVR: scen = OVR[t]
    if t == "ORCL": base_override = strict  # don't credit growth capex for a debt/equity-funded FCF-negative builder
    if base_cf:
        o["iv"] = {k: pv(base_cf, g) for k, g in scen.items()}; o["iv_vs_mcap"] = {k: v / mcap - 1 for k, v in o["iv"].items()}; o["scen_g"] = scen; o["base_cf"] = base_cf
    out[t] = o
json.dump(out, open(f"{R}/valuation.json", "w"))
for ind in ["oil","semi","hyper","soft","air","pharma","bank"]:
    print(f"\n{ind}:")
    for t in S[ind]["robust_order"]:
        v = out[t]
        if ind == "bank":
            print(f"  {t:5} implied ROTCE (TBV) {v['impl_rotce_tbv']*100:5.1f}% vs actual {v['rotce']*100:5.1f}% | implied (econ TBV) {v['impl_rotce_etbv']*100:5.1f}% vs econ ROTCE {v['erotce']*100:5.1f}%")
        else:
            f = lambda x: "  n/a " if x is None else f"{x*100:5.1f}%"
            ivb = v.get("iv_vs_mcap", {}).get("base"); ivb = "  n/a" if ivb is None else f"{ivb*100:+5.0f}%"
            print(f"  {t:5} implied 10y g: strict {f(v['g_strict'])} maint {f(v['g_maint'])} normFCF {f(v['g_norm'])} | IV(base) vs price {ivb}  scen {v.get('scen_g')}")
