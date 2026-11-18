"""Metrics engine. Primary: SEC EDGAR XBRL (scripts/sec_pull.py). Market data + 20-F freshness: yfinance.
metrics(rec, kind, asof=None, mcap=None, fx=1.0) -> dict, usable point-in-time (asof = only facts FIRST FILED <= asof)."""
import json, math, os, statistics as st
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANKLIKE = {"Banks", "Capital Markets & Brokers", "Consumer Finance & Cards"}
INSURER = {"P&C Insurance"}
def kind_of(ind): return "bank" if ind in BANKLIKE else "ins" if ind in INSURER else "gen"

def _f(x):
    return None if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))) else x
def div(a, b):
    if a is None or b is None or b == 0: return None
    return a / b
def clip(x, lo, hi): return None if x is None else max(lo, min(hi, x))
def cagr(a, b, yrs):
    if a is None or b is None or yrs <= 0 or a <= 0 or b <= 0: return None
    return (b / a) ** (1 / yrs) - 1
def mean(xs):
    xs = [x for x in xs if x is not None]; return sum(xs) / len(xs) if xs else None
def sd(xs):
    xs = [x for x in xs if x is not None]; return st.pstdev(xs) if len(xs) >= 3 else None

_YREV = None
def yrev():
    global _YREV
    if _YREV is None:
        p = os.path.join(ROOT, "data", "yf", "revenue.json")
        _YREV = json.load(open(p)) if os.path.exists(p) else {}
    return _YREV
def _near(e, d, tol=20):
    for k, v in d.items():
        if abs((np.datetime64(k) - np.datetime64(e)).astype(int)) <= tol: return v
    return None
def rev_rows(rec):
    """Per fiscal year choose between the priority revenue tag and the largest revenue tag.
    Referee = yfinance Total Revenue for that year; older years: continuity with the next year.
    Fixes subtotal tags (GIS 'Revenues' ~$2B 2019-24, BLK, OWL) without grossing up excise/rebates (PM, MA)."""
    pri = {r[0]: r for r in rec.get("ann", {}).get("rev", [])}
    mx = {r[0]: r for r in rec.get("ann", {}).get("rev_max", [])}
    yfa = yrev().get(rec.get("t"), {}).get("a", {})
    chosen = {}; anchor = None
    for e in sorted(set(pri) | set(mx), reverse=True):
        p, m = pri.get(e), mx.get(e)
        c = [x for x in (p, m) if x and x[1] and x[1] > 0]
        if not c: continue
        if len(c) == 1 or c[0][1] == c[1][1]: pick = c[0]
        else:
            y = _near(e, yfa)
            if y and y > 0 and min(abs(math.log(x[1] / y)) for x in c) < math.log(3):
                pick = min(c, key=lambda x: abs(math.log(x[1] / y)))
            elif anchor:
                lp, lm = abs(math.log(p[1] / anchor)), abs(math.log(m[1] / anchor))
                pick = m if (lp > math.log(1.35) and lm + 0.02 < lp) else p
            else: pick = p
        chosen[e] = pick; anchor = pick[1]
    ks = sorted(chosen)
    while len(ks) >= 3 and not (0.4 <= chosen[ks[0]][1] / chosen[ks[1]][1] <= 2.5): ks = ks[1:]  # leading junk (PM 2015 gross)
    if len(ks) >= 5:  # leading run of junk-scale values (JBLU 2009-11 = $6M)
        med = float(np.median([chosen[k][1] for k in ks]))
        while len(ks) >= 5 and chosen[ks[0]][1] < 0.05 * med: ks = ks[1:]
    return [chosen[k] for k in ks]

