"""Phase 2: build per-company annual series from EDGAR frames, compute triage metrics.
Inputs: data/sec/frames/*.json, universe/universe.csv (ticker, cik, mcap, price...), data/yf/close_10y.pkl
Output: triage/metrics.csv  (one row per universe ticker), data/sec/series.json (annual series per cik)
"""
import json, os, glob, math, collections
import numpy as np, pandas as pd

ROOT = "/home/user/abcd/company_hunt"
FR = f"{ROOT}/data/sec/frames"
U = pd.read_csv(f"{ROOT}/universe/universe.csv")
U["cik"] = U["cik"].astype(int).astype(str)
PRED = {r["cik"]: str(int(r["pred_cik"])) for _, r in U.iterrows() if pd.notna(r.get("pred_cik")) and str(r.get("pred_cik")).strip() not in ("", "nan")}
ciks = set(U["cik"])
_cache = {}
def frame(tax, c, unit, p):
    k = (tax, c, unit, p)
    if k not in _cache:
        fn = f"{FR}/{tax}_{c}_{unit}_{p}.json"
        _cache[k] = json.load(open(fn)) if os.path.exists(fn) else {}
    return _cache[k]

YEARS = list(range(2014, 2027))
def dur(cik, tags, y, unit="USD"):
    for c in [cik] + ([PRED[cik]] if cik in PRED else []):
        for t in tags:
            v = frame("us-gaap", t, unit, f"CY{y}").get(c)
            if v is not None: return v[0], v[1]
    return None, None
def inst(cik, tags, p):
    for c in [cik] + ([PRED[cik]] if cik in PRED else []):
        for t in tags:
            v = frame("us-gaap", t, "USD", p).get(c)
            if v is not None: return v[0]
    return None

