"""SEC EDGAR XBRL companyfacts -> compact per-company history (US-GAAP + IFRS filers).
Keeps every fiscal-year value with its FIRST filing date (point-in-time backtests) and latest value (restated),
plus TTM / latest-quarter flows and latest balance-sheet instants.
Usage: python3 -I sec_pull.py <universe.json> <ticker_map.json> <out_dir> [workers]"""
import json, sys, time, gzip, urllib.request, datetime as dt, threading, os
from concurrent.futures import ThreadPoolExecutor

UA = "IndependentResearch/1.0 research-bot@example.org"  # generic client id (SEC asks for a UA)
_lock = threading.Lock(); _last = [0.0]
def get_json(url):
    for attempt in range(5):
        with _lock:  # global throttle ~7 req/s (SEC limit 10/s)
            w = 0.14 - (time.time() - _last[0])
            if w > 0: time.sleep(w)
            _last[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
                if r.headers.get("Content-Encoding") == "gzip": data = gzip.decompress(data)
            return json.loads(data)
        except Exception as e:
            if attempt == 4: raise
            time.sleep(2 * (attempt + 1))

G = "us-gaap"; I = "ifrs-full"
DUR = {
 "rev": [(G,"Revenues"),(G,"RevenueFromContractWithCustomerExcludingAssessedTax"),(G,"SalesRevenueNet"),(G,"RevenuesNetOfInterestExpense"),
         (G,"SalesRevenueGoodsNet"),(G,"RevenueFromContractWithCustomerIncludingAssessedTax"),(G,"RegulatedAndUnregulatedOperatingRevenue"),
         (G,"OperatingLeasesIncomeStatementLeaseRevenue"),(I,"Revenue"),(I,"RevenueFromContractsWithCustomers"),(I,"RevenueFromSaleOfGoods")],
 "cogs": [(G,"CostOfRevenue"),(G,"CostOfGoodsAndServicesSold"),(G,"CostOfGoodsSold"),(I,"CostOfSales")],
 "gp": [(G,"GrossProfit"),(I,"GrossProfit")],
 "oi": [(G,"OperatingIncomeLoss"),(I,"ProfitLossFromOperatingActivities")],
 "pbt": [(G,"IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"),
         (G,"IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"),
         (G,"IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"),(I,"ProfitLossBeforeTax")],
 "tax": [(G,"IncomeTaxExpenseBenefit"),(I,"IncomeTaxExpenseContinuingOperations")],
 "ni": [(G,"NetIncomeLoss"),(G,"NetIncomeLossAvailableToCommonStockholdersBasic"),(G,"ProfitLoss"),
        (I,"ProfitLossAttributableToOwnersOfParent"),(I,"ProfitLoss")],
 "int": [(G,"InterestExpense"),(G,"InterestExpenseNonoperating"),(G,"InterestExpenseDebt"),(G,"InterestAndDebtExpense"),
         (G,"InterestExpenseNet"),(G,"InterestPaidNet"),(I,"InterestExpense"),(I,"FinanceCosts")],
 "da": [(G,"DepreciationDepletionAndAmortization"),(G,"DepreciationAmortizationAndAccretionNet"),(G,"DepreciationAndAmortization"),
        (G,"DepreciationDepletionAndAmortizationPropertyPlantAndEquipment"),(G,"Depreciation"),
        (I,"AdjustmentsForDepreciationAndAmortisationExpense"),(I,"DepreciationAndAmortisationExpense"),
        (I,"AdjustmentsForDepreciationAmortisationAndImpairmentLossReversalOfImpairmentLossRecognisedInProfitOrLoss")],
 "sbc": [(G,"ShareBasedCompensation"),(G,"AllocatedShareBasedCompensationExpense"),(I,"AdjustmentsForSharebasedPayments"),
         (I,"ExpenseFromSharebasedPaymentTransactionsWithEmployees")],
 "ocf": [(G,"NetCashProvidedByUsedInOperatingActivities"),(G,"NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"),
         (I,"CashFlowsFromUsedInOperatingActivities")],
 "capex": [(G,"PaymentsToAcquirePropertyPlantAndEquipment"),(G,"PaymentsToAcquireProductiveAssets"),
           (G,"PaymentsToAcquireOilAndGasPropertyAndEquipment"),(G,"PaymentsToAcquireOilAndGasProperty"),
           (G,"PaymentsForCapitalImprovements"),(G,"PaymentsToAcquireOtherPropertyPlantAndEquipment"),(G,"PaymentsToAcquireRealEstate"),(G,"PaymentsToDevelopRealEstateAssets"),
           (I,"PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities"),(I,"PurchaseOfPropertyPlantAndEquipment"),
           (I,"PurchaseOfPropertyPlantAndEquipmentIntangibleAssetsOtherThanGoodwillInvestmentPropertyAndOtherNoncurrentAssets"),
           (I,"PurchaseOfOtherLongtermAssetsClassifiedAsInvestingActivities")],
 "div": [(G,"PaymentsOfDividendsCommonStock"),(G,"PaymentsOfDividends"),(G,"PaymentsOfOrdinaryDividends"),
         (G,"PaymentsOfDistributionsToAffiliates"),(G,"DistributionMadeToLimitedPartnerCashDistributionsPaid"),
         (I,"DividendsPaidClassifiedAsFinancingActivities"),(I,"DividendsPaidToEquityHoldersOfParentClassifiedAsFinancingActivities"),(I,"DividendsPaid")],
 "bb": [(G,"PaymentsForRepurchaseOfCommonStock"),(G,"PaymentsForRepurchaseOfEquity"),(I,"PaymentsToAcquireOrRedeemEntitysShares"),
        (I,"PurchaseOfTreasuryShares")],
 "icf": [(G,"NetCashProvidedByUsedInInvestingActivities"),(I,"CashFlowsFromUsedInInvestingActivities")],
 "issue": [(G,"ProceedsFromIssuanceOfCommonStock"),(G,"ProceedsFromIssuanceOrSaleOfEquity"),(I,"ProceedsFromIssuingShares")],
 "acq": [(G,"PaymentsToAcquireBusinessesNetOfCashAcquired"),(G,"PaymentsToAcquireBusinessesGross"),
         (I,"CashFlowsUsedInObtainingControlOfSubsidiariesOrOtherBusinessesClassifiedAsInvestingActivities")],
 "shs": [(G,"WeightedAverageNumberOfDilutedSharesOutstanding"),(G,"WeightedAverageNumberOfShareOutstandingBasicAndDiluted"),
         (G,"WeightedAverageNumberOfSharesOutstandingBasic"),(I,"AdjustedWeightedAverageShares"),(I,"WeightedAverageShares")],
 "eps": [(G,"EarningsPerShareDiluted"),(G,"EarningsPerShareBasicAndDiluted"),(I,"DilutedEarningsLossPerShare")],
 "rd": [(G,"ResearchAndDevelopmentExpense"),(G,"ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost"),(I,"ResearchAndDevelopmentExpense")],
 "nii": [(G,"InterestIncomeExpenseNet"),(G,"InterestIncomeExpenseAfterProvisionForLoanLoss")],
 "prov": [(G,"ProvisionForLoanLeaseAndOtherLosses"),(G,"ProvisionForLoanAndLeaseLosses"),(G,"ProvisionForCreditLosses"),
          (G,"CreditLossExpenseReversal"),(G,"ProvisionForLoanLossesExpensed")],
 "nonint_inc": [(G,"NoninterestIncome")],
 "nonint_exp": [(G,"NoninterestExpense")],
 "prem": [(G,"PremiumsEarnedNet"),(G,"PremiumsEarnedNetPropertyAndCasualty")],
 "claims": [(G,"PolicyholderBenefitsAndClaimsIncurredNet"),(G,"IncurredClaimsPropertyCasualtyAndLiability"),
            (G,"LiabilityForUnpaidClaimsAndClaimsAdjustmentExpenseIncurredClaims1")],
}
INST = {
 "assets": [(G,"Assets"),(I,"Assets")],
 "ca": [(G,"AssetsCurrent"),(I,"CurrentAssets")],
 "cl": [(G,"LiabilitiesCurrent"),(I,"CurrentLiabilities")],
 "liab": [(G,"Liabilities"),(I,"Liabilities")],
 "eq": [(G,"StockholdersEquity"),(G,"PartnersCapital"),(G,"StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"),
        (G,"PartnersCapitalIncludingPortionAttributableToNoncontrollingInterest"),(G,"MembersEquity"),
        (I,"EquityAttributableToOwnersOfParent"),(I,"Equity")],
 "cash": [(G,"CashAndCashEquivalentsAtCarryingValue"),(G,"CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"),(G,"Cash"),
          (G,"CashAndDueFromBanks"),(I,"CashAndCashEquivalents")],
 "sti": [(G,"ShortTermInvestments"),(G,"MarketableSecuritiesCurrent"),(G,"AvailableForSaleSecuritiesDebtSecuritiesCurrent"),
         (G,"ShortTermInvestmentsAndOtherInvestments"),(I,"CurrentFinancialAssetsAtFairValueThroughProfitOrLoss"),(I,"OtherCurrentFinancialAssets")],
 "ltd": [(G,"LongTermDebtNoncurrent"),(G,"LongTermDebt"),(G,"LongTermDebtAndCapitalLeaseObligations"),(G,"SeniorLongTermNotes"),
         (G,"LongTermDebtFairValue"),(G,"DebtInstrumentCarryingAmount"),(G,"LongTermNotesPayable"),
         (I,"NoncurrentPortionOfNoncurrentBorrowings"),(I,"LongtermBorrowings"),(I,"NoncurrentBorrowings"),(I,"Borrowings")],
 "std": [(G,"LongTermDebtCurrent"),(G,"DebtCurrent"),(G,"ShortTermBorrowings"),(G,"CommercialPaper"),
         (G,"LongTermDebtAndCapitalLeaseObligationsCurrent"),(I,"CurrentBorrowingsAndCurrentPortionOfNoncurrentBorrowings"),
         (I,"ShorttermBorrowings"),(I,"CurrentPortionOfLongtermBorrowings"),(I,"CurrentBorrowings")],
 "gw": [(G,"Goodwill"),(I,"Goodwill")],
 "intang": [(G,"IntangibleAssetsNetExcludingGoodwill"),(G,"FiniteLivedIntangibleAssetsNet"),(I,"IntangibleAssetsOtherThanGoodwill")],
 "ppe": [(G,"PropertyPlantAndEquipmentNet"),(G,"PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization"),
         (G,"RealEstateInvestmentPropertyNet"),(I,"PropertyPlantAndEquipment")],
 "inv": [(G,"InventoryNet"),(I,"Inventories")],
 "re": [(G,"RetainedEarningsAccumulatedDeficit"),(I,"RetainedEarnings")],
 "deposits": [(G,"Deposits")],
 "loans": [(G,"LoansAndLeasesReceivableNetReportedAmount"),(G,"FinancingReceivableExcludingAccruedInterestAfterAllowanceForCreditLoss"),
           (G,"LoansAndLeasesReceivableNetOfDeferredIncome")],
 "aoci": [(G,"AccumulatedOtherComprehensiveIncomeLossNetOfTax")],
 "htm_cost": [(G,"HeldToMaturitySecuritiesAmortizedCostAfterAllowanceForCreditLoss"),(G,"HeldToMaturitySecurities"),
              (G,"DebtSecuritiesHeldToMaturityAmortizedCostAfterAllowanceForCreditLoss"),
              (G,"DebtSecuritiesHeldToMaturityExcludingAccruedInterestAfterAllowanceForCreditLoss"),
              (G,"DebtSecuritiesHeldToMaturityExcludingAccruedInterestBeforeAllowanceForCreditLoss")],
 "htm_fv": [(G,"HeldToMaturitySecuritiesFairValue")],
 "htm_gain": [(G,"HeldToMaturitySecuritiesAccumulatedUnrecognizedHoldingGain")],
 "htm_lossu": [(G,"HeldToMaturitySecuritiesAccumulatedUnrecognizedHoldingLoss")],
 "oplease": [(G,"OperatingLeaseLiability")],
 "finlease": [(G,"FinanceLeaseLiability")],
 "nci": [(G,"MinorityInterest")],
 "pref": [(G,"PreferredStockValue"),(G,"PreferredStockValueOutstanding")],
}
D = dt.date.fromisoformat
ANN = {"10-K","10-K/A","20-F","20-F/A","40-F","40-F/A","10-KT"}; QF = {"10-Q","10-Q/A","6-K"}

def unit_rows(node):
    units = node.get("units", {})
    if not units: return None, []
    # monetary: prefer USD, else the most populated currency; shares / per-share handled by caller
    # reporting currency = most populated unit (TSM files TWD + a 1-yr USD convenience translation)
    u = max(units, key=lambda k: (len(units[k]), k == "USD")); return u, units[u]

FALLBACK = {"RevenueFromContractWithCustomerIncludingAssessedTax"}  # gross of excise: only if nothing else
def dur_tab(cf, tag_list, mode="priority"):
    """period (start,end) -> [val_latest, filed_first, unit, filed_latest]; merged across tags.
    priority: first tag wins per period. max (revenue): largest non-fallback tag per period, since a
    higher-priority tag can hold a subtotal for some years (GIS 'Revenues' = ~$2B segment 2019-24)."""
    out = {}; used = []
    if mode == "max":
        main = [t for t in tag_list if t[1] not in FALLBACK]; fb = [t for t in tag_list if t[1] in FALLBACK]
        a, ua = dur_tab_max(cf, main); b, ub = dur_tab(cf, fb)
        for k, v in b.items():
            if k not in a: a[k] = v
        return a, ua + ub
    for tax, tag in tag_list:
        node = cf.get("facts", {}).get(tax, {}).get(tag)
        if not node: continue
        u, rows = unit_rows(node)
        added = 0
        tmp = {}
        for r in rows:
            if "start" not in r or r.get("form") not in ANN | QF: continue
            k = (r["start"], r["end"])
            cur = tmp.get(k)
            if cur is None: tmp[k] = [r["val"], r["filed"], r["filed"]]
            else:
                if r["filed"] > cur[2]: cur[0] = r["val"]; cur[2] = r["filed"]
                if r["filed"] < cur[1]: cur[1] = r["filed"]
        for k, v in tmp.items():
            if k not in out: out[k] = [v[0], v[1], u, v[2]]; added += 1
        if added: used.append(tag)
    return out, used

def dur_tab_max(cf, tag_list):
    out = {}; used = []
    for tl in tag_list:
        t, u = dur_tab(cf, [tl])
        if t: used += u
        for k, v in t.items():
            if k not in out or (v[0] is not None and out[k][0] is not None and v[0] > out[k][0] and v[2] == out[k][2]): out[k] = v
    return out, used

def annual(t):
    a = {}
    for (s, e), v in t.items():
        if 350 <= (D(e) - D(s)).days <= 380:
            if e not in a or v[1] < a[e][1]: a[e] = v
    rows = sorted([[e, v[0], v[1], v[3]] for e, v in a.items()])  # end, value(latest), filed_first, filed_latest
    # stub/overlapping "annual" periods (e.g. EMR 2022-12-31 next to FY 2022-09-30): keep the larger of two ends < 120d apart
    out = []
    for r in rows:
        if out and (D(r[0]) - D(out[-1][0])).days < 120 and r[1] is not None and out[-1][1] is not None:
            if abs(r[1]) > abs(out[-1][1]): out[-1] = r
            continue
        out.append(r)
    return out

def repair_rev(pri, mx):
    """priority-tag revenue, repaired year by year walking back from the latest year: if a year breaks the
    series (x0.4 / x2.5 vs the next year) while the largest revenue tag for that year fits (x0.6-1.6), use it."""
    m = {r[0]: r for r in mx}; out = []; anchor = None
    for r in reversed(pri):
        if anchor and r[1] and not (0.4 <= r[1] / anchor <= 2.5) and r[0] in m and m[r[0]][1] and 0.6 <= m[r[0]][1] / anchor <= 1.6:
            r = m[r[0]]
        out.append(r); anchor = r[1] if r[1] else anchor
    return list(reversed(out))

def ttm(t):
    if not t: return None, None
    E = max(k[1] for k in t)
    c = [(k, v) for k, v in t.items() if k[1] == E]
    for (s, e), v in c:
        if 350 <= (D(e) - D(s)).days <= 380: return v[0], E
    (S, _), vy = max(c, key=lambda kv: (D(kv[0][1]) - D(kv[0][0])).days)
    L = (D(E) - D(S)).days
    fy = [v for k, v in t.items() if abs((D(k[1]) - (D(S) - dt.timedelta(days=1))).days) <= 7 and 350 <= (D(k[1]) - D(k[0])).days <= 380]
    py = [v for k, v in t.items() if abs((D(k[1]) - (D(E) - dt.timedelta(days=365))).days) <= 10 and abs((D(k[1]) - D(k[0])).days - L) <= 10]
    if fy and py: return fy[0][0] + vy[0] - py[0][0], E
    return None, E

def quarters(t, n=12):
    q = {}
    for (s, e), v in t.items():
        if 80 <= (D(e) - D(s)).days <= 100: q[e] = v[0]
    ks = sorted(q)[-n:]
    return [[k, q[k]] for k in ks]

def inst_tab(cf, tag_list):
    out = {}
    for tax, tag in tag_list:
        node = cf.get("facts", {}).get(tax, {}).get(tag)
        if not node: continue
        u, rows = unit_rows(node)
        for r in rows:
            if "start" in r or r.get("form") not in ANN | QF: continue
            e = r["end"]
            if e not in out: out[e] = [r["val"], r["filed"], r["form"] in ANN, u]
            else:
                cur = out[e]
                if r["filed"] < cur[1] and cur[3] == u: cur[1] = r["filed"]
                if r.get("form") in ANN: cur[2] = True
    return out

EXTRA = {"XOM": [34088], "BLK": [1364742], "PARA": [813828]}  # new holding-co CIK + predecessor CIK
def pull(tk, cik, out_dir):
    path = f"{out_dir}/{tk}.json"
    if os.path.exists(path): return tk, "cached"
    cf = get_json(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json")
    for c2 in EXTRA.get(tk, []):
        part = get_json(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{c2:010d}.json")
        for tax, concepts in part.get("facts", {}).items():
            dst = cf.setdefault("facts", {}).setdefault(tax, {})
            for nm, node in concepts.items():
                d = dst.setdefault(nm, {"units": {}})
                for u, rows in node.get("units", {}).items(): d["units"].setdefault(u, []).extend(rows)
    rec = {"t": tk, "cik": cik, "name": cf.get("entityName"), "ann": {}, "ttm": {}, "q": {}, "inst": {}, "inst_ann": {}, "tags": {}, "unit": {}}
    for k, tl in DUR.items():
        t, used = dur_tab(cf, tl, "priority")
        if not t: continue
        rec["tags"][k] = used; rec["unit"][k] = next(iter(t.values()))[2]
        rec["ann"][k] = annual(t)
        if k == "rev":  # keep the max-across-tags view too; compute.py picks per year using yfinance as referee
            tm, _ = dur_tab(cf, tl, "max")
            rec["ann"]["rev_max"] = annual(tm); vm, Em = ttm(tm); rec["ttm"]["rev_max"] = [vm, Em]
        v, E = ttm(t); rec["ttm"][k] = [v, E]
        rec["q"][k] = quarters(t)
    for k, tl in INST.items():
        t = inst_tab(cf, tl)
        if not t: continue
        e = max(t); rec["inst"][k] = [t[e][0], e]; rec["unit"]["i_" + k] = t[e][3]
        rec["inst_ann"][k] = sorted([[e, v[0], v[1]] for e, v in t.items() if v[2]])[-16:]
    dei = cf.get("facts", {}).get("dei", {}).get("EntityCommonStockSharesOutstanding", {}).get("units", {}).get("shares", [])
    if dei:
        agg = {}
        for r in dei:
            k = (r["end"], r.get("filed", ""), r.get("accn", ""))
            agg[k] = agg.get(k, 0) + r["val"]
        last = {}
        for (e, f, a), v in sorted(agg.items()): last[e] = v   # latest filing wins per date
        rec["shs_out"] = sorted([[e, v] for e, v in last.items()])[-40:]
    json.dump(rec, open(path, "w"), separators=(",", ":"))
    a = rec["ann"].get("rev", [])
    return tk, f"ok yrs={len(a)} last={a[-1][0] if a else None} unit={rec['unit'].get('rev')}"

def main():
    upath, mpath, out_dir = sys.argv[1:4]; W = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    u = json.load(open(upath)); m = {v["ticker"]: int(v["cik_str"]) for v in json.load(open(mpath)).values()}
    tks = [t for s in u.values() for i in s.values() for t in i]
    jobs = [(t, m[t]) for t in tks if t in m]
    print("missing", [t for t in tks if t not in m], flush=True)
    with ThreadPoolExecutor(W) as ex:
        futs = [ex.submit(pull, t, c, out_dir) for t, c in jobs]
        for f, (t, c) in zip(futs, jobs):
            try: print(*f.result(), flush=True)
            except Exception as e: print(t, "ERR", repr(e)[:150], flush=True)

if __name__ == "__main__":
    main()