class Co:
    """Company view as of a date. Annual flows keyed by fiscal year-end; values in reporting currency (fx -> USD)."""
    def __init__(s, rec, kind, asof=None, ystm=None, fx=1.0, splits=None):
        s.r, s.kind, s.asof, s.fx = rec, kind, asof, fx
        s.reit = False
        s.A = {}
        for k, rows in rec.get("ann", {}).items():
            if k == "rev": rows = rev_rows(rec)
            s.A[k] = {row[0]: row[1] for row in rows if asof is None or row[2] <= asof}
        s._fix_shares(splits or [])
        # history that belongs to a different business (pre-spin conglomerate) is cut
        cut = {"GE": "2022-06-30"}.get(rec.get("t"))
        if cut:
            s.A = {k: {e: v for e, v in d.items() if e >= cut} for k, d in s.A.items()}
        # derived revenue: banks = NII + noninterest income; fallbacks gp+cogs
        if kind == "bank":
            nii, noi = s.A.get("nii", {}), s.A.get("nonint_inc", {})
            d = {e: nii[e] + noi[e] for e in nii if e in noi}
            if len(d) >= max(3, len(s.A.get("rev", {})) - 2): s.A["rev"] = {**s.A.get("rev", {}), **d}
        if len(s.A.get("rev", {})) < 3 and s.A.get("gp") and s.A.get("cogs"):
            s.A["rev"] = {e: s.A["gp"][e] + s.A["cogs"][e] for e in s.A["gp"] if e in s.A["cogs"]}
        if not s.A.get("gp") and s.A.get("rev") and s.A.get("cogs"):
            s.A["gp"] = {e: s.A["rev"][e] - s.A["cogs"][e] for e in s.A["rev"] if e in s.A["cogs"]}
        # utilities with untagged growth capex (NEE: FPL + NEER) -> capex = net investing outflow
        if rec.get("t") in ("NEE",) and s.A.get("icf"):
            s.A["capex"] = {e: -v for e, v in s.A["icf"].items()}
        # EBIT fallback = PBT + interest (non-banks)
        oi = s.A.get("oi", {}); pbt = s.A.get("pbt", {}); it = s.A.get("int", {})
        if kind == "gen" and len(oi) < max(3, len(pbt) - 3) and pbt:
            s.A["oi"] = {e: pbt[e] + abs(it.get(e, 0) or 0) for e in pbt}
        if kind != "gen" and pbt: s.A["oi"] = dict(pbt)
        # 20-F filers: append fresher fiscal years from yfinance annual statements (same currency) when SEC lags
        if ystm and asof is None: s._yf_fill(ystm)
        s.years = sorted(s.A.get("rev", {}))
        # balance-sheet at fiscal year ends (point-in-time)
        s.IA = {k: {row[0]: row[1] for row in rows if asof is None or row[2] <= asof} for k, rows in rec.get("inst_ann", {}).items()}
        a = rec.get("inst", {}).get("assets"); s.latest_bs = a[1] if a else None

    def _fix_shares(s, splits):
        """share counts -> today's split basis (yfinance split history vs SEC filing date) + unit-scale repair (e.g. MCD tags millions)."""
        def sf(after):  # cumulative split factor for splits strictly after date
            f = 1.0
            for d, r in splits:
                if d > after and r > 0: f *= r
            return f
        rows = {row[0]: row for row in s.r.get("ann", {}).get("shs", [])}
        ref = [(e, v * sf(e)) for e, v in s.r.get("shs_out", []) if v]
        out = {}
        for e, v in s.A.get("shs", {}).items():
            if not v: continue
            fl = rows[e][3] if e in rows and len(rows[e]) > 3 else e
            va = v * sf(fl)
            if ref:
                rv = min(ref, key=lambda x: abs((np.datetime64(x[0]) - np.datetime64(e)).astype(int)))[1]
                best = min([1e-6, 1e-3, 1, 1e3, 1e6], key=lambda f: abs(math.log(va * f / rv)))
                if best != 1 and abs(math.log(va / rv)) > math.log(50): va *= best
            out[e] = va
        s.A["shs"] = out
        s.split_after = sf

    def _yf_fill(s, y):
        rowmap = {"rev": ("ai", "Total Revenue"), "oi": ("ai", "Operating Income"), "ni": ("ai", "Net Income Common Stockholders"),
                  "gp": ("ai", "Gross Profit"), "ocf": ("ac", "Operating Cash Flow"), "capex": ("ac", "Capital Expenditure"),
                  "sbc": ("ac", "Stock Based Compensation"), "div": ("ac", "Cash Dividends Paid"), "bb": ("ac", "Repurchase Of Capital Stock"),
                  "da": ("ai", "Reconciled Depreciation"), "int": ("ai", "Interest Expense"), "pbt": ("ai", "Pretax Income"),
                  "tax": ("ai", "Tax Provision")}  # shares not filled: Yahoo uses ADR units for some 20-F filers
        for k, (sec, row) in rowmap.items():
            ser = (y.get(sec) or {}).get(row) or {}
            have = s.A.get(k, {})
            for e, v in ser.items():
                if v is None: continue
                if any(abs((np.datetime64(e) - np.datetime64(x)).astype(int)) < 20 for x in have): continue
                s.A.setdefault(k, {})[e] = abs(v) if k in ("capex", "div", "bb") else v
        s._yf_q = y

    # --- accessors ---
    def ann(s, k, n=None):
        d = s.A.get(k, {}); ks = sorted(d)
        if n: ks = ks[-n:]
        return [(e, d[e]) for e in ks]
    def val(s, k, e): return s.A.get(k, {}).get(e)
    def ttm(s, k):
        """latest 12m: SEC TTM (10-Q YTD math) if newer than last FY, else last FY. Point-in-time -> last FY."""
        a = s.ann(k)
        last = a[-1] if a else (None, None)
        if s.asof is None and s.kind == "bank" and k == "rev":
            n, o = s.r.get("ttm", {}).get("nii"), s.r.get("ttm", {}).get("nonint_inc")
            if n and o and n[0] is not None and o[0] is not None and n[1] == o[1] and (not last[0] or n[1] > last[0]): return n[0] + o[0]
        if s.asof is None and k == "rev" and s.kind != "bank":
            t1, t2 = s.r.get("ttm", {}).get("rev"), s.r.get("ttm", {}).get("rev_max")
            cands = [t for t in (t1, t2) if t and t[0] and last[0] and t[1] > last[0]]
            if cands:
                q = sorted((yrev().get(s.r.get("t"), {}).get("q") or {}).items(), reverse=True)[:4]
                ref = sum(v for _, v in q) if len(q) == 4 and _near(cands[0][1], dict(q[:1])) else last[1]
                return min(cands, key=lambda t: abs(math.log(t[0] / ref)) if t[0] > 0 and ref and ref > 0 else 9)[0]
        if s.asof is None:
            t = s.r.get("ttm", {}).get(k)
            if k == "capex" and s.r.get("t") == "NEE":
                t = s.r.get("ttm", {}).get("icf"); t = [-t[0], t[1]] if t and t[0] is not None else None
            if t and t[0] is not None and last[0] and t[1] > last[0]: return t[0]
            yq = getattr(s, "_yf_q", None)
            if yq:  # 20-F filers: TTM from yfinance quarterlies
                rowmap = {"rev": "Total Revenue", "oi": "Operating Income", "ni": "Net Income Common Stockholders", "gp": "Gross Profit",
                          "pbt": "Pretax Income", "tax": "Tax Provision", "int": "Interest Expense", "da": "Reconciled Depreciation"}
                cmap = {"ocf": "Operating Cash Flow", "capex": "Capital Expenditure", "sbc": "Stock Based Compensation",
                        "div": "Cash Dividends Paid", "bb": "Repurchase Of Capital Stock"}
                src, row = ("qi", rowmap[k]) if k in rowmap else ("qc", cmap[k]) if k in cmap else (None, None)
                ser = (yq.get(src) or {}).get(row) or {} if src else {}
                q = sorted(ser.items(), reverse=True)[:4]
                span = (np.datetime64(q[0][0]) - np.datetime64(q[-1][0])).astype(int) if len(q) == 4 else 0
                if len(q) == 4 and 250 <= span <= 300 and all(v is not None for _, v in q) and q[0][0] > (last[0] or ""):
                    v = sum(v for _, v in q); return abs(v) if k in ("capex", "div", "bb") else v
        return last[1]
    def inst(s, k):
        if s.asof is None:
            v = s.r.get("inst", {}).get(k)
            ia = s.IA.get(k, {})
            if v and s.latest_bs and (np.datetime64(s.latest_bs) - np.datetime64(v[1])).astype(int) > 400: return None  # stale tag
            if v and (not ia or v[1] >= max(ia)): return v[0]
        ia = s.IA.get(k, {})
        return ia[max(ia)] if ia else None
    def inst_at(s, k, e):
        ia = s.IA.get(k, {})
        if not ia: return None
        c = [x for x in ia if abs((np.datetime64(x) - np.datetime64(e)).astype(int)) <= 15]
        return ia[c[0]] if c else None
    def fcf_ann(s, n=None):
        oc = dict(s.ann("ocf")); cx = {} if getattr(s, "reit", False) else dict(s.ann("capex"))
        ys = sorted(oc)
        out = [(e, oc[e] - (cx.get(e) or 0)) for e in ys if e in cx or s.kind != "gen"]
        if not cx and s.kind == "gen": out = [(e, oc[e]) for e in ys]  # no capex tag (asset-light) -> FCF~OCF
        return out[-n:] if n else out
    def debt(s, e=None):
        g = (lambda k: s.inst(k)) if e is None else (lambda k: s.inst_at(k, e))
        return (g("ltd") or 0) + (g("std") or 0)
    def cash(s, e=None):
        g = (lambda k: s.inst(k)) if e is None else (lambda k: s.inst_at(k, e))
        return (g("cash") or 0) + (g("sti") or 0)

