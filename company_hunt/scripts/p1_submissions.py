"""Phase 1c: EDGAR submissions JSON per CIK: first filing date, SIC, filer category, form counts,
8-K item 4.01/4.02 hits (last 5y), Form 4 counts, SC 13D/G counts, latest 10-K/10-Q/20-F accession + dates.
Usage: python3 scripts/p1_submissions.py <ciks.txt> <out.json>"""
import sys, json, os, time, gzip, urllib.request, collections, datetime as dt
UA = "AlexBungabong research alex-research@example.com"
src, out = sys.argv[1], sys.argv[2]
ciks = [l.strip() for l in open(src) if l.strip()]
res = json.load(open(out)) if os.path.exists(out) else {}
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    for att in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                b = r.read()
                if r.headers.get("Content-Encoding") == "gzip": b = gzip.decompress(b)
                return json.loads(b)
        except Exception as e:
            time.sleep(2 * (att + 1))
    return None
cut5 = (dt.date.today() - dt.timedelta(days=5 * 365)).isoformat()
cut3 = (dt.date.today() - dt.timedelta(days=3 * 365)).isoformat()
n = 0
for cik in ciks:
    if cik in res: continue
    t0 = time.time()
    j = get(f"https://data.sec.gov/submissions/CIK{int(cik):010d}.json")
    if not j: res[cik] = {"err": "fetch"}; continue
    rec = j["filings"]["recent"]
    forms = rec["form"]; dates = rec["filingDate"]; items = rec.get("items", [""] * len(forms)); accs = rec["accessionNumber"]; docs = rec["primaryDocument"]
    older = j["filings"].get("files", [])
    first = min([f.get("filingFrom") for f in older if f.get("filingFrom")] + [min(dates)] if dates else ["9999"])
    fc = collections.Counter(); hits = []; ic = collections.Counter(); f4dates = []
    latest = {}
    for f, d, it, a, doc in zip(forms, dates, items, accs, docs):
        if d >= cut3: fc[f] += 1
        if f == "8-K" and d >= cut3 and it:
            for x in it.split(','): ic[x.strip()] += 1
        if f == "4" and d >= cut3: f4dates.append(d)
        if f in ("8-K", "8-K/A") and d >= cut5 and it and ("4.01" in it or "4.02" in it):
            hits.append([d, it, a])
        if f in ("10-K", "20-F", "40-F", "10-Q", "DEF 14A", "6-K") and f not in latest:
            latest[f] = [d, a, doc]
    res[cik] = {
        "name": j.get("name"), "sic": j.get("sic"), "sicDescription": j.get("sicDescription"), "category": j.get("category"),
        "fiscalYearEnd": j.get("fiscalYearEnd"), "stateOfIncorporation": j.get("stateOfIncorporation"), "tickers": j.get("tickers"),
        "exchanges": j.get("exchanges"), "former": [x.get("name") for x in j.get("formerNames", [])][:5], "first_filing": first,
        "forms_3y": dict(fc), "items_8k_3y": dict(ic), "n_form4_3y": len(f4dates), "item_401_402_5y": hits, "latest": latest, "website": j.get("website"), "investorWebsite": j.get("investorWebsite"),
    }
    n += 1
    if n % 100 == 0:
        json.dump(res, open(out, "w")); print("subs", n, flush=True)
    dtt = time.time() - t0
    if dtt < 0.13: time.sleep(0.13 - dtt)
json.dump(res, open(out, "w")); print("subs done", len(res), flush=True)
