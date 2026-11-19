#!/usr/bin/env python3
"""Ground 5 (Many-Weathers) segment analysis.
Reads data/g5seg/TICKER.json (all single-segment-axis facts of the last 6 10-Ks, per filing) and computes, per company:
  - year x segment revenue (and segment profit) tables, each year shown on the newest filing's basis
  - segment YoY revenue growth, where every year-pair (t-1, t) is read from ONE filing (the newest that reports both years),
    so recast segment reorganizations never create fake growth
  - pairwise correlation of segment revenue growth (and of segment profit $ changes), diversification ratio,
    worst total-revenue year, worst total segment-profit year, weak-segment share
Writes data/g5seg/results.json.  Config per ticker below (tag choices, renamed/merged segments, segments to drop)."""
import json, re, os, sys, itertools, collections, math
import numpy as np, pandas as pd

ROOT = "/home/user/abcd/company_hunt"
D = f"{ROOT}/data/g5seg"

EXCL = re.compile(r"^corporate(nonsegment\w*|segment\w*|andother\w*|other\w*|andelimination\w*|andreconcil\w*|activities\w*|items\w*|andunallocated\w*|expense\w*|functions\w*|andsupport\w*)?$|elimination|intersegment|reconcil|unallocated|consolidat|nonsegment|totalsegment|segmenttotal|^operatingsegments?$|^segments?$|^reportablesegments?$|^totaloptum$|adjustment|^allother|^allothersegments$|^other(segment)?s?$|headquarters|^corporate$", re.I)

REV_DEFAULT = ["us-gaap:RevenuesNetOfInterestExpense", "us-gaap:Revenues", "us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
               "us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax", "us-gaap:SalesRevenueNet"]
PRF_DEFAULT = ["us-gaap:OperatingIncomeLoss", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
               "us-gaap:NetIncomeLoss"]