def growth_block(c):
    rv = c.ann("rev", 11); m = {}
    if len(rv) >= 2:
        last_e, last_v = rv[-1]
        def back(n):
            if len(rv) > n: return cagr(rv[-1 - n][1], last_v, n)
            return None
        m["rev_cagr5"] = back(5) if len(rv) > 5 else back(len(rv) - 1) if len(rv) >= 4 else None
        m["rev_cagr10"] = back(10) if len(rv) > 10 else back(len(rv) - 1) if len(rv) >= 7 else None
        yoy = [div(rv[i][1], rv[i - 1][1]) for i in range(1, len(rv))]
        yoy = [x - 1 for x in yoy if x is not None]
        m["rev_up_share10"] = sum(1 for x in yoy if x > 0) / len(yoy) if len(yoy) >= 4 else None
        m["rev_worst10"] = min(yoy) if len(yoy) >= 4 else None
        fy_yoy = div(rv[-1][1], rv[-2][1]); fy_yoy = None if fy_yoy is None else fy_yoy - 1
        q_yoy = None
        if c.asof is None:
            q = c.r.get("q", {}).get("rev", [])
            if q and q[-1][0] > rv[-1][0]:
                E = np.datetime64(q[-1][0])
                prev = [v for e, v in q if 350 <= (E - np.datetime64(e)).astype(int) <= 380]
                if prev and prev[0]: q_yoy = q[-1][1] / prev[0] - 1
        m["rev_yoy_ttm"] = mean([fy_yoy, q_yoy])
    return m

