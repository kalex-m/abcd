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

EXCL = re.compile(r"^corporate(nonsegment\w*|segment\w*|andother\w*|other\w*|andelimination\w*|andreconcil\w*|activities\w*|items\w*|andunallocated\w*|expense\w*|functions\w*|andsupport\w*)?$|elimination|intersegment|reconcil|unallocated|consolidat|nonsegment|totalsegment|segmenttotal|^operatingsegments?$|^segments?$|^reportablesegments?$|^totaloptum$|adjustment|^allother|^allothersegments$|^other(segment)?s?$|headquarters|^corporate$|^total$|^reportable$|reportablesegmentaggregation|segmentaggregation", re.I)

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
 "GS":  dict(skip=["2025:platformsolutions"], prf=["us-gaap:NetIncomeLoss"], fin=1),
 "MS":  dict(skip=["2021:wealthmanagement", "2021:investmentmanagement"], prf=["us-gaap:NetIncomeLoss"], fin=1),
 "PNC": dict(rev=["us-gaap:Revenues", "us-gaap:InterestIncomeExpenseNet+us-gaap:NoninterestIncome"], prf=["us-gaap:NetIncomeLoss", "us-gaap:IncomeLossFromContinuingOperations"], alias={"retailbanking1": "retailbanking"}, fin=1),
 "BNY": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], fin=1),
 "SCHW": dict(skip=[2021], rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], fin=1),
 "RJF": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "rjf:IncomeLossFromContinuingOperationsBeforeIncomeTaxesAndAfterEquityMethodInvestmentsAndNoncontrollingInterest"], alias={"rjbank": "bank"}, fin=1),
 "AMP": dict(rev=["us-gaap:Revenues"], prf=["amp:SegmentReportingInformationOperatingEarnings", "amp:AdjustedOperatingEarnings", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
             alias={"retirementprotectionsolutions": "retirementandprotectionsolutions"}, fin=1),
 "ICE": dict(skip=["2019:mortgagetechnology", "2020:mortgagetechnology", "2021:mortgagetechnology", "2023:mortgagetechnology", "2024:mortgagetechnology"]), "MCO": dict(prf=["mco:AdjustedOperatingIncome", "us-gaap:OperatingIncomeLoss"]),
 "SPGI": dict(alias={"commodityinsights": "energy", "platts": "energy"}, drop=["engineeringsolutions"], skip=["2022:marketintelligence", "2022:energy", "2022p:marketintelligence", "2023p:marketintelligence"]),
 "MSCI": dict(prf=["msci:OperatingSegmentProfitability"], alias={"esgandclimate": "sustainabilityandclimate", "allotherprivateassets": "privateassets"}),
 "FDS": dict(), "BRK-B": dict(rev=["us-gaap:Revenues"], drop=["insurancecorporateandother"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "us-gaap:OperatingIncomeLoss"], fin=1),
 "HIG": dict(rev=["us-gaap:Revenues", "hig:Earnedpremiumsandfeeincome"], prf=["us-gaap:NetIncomeLoss"], alias={"groupbenefits": "employeebenefits", "pccommerciallines": "pcbusinessinsurance", "pcpersonallines": "pcpersonalinsurance"}, drop=["propertycasualtyotheroperations", "reportablesegmentaggregationbeforeotheroperating"], fin=1),
 "MET": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:OperatingIncomeLoss", "met:AdjustedEarnings"], fin=1),
 "AFL": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:OperatingIncomeLoss"], fin=1),
 "CB":  dict(skip=["2022:life", "2023:life"], rev=["us-gaap:PremiumsEarnedNet"], prf=["cb:SegmentUnderwritingIncomeLossandNetInvestmentIncomeLoss", "us-gaap:UnderwritingIncomeLoss"],
             alias={"segmentinsurancenorthamericanpersonalpcmember": "napersonal", "segmentinsurancenorthamericanpersonalpc": "napersonal", "segmentnorthamericacommercialpcinsurance": "nacommercial", "segmentinsurancenorthamericancommercialpc": "nacommercial", "northamericacommercialpcinsurance": "nacommercial", "insurancenorthamericancommercialpc": "nacommercial", "insurancenorthamericanpersonalpc": "napersonal", "northamericapersonalpcinsurance": "napersonal", "insurancenorthamericanagriculture": "naagriculture", "northamericaagriculturalinsurance": "naagriculture", "insuranceoverseasgeneral": "overseasgeneral"}, fin=1),
 "TRV": dict(rev=["us-gaap:RevenuesExcludingRealizedGainLoss", "us-gaap:PremiumsEarnedNet"], prf=["trv:OperatingIncomeLossNetOfTax", "trv:SegmentIncomeLoss", "us-gaap:NetIncomeLoss"], fin=1),
 "ALL": dict(skip=[2021, "2025:allstatehealthandbenefits"], rev=["us-gaap:Revenues"], prf=["all:OperatingIncomeLossAfterTax", "all:AdjustedNetIncome", "us-gaap:NetIncomeLoss"], alias={"allstateannuities": "lifeandannuities", "allstatelife": "lifeandannuities", "allstatebenefits": "allstatehealthandbenefits"}, fin=1),
 "PGR": dict(rev=["us-gaap:SupplementaryInsuranceInformationPremiumRevenue"], prf=["pgr:PretaxProfitLoss", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
             alias={"property": "personallines"}, drop=["otherindemnity"], fin=1),
 "MRSH": dict(), "AJG": dict(prf=["us-gaap:NetIncomeLoss"], fin=1), "BRO": dict(alias={"nationalprograms": "programs", "retail": "retail", "wholesalebrokerage": "specialtydistribution"}, drop=["services"], fin=1),
 "GL":  dict(rev=["gl:SegmentRevenuesExcludingRealizedInvestmentGainsLosses"], prf=["gl:SegmentProfitLoss", "us-gaap:GrossProfit"], drop=["annuity"], fin=1),
 "L":   dict(rev=["us-gaap:Revenues"], prf=["us-gaap:NetIncomeLoss"], drop=["diamondoffshoredrillinginc"], fin=1),
 "MKL": dict(rev=["us-gaap:Revenues"], prf=["mkl:SegmentProfitLoss"], fin=1),
 "HON": dict(skip=[2019], prf=["hon:SegmentReportingSegmentProfitLoss", "us-gaap:OperatingIncomeLoss"]),
 "ITW": dict(), "DOV": dict(alias={"fuelingsolutions": "cleanenergyfueling", "refrigerationandfoodequipment": "climatesustainabilitytechnologies"}),
 "TXT": dict(drop=["finance", "textroneaviation"]), "GD": dict(), "RTX": dict(skip=["2019:collinsaerospace"], alias={"collinsaerospacesystems": "collinsaerospace", "raytheonintelligencespace": "raytheon", "raytheonmissilesdefense": "raytheon"}),
 "ETN": dict(), "AME": dict(),
 "JNJ": dict(alias={"medicaldevices": "medtech", "pharmaceutical": "innovativemedicine"}),
 "ABT": dict(), "TMO": dict(skip=["2022:laboratoryproductsandbiopharmaservices"], alias={"laboratoryproductsandservices": "laboratoryproductsandbiopharmaservices"}),
 "DHR": dict(skip=["2020:lifesciences", "2021:biotechnology"]), "UNH": dict(), "CVS": dict(skip=[2019], rev=["us-gaap:Revenues"], prf=["cvs:AdjustedOperatingIncomeLoss", "us-gaap:OperatingIncomeLoss"]),
 "CI":  dict(skip=[2019], rev=["ci:SegmentRevenues", "us-gaap:Revenues"], prf=["ci:PreTaxAdjustedIncomeFromOperations", "ci:SegmentPreTaxAdjustedIncomeFromOperations", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], drop=["otheroperations", "groupdisabilityandother", "internationalmarkets"]),
 "PEP": dict(rev=["us-gaap:Revenues"]), "WMT": dict(alias={"samsclub": "samsclubus"}, skip=["2021:walmartinternational"]), "DIS": dict(drop=["contentlicense", "contentlicensesegmentadjustment", "total"]),
 "MSFT": dict(), "GOOGL": dict(), "AMZN": dict(), "IBM": dict(rev=["us-gaap:Revenues"], drop=["financing", "globalfinancing"]), "ADP": dict(),
 "ADBE": dict(prf=["us-gaap:GrossProfit"]), "ACN": dict(), "CTSH": dict(alias={"communicationmediaandtechnology": "communicationsmediaandtechnology", "healthcare": "healthsciences"}),
 "INTU": dict(skip=["2022:creditkarma", "2022:globalbusinesssolutions"], alias={"creditkarmainc": "creditkarma", "proconnect": "protax", "smallbusinessselfemployed": "globalbusinesssolutions"}),
 "BR": dict(drop=["reportable"], prf=["br:EarningsBeforeIncomeTaxes", "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "us-gaap:OperatingIncomeLoss"]),
 "JKHY": dict(prf=["us-gaap:GrossProfit"], drop=["corporateservices"]), "FISV": dict(skip=[2019, 2020], alias={"firstdata": "merchant", "acceptance": "merchant", "merchantsolutions": "merchant", "fintech": "financial", "financialinstitutionservices": "financial", "financialsolutions": "financial", "paymentsandindustryproducts": "payments"}),
 "FICO": dict(), "IDXX": dict(alias={"cag": "companionanimalgroup", "lpd": "livestockandpoultrydiagnostics"}), "IQV": dict(prf=["us-gaap:GrossProfit"]),
 "UHS": dict(prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "uhs:IncomeLossFromContinuingOperationsBeforeAllocationOfCorporateOverheadAndIncomeTaxesExtraordinaryItemsNoncontrollingInterest"]), "RMD": dict(alias={"devicesandmasks": "sleepandbreathinghealth", "sleepandrespiratory": "sleepandbreathinghealth", "softwareasaservice": "residentialcaresoftware", "softwareasservice": "residentialcaresoftware"}, drop=["softwareasservicebeforedeferredrevenueadjustment"]),
 "MKC": dict(), "COST": dict(), "CMCSA": dict(prf=["cmcsa:AdjustedEBITDA"], drop=["nbcuniversalsegments", "cablecommunicationssegments", "skylimitedsegments", "nbcuniversal"], skip=["2019:skylimited"]),
 "LULU": dict(), "DPZ": dict(prf=["dpz:SegmentIncomeLoss"]),
 "USB": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:NetIncomeLoss"], drop=["treasuryandcorporatesupport"], fin=1),
 "NTRS": dict(rev=["us-gaap:NoninterestIncome"], prf=["us-gaap:NetIncomeLoss"], alias={"corporateandinstitutionalservice": "assetservicing"}, drop=["treasuryandother"], fin=1),
 "STT": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], fin=1),
 "CBOE": dict(rev=["us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax"], alias={"europeanequities": "europeandasiapacific"}, drop=["digital"]),
 "NDAQ": dict(drop=["financialtechnologyincludingppa"]),
 "LH": dict(rev=["us-gaap:Revenues", "lh:SegmentRevenues"], alias={"biopharmalaboratoryservices": "drugdevelopment"}),
 "ACGL": dict(rev=["us-gaap:PremiumsEarnedNet"], prf=["acgl:UnderwritingIncomeLossSegment"], drop=["underwritingsegments"], fin=1),
 "WRB": dict(rev=["us-gaap:Revenues"], prf=["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"], fin=1),
 "TDY": dict(skip=["2021:digitalimaging", "2022:digitalimaging"]),
 "ROP": dict(prf=["rop:SegmentOperatingProfit"]),
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

def parse_skip(cfg, profit=False):
    """skip entries: int year (whole year, revenue and profit), "YYYY:seg" (that segment-year, revenue and profit),
    "YYYYp:seg" (profit only). Used for acquisition/divestiture years, so growth is closer to like-for-like."""
    years, pairs = set(), set()
    for e in cfg.get("skip", []):
        if isinstance(e, int): years.add(e); continue
        y, c = e.split(":")
        if y.endswith("p"):
            if profit: pairs.add((int(y[:-1]), c))
        else:
            pairs.add((int(y), c))
    return years, pairs

def build(pf, skip_years=(), skip_pairs=()):
    """levels on newest basis per year; growth per pair from the newest filing reporting both years.
    Skipped years/segment-years are left out of growth AND of that year's total growth (remaining segments only)."""
    filings = sorted(pf.keys())
    years = sorted({fy for f in filings for s in pf[f][2].values() for fy in s})
    level, lvl_src = {}, {}
    for y in years:
        for f in reversed(filings):
            segs = pf[f][2]
            if sum(1 for s in segs.values() if y in s) >= 2:
                level[y] = {c: s[y] for c, s in segs.items() if y in s}; lvl_src[y] = pf[f][0]; break
    growth, totg, dlev, srcs, prior, sk_prior = {}, {}, {}, {}, {}, {}
    for y0, y1 in zip(years, years[1:]):
        if y1 - y0 != 1 or y1 in skip_years: continue
        for f in reversed(filings):
            segs = pf[f][2]
            both = {c: (s[y0], s[y1]) for c, s in segs.items() if y0 in s and y1 in s and (y1, c) not in skip_pairs}
            sk = {c: s[y0] for c, s in segs.items() if y0 in s and y1 in s and (y1, c) in skip_pairs}
            if len(both) >= 2:
                growth[y1] = {c: (b / a - 1) if a > 0 else np.nan for c, (a, b) in both.items()}
                dlev[y1] = {c: b - a for c, (a, b) in both.items()}
                prior[y1] = {c: a for c, (a, b) in both.items()}
                sk_prior[y1] = sk
                srcs[y1] = pf[f][0]; break
    # total growth per year on the prior-year mix; a skipped (acquisition/divestiture) segment-year is imputed at that
    # segment's median clean growth when it has >= 3 clean years, else at 0% (flat), so a purchase neither inflates nor drops out
    gdf = pd.DataFrame(growth).T
    for y in growth:
        num = sum(prior[y][c] * (1 + g) for c, g in growth[y].items() if not np.isnan(g) and prior[y][c] > 0)
        den = sum(prior[y][c] for c, g in growth[y].items() if not np.isnan(g) and prior[y][c] > 0)
        for c, a in sk_prior.get(y, {}).items():
            if a <= 0: continue
            clean = gdf[c].dropna() if c in gdf.columns else pd.Series(dtype=float)
            gi = float(clean.median()) if len(clean) >= 3 else 0.0
            num += a * (1 + gi); den += a
        totg[y] = num / den - 1 if den > 0 else np.nan
    return years, level, lvl_src, growth, totg, dlev, prior, srcs

def corr_stats(growth, min_obs=4):
    df = pd.DataFrame(growth).T.sort_index()
    cs = []
    for a, b in itertools.combinations(df.columns, 2):
        x = df[[a, b]].dropna()
        if len(x) >= min_obs and x[a].std() > 0 and x[b].std() > 0:
            cs.append((a, b, float(x[a].corr(x[b])), len(x)))
    return df, cs

def offset_ratio(growth, prior, min_obs=3):
    """Year-by-year diversification ratio that survives re-segmentations.
    e_it = segment growth minus that segment's own average growth (its 'wave'); w_it = prior-year revenue share.
    num_t = sum w e (the wave left in the total), den_t = sum w |e| (the wave if every segment swung the same way).
    ratio = sqrt(sum num^2) / sqrt(sum den^2): 1 = waves line up, 0 = waves cancel. amp = rms of den (size of the waves)."""
    gdf = pd.DataFrame(growth).T.sort_index()
    ok = [c for c in gdf.columns if gdf[c].notna().sum() >= min_obs]
    if not ok: return np.nan, np.nan, 0
    mu = gdf[ok].mean()
    nums, dens = [], []
    for y in gdf.index:
        cs = [c for c in ok if not np.isnan(gdf.at[y, c]) and c in prior.get(y, {})]
        if len(cs) < 2: continue
        tw = sum(prior[y][c] for c in cs)
        if tw <= 0: continue
        e = {c: gdf.at[y, c] - mu[c] for c in cs}
        nums.append(sum(prior[y][c] / tw * e[c] for c in cs)); dens.append(sum(prior[y][c] / tw * abs(e[c]) for c in cs))
    if len(nums) < 3 or sum(d * d for d in dens) == 0: return np.nan, np.nan, len(nums)
    return float(math.sqrt(sum(n * n for n in nums)) / math.sqrt(sum(d * d for d in dens))), float(math.sqrt(np.mean([d * d for d in dens]))), len(nums)

STRESS = (2020, 2022, 2023)

def analyze(t):
    d = json.load(open(f"{D}/{t}.json"))
    cfg = CFG.get(t, {})
    fa = d.get("facts_all", [])
    res = dict(ticker=t, docs=d["docs"], skip=cfg.get("skip", []))
    rp = per_filing(fa, cfg.get("rev", REV_DEFAULT), cfg)
    pp = per_filing(fa, cfg.get("prf", PRF_DEFAULT), cfg)
    if not rp:
        res["status"] = "no_segments"; return res
    sy, sp = parse_skip(cfg)
    years, level, lsrc, growth, totg, dlev, prior, gsrc = build(rp, sy, sp)
    res.update(rev_tags=sorted({v[1] for v in rp.values()}), years=years, level=level, growth=growth, totg=totg, prior=prior)
    gdf, cs = corr_stats(growth)
    res["pairs"] = cs
    lv = pd.DataFrame(level).T
    share = (lv.div(lv.sum(axis=1), axis=0)).mean()
    res["avg_share"] = share.to_dict()
    res["n_segments_latest"] = int(len(level[max(level)])) if level else 0
    if cs:
        res["mean_corr"] = float(np.mean([c for _, _, c, _ in cs]))
        w = [share.get(a, 0) * share.get(b, 0) for a, b, _, _ in cs]
        res["wmean_corr"] = float(np.average([c for _, _, c, _ in cs], weights=w)) if sum(w) > 0 else np.nan
    else:
        res["mean_corr"] = res["wmean_corr"] = np.nan
    res["div_ratio"], res["wave_amp"], res["n_dr_obs"] = offset_ratio(growth, prior)
    tg = pd.Series(totg).dropna()
    res["n_obs"] = int(len(tg))
    res["tot_growth_sd"] = float(tg.std()) if len(tg) >= 3 else np.nan
    if len(tg):
        wy = int(tg.idxmin()); res["worst_seg_total_year"] = wy; res["worst_seg_total_yoy"] = float(tg.min())
        g = {c: v for c, v in growth[wy].items() if not np.isnan(v)}
        ws = min(g, key=g.get); p = prior[wy]
        res["weak_seg"] = ws; res["weak_seg_g"] = g[ws]; res["weak_seg_share_worstyr"] = p[ws] / sum(p.values())
        allf = [(growth[y][c], y, c) for y in growth for c in growth[y] if not np.isnan(growth[y][c])]
        mg = min(allf); res["max_fall"] = dict(g=mg[0], year=mg[1], seg=mg[2], share=prior[mg[1]][mg[2]] / sum(prior[mg[1]].values()))
    # weak share: revenue share (prior year) of segments that shrank, in each named slowdown year; mean over years present
    ws = {}
    for y in STRESS:
        if y in growth:
            p = prior[y]; tot = sum(p.values())
            ws[y] = sum(p[c] for c, v in growth[y].items() if not np.isnan(v) and v < 0) / tot if tot > 0 else np.nan
            g = {c: v for c, v in growth[y].items() if not np.isnan(v) and p[c] / tot >= 0.10}
            if len(g) >= 2: res[f"spread_{y}"] = (min(g.values()), max(g.values()))
    res["shrink_share_by_year"] = ws
    res["weak_share"] = float(np.mean(list(ws.values()))) if ws else np.nan
    if pp:
        psy, psp = parse_skip(cfg, profit=True)
        py, plevel, plsrc, pgrowth, ptotg, pdlev, pprior, pgsrc = build(pp, psy, psp)
        res.update(prf_tags=sorted({v[1] for v in pp.values()}), plevel=plevel, ptotg=ptotg)
        pt = pd.Series(ptotg).dropna()
        if len(pt): res["worst_prf_yoy"] = float(pt.min()); res["worst_prf_year"] = int(pt.idxmin())
        ddf = pd.DataFrame(pdlev).T.sort_index()
        pcs = []
        for a, b in itertools.combinations(ddf.columns, 2):
            x = ddf[[a, b]].dropna()
            if len(x) >= 4 and x[a].std() > 0 and x[b].std() > 0: pcs.append((a, b, float(x[a].corr(x[b])), len(x)))
        res["ppairs"] = pcs
        res["mean_pcorr"] = float(np.mean([c for _, _, c, _ in pcs])) if pcs else np.nan
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
        print(f"mean_corr={r['mean_corr']} wmean={r['wmean_corr']} offset_ratio={r['div_ratio']} amp={r['wave_amp']} shrink_share={r.get('weak_share')} worst_tot={r.get('worst_seg_total_year')} {r.get('worst_seg_total_yoy', 0)*100:.1f}%")
        if "plevel" in r:
            print("profit:\n" + (pd.DataFrame(r["plevel"]).T.sort_index() / 1e6).round(0).to_string())
            print(f"worst_prf={r.get('worst_prf_year')} {r.get('worst_prf_yoy', 0)*100:.1f}% mean_pcorr={r.get('mean_pcorr')}")
