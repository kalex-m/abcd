"""Phase 2 data: SEC EDGAR XBRL frames API, one call per concept-period, all filers at once.
Saves data/sec/frames/<taxonomy>_<concept>_<unit>_<period>.json (compact: cik -> [val, end, accn, form? filed?]).
Usage: python3 scripts/p2_frames.py
"""
import json, os, time, gzip, urllib.request, urllib.error

ROOT = "/home/user/abcd/company_hunt"
OUT = f"{ROOT}/data/sec/frames"; os.makedirs(OUT, exist_ok=True)
UA = "AlexBungabong research alex-research@example.com"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    for att in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                b = r.read()
                if r.headers.get("Content-Encoding") == "gzip": b = gzip.decompress(b)
                return json.loads(b)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(2 * (att + 1))
        except Exception:
            time.sleep(2 * (att + 1))
    return None

DUR_USD = [
 "Revenues","RevenueFromContractWithCustomerExcludingAssessedTax","RevenueFromContractWithCustomerIncludingAssessedTax",
 "SalesRevenueNet","RevenuesNetOfInterestExpense","InterestAndDividendIncomeOperating","NoninterestIncome","InterestIncomeExpenseNet",
 "GrossProfit","CostOfRevenue","CostOfGoodsAndServicesSold","OperatingIncomeLoss","NetIncomeLoss","ProfitLoss",
 "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
 "IncomeTaxExpenseBenefit","InterestExpense","InterestExpenseNonoperating","InterestExpenseDebt",
 "NetCashProvidedByUsedInOperatingActivities","PaymentsToAcquirePropertyPlantAndEquipment","PaymentsToAcquireProductiveAssets",
 "ShareBasedCompensation","AllocatedShareBasedCompensationExpense","PaymentsForRepurchaseOfCommonStock",
 "PaymentsOfDividendsCommonStock","PaymentsOfDividends","DepreciationDepletionAndAmortization","DepreciationAndAmortization",
 "DepreciationAmortizationAndAccretionNet","PaymentsToAcquireBusinessesNetOfCashAcquired","ResearchAndDevelopmentExpense",
 "ProvisionForLoanLeaseAndOtherLosses","NoninterestExpense",
 "RestructuringCharges","GoodwillImpairmentLoss","AssetImpairmentCharges","ProceedsFromDivestitureOfBusinesses",
 "ProceedsFromIssuanceOfCommonStock","IncomeLossFromEquityMethodInvestments","SellingGeneralAndAdministrativeExpense",
 "PaymentsToDevelopSoftware","PaymentsForSoftware",
]
DUR_SH = ["WeightedAverageNumberOfDilutedSharesOutstanding","WeightedAverageNumberOfShareOutstandingBasicAndDiluted","WeightedAverageNumberOfSharesOutstandingBasic"]
DUR_EPS = ["EarningsPerShareDiluted"]
INST_USD = [
 "Assets","StockholdersEquity","CashAndCashEquivalentsAtCarryingValue","CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
 "ShortTermInvestments","MarketableSecuritiesCurrent","AvailableForSaleSecuritiesDebtSecuritiesCurrent","LongTermInvestments",
 "LongTermDebt","LongTermDebtNoncurrent","LongTermDebtCurrent","DebtCurrent","ShortTermBorrowings","CommercialPaper",
 "LongTermDebtAndCapitalLeaseObligations","OperatingLeaseLiability","FinanceLeaseLiability","Goodwill","IntangibleAssetsNetExcludingGoodwill",
 "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest","AssetsCurrent","LiabilitiesCurrent","Liabilities","DefinedBenefitPlanFundedStatusOfPlan","EquityMethodInvestments",
 "LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths","LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo",
 "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree","Deposits","PropertyPlantAndEquipmentNet","InventoryNet",
 "RetainedEarningsAccumulatedDeficit","TreasuryStockValue","LossContingencyAccrualAtCarryingValue","UnrecognizedTaxBenefits",
 "RevenueRemainingPerformanceObligation","ContractWithCustomerLiability","AccountsReceivableNetCurrent","AccountsPayableCurrent",
]
YEARS = list(range(2014, 2027))
jobs = []
for c in DUR_USD: jobs += [("us-gaap", c, "USD", f"CY{y}") for y in YEARS]
for c in DUR_SH: jobs += [("us-gaap", c, "shares", f"CY{y}") for y in YEARS]
for c in DUR_EPS: jobs += [("us-gaap", c, "USD-per-shares", f"CY{y}") for y in YEARS]
for c in INST_USD: jobs += [("us-gaap", c, "USD", f"CY{y}Q4I") for y in YEARS[:-1]] + [("us-gaap", c, "USD", p) for p in ("CY2026Q1I","CY2026Q2I","CY2026Q3I")]
jobs += [("dei", "EntityCommonStockSharesOutstanding", "shares", p) for p in ("CY2025Q3I","CY2025Q4I","CY2026Q1I","CY2026Q2I","CY2026Q3I","CY2026Q4I")]
# quarterly duration for TTM revenue / NI / OI
for c in ["Revenues","RevenueFromContractWithCustomerExcludingAssessedTax","OperatingIncomeLoss","NetIncomeLoss","GrossProfit"]:
    jobs += [("us-gaap", c, "USD", f"CY{y}Q{q}") for y in (2024, 2025, 2026) for q in (1, 2, 3, 4)]
print("jobs", len(jobs), flush=True)
n = 0
for tax, c, u, p in jobs:
    fn = f"{OUT}/{tax}_{c}_{u}_{p}.json"
    if os.path.exists(fn): continue
    t0 = time.time()
    j = get(f"https://data.sec.gov/api/xbrl/frames/{tax}/{c}/{u}/{p}.json")
    comp = {}
    if j:
        for r in j.get("data", []):
            comp[str(r["cik"])] = [r["val"], r.get("end"), r.get("start"), r.get("accn")]
    json.dump(comp, open(fn, "w"))
    n += 1
    if n % 50 == 0: print(n, c, p, len(comp), flush=True)
    dt = time.time() - t0
    if dt < 0.15: time.sleep(0.15 - dt)
print("frames done", n, flush=True)