def gen_metrics(c, mcap_usd=None):
    m = growth_block(c); fx = c.fx
    rev_t = c.ttm("rev"); oi_t = c.ttm("oi"); ni_t = c.ttm("ni"); gp_t = c.ttm("gp")
    ocf_t = c.ttm("ocf"); cx_t = 0 if c.reit else (c.ttm("capex") or 0); sbc_t = c.ttm("sbc") or 0
    fcf_t = None if ocf_t is None else ocf_t - abs(cx_t)
    m["gm_ttm"] = div(gp_t, rev_t)
    m["om_ttm"] = div(oi_t, rev_t)
    rv = dict(c.ann("rev")); oi = dict(c.ann("oi")); ni = dict(c.ann("ni"))
    om = [(e, div(oi[e], rv[e])) for e in sorted(oi) if e in rv and rv[e]]
    m["om_avg5"] = mean([x for _, x in om[-5:]])
    m["om_trend"] = None if m["om_ttm"] is None or m["om_avg5"] is None else m["om_ttm"] - m["om_avg5"]
    m["om_std10"] = sd([x for _, x in om[-10:]])
    fa = c.fcf_ann()
    fm = [(e, div(v, rv.get(e))) for e, v in fa if rv.get(e)]
    m["fcf_m_ttm"] = div(fcf_t, rev_t)
    m["fcf_m_avg5"] = mean([x for _, x in fm[-5:]])
    m["fcf_pos10"] = (sum(1 for _, v in fa[-10:] if v > 0) / len(fa[-10:])) if len(fa) >= 4 else None
    f5 = [v for _, v in fa[-5:]]; n5 = [ni.get(e) for e, _ in fa[-5:]]
    if len(f5) >= 3 and all(x is not None for x in n5) and sum(n5) > 0: m["fcf_conv5"] = clip(sum(f5) / sum(n5), -1, 2)
    m["fcf_sbc_m"] = div(None if fcf_t is None else fcf_t - abs(sbc_t), rev_t)
    if len(fa) >= 8:
        a = mean([v for _, v in fa[-3:]]); b = mean([v for _, v in fa[-8:-5]])
        sh = dict(c.ann("shs"))
        def ps(rows):
            vals = [div(v, sh.get(e)) for e, v in rows]; return mean(vals) if all(x is not None for x in vals) else None
        pa, pb = ps(fa[-3:]), ps(fa[-8:-5])
        m["fcf_ps_cagr5"] = cagr(pb, pa, 5) if pa and pb else (-0.25 if pa is not None and pb is not None and pa < pb else None)
    m["fcf_worst10"] = min([x for _, x in fm[-10:]]) if len(fm) >= 4 else None
    m["_fcf_pos5"] = sum(1 for _, v in fa[-5:] if v > 0) if len(fa) >= 5 else None
    # balance sheet / war chest
    cash = c.cash(); debt = c.debt(); assets = c.inst("assets"); eq = c.inst("eq"); cl = c.inst("cl"); ca = c.inst("ca")
    da_t = c.ttm("da") or 0; ebitda = None if oi_t is None else oi_t + abs(da_t)
    if mcap_usd: m["netcash_mcap"] = (cash - debt) * fx / mcap_usd
    m["cash_assets"] = div(cash, assets)
    m["nd_ebitda"] = None if not ebitda or ebitda <= 0 else clip((debt - cash) / ebitda, -5, 15)
    if ebitda is not None and ebitda <= 0: m["nd_ebitda"] = 15 if debt > cash else 0
    it = c.ttm("int")
    m["int_cov"] = clip(div(oi_t, abs(it)) if it else (50 if oi_t and oi_t > 0 else None), -10, 50)
    m["current_ratio"] = div(ca, cl)
    liab = c.inst("liab") or (assets - (eq or 0) if assets else None); re_ = c.inst("re")
    if assets and rev_t and oi_t is not None and liab:
        wc = (ca or 0) - (cl or 0)
        z = 1.2 * wc / assets + 1.4 * (re_ or 0) / assets + 3.3 * oi_t / assets + 1.0 * rev_t / assets
        if mcap_usd: z += 0.6 * (mcap_usd / fx) / liab
        m["altman_z"] = clip(z, -5, 15)
    # returns on capital: operating invested capital = assets - cash - (current liabilities - short debt)
    def roic_at(e):
        a = c.inst_at("assets", e); ch = (c.inst_at("cash", e) or 0) + (c.inst_at("sti", e) or 0)
        cl_ = c.inst_at("cl", e); sd_ = c.inst_at("std", e) or 0
        if not a or oi.get(e) is None: return None
        ic = a - ch - max(0, (cl_ or 0) - sd_)
        if ic <= 0: return None
        tx = div(c.val("tax", e), c.val("pbt", e)); tx = 0.21 if tx is None or tx < 0 or tx > 0.4 else tx
        return oi[e] * (1 - tx) / ic
    ro = [(e, roic_at(e)) for e in sorted(oi)[-10:]]; ro = [(e, x) for e, x in ro if x is not None]
    if assets and oi_t is not None:
        ic = assets - cash - max(0, (cl or 0) - (c.inst("std") or 0))
        tx = div(c.ttm("tax"), c.ttm("pbt")); tx = 0.21 if tx is None or tx < 0 or tx > 0.4 else tx
        m["roic_ttm"] = clip(div(oi_t * (1 - tx), ic) if ic and ic > 0 else None, -1, 2)
    m["roic_avg5"] = clip(mean([x for _, x in ro[-5:]]), -1, 2)
    m["roic_min5"] = clip(min([x for _, x in ro[-5:]]) if len(ro) >= 3 else None, -1, 2)
    eqs = [(e, c.inst_at("eq", e)) for e in sorted(ni)[-5:]]
    roe = [div(ni[e], q) for e, q in eqs if q and q > 0]
    m["roe_avg5"] = clip(mean(roe), -1, 2) if len(roe) >= 3 else None
    # capital intensity (lower = lighter)
    cxa = dict(c.ann("capex")); oca = dict(c.ann("ocf"))
    m["capex_rev5"] = mean([div(abs(cxa[e]), rv.get(e)) for e in sorted(cxa)[-5:] if rv.get(e)])
    ratios = [div(abs(cxa[e]), oca.get(e)) for e in sorted(cxa)[-5:] if oca.get(e) and oca.get(e) > 0]
    m["capex_ocf5"] = clip(mean(ratios), 0, 3) if ratios else (3 if cxa else None)
    if c.reit: m["capex_rev5"] = m["capex_ocf5"] = None
    # business model durability
    sh = c.ann("shs")
    if len(sh) >= 6 and sh[-6][1]: m["shs_chg5"] = clip(sh[-1][1] / sh[-6][1] - 1, -0.6, 1.5)
    elif len(sh) >= 3 and sh[0][1]: m["shs_chg5"] = clip((sh[-1][1] / sh[0][1]) ** (5 / (len(sh) - 1)) - 1, -0.6, 1.5)
    m["sbc_rev"] = div(abs(sbc_t), rev_t) if sbc_t else (0.0 if rev_t and c.ann("sbc") == [] and c.asof is None else div(abs(sbc_t), rev_t))
    m["gw_assets"] = div((c.inst("gw") or 0) + (c.inst("intang") or 0), assets)
    # value (needs USD market cap)
    if mcap_usd:
        mc = mcap_usd / fx
        m["fcf_yield"] = div(fcf_t, mc)
        m["fcf_yield_norm5"] = div(mean([v for _, v in fa[-5:]]), mc)
        ev = mc + debt - cash
        m["ebit_ev"] = clip(div(oi_t, ev) if ev > 0 else 0.25, -0.5, 0.5)
        m["earn_yield"] = clip(div(ni_t, mc), -0.5, 0.5)
        sy = (abs(c.ttm("div") or 0) + abs(c.ttm("bb") or 0))
        m["sh_yield"] = clip(div(sy, mc), 0, 0.3)
        m["mcap_usd_b"] = mcap_usd / 1e9; m["ev_usd_b"] = ev * fx / 1e9
    m["_rev_usd_b"] = None if rev_t is None else rev_t * fx / 1e9
    m["_fcf_usd_b"] = None if fcf_t is None else fcf_t * fx / 1e9
    m["_ni_usd_b"] = None if ni_t is None else ni_t * fx / 1e9
    m["_netcash_usd_b"] = (cash - debt) * fx / 1e9
    m["_capex_rev_ttm"] = div(abs(cx_t), rev_t)
    return m

