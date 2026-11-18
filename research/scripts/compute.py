"""Own-metrics engine: merges SEC EDGAR (primary), FMP, yfinance; computes quality/strength/allocation/growth/valuation,
classifies business-model archetype (user's 4 diagrams), scores within industry under 5 weighting schemes."""
import json, math, statistics as st, csv, os, sys
R = "/home/user/abcd/research/data"
sec = {f[:-5]: json.load(open(f"{R}/sec/{f}")) for f in os.listdir(f"{R}/sec") if f.endswith(".json") and f[0].isupper() and f not in ("company_tickers.json",)}
fmp = {}
for l in open(f"{R}/companies.jsonl"):
    d = json.loads(l); fmp[d["t"]] = d
mkt = json.load(open(f"{R}/yf/market.json"))
ybs = json.load(open(f"{R}/yf/us_bs.json"))
yff = json.load(open(f"{R}/yf/foreign_fin.json"))
closes = list(csv.reader(open(f"{R}/yf/closes.csv")))
hdr = closes[1] if closes[0][0] == "Price" else closes[0]
# yfinance multiindex csv: row0 'Price', row1 'Ticker', row2 'Date'
tick_row = closes[0] if closes[0][0] == "Date" else closes[1]; data_rows = [r for r in closes[1:] if r and r[0][:2] == "20"]
col = {t: i for i, t in enumerate(tick_row)}
def px_series(t):
    i = col.get(t); 
    if i is None: return []
    return [(r[0], float(r[i])) for r in data_rows if r[i] not in ("", None)]
FX = {"USD": 1.0, "EUR": mkt["EURUSD=X"]["lastPrice"], "DKK": 1 / mkt["DKK=X"]["lastPrice"], "TWD": 1 / mkt["TWD=X"]["lastPrice"]}
B = 1e9
IND = {
 "bank": ("Banks", ["JPM","BAC","WFC","C","GS","MS","USB","PNC","COF"]),
 "oil": ("Oil & Gas", ["XOM","CVX","COP","EOG","OXY","SHEL","TTE","BP"]),
 "semi": ("Semiconductors", ["NVDA","TSM","AVGO","AMD","ASML","MU","INTC","QCOM"]),
 "hyper": ("Hyperscalers / AI Platforms", ["MSFT","AMZN","GOOGL","META","ORCL","AAPL"]),
 "soft": ("Application Software", ["ADBE","CRM","NOW","INTU","SAP","PLTR","WDAY"]),
 "air": ("Airlines", ["DAL","UAL","AAL","LUV","ALK","JBLU"]),
 "pharma": ("Big Pharma", ["LLY","JNJ","ABBV","MRK","PFE","BMY","AMGN","NVO"]),
}
FOREIGN_CCY = {"SHEL":"USD","TTE":"USD","BP":"USD","ASML":"EUR","SAP":"EUR","NVO":"DKK","TSM":"TWD"}
NAMES = {"JPM":"JPMorgan Chase","BAC":"Bank of America","WFC":"Wells Fargo","C":"Citigroup","GS":"Goldman Sachs","MS":"Morgan Stanley","USB":"U.S. Bancorp","PNC":"PNC Financial","COF":"Capital One",
 "XOM":"ExxonMobil","CVX":"Chevron","COP":"ConocoPhillips","EOG":"EOG Resources","OXY":"Occidental","SHEL":"Shell","TTE":"TotalEnergies","BP":"BP",
 "NVDA":"NVIDIA","TSM":"TSMC","AVGO":"Broadcom","AMD":"AMD","ASML":"ASML","MU":"Micron","INTC":"Intel","QCOM":"Qualcomm",
 "MSFT":"Microsoft","AMZN":"Amazon","GOOGL":"Alphabet","META":"Meta","ORCL":"Oracle","AAPL":"Apple",
 "ADBE":"Adobe","CRM":"Salesforce","NOW":"ServiceNow","INTU":"Intuit","SAP":"SAP","PLTR":"Palantir","WDAY":"Workday",
 "DAL":"Delta","UAL":"United","AAL":"American","LUV":"Southwest","ALK":"Alaska Air","JBLU":"JetBlue",
 "LLY":"Eli Lilly","JNJ":"Johnson & Johnson","ABBV":"AbbVie","MRK":"Merck","PFE":"Pfizer","BMY":"Bristol-Myers","AMGN":"Amgen","NVO":"Novo Nordisk"}