TAGS = {
 "rev": ["Revenues","RevenueFromContractWithCustomerExcludingAssessedTax","RevenueFromContractWithCustomerIncludingAssessedTax","SalesRevenueNet","RevenuesNetOfInterestExpense"],
 "gp": ["GrossProfit"], "cogs": ["CostOfRevenue","CostOfGoodsAndServicesSold"], "oi": ["OperatingIncomeLoss"],
 "ni": ["NetIncomeLoss","ProfitLoss"], "pbt": ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"],
 "tax": ["IncomeTaxExpenseBenefit"], "int": ["InterestExpense","InterestExpenseNonoperating","InterestExpenseDebt"],
 "ocf": ["NetCashProvidedByUsedInOperatingActivities"], "capex": ["PaymentsToAcquirePropertyPlantAndEquipment","PaymentsToAcquireProductiveAssets"],
 "capog": ["PaymentsToAcquireOilAndGasPropertyAndEquipment","PaymentsToExploreAndDevelopOilAndGasProperties","PaymentsToAcquireOilAndGasProperty"],
 "sbc": ["ShareBasedCompensation","AllocatedShareBasedCompensationExpense"], "bb": ["PaymentsForRepurchaseOfCommonStock"],
 "div": ["PaymentsOfDividendsCommonStock","PaymentsOfDividends"], "da": ["DepreciationDepletionAndAmortization","DepreciationAndAmortization","DepreciationAmortizationAndAccretionNet"],
 "acq": ["PaymentsToAcquireBusinessesNetOfCashAcquired"], "rnd": ["ResearchAndDevelopmentExpense"], "sga": ["SellingGeneralAndAdministrativeExpense"],
 "restr": ["RestructuringCharges"], "gwimp": ["GoodwillImpairmentLoss"], "imp": ["AssetImpairmentCharges"], "divest": ["ProceedsFromDivestitureOfBusinesses"],
 "issue": ["ProceedsFromIssuanceOfCommonStock"], "capsw": ["PaymentsToDevelopSoftware","PaymentsForSoftware"], "eqinc": ["IncomeLossFromEquityMethodInvestments"],
 "nii": ["InterestIncomeExpenseNet"], "nonii": ["NoninterestIncome"], "prov": ["ProvisionForLoanLeaseAndOtherLosses"],
}
ITAGS = {
 "assets": ["Assets"], "eq": ["StockholdersEquity","StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"], "cash": ["CashAndCashEquivalentsAtCarryingValue","CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
 "sti": ["ShortTermInvestments","MarketableSecuritiesCurrent","AvailableForSaleSecuritiesDebtSecuritiesCurrent"], "lti": ["LongTermInvestments"],
 "ltd_total": ["LongTermDebt","LongTermDebtAndCapitalLeaseObligations"], "ltd_nc": ["LongTermDebtNoncurrent"], "ltd_cur": ["LongTermDebtCurrent","DebtCurrent"],
 "stb": ["ShortTermBorrowings"], "cp": ["CommercialPaper"], "oplease": ["OperatingLeaseLiability"], "gw": ["Goodwill"], "intang": ["IntangibleAssetsNetExcludingGoodwill"],
 "ca": ["AssetsCurrent"], "cl": ["LiabilitiesCurrent"], "liab": ["Liabilities"], "pension": ["DefinedBenefitPlanFundedStatusOfPlan"], "eqmeth": ["EquityMethodInvestments"],
 "mat1": ["LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths"], "mat2": ["LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo"],
 "mat3": ["LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree"], "deposits": ["Deposits"], "ppe": ["PropertyPlantAndEquipmentNet"], "inv": ["InventoryNet"],
 "rpo": ["RevenueRemainingPerformanceObligation"], "defrev": ["ContractWithCustomerLiability"], "ar": ["AccountsReceivableNetCurrent"], "ap": ["AccountsPayableCurrent"],
 "litres": ["LossContingencyAccrualAtCarryingValue"],
}
def debt_of(cik, p):
    tot = inst(cik, ITAGS["ltd_total"], p)
    if tot is None:
        nc = inst(cik, ITAGS["ltd_nc"], p); cur = inst(cik, ITAGS["ltd_cur"], p)
        if nc is None and cur is None: tot = None
        else: tot = (nc or 0) + (cur or 0)
    stb = inst(cik, ITAGS["stb"], p) or 0; cp = inst(cik, ITAGS["cp"], p) or 0
    if tot is None and not stb and not cp: return None
    return (tot or 0) + stb + cp

closes = pd.read_pickle(f"{ROOT}/data/yf/close_10y.pkl")
SPLITS = json.load(open(f"{ROOT}/data/yf/splits.json"))
def px_at(tk, date):
    if tk not in closes.columns: return None
    s = closes[tk].dropna(); s = s[s.index <= pd.Timestamp(date)]
    return float(s.iloc[-1]) if len(s) else None

def cagr(a, b, n):
    if a is None or b is None or n <= 0 or a <= 0 or b <= 0: return None
    return (b / a) ** (1 / n) - 1

series = {}
rows = []
for _, u in U.iterrows():
    cik = u["cik"]; tk = u["ticker"]
    S = {k: {} for k in TAGS}; ends = {}
    for y in YEARS:
        for k, tags in TAGS.items():
            v, e = dur(cik, tags, y)
            if v is not None:
                S[k][y] = v
                if k in ("rev", "ni", "ocf"): ends[y] = e
        sh, e = dur(cik, ["WeightedAverageNumberOfDilutedSharesOutstanding","WeightedAverageNumberOfShareOutstandingBasicAndDiluted","WeightedAverageNumberOfSharesOutstandingBasic"], y, "shares")
        S.setdefault("shs", {})
        if sh: S["shs"][y] = sh
    # split adjustment of share counts: frames carry the last-filed value, which may or may not be restated for a later split.
    # For each split (newest first), adjust earlier years only where multiplying by the ratio brings the count closer to the
    # first post-split year's count (share counts move a few % a year; splits move them by >= 1.5x).
    shs_raw = dict(S["shs"])
    for sd, ratio in sorted(SPLITS.get(tk) or [], reverse=True):
        if not (ratio >= 1.4 or ratio <= 0.7): continue
        post = [y for y in sorted(S["shs"]) if (ends.get(y) or f"{y}-12-31") >= sd]
        if not post: continue
        ref = S["shs"][post[0]]
        for y in sorted(S["shs"]):
            if (ends.get(y) or f"{y}-12-31") >= sd: continue
            v = S["shs"][y]
            if v and ref and abs(math.log(v * ratio / ref)) < abs(math.log(v / ref)):
                S["shs"][y] = v * ratio
    # bank revenue fallback
    for y in YEARS:
        if y not in S["rev"] and (y in S["nii"] or y in S["nonii"]):
            S["rev"][y] = (S["nii"].get(y) or 0) + (S["nonii"].get(y) or 0)
    B = {}
    for y in YEARS[:-1]:
        p = f"CY{y}Q4I"; B[y] = {k: inst(cik, t, p) for k, t in ITAGS.items()}; B[y]["debt"] = debt_of(cik, p)
    # latest balance sheet
    latest_bs = None
    for p in ("CY2026Q3I", "CY2026Q2I", "CY2026Q1I", "CY2025Q4I"):
        b = {k: inst(cik, t, p) for k, t in ITAGS.items()}; b["debt"] = debt_of(cik, p)
        if b["assets"] is not None:
            latest_bs = b; latest_bs["period"] = p; break
    # capex = PP&E + capitalized software (cross-check vs yfinance showed software capex missing for FICO, NICE, FIS, MKTX)
    for y in list(S["ocf"]):
        if S["capsw"].get(y): S["capex"][y] = (S["capex"].get(y) or 0) + S["capsw"][y]
        # oil & gas drilling capex sits under its own tags (Phase 3 found EOG's FCF overstated); add when PP&E capex is small vs it
        if S["capog"].get(y) and S["capog"][y] > (S["capex"].get(y) or 0): S["capex"][y] = (S["capex"].get(y) or 0) + S["capog"][y]
    S["fcf"] = {y: S["ocf"][y] - (S["capex"].get(y) or 0) for y in S["ocf"]}
    S["ends"] = ends
    series[cik] = {"ticker": tk, "S": {k: v for k, v in S.items()}, "B": B, "latest_bs": latest_bs}
    yrs = sorted(set(S["rev"]) | set(S["ocf"]))
    if not yrs:
        rows.append({"ticker": tk, "cik": cik, "has_xbrl": 0}); continue
    both = [y for y in yrs if (y in S["ocf"] and y in S["rev"])]
    LY = max(both) if both else max(y for y in yrs if (y in S["ocf"] or y in S["rev"]))
    g = lambda k, y=LY: S[k].get(y)
    rev, ocf, capex, sbc, ni, oi, gp = g("rev"), g("ocf"), g("capex") or 0, g("sbc") or 0, g("ni"), g("oi"), g("gp")
    if gp is None and rev and g("cogs"): gp = rev - g("cogs")
    fcf = (ocf - capex) if ocf is not None else None
    mcap = u.get("mcap"); price = u.get("price")
    bs = latest_bs or (B.get(LY) or {})
    cash = (bs.get("cash") or 0) + (bs.get("sti") or 0)
    debt = bs.get("debt")
    netcash = cash - (debt or 0) if bs else None
    ev = mcap - netcash if (mcap and netcash is not None) else None
    r = {"ticker": tk, "cik": cik, "has_xbrl": 1, "last_fy": LY, "fy_end_date": ends.get(LY), "bs_period": bs.get("period") if latest_bs else f"CY{LY}Q4I",
         "rev": rev, "gp": gp, "oi": oi, "ni": ni, "ocf": ocf, "capex": capex, "sbc": sbc, "fcf": fcf,
         "fcf_sbc": (fcf - sbc) if fcf is not None else None, "cash_sti": cash, "debt": debt, "net_cash": netcash, "ev": ev,
         "oplease": bs.get("oplease"), "pension_funded": bs.get("pension"), "eqmeth": bs.get("eqmeth"), "lti": bs.get("lti"),
         "gw_intang": (bs.get("gw") or 0) + (bs.get("intang") or 0), "equity": bs.get("eq"), "assets": bs.get("assets"),
         "mat_1_3y": sum(x or 0 for x in (bs.get("mat1"), bs.get("mat2"), bs.get("mat3"))) if bs else None,
         "rpo": bs.get("rpo"), "deposits": bs.get("deposits")}
    r["gm"] = gp / rev if (gp is not None and rev) else None
    r["om"] = oi / rev if (oi is not None and rev) else None
    r["fcf_margin"] = fcf / rev if (fcf is not None and rev) else None
    r["capex_rev"] = capex / rev if rev else None
    r["sbc_rev"] = sbc / rev if rev else None
    r["fcf_yield"] = fcf / mcap if (fcf is not None and mcap) else None
    r["fcf_sbc_yield"] = r["fcf_sbc"] / mcap if (r["fcf_sbc"] is not None and mcap) else None
    r["fcf_ev_yield"] = fcf / ev if (fcf is not None and ev and ev > 0) else None
    r["netcash_mcap"] = netcash / mcap if (netcash is not None and mcap) else None
    ii = g("int"); r["int_cov"] = oi / ii if (oi is not None and ii and ii > 0) else None
    # ROIC
    pbt, tax = g("pbt"), g("tax")
    tr = min(max(tax / pbt, 0), 0.35) if (pbt and tax is not None and pbt > 0) else 0.21
    def roic_y(y):
        o = S["oi"].get(y); b = B.get(y) or {}
        if y == LY and latest_bs: b = latest_bs
        if o is None or b.get("eq") is None: return None
        ic = (b.get("eq") or 0) + (b.get("debt") or 0) - (b.get("cash") or 0) - (b.get("sti") or 0)
        return o * (1 - tr) / ic if ic > 0 else None
    r["roic"] = roic_y(LY)
    rr = [roic_y(y) for y in range(LY - 5, LY)]; rr = [x for x in rr if x is not None]
    r["roic_5y_avg"] = float(np.mean(rr)) if rr else None
    # margins history
    om_hist = {y: S["oi"][y] / S["rev"][y] for y in S["oi"] if S["rev"].get(y)}
    gm_hist = {}
    for y in S["rev"]:
        gpy = S["gp"].get(y) if S["gp"].get(y) is not None else ((S["rev"][y] - S["cogs"][y]) if S["cogs"].get(y) is not None else None)
        if gpy is not None and S["rev"][y]: gm_hist[y] = gpy / S["rev"][y]
    fm_hist = {y: S["fcf"][y] / S["rev"][y] for y in S["fcf"] if S["rev"].get(y)}
    def med(d, lo, hi):
        v = [d[y] for y in d if lo <= y <= hi]; return float(np.median(v)) if v else None
    r["om_med_10y"] = med(om_hist, LY - 9, LY); r["gm_med_5y"] = med(gm_hist, LY - 5, LY - 1)
    r["om_min_2019_25"] = min([om_hist[y] for y in om_hist if 2019 <= y <= 2025], default=None)
    v = [fm_hist[y] for y in fm_hist if LY - 9 <= y <= LY]
    r["fcf_margin_vol_10y"] = float(np.std(v)) if len(v) >= 5 else None
    r["fcf_margin_min_10y"] = min(v) if v else None
    r["n_fcf_neg_10y"] = sum(1 for x in v if x < 0)
    r["n_years_fcf"] = len(v)
    # growth
    for n in (3, 5, 10):
        r[f"rev_cagr_{n}y"] = cagr(S["rev"].get(LY - n), rev, n)
        r[f"ni_cagr_{n}y"] = cagr(S["ni"].get(LY - n), ni, n)
    shs = S["shs"]
    def ps(k, y):
        v = S[k].get(y); s = shs.get(y)
        return v / s if (v is not None and s) else None
    r["fcfps_cagr_5y"] = cagr(ps("fcf", LY - 5), ps("fcf", LY), 5)
    r["eps_cagr_5y"] = cagr(ps("ni", LY - 5), ps("ni", LY), 5)
    r["shs_chg_3y"] = (shs[LY] / shs[LY - 3] - 1) if (shs.get(LY) and shs.get(LY - 3)) else None
    r["shs_chg_5y"] = (shs[LY] / shs[LY - 5] - 1) if (shs.get(LY) and shs.get(LY - 5)) else None
    r["sh_yield"] = ((g("div") or 0) + (g("bb") or 0)) / mcap if mcap else None
    # revenue resilience: worst yoy over 2015-LY, worst om drop
    yoy = [S["rev"][y] / S["rev"][y - 1] - 1 for y in S["rev"] if S["rev"].get(y - 1) and S["rev"][y - 1] > 0 and y <= LY]
    r["rev_worst_yoy"] = min(yoy) if yoy else None
    r["rev_yoy_vol"] = float(np.std(yoy)) if len(yoy) >= 5 else None
    r["n_rev_down_years"] = sum(1 for x in yoy if x < 0)
    oiy = [S["oi"][y] / S["oi"][y - 1] - 1 for y in S["oi"] if S["oi"].get(y - 1) and S["oi"][y - 1] > 0 and y <= LY]
    r["oi_worst_yoy"] = min(oiy) if oiy else None
    fps = [ps("fcf", y) for y in range(LY - 9, LY + 1)]; fps = [x for x in fps if x is not None]
    r["fcfps_down_years"] = sum(1 for a, b in zip(fps, fps[1:]) if b < a)
    # rev peak dip
    rr3 = [S["rev"].get(y) for y in range(LY - 3, LY + 1) if S["rev"].get(y)]
    r["rev_vs_peak4y"] = rev / max(rr3) - 1 if (rev and rr3) else None
    nn3 = [S["ni"].get(y) for y in range(LY - 3, LY + 1) if S["ni"].get(y)]
    r["ni_vs_peak4y"] = ni / max(nn3) - 1 if (ni and nn3 and max(nn3) > 0) else None
    r["ocf_ni_5y"] = (sum(S["ocf"].get(y, 0) for y in range(LY - 4, LY + 1)) / sum(S["ni"].get(y, 0) for y in range(LY - 4, LY + 1))) if sum(S["ni"].get(y, 0) for y in range(LY - 4, LY + 1)) > 0 else None
    # rebuild proxies
    r["restr_3y"] = sum(S["restr"].get(y, 0) for y in range(LY - 2, LY + 1))
    r["imp_3y"] = sum(S["gwimp"].get(y, 0) + S["imp"].get(y, 0) for y in range(LY - 2, LY + 1))
    r["divest_3y"] = sum(S["divest"].get(y, 0) for y in range(LY - 2, LY + 1))
    r["acq_5y"] = sum(S["acq"].get(y, 0) for y in range(LY - 4, LY + 1))
    r["ocf_growth_vs_ni"] = None
    if S["ocf"].get(LY - 2) and S["ni"].get(LY - 2) and ocf and ni:
        r["ocf_growth_vs_ni"] = (ocf / S["ocf"][LY - 2] - 1) - (ni / S["ni"][LY - 2] - 1) if S["ni"][LY - 2] > 0 and S["ocf"][LY - 2] > 0 else None
    r["eqinc"] = g("eqinc")
    r["rpo_growth"] = None
    rp0 = (B.get(LY - 1) or {}).get("rpo"); rp1 = bs.get("rpo")
    if rp0 and rp1: r["rpo_growth"] = rp1 / rp0 - 1
    r["rpo_rev"] = rp1 / rev if (rp1 and rev) else None
    # historical multiples (year-end price x diluted shares)
    pe_h, pf_h, eve_h = [], [], []
    for y in range(max(2016, LY - 9), LY + 1):
        e = ends.get(y)
        if not e: continue
        p = px_at(tk, e); s = shs.get(y)
        if not p or not s: continue
        mc = p * s
        bb = B.get(y) or {}
        evy = mc + (bb.get("debt") or 0) - (bb.get("cash") or 0) - (bb.get("sti") or 0)
        if S["ni"].get(y, 0) > 0: pe_h.append(mc / S["ni"][y])
        if S["fcf"].get(y, 0) > 0: pf_h.append(mc / S["fcf"][y])
        if S["oi"].get(y, 0) > 0 and evy > 0: eve_h.append(evy / S["oi"][y])
    r["pe_now"] = mcap / ni if (mcap and ni and ni > 0) else None
    r["pfcf_now"] = mcap / fcf if (mcap and fcf and fcf > 0) else None
    r["evebit_now"] = ev / oi if (ev and oi and oi > 0) else None
    r["pe_med_10y"] = float(np.median(pe_h)) if len(pe_h) >= 4 else None
    r["pfcf_med_10y"] = float(np.median(pf_h)) if len(pf_h) >= 4 else None
    r["evebit_med_10y"] = float(np.median(eve_h)) if len(eve_h) >= 4 else None
    for a, b in (("pe", "pe"), ("pfcf", "pfcf"), ("evebit", "evebit")):
        n_, m_ = r[f"{a}_now"], r[f"{b}_med_10y"]
        r[f"{a}_vs_med"] = n_ / m_ - 1 if (n_ and m_) else None
    rows.append(r)
M = pd.DataFrame(rows)
# debt/cash cross-check vs yfinance (EDGAR tag coverage gaps: GM, F, OMC, CME...). Fill only when EDGAR is missing or < 50% of yfinance.
INFO = json.load(open(f"{ROOT}/data/yf/info.json"))
S_DA = {}
for _, rr in M.iterrows():
    if pd.notna(rr.get("last_fy")) and rr["cik"] in series:
        S_DA[rr["cik"]] = series[rr["cik"]]["S"].get("da", {}).get(int(rr["last_fy"]))
M["debt_src"] = "edgar"
# capex guard: EDGAR capex missing/zero while D&A says the company has real fixed assets -> yfinance implied capex (OCF - FCF, TTM)
M["capex_src"] = "edgar"
for i, r in M.iterrows():
    inf = INFO.get(r["ticker"]) or {}
    da = (S_DA.get(r["cik"]) or 0)
    if r.get("has_xbrl") == 1 and (pd.isna(r["capex"]) or r["capex"] == 0) and r["rev"] and da > 0.01 * r["rev"]:
        if inf.get("operatingCashflow") and inf.get("freeCashflow") is not None:
            cx = inf["operatingCashflow"] - inf["freeCashflow"]
            if cx > 0:
                M.at[i, "capex"] = cx; M.at[i, "fcf"] = r["ocf"] - cx; M.at[i, "fcf_sbc"] = r["ocf"] - cx - (r["sbc"] or 0)
                M.at[i, "capex_src"] = "yf_implied_ttm"
                mc_ = U.loc[U["ticker"] == r["ticker"], "mcap"].iloc[0]
                if mc_:
                    M.at[i, "fcf_yield"] = M.at[i, "fcf"] / mc_; M.at[i, "fcf_sbc_yield"] = M.at[i, "fcf_sbc"] / mc_
                M.at[i, "capex_rev"] = cx / r["rev"]; M.at[i, "fcf_margin"] = M.at[i, "fcf"] / r["rev"]
for i, r in M.iterrows():
    yd = (INFO.get(r["ticker"]) or {}).get("totalDebt"); yc = (INFO.get(r["ticker"]) or {}).get("totalCash")
    if r.get("has_xbrl") != 1: continue
    if yd and (pd.isna(r["debt"]) or r["debt"] < 0.2 * yd):
        M.at[i, "debt_edgar"] = r["debt"]; M.at[i, "debt"] = yd; M.at[i, "debt_src"] = "yf_fill"
    if pd.isna(r["cash_sti"]) or r["cash_sti"] == 0:
        if yc: M.at[i, "cash_sti"] = yc
    nc = M.at[i, "cash_sti"] - (M.at[i, "debt"] if pd.notna(M.at[i, "debt"]) else 0)
    M.at[i, "net_cash"] = nc
    M.at[i, "net_cash_incl_leases"] = nc - (r["oplease"] if pd.notna(r["oplease"]) else 0)
    mc = U.loc[U["ticker"] == r["ticker"], "mcap"].iloc[0]
    if mc:
        M.at[i, "netcash_mcap"] = nc / mc
        ev = mc - nc; M.at[i, "ev"] = ev
        M.at[i, "fcf_ev_yield"] = r["fcf"] / ev if (pd.notna(r["fcf"]) and ev > 0) else None
        if pd.notna(r["oi"]) and r["oi"] > 0 and ev > 0: M.at[i, "evebit_now"] = ev / r["oi"]
M = U.merge(M, on=["ticker", "cik"], how="left")
M.to_csv(f"{ROOT}/triage/metrics.csv", index=False)
json.dump(series, open(f"{ROOT}/data/sec/series.json", "w"))
print("metrics rows", len(M), "with xbrl", int(M["has_xbrl"].fillna(0).sum()))