def bank_metrics(c, mcap_usd=None):
    m = growth_block(c); fx = c.fx
    rev_t = c.ttm("rev"); ni_t = c.ttm("ni"); pbt_t = c.ttm("pbt"); nie_t = c.ttm("nonint_exp"); prov_t = c.ttm("prov")
    rv = dict(c.ann("rev")); ni = dict(c.ann("ni")); pbt = dict(c.ann("pbt")); nie = dict(c.ann("nonint_exp")); pv = dict(c.ann("prov"))
    m["eff_ratio"] = div(nie_t, rev_t)
    m["eff_ratio_avg5"] = mean([div(nie[e], rv.get(e)) for e in sorted(nie)[-5:] if rv.get(e)])
    m["pbt_m_ttm"] = div(pbt_t, rev_t)
    m["pbt_m_avg5"] = mean([div(pbt[e], rv.get(e)) for e in sorted(pbt)[-5:] if rv.get(e)])
    assets = c.inst("assets"); eq = c.inst("eq"); pref = c.inst("pref") or 0; gw = c.inst("gw") or 0; it = c.inst("intang") or 0
    tce = None if eq is None else eq - pref - gw - it
    m["roa_ttm"] = div(ni_t, assets)
    m["ni_pos10"] = sum(1 for _, v in c.ann("ni", 10) if v > 0) / max(1, len(c.ann("ni", 10))) if len(c.ann("ni")) >= 4 else None
    nv = c.ann("ni", 6)
    m["ni_cagr5"] = cagr(nv[0][1], nv[-1][1], len(nv) - 1) if len(nv) >= 4 else None
    m["tce_ta"] = div(tce, None if assets is None else assets - gw - it)
    m["aoci_tce"] = clip(div(c.inst("aoci"), tce), -1, 0.5) if c.inst("aoci") is not None else None
    hg, hl = c.inst("htm_gain"), c.inst("htm_lossu")
    m["htm_loss_tce"] = clip(div((hg or 0) - hl, tce), -1, 0.5) if hl is not None and tce else (0.0 if c.asof is None else None)
    m["loans_dep"] = div(c.inst("loans"), c.inst("deposits"))
    m["rotce_ttm"] = clip(div(ni_t, tce) if tce and tce > 0 else None, -1, 1)
    def tce_at(e):
        q = c.inst_at("eq", e)
        if q is None: return None
        return q - (c.inst_at("pref", e) or 0) - (c.inst_at("gw", e) or 0) - (c.inst_at("intang", e) or 0)
    rot = [div(ni[e], tce_at(e)) for e in sorted(ni)[-10:] if tce_at(e) and tce_at(e) > 0]
    m["rotce_avg5"] = clip(mean(rot[-5:]), -1, 1) if len(rot) >= 3 else None
    m["roe_min5"] = clip(min(rot[-5:]), -1, 1) if len(rot) >= 3 else None
    m["roe_worst10"] = clip(min(rot), -1, 1) if len(rot) >= 4 else None
    m["roe_std10"] = sd(rot)
    sh = dict(c.ann("shs"))
    ys = [e for e in sorted(ni) if tce_at(e) and sh.get(e)]
    if len(ys) >= 4:
        a, b = ys[max(0, len(ys) - 6)], ys[-1]
        m["tbvps_cagr5"] = cagr(tce_at(a) / sh[a], tce_at(b) / sh[b], max(1, len(ys[ys.index(a):]) - 1))
    m["prov_rev"] = div(prov_t, rev_t)
    m["prov_rev_avg5"] = mean([div(pv[e], rv.get(e)) for e in sorted(pv)[-5:] if rv.get(e)])
    shl = c.ann("shs")
    if len(shl) >= 6 and shl[-6][1]: m["shs_chg5"] = clip(shl[-1][1] / shl[-6][1] - 1, -0.6, 1.5)
    m["nonint_share"] = div(c.ttm("nonint_inc"), rev_t)
    if mcap_usd:
        mc = mcap_usd / fx
        m["earn_yield"] = clip(div(ni_t, mc), -0.5, 0.5)
        m["p_tbv"] = div(mc, tce) if tce and tce > 0 else None
        m["sh_yield"] = clip(div(abs(c.ttm("div") or 0) + abs(c.ttm("bb") or 0), mc), 0, 0.3)
        m["mcap_usd_b"] = mcap_usd / 1e9
    m["_rev_usd_b"] = None if rev_t is None else rev_t * fx / 1e9
    m["_ni_usd_b"] = None if ni_t is None else ni_t * fx / 1e9
    return m