# alias: normalized member -> canonical segment (members mapped to the same canonical are SUMMED within a filing)
# drop: normalized members to ignore; rev/prf: tag priority lists (a "+" joins tags that are added, e.g. NII + non-interest income)
CFG = {
 "JPM": dict(prf=["us-gaap:NetIncomeLoss"], alias={"corporateinvestmentbank": "cib", "corporateandinvestmentbank": "cib", "commercialbanking": "cib", "commercialandinvestmentbank": "cib"}, fin=1),
 "BAC": dict(rev=["bac:RevenuesNetOfInterestExpenseFullTaxEquivalentBasis"], prf=["us-gaap:NetIncomeLoss"], fin=1),
 "WFC": dict(prf=["us-gaap:NetIncomeLoss"], fin=1),
 "C":   dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest"],
             drop=["citicorpsegmentandcorporateandother", "legacyfranchises"], fin=1),
 "GS":  dict(prf=["us-gaap:NetIncomeLoss"], fin=1),
 "MS":  dict(prf=["us-gaap:NetIncomeLoss"], fin=1),
 "PNC": dict(rev=["us-gaap:Revenues", "us-gaap:InterestIncomeExpenseNet+us-gaap:NoninterestIncome"], prf=["us-gaap:NetIncomeLoss", "us-gaap:IncomeLossFromContinuingOperations"], alias={"retailbanking1": "retailbanking"}, fin=1),
 "BNY": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], fin=1),
 "SCHW": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], fin=1),
 "RJF": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], alias={"rjbank": "bank"}, fin=1),
 "AMP": dict(rev=["us-gaap:Revenues"], prf=["amp:SegmentReportingInformationOperatingEarnings", "amp:AdjustedOperatingEarnings", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
             alias={"retirementprotectionsolutions": "retirementandprotectionsolutions"}, fin=1),
 "ICE": dict(), "MCO": dict(prf=["mco:AdjustedOperatingIncome", "us-gaap:OperatingIncomeLoss"]),
 "SPGI": dict(alias={"commodityinsights": "energy", "platts": "energy"}, drop=["engineeringsolutions"]),
 "MSCI": dict(prf=["msci:OperatingSegmentProfitability"], alias={"esgandclimate": "sustainabilityandclimate", "allotherprivateassets": "privateassets"}),
 "FDS": dict(), "BRK-B": dict(rev=["us-gaap:Revenues"], drop=["insurancecorporateandother"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "us-gaap:OperatingIncomeLoss"], fin=1),
 "HIG": dict(rev=["us-gaap:Revenues", "hig:Earnedpremiumsandfeeincome"], prf=["us-gaap:NetIncomeLoss"], alias={"groupbenefits": "employeebenefits", "pccommerciallines": "pcbusinessinsurance", "pcpersonallines": "pcpersonalinsurance"}, drop=["propertycasualtyotheroperations"], fin=1),
 "MET": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:OperatingIncomeLoss", "met:AdjustedEarnings"], fin=1),
 "AFL": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:OperatingIncomeLoss"], fin=1),
 "CB":  dict(rev=["us-gaap:PremiumsEarnedNet"], prf=["cb:SegmentUnderwritingIncomeLossandNetInvestmentIncomeLoss", "us-gaap:UnderwritingIncomeLoss"],
             alias={"segmentinsurancenorthamericanpersonalpcmember": "napersonal", "segmentinsurancenorthamericanpersonalpc": "napersonal", "segmentnorthamericacommercialpcinsurance": "nacommercial", "segmentinsurancenorthamericancommercialpc": "nacommercial"}, fin=1),
 "TRV": dict(rev=["us-gaap:RevenuesExcludingRealizedGainLoss", "us-gaap:PremiumsEarnedNet"], prf=["trv:SegmentIncomeLoss", "us-gaap:NetIncomeLoss"], fin=1),
 "ALL": dict(rev=["us-gaap:Revenues"], prf=["all:AdjustedNetIncome", "us-gaap:NetIncomeLoss"], alias={"allstateannuities": "lifeandannuities", "allstatelife": "lifeandannuities", "allstatebenefits": "allstatehealthandbenefits"}, fin=1),
 "PGR": dict(rev=["us-gaap:SupplementaryInsuranceInformationPremiumRevenue"], prf=["pgr:PretaxProfitLoss", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
             alias={"property": "personallines"}, drop=["otherindemnity"], fin=1),
 "MRSH": dict(), "AJG": dict(prf=["us-gaap:NetIncomeLoss"], fin=1), "BRO": dict(alias={"nationalprograms": "programs", "retail": "retail", "wholesalebrokerage": "specialtydistribution"}, drop=["services"], fin=1),
 "GL":  dict(rev=["gl:SegmentRevenuesExcludingRealizedInvestmentGainsLosses"], prf=["gl:SegmentProfitLoss", "us-gaap:GrossProfit"], drop=["annuity"], fin=1),
 "L":   dict(rev=["us-gaap:Revenues"], prf=["us-gaap:NetIncomeLoss"], drop=["diamondoffshoredrillinginc"], fin=1),
 "MKL": dict(rev=["us-gaap:Revenues"], prf=["mkl:SegmentProfitLoss"], fin=1),
 "HON": dict(prf=["hon:SegmentReportingSegmentProfitLoss", "us-gaap:OperatingIncomeLoss"]),
 "ITW": dict(), "DOV": dict(alias={"fuelingsolutions": "cleanenergyfueling", "refrigerationandfoodequipment": "climatesustainabilitytechnologies"}),
 "TXT": dict(drop=["finance", "textroneaviation"]), "GD": dict(), "RTX": dict(alias={"collinsaerospacesystems": "collinsaerospace", "raytheonintelligencespace": "raytheon", "raytheonmissilesdefense": "raytheon"}),
 "ETN": dict(), "AME": dict(),
 "JNJ": dict(alias={"medicaldevices": "medtech", "pharmaceutical": "innovativemedicine"}),
 "ABT": dict(), "TMO": dict(alias={"laboratoryproductsandservices": "laboratoryproductsandbiopharmaservices"}),
 "DHR": dict(), "UNH": dict(), "CVS": dict(rev=["us-gaap:Revenues"], prf=["cvs:AdjustedOperatingIncomeLoss", "us-gaap:OperatingIncomeLoss"]),
 "CI":  dict(rev=["ci:SegmentRevenues", "us-gaap:Revenues"], prf=["ci:PreTaxAdjustedIncomeFromOperations", "ci:SegmentPreTaxAdjustedIncomeFromOperations", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], drop=["otheroperations", "groupdisabilityandother", "internationalmarkets"]),
 "PEP": dict(rev=["us-gaap:Revenues"]), "WMT": dict(alias={"samsclub": "samsclubus"}), "DIS": dict(drop=["contentlicense", "contentlicensesegmentadjustment"]),
 "MSFT": dict(), "GOOGL": dict(), "AMZN": dict(), "IBM": dict(rev=["us-gaap:Revenues"], drop=["financing", "globalfinancing"]), "ADP": dict(),
 "ADBE": dict(prf=["us-gaap:GrossProfit"]), "ACN": dict(), "CTSH": dict(alias={"communicationmediaandtechnology": "communicationsmediaandtechnology", "healthcare": "healthsciences"}),
 "INTU": dict(alias={"creditkarmainc": "creditkarma", "proconnect": "protax", "smallbusinessselfemployed": "globalbusinesssolutions"}),
 "BR": dict(prf=["br:EarningsBeforeIncomeTaxes", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "us-gaap:OperatingIncomeLoss"]),
 "JKHY": dict(prf=["us-gaap:GrossProfit"], drop=["corporateservices"]), "FISV": dict(alias={"firstdata": "merchant", "acceptance": "merchant", "merchantsolutions": "merchant", "fintech": "financial", "financialinstitutionservices": "financial", "financialsolutions": "financial", "paymentsandindustryproducts": "payments"}),
 "FICO": dict(), "IDXX": dict(alias={"cag": "companionanimalgroup", "lpd": "livestockandpoultrydiagnostics"}), "IQV": dict(prf=["us-gaap:GrossProfit"]),
 "UHS": dict(), "RMD": dict(alias={"devicesandmasks": "sleepandbreathinghealth", "sleepandrespiratory": "sleepandbreathinghealth", "softwareasaservice": "residentialcaresoftware", "softwareasservice": "residentialcaresoftware"}, drop=["softwareasservicebeforedeferredrevenueadjustment"]),
 "MKC": dict(), "COST": dict(), "CMCSA": dict(prf=["cmcsa:AdjustedEBITDA"], drop=["nbcuniversalsegments", "cablecommunicationssegments", "skylimitedsegments"]),
 "LULU": dict(), "DPZ": dict(prf=["dpz:SegmentIncomeLoss"]),
}

def norm(m):
    m = m.split("|")[-1]
    m = re.sub(r"(Member)+$", "", m)
    m = re.sub(r"Segments?$", "", m)
    m = re.sub(r"^Segment", "", m)
    return re.sub(r"[^a-z0-9]", "", m.lower())

def fy_label(end):
    y, mth = int(end[:4]), int(end[5:7])
    return y - 1 if mth <= 2 else y

def per_filing(facts_all, tags, cfg):
    """-> {filed_date: (url, tag_used, {canon: {fy: value}})} using the first tag (expr) that gives >=2 kept segments."""
    alias, drop = cfg.get("alias", {}), set(cfg.get("drop", []))
    byf = collections.defaultdict(list)
    for tag, seg, end, v, src, filed in facts_all:
        byf[(filed, src)].append((tag, seg, end, v))
    out = {}
    for (filed, src), rows in byf.items():
        for expr in tags:
            parts = expr.split("+")
            vals = collections.defaultdict(dict)   # (normkey) -> fy -> {part: v}
            for tag, seg, end, v in rows:
                if tag in parts:
                    k = norm(seg)
                    if EXCL.search(k) and k not in alias: continue
                    if k in drop: continue
                    vals[(k, fy_label(end))].setdefault(tag, v)
            segs = collections.defaultdict(dict)
            for (k, fy), pv in vals.items():
                if len(pv) < len(parts): continue
                c = alias.get(k, k)
                segs[c][fy] = segs[c].get(fy, 0.0) + sum(pv.values())
            if len(segs) >= 2:
                out[filed] = (src, expr, {c: dict(v) for c, v in segs.items()})
                break
    return out

def build(pf):
    """levels on newest basis per year; growth per pair from the newest filing reporting both years."""
    filings = sorted(pf.keys())
    years = sorted({fy for f in filings for s in pf[f][2].values() for fy in s})
    level, lvl_src = {}, {}
    for y in years:
        for f in reversed(filings):
            segs = pf[f][2]
            if sum(1 for s in segs.values() if y in s) >= 2:
                level[y] = {c: s[y] for c, s in segs.items() if y in s}; lvl_src[y] = pf[f][0]; break
    growth, totg, dlev, srcs, prior = {}, {}, {}, {}, {}
    for y0, y1 in zip(years, years[1:]):
        if y1 - y0 != 1: continue
        for f in reversed(filings):
            segs = pf[f][2]
            both = {c: (s[y0], s[y1]) for c, s in segs.items() if y0 in s and y1 in s}
            if len(both) >= 2:
                growth[y1] = {c: (b / a - 1) if a > 0 else np.nan for c, (a, b) in both.items()}
                dlev[y1] = {c: b - a for c, (a, b) in both.items()}
                prior[y1] = {c: a for c, (a, b) in both.items()}
                s0, s1 = sum(a for a, b in both.values()), sum(b for a, b in both.values())
                totg[y1] = s1 / s0 - 1 if s0 > 0 else np.nan
                srcs[y1] = pf[f][0]; break
    return years, level, lvl_src, growth, totg, dlev, prior, srcs

def corr_stats(growth, min_obs=4):
    df = pd.DataFrame(growth).T.sort_index()
    cs = []
    for a, b in itertools.combinations(df.columns, 2):
        x = df[[a, b]].dropna()
        if len(x) >= min_obs and x[a].std() > 0 and x[b].std() > 0:
            cs.append((a, b, float(x[a].corr(x[b])), len(x)))
    return df, cs

def analyze(t):
    d = json.load(open(f"{D}/{t}.json"))
    cfg = CFG.get(t, {})
    fa = d.get("facts_all", [])
    res = dict(ticker=t, docs=d["docs"])
    rp = per_filing(fa, cfg.get("rev", REV_DEFAULT), cfg)
    pp = per_filing(fa, cfg.get("prf", PRF_DEFAULT), cfg)
    if not rp:
        res["status"] = "no_segments"; return res
    years, level, lsrc, growth, totg, dlev, prior, gsrc = build(rp)
    res.update(rev_tags=sorted({v[1] for v in rp.values()}), years=years, level=level, growth=growth, totg=totg)
    gdf, cs = corr_stats(growth)
    res["pairs"] = cs
    # size-weighted mean of pairwise correlations (weights = product of average shares)
    lv = pd.DataFrame(level).T
    share = (lv.div(lv.sum(axis=1), axis=0)).mean()
    res["avg_share"] = share.to_dict()
    if cs:
        res["mean_corr"] = float(np.mean([c for _, _, c, _ in cs]))
        w = [share.get(a, 0) * share.get(b, 0) for a, b, _, _ in cs]
        res["wmean_corr"] = float(np.average([c for _, _, c, _ in cs], weights=w)) if sum(w) > 0 else np.nan
    else:
        res["mean_corr"] = res["wmean_corr"] = np.nan
    # diversification ratio: sd(total seg growth) / sum(w_i * sd(g_i)) over years with growth for the big segments
    tg = pd.Series(totg).dropna()
    sds = gdf.std()
    denom = sum(share.get(c, 0) * sds.get(c, np.nan) for c in gdf.columns if not np.isnan(sds.get(c, np.nan)))
    res["div_ratio"] = float(tg.std() / denom) if len(tg) >= 3 and denom and denom > 0 else np.nan
    res["n_obs"] = int(len(tg))
    # worst total year and weak segment
    if len(tg):
        wy = int(tg.idxmin()); res["worst_seg_total_year"] = wy; res["worst_seg_total_yoy"] = float(tg.min())
        g = {c: v for c, v in growth[wy].items() if not np.isnan(v)}
        ws = min(g, key=g.get); p = prior[wy]
        res["weak_seg"] = ws; res["weak_seg_g"] = g[ws]; res["weak_share"] = p[ws] / sum(p.values())
        # biggest single segment fall anywhere, and its share
        allf = [(growth[y][c], y, c) for y in growth for c in growth[y] if not np.isnan(growth[y][c])]
        mg = min(allf); res["max_fall"] = dict(g=mg[0], year=mg[1], seg=mg[2], share=prior[mg[1]][mg[2]] / sum(prior[mg[1]].values()))
    # stress years: spread among segments with >=10% share
    for y in (2020, 2022, 2023):
        if y in growth:
            g = {c: v for c, v in growth[y].items() if not np.isnan(v) and prior[y][c] / sum(prior[y].values()) >= 0.10}
            if len(g) >= 2: res[f"spread_{y}"] = (min(g.values()), max(g.values()))
    # profit
    if pp:
        py, plevel, plsrc, pgrowth, ptotg, pdlev, pprior, pgsrc = build(pp)
        res.update(prf_tags=sorted({v[1] for v in pp.values()}), plevel=plevel, ptotg=ptotg)
        pt = pd.Series(ptotg).dropna()
        if len(pt): res["worst_prf_yoy"] = float(pt.min()); res["worst_prf_year"] = int(pt.idxmin())
        ddf = pd.DataFrame(pdlev).T.sort_index()
        pcs = []
        for a, b in itertools.combinations(ddf.columns, 2):
            x = ddf[[a, b]].dropna()
            if len(x) >= 4 and x[a].std() > 0 and x[b].std() > 0: pcs.append((a, b, float(x[a].corr(x[b])), len(x)))
        res["ppairs"] = pcs
        res["mean_pcorr"] = float(np.mean([c for *_, c, _ in [(a, b, c, n) for a, b, c, n in pcs]])) if pcs else np.nan
    res["src_urls"] = sorted({v[0] for v in rp.values()} | ({v[0] for v in pp.values()} if pp else set()))
    res["status"] = "ok"
    return res

if __name__ == "__main__":
    import glob
    ts = sys.argv[1:] or sorted(os.path.basename(f)[:-5] for f in glob.glob(f"{D}/*.json") if not f.endswith("results.json"))
    out = {}
    for t in ts:
        try: out[t] = analyze(t)
        except Exception as e:
            import traceback; traceback.print_exc(); out[t] = dict(ticker=t, status=f"error {e}")
    def conv(o):
        if isinstance(o, dict): return {str(k): conv(v) for k, v in o.items()}
        if isinstance(o, (list, tuple)): return [conv(v) for v in o]
        if isinstance(o, (np.floating, float)): return None if (o is None or np.isnan(o)) else float(o)
        if isinstance(o, np.integer): return int(o)
        return o
    if len(sys.argv) == 1:
        json.dump(conv(out), open(f"{D}/results.json", "w"), indent=0)
    for t, r in out.items():
        if r.get("status") != "ok": print(t, r.get("status")); continue
        print(f"\n## {t} rev={r['rev_tags']} prf={r.get('prf_tags')} yrs={r['years'][0]}-{r['years'][-1]} n_obs={r['n_obs']}")
        lv = pd.DataFrame(r["level"]).T.sort_index() / 1e6
        print(lv.round(0).to_string())
        gd = pd.DataFrame(r["growth"]).T.sort_index()
        print("growth:\n" + (gd * 100).round(1).to_string())
        print("tot seg growth:", {k: round(v * 100, 1) for k, v in r["totg"].items() if v == v})
        print(f"mean_corr={r['mean_corr']:.2f} wmean={r['wmean_corr']:.2f} divratio={r['div_ratio']:.2f} weak={r.get('weak_seg')} {r.get('weak_seg_g', 0)*100:.1f}% share={r.get('weak_share', 0):.2f} worst_tot={r.get('worst_seg_total_year')} {r.get('worst_seg_total_yoy', 0)*100:.1f}%")
        if "plevel" in r:
            print("profit:\n" + (pd.DataFrame(r["plevel"]).T.sort_index() / 1e6).round(0).to_string())
            print(f"worst_prf={r.get('worst_prf_year')} {r.get('worst_prf_yoy', 0)*100:.1f}% mean_pcorr={r.get('mean_pcorr')}")
