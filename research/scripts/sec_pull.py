"""Pull SEC EDGAR XBRL companyfacts and extract standardized annual + TTM metrics.
Usage: python3 -I sec_pull.py <out_dir> <ticker_map.json> TICKER [TICKER ...]
Writes <out_dir>/<TICKER>.json (extracted only; raw facts not stored)."""
import json, sys, time, gzip, urllib.request, datetime as dt

UA = "abcd-research research-bot@example.com"
def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    data = gzip.decompress(data)
            return json.loads(data)
        except Exception as e:
            if attempt == 3: raise
            time.sleep(1.5 * (attempt + 1))

DUR = {  # name -> candidate us-gaap tags (first with good coverage wins)
 "rev": ["Revenues","RevenueFromContractWithCustomerExcludingAssessedTax","RevenueFromContractWithCustomerIncludingAssessedTax","SalesRevenueNet","RevenuesNetOfInterestExpense"],
 "gp": ["GrossProfit"],
 "oi": ["OperatingIncomeLoss"],
 "pbt": ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest","IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments","IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"],
 "tax": ["IncomeTaxExpenseBenefit"],
 "ni": ["NetIncomeLoss","NetIncomeLossAvailableToCommonStockholdersBasic","ProfitLoss"],
 "ni_common": ["NetIncomeLossAvailableToCommonStockholdersBasic","NetIncomeLoss"],
 "int": ["InterestExpense","InterestExpenseNonoperating","InterestExpenseDebt","InterestPaidNet"],
 "da": ["DepreciationDepletionAndAmortization","DepreciationAmortizationAndAccretionNet","DepreciationAndAmortization","DepreciationDepletionAndAmortizationPropertyPlantAndEquipment","Depreciation"],
 "sbc": ["ShareBasedCompensation","AllocatedShareBasedCompensationExpense"],
 "ocf": ["NetCashProvidedByUsedInOperatingActivities","NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"],
 "capex": ["PaymentsToAcquirePropertyPlantAndEquipment","PaymentsToAcquireProductiveAssets","PaymentsToAcquireOilAndGasPropertyAndEquipment","PaymentsToAcquireOilAndGasProperty","PaymentsForCapitalImprovements"],
 "div": ["PaymentsOfDividendsCommonStock","PaymentsOfDividends","PaymentsOfOrdinaryDividends"],
 "bb": ["PaymentsForRepurchaseOfCommonStock","PaymentsForRepurchaseOfEquity"],
 "acq": ["PaymentsToAcquireBusinessesNetOfCashAcquired","PaymentsToAcquireBusinessesGross"],
 "shs": ["WeightedAverageNumberOfDilutedSharesOutstanding"],
 "nii": ["InterestIncomeExpenseNet","InterestIncomeExpenseAfterProvisionForLoanLoss"],
 "prov": ["ProvisionForLoanLeaseAndOtherLosses","ProvisionForLoanAndLeaseLosses","ProvisionForCreditLosses","CreditLossExpenseReversal","ProvisionForLoanLossesExpensed"],
 "nonint_exp": ["NoninterestExpense"],
 "nonint_inc": ["NoninterestIncome"],
}
INST = {
 "assets": ["Assets"], "eq": ["StockholdersEquity"], "eq_total": ["StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
 "cash": ["CashAndCashEquivalentsAtCarryingValue","CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents","Cash"],
 "sti": ["ShortTermInvestments","MarketableSecuritiesCurrent","AvailableForSaleSecuritiesDebtSecuritiesCurrent"],
 "ltd": ["LongTermDebtNoncurrent","LongTermDebt","LongTermDebtAndCapitalLeaseObligations","SeniorLongTermNotes"],
 "std": ["LongTermDebtCurrent","DebtCurrent","ShortTermBorrowings","CommercialPaper","LongTermDebtAndCapitalLeaseObligationsCurrent"],
 "gw": ["Goodwill"], "intang": ["IntangibleAssetsNetExcludingGoodwill","FiniteLivedIntangibleAssetsNet"],
 "pref": ["PreferredStockValue","PreferredStockValueOutstanding"],
 "deposits": ["Deposits"], "loans": ["LoansAndLeasesReceivableNetReportedAmount","FinancingReceivableExcludingAccruedInterestAfterAllowanceForCreditLoss","LoansAndLeasesReceivableNetOfDeferredIncome"],
 "aoci": ["AccumulatedOtherComprehensiveIncomeLossNetOfTax"],
 "ppe": ["PropertyPlantAndEquipmentNet"], "inventory": ["InventoryNet"], "ar": ["AccountsReceivableNetCurrent"],
 "oplease": ["OperatingLeaseLiability"], "finlease": ["FinanceLeaseLiability"],
}
D = lambda s: dt.date.fromisoformat(s)
ANN_FORMS = {"10-K","10-K/A","20-F","40-F","10-KT"}; Q_FORMS = {"10-Q","10-Q/A"}

def facts_for(cf, tag, unit_pref=("USD","shares")):
    node = cf.get("facts", {}).get("us-gaap", {}).get(tag)
    if not node: return []
    units = node.get("units", {})
    for u in unit_pref:
        if u in units: return units[u]
    return []

def dur_table(rows):
    """{(start,end): (val, filed, form)} keeping latest filed"""
    t = {}
    for r in rows:
        if "start" not in r or r.get("form") not in ANN_FORMS | Q_FORMS: continue
        k = (r["start"], r["end"])
        if k not in t or r["filed"] > t[k][1]: t[k] = (r["val"], r["filed"], r["form"])
    return t

def series(cf, tags):
    best = None
    for tag in tags:
        rows = facts_for(cf, tag)
        if not rows: continue
        t = dur_table(rows)
        if not t: continue
        latest_end = max(k[1] for k in t)
        n_ann = sum(1 for (s, e) in t if 350 <= (D(e) - D(s)).days <= 380 and e >= "2023-01-01")
        score = (latest_end >= "2026-03-01", n_ann >= 2, latest_end, n_ann, len(t))
        if best is None or score > best[0]: best = (score, tag, t)
    return (best[1], best[2]) if best else (None, {})

def annual(t, n=6):
    out = {}
    for (s, e), (v, f, form) in t.items():
        days = (D(e) - D(s)).days
        if 350 <= days <= 380: out[e] = v
    ks = sorted(out)[-n:]
    return [(k, out[k]) for k in ks]

def ttm(t):
    if not t: return None, None
    ends = sorted({k[1] for k in t})
    E = ends[-1]
    cands = [(k, v) for k, v in t.items() if k[1] == E]
    # prefer annual at E
    for (s, e), (v, f, form) in cands:
        if 350 <= (D(e) - D(s)).days <= 380: return v, E
    # YTD at E: longest duration < 350
    ytd = max(cands, key=lambda kv: (D(kv[0][1]) - D(kv[0][0])).days)
    (S, _), (vy, _, _) = ytd
    # prior FY ending day before S
    fy = [(k, v) for k, v in t.items() if abs((D(k[1]) - (D(S) - dt.timedelta(days=1))).days) <= 7 and 350 <= (D(k[1]) - D(k[0])).days <= 380]
    py = [(k, v) for k, v in t.items() if abs((D(k[1]) - (D(E) - dt.timedelta(days=365))).days) <= 10 and abs(((D(k[1]) - D(k[0])).days) - (D(E) - D(S)).days) <= 10]
    if fy and py:
        return fy[0][1][0] + vy - py[0][1][0], E
    return None, E

def last_q(t):
    """latest 3-month value"""
    qs = {(s, e): v for (s, e), (v, f, form) in t.items() if 80 <= (D(e) - D(s)).days <= 100}
    if not qs: return None, None
    k = max(qs, key=lambda k: k[1]); return qs[k], k[1]

def instant(cf, tags):
    best = None
    for tag in tags:
        rows = [r for r in facts_for(cf, tag) if "start" not in r and r.get("form") in ANN_FORMS | Q_FORMS]
        if not rows: continue
        r = max(rows, key=lambda r: (r["end"], r["filed"]))
        if best is None or r["end"] > best[1]["end"]: best = (tag, r)
    return (best[1]["val"], best[1]["end"], best[0]) if best else (None, None, None)

def main():
    out_dir, tmap_path, *tickers = sys.argv[1:]
    tmap = {v["ticker"].upper(): int(v["cik_str"]) for v in json.load(open(tmap_path)).values()}
    for tk in tickers:
        extra = []
        if "=" in tk:
            tk, ciks = tk.split("="); extra = [int(c) for c in ciks.split("+")]
        q = tk.replace(".", "-").upper()
        cik = tmap.get(q) or tmap.get(tk.upper())
        if not cik and not extra: print(tk, "NO CIK"); continue
        ciks = list(dict.fromkeys(([cik] if cik else []) + extra))
        cf = None
        try:
            for c in ciks:
                part = get_json(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{c:010d}.json")
                if cf is None: cf = part; continue
                for tax, concepts in part.get("facts", {}).items():
                    dst = cf.setdefault("facts", {}).setdefault(tax, {})
                    for name, node in concepts.items():
                        d = dst.setdefault(name, {"units": {}})
                        for u, rows in node.get("units", {}).items():
                            d["units"].setdefault(u, []).extend(rows)
                time.sleep(0.2)
        except Exception as e:
            print(tk, "ERR", repr(e)[:120]); continue
        rec = {"t": tk, "cik": cik, "name": cf.get("entityName"), "tags": {}, "ann": {}, "ttm": {}, "lastq": {}, "inst": {}}
        for k, tags in DUR.items():
            tag, t = series(cf, tags)
            if not tag: continue
            rec["tags"][k] = tag
            rec["ann"][k] = annual(t)
            v, E = ttm(t); rec["ttm"][k] = v; rec["ttm"]["_end_" + k] = E
            lq, le = last_q(t); rec["lastq"][k] = lq; rec["lastq"]["_end_" + k] = le
        for k, tags in INST.items():
            v, e, tag = instant(cf, tags)
            if v is not None: rec["inst"][k] = v; rec["inst"]["_end_" + k] = e; rec["tags"]["i_" + k] = tag
        dei = cf.get("facts", {}).get("dei", {}).get("EntityCommonStockSharesOutstanding", {}).get("units", {}).get("shares", [])
        if dei:
            r = max(dei, key=lambda r: (r["end"], r["filed"])); rec["inst"]["shs_out"] = r["val"]; rec["inst"]["_end_shs_out"] = r["end"]
        json.dump(rec, open(f"{out_dir}/{tk}.json", "w"))
        a = rec["ann"].get("rev", [])
        print(f"{tk:6} cik={cik} rev_ann={[round(v/1e9,1) for _,v in a][-3:]} ttm_rev={round((rec['ttm'].get('rev') or 0)/1e9,1)} end={rec['ttm'].get('_end_rev')} ni_ttm={round((rec['ttm'].get('ni') or 0)/1e9,2)} ocf_ttm={round((rec['ttm'].get('ocf') or 0)/1e9,2)} capex_ttm={round((rec['ttm'].get('capex') or 0)/1e9,2)}")
        time.sleep(0.25)

if __name__ == "__main__":
    main()