def ins_metrics(c, mcap_usd=None):
    m = growth_block(c); fx = c.fx
    rev_t = c.ttm("rev"); ni_t = c.ttm("ni"); pbt_t = c.ttm("pbt"); prem_t = c.ttm("prem"); cl_t = c.ttm("claims"); ocf_t = c.ttm("ocf")
    rv = dict(c.ann("rev")); ni = dict(c.ann("ni")); pbt = dict(c.ann("pbt")); pr = dict(c.ann("prem")); cm = dict(c.ann("claims")); oc = dict(c.ann("ocf"))
    pv = c.ann("prem", 6)
    m["prem_cagr5"] = cagr(pv[0][1], pv[-1][1], len(pv) - 1) if len(pv) >= 4 else None
    m["pbt_m_ttm"] = div(pbt_t, rev_t); m["pbt_m_avg5"] = mean([div(pbt[e], rv.get(e)) for e in sorted(pbt)[-5:] if rv.get(e)])
    m["loss_ratio"] = div(cl_t, prem_t); m["loss_ratio_avg5"] = mean([div(cm[e], pr.get(e)) for e in sorted(cm)[-5:] if pr.get(e)])
    m["ocf_rev_ttm"] = div(ocf_t, rev_t); m["ocf_rev_avg5"] = mean([div(oc[e], rv.get(e)) for e in sorted(oc)[-5:] if rv.get(e)])
    m["ocf_pos10"] = sum(1 for _, v in c.ann("ocf", 10) if v > 0) / max(1, len(c.ann("ocf", 10))) if len(c.ann("ocf")) >= 4 else None
    assets = c.inst("assets"); eq = c.inst("eq"); debt = c.debt()
    m["eq_assets"] = div(eq, assets); m["debt_eq"] = div(debt, eq)
    roe = [div(ni[e], c.inst_at("eq", e)) for e in sorted(ni)[-10:] if c.inst_at("eq", e)]
    m["roe_ttm"] = clip(div(ni_t, eq), -1, 1); m["roe_avg5"] = clip(mean(roe[-5:]), -1, 1) if len(roe) >= 3 else None
    m["roe_min5"] = clip(min(roe[-5:]), -1, 1) if len(roe) >= 3 else None
    m["roe_worst10"] = clip(min(roe), -1, 1) if len(roe) >= 4 else None
    m["roe_std10"] = sd(roe)
    sh = dict(c.ann("shs")); ys = [e for e in sorted(ni) if c.inst_at("eq", e) and sh.get(e)]
    if len(ys) >= 4:
        a, b = ys[max(0, len(ys) - 6)], ys[-1]
        m["bvps_cagr5"] = cagr(c.inst_at("eq", a) / sh[a], c.inst_at("eq", b) / sh[b], max(1, len(ys[ys.index(a):]) - 1))
    shl = c.ann("shs")
    if len(shl) >= 6 and shl[-6][1]: m["shs_chg5"] = clip(shl[-1][1] / shl[-6][1] - 1, -0.6, 1.5)
    if mcap_usd:
        mc = mcap_usd / fx
        m["earn_yield"] = clip(div(ni_t, mc), -0.5, 0.5); m["p_b"] = div(mc, eq) if eq and eq > 0 else None
        m["sh_yield"] = clip(div(abs(c.ttm("div") or 0) + abs(c.ttm("bb") or 0), mc), 0, 0.3)
        m["mcap_usd_b"] = mcap_usd / 1e9
    m["_rev_usd_b"] = None if rev_t is None else rev_t * fx / 1e9
    m["_ni_usd_b"] = None if ni_t is None else ni_t * fx / 1e9
    return m