def g(d, *ks, default=None):
    for k in ks:
        if d is None: return default
        d = d.get(k) if isinstance(d, dict) else None
    return default if d is None else d
def safe(a, b):
    try:
        if a is None or b in (None, 0): return None
        return a / b
    except Exception: return None
def yq_sum(rec, sect, row, n=4):
    s = g(rec, sect, row)
    if not s: return None
    vals = [v for k, v in sorted(s.items(), reverse=True)][:n]
    if len(vals) < n or any(v is None for v in vals): return None
    return sum(vals)
def yq_yoy(rec, sect, row):
    s = g(rec, sect, row)
    if not s: return None
    v = [x for k, x in sorted(s.items(), reverse=True)]
    if len(v) >= 5 and v[0] is not None and v[4] not in (None, 0): return v[0] / v[4] - 1
    return None
def ret(t, days=None, start=None):
    s = px_series(t)
    if not s: return None
    last = s[-1][1]
    if start:
        base = [p for d, p in s if d >= start]
        return last / base[0] - 1 if base else None
    if len(s) > days: return last / s[-1 - days][1] - 1
    return None

def nonfin(t, ind):
    m = mkt.get(t, {}); px = m.get("lastPrice"); mcap = (m.get("marketCap") or 0) / B
    S = sec.get(t); F = fmp.get(t); Y = ybs.get(t, {}); src = []
    c = {"t": t, "name": NAMES.get(t, t), "ind": ind, "px": px, "mcap": mcap, "hi52": m.get("yearHigh"), "lo52": m.get("yearLow")}
    fx = FX[FOREIGN_CCY.get(t, "USD")]
    T = {}; A = {}
    if t in FOREIGN_CCY and t != "TSM":
        Fr = yff[t]; src.append("yfinance(statements)")
        for k, row, sect in [("rev","Total Revenue","qi"),("oi","Operating Income","qi"),("ni","Net Income","qi"),("ocf","Operating Cash Flow","qc"),("capex","Capital Expenditure","qc"),("sbc","Stock Based Compensation","qc"),("bb","Repurchase Of Capital Stock","qc"),("div","Cash Dividends Paid","qc"),("da","Reconciled Depreciation","qi"),("int","Interest Expense","qi")]:
            v = yq_sum(Fr, sect, row)
            if v is None and k == "div": v = yq_sum(Fr, sect, "Common Stock Dividend Paid")
            T[k] = None if v is None else abs(v) * fx / B if k in ("capex","bb","div") else (v * fx / B)
        for k, row, sect in [("rev","Total Revenue","ai"),("oi","Operating Income","ai"),("ni","Net Income","ai"),("ocf","Operating Cash Flow","ac"),("capex","Capital Expenditure","ac"),("sbc","Stock Based Compensation","ac")]:
            s = g(Fr, sect, row) or {}
            A[k] = [(d, (abs(v) if k == "capex" else v) * fx / B) for d, v in sorted(s.items()) if v is not None]
        bs = g(Fr, "qb") or {}
        def lastv(row):
            s = bs.get(row) or {}
            return list(s.values())[0] if s else None
        c["debt"] = (lastv("Total Debt") or 0) * fx / B; c["cash"] = (lastv("Cash Cash Equivalents And Short Term Investments") or lastv("Cash And Cash Equivalents") or 0) * fx / B
        c["eq"] = (lastv("Stockholders Equity") or 0) * fx / B; c["gw"] = (lastv("Goodwill And Other Intangible Assets") or 0) * fx / B
        c["rev_yoy_q"] = yq_yoy(Fr, "qi", "Total Revenue")
        c["shs_ann"] = [v for d, v in sorted((g(Fr, "ai", "Diluted Average Shares") or {}).items()) if v]
    elif t == "TSM":
        src.append("FMP(TWD)")
        q = F["q"]
        for k in ["rev","oi","ni","ocf","capex","div","bb","da","sbc"]:
            T[k] = sum(q[k]) * fx if k in q else None
        T["int"] = None
        for k in ["rev","oi","ni","ocf","capex","sbc"]:
            A[k] = [(str(y), v * fx) for y, v in zip(F["yrs"], F[k])]
        c["debt"] = F["bs"]["debt"] * fx; c["cash"] = F["bs"]["cash"] * fx; c["eq"] = F["bs"]["eq"] * fx; c["gw"] = F["bs"]["gw"] * fx
        c["rev_yoy_q"] = 1494.243 / 989.918 - 1  # Q3-26 vs Q3-25 (TWD bn, Q3-25 from TSMC report)
        c["shs_ann"] = F["shs"]
    else:
        src.append("SEC EDGAR XBRL")
        for k in ["rev","gp","oi","ni","ocf","capex","sbc","div","bb","da","int","acq","pbt","tax"]:
            v = g(S, "ttm", k); T[k] = None if v is None else v / B
        for k in ["rev","oi","ni","ocf","capex","sbc","div","bb","acq","da","shs","pbt","int"]:
            A[k] = [(d, v / (B if k != "shs" else 1)) for d, v in g(S, "ann", k, default=[])]
        oi_a = dict(A.get("oi", [])); pb = dict(A.get("pbt", [])); ia = dict(A.get("int", []))
        if len(oi_a) < 3 and len(pb) >= 3:
            A["oi"] = [(d, pb[d] + abs(ia.get(d, 0))) for d in sorted(pb)]; src.append("EBIT=PBT+int (no OpInc tag)")
        # fill gaps from yfinance quarterly (e.g. LLY capex/oi)
        for k, row, sect in [("capex","Capital Expenditure","qc"),("oi","Operating Income","qi"),("da","Depreciation And Amortization","qc"),("sbc","Stock Based Compensation","qc")]:
            if T.get(k) in (None, 0):
                v = yq_sum(Y, sect, row)
                if v is not None: T[k] = abs(v) / B if k == "capex" else v / B; src.append(f"yf:{k}")
        c["debt"] = (Y.get("Total Debt") or 0) / B; c["cash"] = (Y.get("Cash Cash Equivalents And Short Term Investments") or Y.get("Cash And Cash Equivalents") or 0) / B
        c["eq"] = (Y.get("Stockholders Equity") or g(S, "inst", "eq") or 0) / B; c["gw"] = (Y.get("Goodwill And Other Intangible Assets") or 0) / B
        c["rev_yoy_q"] = yq_yoy(Y, "qi", "Total Revenue")
        c["shs_ann"] = [v for d, v in A.get("shs", [])]
        if t == "NVDA" and F:  # FMP has Oct-26 quarter (SEC companyfacts lagging)
            q = F["q"]; src.append("FMP(Oct-26 qtr)")
            for k in ["rev","oi","ni","ocf","capex","sbc","div","bb","da"]: T[k] = sum(q[k])
            c["debt"] = F["bs"]["debt"]; c["cash"] = F["bs"]["cash"]; c["eq"] = F["bs"]["eq"]; c["gw"] = F["bs"]["gw"]
            c["rev_yoy_q"] = 115.844 / 57.006 - 1
        if t == "MSFT" and F: c["debt"] = F["bs"]["debt"]; src.append("FMP debt incl finance leases")
    if t == "NVO":  # Q1-26 revenue DKK 96.8B is a ~DKK 17B outlier vs ~79B run-rate (one-off); normalize
        adj = 17.0 * FX["DKK"]
        T["rev"] -= adj; T["oi"] = (T.get("oi") or 0) - adj; T["ni"] = (T.get("ni") or 0) - adj * 0.78; src.append("NVO Q1-26 one-off (~DKK17B) removed")
    c["src"] = src; c["ttm"] = T; c["ann"] = A
    if T.get("oi") in (None,) and T.get("pbt") is not None: T["oi"] = T["pbt"] + abs(T.get("int") or 0)
    rev = T.get("rev"); ni = T.get("ni"); ocf = T.get("ocf"); capex = abs(T.get("capex") or 0); sbc = T.get("sbc") or 0; da = T.get("da") or 0; oi = T.get("oi")
    fcf = None if ocf is None else ocf - capex
    c.update({"rev": rev, "ni": ni, "ocf": ocf, "capex": capex, "fcf": fcf, "sbc": sbc, "da": da, "oi": oi})
    c["om"] = safe(oi, rev); c["nm"] = safe(ni, rev); c["fcf_m"] = safe(fcf, rev); c["sbc_rev"] = safe(sbc, rev)
    c["capex_ocf"] = safe(capex, ocf); c["fcf_ni"] = safe(fcf, ni) if (ni or 0) > 0 else None
    c["oe_strict"] = None if fcf is None else fcf - sbc
    c["oe_maint"] = None if ocf is None else ocf - min(capex, da if da > 0 else capex) - sbc
    nd = (c.get("debt") or 0) - (c.get("cash") or 0); c["net_debt"] = nd
    c["ev"] = mcap + nd
    ebitda = (oi or 0) + da; c["ebitda"] = ebitda
    c["nd_ebitda"] = safe(nd, ebitda) if ebitda > 0 else (99 if nd > 0 else -1)
    intexp = T.get("int"); c["int_cov"] = safe(oi, abs(intexp)) if intexp else None
    ic = (c.get("eq") or 0) + (c.get("debt") or 0) - (c.get("cash") or 0)
    tax_rate = 0.21
    if T.get("tax") and T.get("pbt") and T["pbt"] > 0: tax_rate = min(max(T["tax"] / T["pbt"], 0.08), 0.30)
    nopat = (oi or 0) * (1 - tax_rate)
    if ic > 0: c["roic"] = min(nopat / ic, 1.5)
    else: c["roic"] = 1.5 if nopat > 0 else None
    c["roic_flag"] = "IC<=0 (cash > capital) capped" if ic <= 0 else ("capped" if c["roic"] == 1.5 else "")
    # 5y history
    A20 = {k: [(d, v) for d, v in vals if d < "2021-06-01"] for k, vals in A.items()}
    c["y2020"] = {k: (v[-1][1] if v else None) for k, v in A20.items() if k in ("rev","oi","ni","ocf","capex")}
    A = {k: [(d, v) for d, v in vals if d >= "2021-06-01"] for k, vals in A.items()}
    def avg_margin(k):
        r = dict(A.get("rev", [])); v = dict(A.get(k, []))
        ms = [v[d] / r[d] for d in v if d in r and r[d]]
        return (st.mean(ms), st.pstdev(ms)) if len(ms) >= 3 else (None, None)
    c["om5"], c["om5_sd"] = avg_margin("oi")
    r_ann = dict(A.get("rev", [])); o_ann = dict(A.get("ocf", [])); k_ann = dict(A.get("capex", []))
    fcf_hist = [(d, o_ann[d] - abs(k_ann.get(d, 0))) for d in sorted(o_ann) if d in k_ann]
    c["fcf_hist"] = fcf_hist
    fm = [f / r_ann[d] for d, f in fcf_hist if r_ann.get(d)]
    c["fcf_m5"] = st.mean(fm) if len(fm) >= 3 else None
    c["fcf_m_min"] = min(fm) if fm else None
    c["fcf_neg_yrs"] = sum(1 for d, f in fcf_hist if f < 0)
    revs = [v for d, v in sorted(A.get("rev", []))]
    if len(revs) >= 4 and revs[0] > 0 and rev:
        yrs = len(revs) - 1 + 0.75
        c["rev_cagr"] = (rev / revs[0]) ** (1 / yrs) - 1
    else: c["rev_cagr"] = None
    shs = list(c.get("shs_ann") or [])
    for i in range(len(shs) - 1, 0, -1):  # walk backwards, scale older pre-split values
        r = shs[i] / shs[i - 1] if shs[i - 1] else 1
        for fct in (2, 3, 4, 5, 10, 20):
            if abs(r / fct - 1) < 0.25:
                shs[:i] = [x * fct for x in shs[:i]]; break
            if abs(r * fct - 1) < 0.25:
                shs[:i] = [x / fct for x in shs[:i]]; break
    c["shs_cagr"] = (shs[-1] / shs[0]) ** (1 / (len(shs) - 1)) - 1 if len(shs) >= 3 and shs[0] else None
    # capital allocation over history (sum of annual flows)
    def tot(k): return sum(abs(v) for d, v in A.get(k, []))
    o5 = tot("ocf"); c["alloc"] = {k: safe(tot(k), o5) for k in ["capex","div","bb","acq"]} if o5 else {}
    # valuation
    c["pe"] = safe(mcap, ni) if (ni or 0) > 0 else None
    norm_ni = (c["om5"] or 0) * 0.79 * rev if (c["om5"] and rev) else None
    c["pe_norm"] = safe(mcap, norm_ni) if norm_ni and norm_ni > 0 else None
    c["fcf_y"] = safe(fcf, mcap); c["oe_y_strict"] = safe(c["oe_strict"], mcap); c["oe_y_maint"] = safe(c["oe_maint"], mcap)
    c["ev_ebit"] = safe(c["ev"], oi) if (oi or 0) > 0 else None
    norm_fcf = (c["fcf_m5"] or 0) * rev if (c["fcf_m5"] is not None and rev) else None
    c["fcf_y_norm"] = safe(norm_fcf, mcap)
    c["div_cov"] = safe(fcf, abs(T.get("div") or 0)) if T.get("div") else None
    c["payout_fcf"] = safe(abs(T.get("div") or 0) + abs(T.get("bb") or 0), fcf) if (fcf or 0) > 0 else None
    c["ret_1y"] = ret(t, 252); c["ret_ytd"] = ret(t, start="2026-01-02")
    c["dd_hi"] = safe(px, c["hi52"]) - 1 if px and c["hi52"] else None
    return c

