"""Berkshire Hathaway 13F holdings history from SEC EDGAR (primary source).
Usage: python3 -I brk_13f.py <out_json>"""
import json, sys, time, gzip, urllib.request, re
import xml.etree.ElementTree as ET
UA = "abcd-research research-bot@example.com"
def get(url, as_json=True):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
        if r.headers.get("Content-Encoding") == "gzip": data = gzip.decompress(data)
    time.sleep(0.2)
    return json.loads(data) if as_json else data
sub = get("https://data.sec.gov/submissions/CIK0001067983.json")
rec = sub["filings"]["recent"]
rows = [(rec["form"][i], rec["accessionNumber"][i], rec["reportDate"][i], rec["filingDate"][i]) for i in range(len(rec["form"])) if rec["form"][i] in ("13F-HR", "13F-HR/A")]
rows = [r for r in rows if r[2] >= "2023-06-30"]
out = {}
for form, acc, period, filed in sorted(rows, key=lambda r: (r[2], r[3])):
    base = f"https://www.sec.gov/Archives/edgar/data/1067983/{acc.replace('-', '')}/"
    try:
        idx = get(base + "index.json")
        xmls = [it["name"] for it in idx["directory"]["item"] if it["name"].lower().endswith(".xml") and "primary_doc" not in it["name"].lower()]
        holdings = {}
        for x in xmls:
            raw = get(base + x, as_json=False)
            root = ET.fromstring(raw)
            for it in root.iter():
                if it.tag.split('}')[-1] != "infoTable": continue
                g = {c.tag.split('}')[-1]: c for c in it}
                name = g["nameOfIssuer"].text.strip()
                cls = g.get("titleOfClass").text.strip() if g.get("titleOfClass") is not None else ""
                val = float(g["value"].text)
                sh = 0.0
                for c in g["shrsOrPrnAmt"]:
                    if c.tag.split('}')[-1] == "sshPrnamt": sh = float(c.text)
                key = f"{name} | {cls}"
                h = holdings.setdefault(key, {"sh": 0.0, "val": 0.0})
                h["sh"] += sh; h["val"] += val
        tag = period + (" A" if form.endswith("/A") else "")
        out[tag] = {"filed": filed, "form": form, "n": len(holdings), "total_val": sum(h["val"] for h in holdings.values()), "h": holdings}
        print(tag, filed, form, "positions", len(holdings), "total $B", round(out[tag]["total_val"]/1e9, 1))
    except Exception as e:
        print("ERR", period, acc, repr(e)[:150])
json.dump(out, open(sys.argv[1], "w"))