# metric -> (pillar, direction(+1 higher better), horizon)
SPEC = {
 "gen": {
  "rev_cagr5": ("Revenue", 1, "5y"), "rev_cagr10": ("Revenue", 1, "10y"), "rev_yoy_ttm": ("Revenue", 1, "now"),
  "rev_up_share10": ("Revenue", 1, "10y"), "rev_worst10": ("Revenue", 1, "10y"),
  "gm_ttm": ("Margins", 1, "now"), "om_ttm": ("Margins", 1, "now"), "om_avg5": ("Margins", 1, "5y"), "om_trend": ("Margins", 1, "now"),
  "fcf_m_ttm": ("FCF", 1, "now"), "fcf_m_avg5": ("FCF", 1, "5y"), "fcf_pos10": ("FCF", 1, "10y"), "fcf_conv5": ("FCF", 1, "5y"),
  "fcf_sbc_m": ("FCF", 1, "now"), "fcf_ps_cagr5": ("FCF", 1, "5y"),
  "netcash_mcap": ("WarChest", 1, "now"), "cash_assets": ("WarChest", 1, "now"),
  "roic_ttm": ("Capital", 1, "now"), "roic_avg5": ("Capital", 1, "5y"), "roic_min5": ("Capital", 1, "5y"),
  "capex_rev5": ("CapLight", -1, "5y"), "capex_ocf5": ("CapLight", -1, "5y"),
  "om_std10": ("Business", -1, "10y"), "shs_chg5": ("Business", -1, "5y"), "sbc_rev": ("Business", -1, "now"), "gw_assets": ("Business", -1, "now"),
  "fcf_yield": ("Value", 1, "now"), "fcf_yield_norm5": ("Value", 1, "5y"), "ebit_ev": ("Value", 1, "now"), "sh_yield": ("Value", 1, "now"),
  "int_cov": ("Survival", 1, "now"), "nd_ebitda": ("Survival", -1, "now"), "current_ratio": ("Survival", 1, "now"),
  "altman_z": ("Survival", 1, "now"), "fcf_worst10": ("Survival", 1, "10y"),
 },
 "bank": {
  "rev_cagr5": ("Revenue", 1, "5y"), "rev_cagr10": ("Revenue", 1, "10y"), "rev_yoy_ttm": ("Revenue", 1, "now"),
  "rev_up_share10": ("Revenue", 1, "10y"), "rev_worst10": ("Revenue", 1, "10y"),
  "eff_ratio": ("Margins", -1, "now"), "eff_ratio_avg5": ("Margins", -1, "5y"), "pbt_m_ttm": ("Margins", 1, "now"), "pbt_m_avg5": ("Margins", 1, "5y"),
  "roa_ttm": ("FCF", 1, "now"), "ni_pos10": ("FCF", 1, "10y"), "ni_cagr5": ("FCF", 1, "5y"),
  "tce_ta": ("WarChest", 1, "now"), "aoci_tce": ("WarChest", 1, "now"), "htm_loss_tce": ("WarChest", 1, "now"), "loans_dep": ("WarChest", -1, "now"),
  "rotce_ttm": ("Capital", 1, "now"), "rotce_avg5": ("Capital", 1, "5y"), "roe_min5": ("Capital", 1, "5y"), "tbvps_cagr5": ("Capital", 1, "5y"),
  "prov_rev": ("CapLight", -1, "now"), "prov_rev_avg5": ("CapLight", -1, "5y"),
  "roe_std10": ("Business", -1, "10y"), "shs_chg5": ("Business", -1, "5y"), "nonint_share": ("Business", 1, "now"),
  "earn_yield": ("Value", 1, "now"), "p_tbv": ("Value", -1, "now"), "sh_yield": ("Value", 1, "now"),
  "roe_worst10": ("Survival", 1, "10y"),
 },
 "ins": {
  "rev_cagr5": ("Revenue", 1, "5y"), "rev_cagr10": ("Revenue", 1, "10y"), "rev_yoy_ttm": ("Revenue", 1, "now"),
  "rev_up_share10": ("Revenue", 1, "10y"), "prem_cagr5": ("Revenue", 1, "5y"),
  "pbt_m_ttm": ("Margins", 1, "now"), "pbt_m_avg5": ("Margins", 1, "5y"), "loss_ratio": ("Margins", -1, "now"), "loss_ratio_avg5": ("Margins", -1, "5y"),
  "ocf_rev_ttm": ("FCF", 1, "now"), "ocf_rev_avg5": ("FCF", 1, "5y"), "ocf_pos10": ("FCF", 1, "10y"),
  "eq_assets": ("WarChest", 1, "now"),
  "roe_ttm": ("Capital", 1, "now"), "roe_avg5": ("Capital", 1, "5y"), "roe_min5": ("Capital", 1, "5y"), "bvps_cagr5": ("Capital", 1, "5y"),
  "roe_std10": ("Business", -1, "10y"), "shs_chg5": ("Business", -1, "5y"),
  "earn_yield": ("Value", 1, "now"), "p_b": ("Value", -1, "now"), "sh_yield": ("Value", 1, "now"),
  "debt_eq": ("Survival", -1, "now"), "roe_worst10": ("Survival", 1, "10y"),
 },
}
PILLARS = ["Revenue", "Margins", "FCF", "WarChest", "Capital", "CapLight", "Business", "Value", "Survival"]

def metrics(rec, kind, asof=None, mcap_usd=None, fx=1.0, ystm=None, splits=None, ind=None):
    c = Co(rec, kind, asof, ystm, fx, splits)
    c.reit = ind == "REITs"
    f = gen_metrics if kind == "gen" else bank_metrics if kind == "bank" else ins_metrics
    m = f(c, mcap_usd)
    m["_last_fy"] = c.years[-1] if c.years else None
    m["_n_years"] = len(c.years)
    return {k: _f(v) for k, v in m.items()}