def bank(t):
    m = mkt.get(t, {}); S = sec[t]; F = fmp.get(t)
    c = {"t": t, "name": NAMES[t], "ind": "bank", "px": m.get("lastPrice"), "mcap": (m.get("marketCap") or 0) / B, "hi52": m.get("yearHigh"), "lo52": m.get("yearLow"), "src": ["SEC EDGAR XBRL"]}
    T = {k: (g(S, "ttm", k) or 0) / B for k in ["rev","nii","prov","nonint_exp","ni","ni_common","div","bb"]}
    I = {k: (g(S, "inst", k) or 0) / B for k in ["eq","pref","gw","intang","deposits","loans","aoci","assets"]}
    shs_out = (g(S, "inst", "shs_out") or 0) / B
    if t == "C":  # SEC 2026 10-Q facts not in companyfacts -> FMP
        q = F["q"]; T.update({"rev": sum(q["net_rev"]), "nii": sum(q["nii"]), "ni": sum(q["ni"]), "ni_common": sum(q["ni_common"])})
        I.update({"eq": F["bs"]["eq"], "pref": F["bs"]["pref"], "gw": F["bs"]["gw"], "intang": 0, "aoci": F["bs"]["aoci"]}); c["src"].append("FMP(2026 qtrs)")
        T["nonint_exp"] = 13.98 + 13.68 + 14.32 + 13.95  # FMP opex+other (approx)
    if t == "BAC": I["pref"] = 24.996; c["src"].append("FMP pref")
    if t == "JPM": I["pref"] = 21.04; c["src"].append("FMP pref")
    if t == "PNC": I["pref"] = 6.0; c["src"].append("pref est.")
    if t == "COF": I["pref"] = 4.8; c["src"].append("pref est.")
    tbv = I["eq"] - I["pref"] - I["gw"] - I["intang"]
    H = json.load(open(f"{R}/sec/bank_htm.json")).get(t, {})
    htm = (H.get("htm_loss") or 0) / B; c["htm_loss"] = htm; c["htm_loss_tbv"] = htm / tbv if tbv else None
    c["etbv"] = tbv - htm * 0.76; c["p_etbv"] = (c["mcap"] / c["etbv"]) if c["etbv"] > 0 else None
    c.update(T); c.update({k: I[k] for k in I}); c["tbv"] = tbv
    nic = T["ni_common"] or T["ni"]
    c["rotce"] = safe(nic, tbv); c["ptbv"] = safe(c["mcap"], tbv); c["pe"] = safe(c["mcap"], nic)
    c["eff"] = safe(T["nonint_exp"], T["rev"]); c["prov_rev"] = safe(T["prov"], T["rev"]); c["nii_share"] = safe(T["nii"], T["rev"])
    c["ld"] = safe(I["loans"], I["deposits"]); c["aoci_tbv"] = safe(I["aoci"], tbv)
    c["ppnr"] = T["rev"] - T["nonint_exp"]; c["ppnr_assets"] = safe(c["ppnr"], I["assets"]) if I["assets"] else None
    c["payout"] = safe(abs(T["div"]) + abs(T["bb"]), nic)
    shs = [v for d, v in g(S, "ann", "shs", default=[])]
    c["shs_cagr"] = (shs[-1] / shs[0]) ** (1 / (len(shs) - 1)) - 1 if len(shs) >= 3 else None
    ni_hist = g(S, "ann", "ni", default=[]); c["ni_hist"] = [(d, v / B) for d, v in ni_hist]
    nis = [v for d, v in ni_hist]
    c["ni_cv"] = (st.pstdev(nis) / st.mean(nis)) if len(nis) >= 3 and st.mean(nis) > 0 else None
    c["earn_yield"] = safe(nic, c["mcap"])
    c["ret_1y"] = ret(t, 252); c["ret_ytd"] = ret(t, start="2026-01-02")
    c["dd_hi"] = safe(c["px"], c["hi52"]) - 1 if c["px"] and c["hi52"] else None
    c["cet1"] = {"JPM": 13.9, "WFC": 10.0, "C": 12.8}.get(t)
    return c

