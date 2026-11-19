"""Monthly point-in-time valuation history for every company (2009 -> today).
Market cap(t) = market cap today x split-adjusted price ratio x share-count ratio (SEC shares, split-adjusted).
Fundamentals(t) = latest fiscal year whose 10-K/20-F was already FILED by t (no look-ahead).
Valuations are stored as YIELDS (higher = cheaper) so negative earnings stay on one continuous scale.
Also exposes cheapness(t): percentile of today's yield inside the company's OWN last-10y history, and
reversion upside: value if yields return to the company's own 10y median."""
import json, math, numpy as np, pandas as pd
import load as L, compute as C

YIELDS = {"gen": ["sales_ev", "ebit_ev", "ebit5_ev", "fcf5_y", "ey"], "auto": ["sales_ev", "ebit5_ev", "fcf5_y", "ey", "ey5"],
          "bank": ["ey", "ey5", "bp"], "ins": ["ey", "ey5", "bp"], "reit": ["sales_ev", "ocf_y", "ocf5_y"]}
CHEAP_KEYS = {"gen": ["sales_ev", "ebit5_ev", "fcf5_y", "ey"], "auto": ["ey5", "ey", "fcf5_y"], "bank": ["ey5", "bp", "ey"], "ins": ["ey5", "bp", "ey"],
              "reit": ["ocf5_y", "sales_ev", "ocf_y"]}
# autos: captive finance arms make EV meaningless -> earnings/FCF yields only
EV_BASED = {"sales_ev", "ebit_ev", "ebit5_ev"}
TODAY = pd.Timestamp(L.DTR.index[-1].date())

def month_ends():
    idx = L.MSA.index
    ends = [(d + pd.offsets.MonthEnd(0)) for d in idx]
    ends[-1] = min(ends[-1], TODAY)
    return ends

def build(t):
    ind = L.TK2IND[t]; kind = C.kind_of(ind); vk = "reit" if ind == "REITs" else "auto" if ind == "Autos & EVs" else kind
    rec = L.sec(t); cur = rec["unit"].get("rev") or "USD"
    c = C.Co(rec, kind, None, L.FST.get(t), 1.0, L.splits(t)); c.reit = vk == "reit"
    years = sorted(c.A.get("rev", {}))
    if len(years) < 3 or t not in L.MSA: return None
    firsts = {}
    for k in ("rev", "ni", "nii", "ocf"):
        for row in rec.get("ann", {}).get(k, []):
            firsts.setdefault(row[0], []).append(row[2])
    def filed(e):
        c_ = [f for d, fs in firsts.items() if abs((pd.Timestamp(d) - pd.Timestamp(e)).days) <= 20 for f in fs]
        return pd.Timestamp(min(c_)) if c_ else pd.Timestamp(e) + pd.Timedelta(days=110)
    F = {e: filed(e) for e in years}
    rev = c.A.get("rev", {}); oi = c.A.get("oi", {}); ni = c.A.get("ni", {}); oc = c.A.get("ocf", {})
    cx = {} if c.reit else c.A.get("capex", {})
    def fcf(e):
        if oc.get(e) is None: return None
        if kind == "gen" and not c.A.get("capex") : return oc[e]
        return oc[e] - abs(cx.get(e) or 0)
    def ia(k, e): return c.inst_at(k, e)
    sh = c.A.get("shs", {})
    S_now = sh[max(sh)] if sh else None
    P = L.MSA[t]; mc_now = L.mcap(t); P_now = float(P.dropna().iloc[-1])
    out = {"t": t, "kind": vk, "m": [], **{y: [] for y in YIELDS[vk]}, "mcap": [], "nd": [], "fy": []}
    for d, tend in zip(L.MSA.index, month_ends()):
        p = P.get(d)
        if p is None or (isinstance(p, float) and math.isnan(p)): continue
        av = [e for e in years if F[e] <= tend]
        if not av: continue
        e0 = av[-1]; l5 = av[-5:]
        shs_av = [e for e in sorted(sh) if F.get(e, pd.Timestamp(e) + pd.Timedelta(days=110)) <= tend]
        ratio = (sh[shs_av[-1]] / S_now) if shs_av and S_now else 1.0
        mc_usd = mc_now * (float(p) / P_now) * ratio
        mc = mc_usd / L.fx(cur, tend)
        debt = (ia("ltd", e0) or 0) + (ia("std", e0) or 0); cash = (ia("cash", e0) or 0) + (ia("sti", e0) or 0)
        ev = mc + debt - cash
        ev = max(ev, 0.05 * mc)
        avg = lambda d_, ks: (np.mean([d_[k] for k in ks if d_.get(k) is not None]) if sum(d_.get(k) is not None for k in ks) >= 3 else None)
        row = {}
        if vk in ("gen", "auto"):
            f5 = [fcf(e) for e in l5]; f5 = [x for x in f5 if x is not None]
            row = {"sales_ev": rev.get(e0) / ev if rev.get(e0) else None,
                   "ebit_ev": oi.get(e0) / ev if oi.get(e0) is not None else None,
                   "ebit5_ev": (avg(oi, l5) / ev) if avg(oi, l5) is not None else None,
                   "fcf5_y": (np.mean(f5) / mc) if len(f5) >= 3 else None,
                   "ey": ni.get(e0) / mc if ni.get(e0) is not None else None,
                   "ey5": (avg(ni, l5) / mc) if avg(ni, l5) is not None else None}
        elif vk == "reit":
            o5 = [oc[e] for e in l5 if oc.get(e) is not None]
            row = {"sales_ev": rev.get(e0) / ev if rev.get(e0) else None, "ocf_y": oc.get(e0) / mc if oc.get(e0) is not None else None,
                   "ocf5_y": np.mean(o5) / mc if len(o5) >= 3 else None}
        else:
            q = ia("eq", e0)
            if q is not None and kind == "bank": q = q - (ia("pref", e0) or 0) - (ia("gw", e0) or 0) - (ia("intang", e0) or 0)
            row = {"ey": ni.get(e0) / mc if ni.get(e0) is not None else None, "ey5": (avg(ni, l5) / mc) if avg(ni, l5) is not None else None,
                   "bp": q / mc if q else None}
        out["m"].append(str(d.date())[:7])
        for y in YIELDS[vk]: out[y].append(None if row.get(y) is None else round(float(row[y]), 5))
        out["mcap"].append(round(mc_usd / 1e9, 3)); out["nd"].append(round((debt - cash) / 1e9, 3) if vk not in ("bank", "ins") else 0); out["fy"].append(e0)
    return out

