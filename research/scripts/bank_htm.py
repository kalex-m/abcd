"""Held-to-maturity securities: amortized cost vs fair value (unrealized loss NOT in AOCI/TBV). SEC XBRL.
Usage: python3 -I bank_htm.py <out_json>"""
import json, sys, time, gzip, urllib.request
UA = "abcd-research research-bot@example.com"
CIK = {"JPM":19617,"BAC":70858,"WFC":72971,"C":831001,"GS":886982,"MS":895421,"USB":36104,"PNC":713676,"COF":927628}
FV = ["DebtSecuritiesHeldToMaturityFairValue","HeldToMaturitySecuritiesFairValue"]
AC = ["DebtSecuritiesHeldToMaturityAmortizedCostAfterAllowanceForCreditLoss","HeldToMaturitySecurities","DebtSecuritiesHeldToMaturityExcludingAccruedInterestBeforeAllowanceForCreditLoss","HeldToMaturitySecuritiesAmortizedCostBeforeOtherThanTemporaryImpairment"]
UL = ["HeldToMaturitySecuritiesAccumulatedUnrecognizedHoldingLoss","DebtSecuritiesHeldToMaturityAccumulatedUnrecognizedHoldingLoss"]
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req, timeout=90) as r:
        d = r.read(); d = gzip.decompress(d) if r.headers.get("Content-Encoding") == "gzip" else d
    return json.loads(d)
def latest(cf, tags):
    best = None
    for t in tags:
        for r in cf["facts"].get("us-gaap", {}).get(t, {}).get("units", {}).get("USD", []):
            if "start" in r or r.get("form") not in ("10-Q","10-K"): continue
            if best is None or (r["end"], r["filed"]) > (best[1]["end"], best[1]["filed"]): best = (t, r)
    return best
out = {}
for t, c in CIK.items():
    cf = get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{c:010d}.json"); time.sleep(0.3)
    fv = latest(cf, FV); ac = latest(cf, AC); ul = latest(cf, UL)
    rec = {"fv": fv[1]["val"] if fv else None, "fv_end": fv[1]["end"] if fv else None, "ac": ac[1]["val"] if ac else None, "ac_end": ac[1]["end"] if ac else None,
           "ul": ul[1]["val"] if ul else None, "ul_end": ul[1]["end"] if ul else None}
    if rec["fv"] and rec["ac"] and rec["fv_end"] == rec["ac_end"]: rec["htm_loss"] = rec["ac"] - rec["fv"]
    elif rec["ul"]: rec["htm_loss"] = rec["ul"]
    out[t] = rec
    print(t, {k: (round(v/1e9,1) if isinstance(v,(int,float)) else v) for k, v in rec.items()})
json.dump(out, open(sys.argv[1], "w"))
