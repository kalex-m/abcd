#!/usr/bin/env python3
"""Ground 7 evidence pull: RPO series, latest-quarter revenue/OI vs year-ago, backlog mentions in latest 10-Q/10-K.
Writes one JSON per ticker to data/g7_evidence/ (skips existing). Uses edgar_tool (EDGAR UA + throttle)."""
import sys, json, os, re, datetime as dt
sys.path.insert(0, "/home/user/abcd/company_hunt/scripts")
import edgar_tool as E
OUT = "/home/user/abcd/company_hunt/data/g7_evidence"
REV_TAGS = ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet", "RevenueFromContractWithCustomerIncludingAssessedTax", "RevenuesNetOfInterestExpense"]
OI_TAGS = ["OperatingIncomeLoss"]
RPO_TAGS = ["RevenueRemainingPerformanceObligation"]

def series(facts, tag, kind):
    for tax in ("us-gaap", "ifrs-full"):
        node = facts.get(tax, {}).get(tag)
        if not node: continue
        for unit, rows in node["units"].items():
            if unit not in ("USD",): continue
            seen = {}
            for r in rows:
                if r.get("form") not in ("10-K", "10-K/A", "10-Q", "10-Q/A", "20-F", "40-F", "6-K"): continue
                st = r.get("start"); en = r["end"]
                if kind == "I":
                    if st: continue
                else:
                    if not st: continue
                    days = (dt.date.fromisoformat(en) - dt.date.fromisoformat(st)).days
                    if kind == "Q" and not (80 <= days <= 100): continue
                    if kind == "FY" and not (350 <= days <= 380): continue
                k = (st, en)
                if k not in seen or r["filed"] > seen[k]["filed"]: seen[k] = r
            out = sorted(seen.values(), key=lambda r: r["end"])
            if out: return [(r.get("start"), r["end"], r["val"], r["form"], r["filed"], r.get("accn")) for r in out]
    return []

def yoy(ser):
    """latest point and the point ~1 year earlier"""
    if not ser: return None
    last = ser[-1]; le = dt.date.fromisoformat(last[1])
    best = None
    for s in ser[:-1]:
        d = (le - dt.date.fromisoformat(s[1])).days
        if 330 <= d <= 400: best = s
    return {"latest": last, "prior": best, "growth": (last[2] / best[2] - 1) if best and best[2] else None}

def run(t):
    fn = f"{OUT}/{t}.json"
    if os.path.exists(fn): return
    res = {"ticker": t}
    try:
        cik = E.cik_of(t); res["cik"] = cik
        j = json.loads(E.fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json"))
        f = j["facts"]
        for tg in RPO_TAGS:
            s = series(f, tg, "I")
            if s: res["rpo"] = yoy(s); res["rpo_tag"] = tg; break
        best = None
        for tg in REV_TAGS:
            s = series(f, tg, "Q")
            if s and (best is None or s[-1][1] > best[1][-1][1]): best = (tg, s)
        if best: res["rev_q"] = yoy(best[1]); res["rev_tag"] = best[0]
        s = series(f, "OperatingIncomeLoss", "Q")
        if s: res["oi_q"] = yoy(s)
        # latest periodic report
        jj, rows = E.submissions(cik)
        for form, d, acc, it, doc, rd in rows:
            if form in ("10-Q", "10-K", "20-F", "40-F"):
                url = E.doc_url(cik, acc, doc); res["latest_report"] = {"form": form, "filed": d, "period": rd, "url": url}
                try:
                    txt = E.to_text(E.fetch(url))
                    hits = []
                    last_e = -1
                    for mm in re.finditer(r"backlog|remaining performance obligation|orders", txt, flags=re.I):
                        s0, e0 = max(0, mm.start() - 300), min(len(txt), mm.end() + 400)
                        if s0 < last_e: continue
                        seg = txt[s0:e0].replace("\n", " ")
                        if re.search(r"\$\s?[\d,.]+\s*(billion|million)|\d{1,3}(,\d{3})+|\d+(\.\d)?%", seg) and not re.search(r"forward-looking|Exchange Act", seg):
                            hits.append(seg); last_e = e0
                        if len(hits) >= 14: break
                    res["backlog_hits"] = hits
                except Exception as ex:
                    res["doc_err"] = str(ex)
                break
    except SystemExit as ex:
        res["err"] = str(ex)
    except Exception as ex:
        res["err"] = repr(ex)
    json.dump(res, open(fn, "w"), indent=1, default=str)

if __name__ == "__main__":
    for t in sys.argv[1:]:
        run(t); print(t, "done", flush=True)