def archetype(c):
    """Map to the user's 4 business-model diagrams using 5-yr capital allocation + balance sheet."""
    a = c.get("alloc") or {}; capex = a.get("capex") or 0; div = a.get("div") or 0; bb = a.get("bb") or 0
    capex_ttm = c.get("capex_ocf") or 0; nd = c.get("net_debt") or 0
    if capex >= 0.5 or capex_ttm >= 0.6: return "B", "Capital-intensive cycle (img 5)"
    if div >= 0.45 and bb < 0.35: return "C", "Cash cow / dividend (img 6)"
    if nd < 0 and div + bb < 0.5: return "A", "War chest / retained capital (img 4)"
    return "D", "Hybrid: reinvest + distribute (img 7)"

companies = {}
for ind, (nm, ts) in IND.items():
    for t in ts:
        try:
            c = bank(t) if ind == "bank" else nonfin(t, ind)
            if ind != "bank": c["arch"], c["arch_label"] = archetype(c)
            else: c["arch"], c["arch_label"] = ("D", "Hybrid: retain capital + distribute (img 7)")
            companies[t] = c
        except Exception as e:
            print("ERR", t, repr(e))
json.dump(companies, open(f"{R}/metrics.json", "w"), default=float)
def f(v, p=1, pct=False):
    if v is None: return "  -  "
    return f"{v*100:.{p}f}%" if pct else f"{v:.{p}f}"
