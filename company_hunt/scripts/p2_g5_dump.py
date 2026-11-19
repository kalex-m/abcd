#!/usr/bin/env python3
"""Dump candidate segment revenue / profit tables per ticker from data/g5seg/*.json so a human can pick tags and map renamed segments.
Usage: python3 scripts/p2_g5_dump.py TICKER [TICKER ...]   (or ALL)"""
import sys, json, glob, os, re, collections
D = "/home/user/abcd/company_hunt/data/g5seg"
EXCL = re.compile(r"^Corporate(Member|NonSegment\w*|Segment\w*|AndOther\w*|Other\w*|AndElimination\w*|AndReconcil\w*|Activities\w*|Items\w*|AndUnallocated\w*|Expense\w*|Functions\w*)$|Elimination|Intersegment|Reconcil|Unallocated|Consolidat|NonSegment|TotalSegment|SegmentTotal|^OperatingSegmentsMember$|^SegmentsMember$|^ReportableSegment", re.I)
REV = re.compile(r"(^us-gaap:(Revenues|RevenueFromContractWithCustomerExcludingAssessedTax|RevenueFromContractWithCustomerIncludingAssessedTax|RevenuesNetOfInterestExpense|SalesRevenueNet|SalesRevenueGoodsNet|PremiumsEarnedNet|InterestIncomeExpenseNet|NoninterestIncome|BenefitsLossesAndExpenses)$)|(:\w*(Revenue|Sales)\w*$)", re.I)
PRF = re.compile(r"(^us-gaap:(OperatingIncomeLoss|NetIncomeLoss|IncomeLossFromContinuingOperationsBeforeIncomeTaxes\w*|GrossProfit)$)|SegmentProfit|SegmentOperating|OperatingProfit|SegmentEarnings|SegmentIncome|EBITDA|OperatingEarnings|AdjustedEarnings|PretaxIncome|AdjustedOperatingIncome|SegmentAdjusted", re.I)

def load(t):
    d = json.load(open(f"{D}/{t}.json"))
    by = collections.defaultdict(dict)
    for tag, seg, end, v, url in d["facts"]:
        by[(tag, seg)][end[:7]] = v
    return d, by

def dump(t):
    d, by = load(t)
    print(f"\n==================== {t}  docs: " + ", ".join(x['period'][:7] for x in d['docs']))
    tags = collections.Counter(k[0] for k in by)
    for kind, rx in (("REV", REV), ("PRF", PRF)):
        cands = [tg for tg in tags if rx.search(tg) and not re.search(r"Cost|Expense|Percent|Deferred|Unearned|Ratio|Margin|IncomeTax|TaxExpense", tg.split(":")[1])]
        cov = lambda tg: sum(len(by[k]) for k in by if k[0] == tg and not EXCL.search(k[1].split("|")[1]))
        cands = [tg for tg in cands if len([k for k in by if k[0] == tg and not EXCL.search(k[1].split("|")[1])]) >= 2]
        cands.sort(key=lambda tg: (0 if tg.startswith("us-gaap:") and kind == "REV" else (0 if re.search("Segment", tg) else 1), -cov(tg)))
        for tg in cands[:2]:
            segs = [k[1] for k in by if k[0] == tg]
            ends = sorted(set(e for k in by if k[0] == tg for e in by[k]))
            print(f"-- {kind} {tg}  | " + " ".join(f"{e:>8s}" for e in ends))
            for sg in sorted(segs):
                vals = [by[(tg, sg)].get(e) for e in ends]
                flag = "x" if EXCL.search(sg.split("|")[1]) else " "
                print(f" {flag}{sg.split('|')[0][:22]:22s} {sg.split('|')[1][:48]:48s} " + " ".join(f"{v/1e6:>8,.0f}" if v is not None else f"{'-':>8s}" for v in vals))

if __name__ == "__main__":
    ts = sys.argv[1:]
    if ts == ["ALL"]: ts = sorted(os.path.basename(f)[:-5] for f in glob.glob(f"{D}/*.json"))
    for t in ts:
        try: dump(t)
        except Exception as e: print(t, "ERR", e)