def cheapness(h, upto=None, window=120, min_hist=36):
    """Own-history percentile (1 = cheapest in its last 10y) + reversion upside, evaluated at month index `upto` (default last)."""
    n = len(h["m"]); i = n - 1 if upto is None else upto
    if i < 0: return None
    lo = max(0, i - window)
    pcts, ups, det = [], [], {}
    for y in CHEAP_KEYS[h["kind"]]:
        hist = [v for v in h[y][lo:i + 1] if v is not None]
        v = h[y][i]
        if v is None or len(hist) < min_hist: continue
        p = sum(1 for x in hist if x <= v) / len(hist)
        med = float(np.median(hist)); pcts.append(p)
        if med > 0 and v is not None:
            if y in EV_BASED:
                mc = h["mcap"][i]; nd = h["nd"][i] or 0
                ev = mc + nd
                up = (ev * v / med - nd) / mc - 1 if mc > 0 else None
            else:
                up = v / med - 1
            if up is not None: ups.append(max(-0.8, min(3.0, up)))
        det[y] = {"v": v, "p": round(p, 3), "med": med, "lo": float(min(hist)), "hi": float(max(hist))}
    if not pcts: return None
    return {"cheap": float(np.mean(pcts)), "upside": float(np.median(ups)) if ups else None, "n": len(pcts), "det": det}

if __name__ == "__main__":
    allh = {}
    for t in L.TK2IND:
        try:
            h = build(t)
            if h: allh[t] = h
        except Exception as e:
            print("ERR", t, repr(e)[:120])
    json.dump(allh, open(f"{L.R}/valhist.json", "w"), separators=(",", ":"))
    print(len(allh), "companies")
    for t in ["HSY", "UNH", "ACN", "NKE", "DOW", "LYB", "GIS", "TROW", "NVO", "JPM", "VICI", "INFY", "EOG"]:
        if t in allh:
            ch = cheapness(allh[t]); h = allh[t]
            print(t, h["m"][0], len(h["m"]), {k: (round(v["v"], 3), v["p"]) for k, v in (ch or {}).get("det", {}).items()}, "cheap", round(ch["cheap"], 2) if ch else None, "up", round(ch["upside"], 2) if ch and ch["upside"] is not None else None)