for ind, (nm, ts) in IND.items():
    print(f"\n== {nm} ==")
    for t in ts:
        c = companies.get(t)
        if not c: continue
        if ind == "bank":
            print(f"{t:5} mcap {c['mcap']:7.0f} ROTCE {f(c['rotce'],1,1):>6} P/TBV {f(c['ptbv'],2):>5} P/E {f(c['pe'],1):>5} eff {f(c['eff'],0,1):>4} prov/rev {f(c['prov_rev'],1,1):>5} AOCI/TBV {f(c['aoci_tbv'],0,1):>5} payout {f(c['payout'],0,1):>5} shsCAGR {f(c['shs_cagr'],1,1):>6} 1y {f(c['ret_1y'],0,1):>5}")
        else:
            print(f"{t:5} mcap {c['mcap']:6.0f} rev {f(c['rev'],1):>6} yoyQ {f(c['rev_yoy_q'],0,1):>5} OM {f(c['om'],0,1):>4} OM5 {f(c['om5'],0,1):>4} FCFm {f(c['fcf_m'],0,1):>5} ROIC {f(c['roic'],0,1):>5} ND/EBITDA {f(c['nd_ebitda'],1):>5} PE {f(c['pe'],1):>5} PEn {f(c['pe_norm'],1):>5} FCFy {f(c['fcf_y'],1,1):>5} OEys {f(c['oe_y_strict'],1,1):>5} OEym {f(c['oe_y_maint'],1,1):>5} shs {f(c['shs_cagr'],1,1):>5} arch {c['arch']} 1y {f(c['ret_1y'],0,1):>5}")
