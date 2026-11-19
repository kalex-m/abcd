#!/usr/bin/env python3
"""Ground 5 (Many-Weathers): pull every single-segment-dimension annual fact from the last N 10-K inline-XBRL docs.
Usage: python3 scripts/p2_g5_fetch.py N TICKER [TICKER ...]
Writes data/g5seg/TICKER.json = {ticker, cik, docs:[{date,url}], facts:[[tag, segment, period_end, value, url]]}.
Newer filings overwrite older values for the same (tag, segment, period_end), so recast numbers win."""
import sys, os, json, re
sys.path.insert(0, "/home/user/abcd/company_hunt/scripts")
import edgar_tool as E

import datetime as dt

def parse(raw):
    """Like edgar_tool.parse_ixbrl_segments but keeps the axis name and accepts only business-segment axes
    (StatementBusinessSegmentsAxis or a company-specific segment axis), never loan-portfolio segment axes."""
    ctx = {}
    for m in re.finditer(r'<xbrli:context id="([^"]+)">(.*?)</xbrli:context>', raw, re.S):
        cid, body = m.group(1), m.group(2)
        mems = re.findall(r'<xbrldi:explicitMember dimension="([^"]+)">([^<]+)</xbrldi:explicitMember>', body)
        sd = re.search(r"<xbrli:startDate>([^<]+)</xbrli:startDate>", body); ed = re.search(r"<xbrli:endDate>([^<]+)</xbrli:endDate>", body)
        if not sd or not ed: continue
        days = (dt.date.fromisoformat(ed.group(1).strip()) - dt.date.fromisoformat(sd.group(1).strip())).days
        if days < 330 or days > 400: continue
        ctx[cid] = (ed.group(1).strip(), mems)
    out = {}
    for m in re.finditer(r'<ix:nonFraction([^>]*)>(.*?)</ix:nonFraction>', raw, re.S):
        attrs, val = m.group(1), m.group(2)
        nm = re.search(r'name="([^"]+)"', attrs).group(1)
        cr = re.search(r'contextRef="([^"]+)"', attrs)
        if not cr or cr.group(1) not in ctx: continue
        end, mems = ctx[cr.group(1)]
        segm = [(d, mv) for d, mv in mems if "Segment" in d and "Portfolio" not in d and "Financing" not in d]
        other = [mv for d, mv in mems if (d, mv) not in segm and not (d.endswith("ConsolidationItemsAxis") and "OperatingSegments" in mv)]
        if len(segm) != 1 or other: continue
        v = re.sub(r"<[^>]+>", "", val).replace(",", "").strip()
        if v in ("", "-", "\u2014"): v = "0"
        try: v = float(v)
        except Exception: continue
        sc = re.search(r'scale="(-?\d+)"', attrs); v *= 10 ** int(sc.group(1)) if sc else 1
        if 'sign="-"' in attrs: v = -v
        out[(nm, segm[0][0].split(":")[-1] + "|" + segm[0][1].split(":")[-1], end)] = v
    return out

OUT = "/home/user/abcd/company_hunt/data/g5seg"; os.makedirs(OUT, exist_ok=True)
N = int(sys.argv[1])
for t in sys.argv[2:]:
    fn = f"{OUT}/{t}.json"
    if os.path.exists(fn):
        continue
    try:
        cik = E.cik_of(t)
        j, rows = E.submissions(cik)
        docs = [(d, acc, doc, rd) for f, d, acc, it, doc, rd in rows if f in ("10-K", "20-F")][:N]
        facts = {}
        allf = []   # every fact of every filing, so year-pairs can be read on one filing's (recast) basis
        dl = []
        for d, acc, doc, rd in reversed(docs):
            url = E.doc_url(cik, acc, doc)
            dl.append({"filed": d, "period": rd, "url": url})
            try:
                raw = E.fetch(url)
            except Exception as e:
                dl[-1]["error"] = str(e); continue
            got = parse(raw)
            if not got:
                # annual report filed as Exhibit 13 (WFC, BNY, IBM...): contexts sit in the primary doc's ix:header,
                # facts in the exhibit, so parse the concatenation
                try:
                    base, names = E.filing_index(cik, acc)
                    ex = [nm for nm in names if nm.lower().endswith((".htm", ".html")) and nm != doc and not re.match(r"R\d+\.htm|.*index", nm)
                          and (re.search(r"ex-?13|exhibit13|ex13", nm.lower()) or not re.search(r"ex-?\d|exhibit", nm.lower()))]
                    for nm in ex:
                        raw += E.fetch(base + nm)
                        dl[-1].setdefault("extra", []).append(base + nm)
                    got = parse(raw)
                except Exception as e:
                    dl[-1]["error"] = "ex13: " + str(e)
            src = dl[-1].get("extra", [url])[0] if dl[-1].get("extra") and "_d2" in url else url
            for k, v in got.items():
                facts[k] = (v, src)
                allf.append([k[0], k[1], k[2], v, src, d])
        json.dump({"ticker": t, "cik": cik, "docs": dl,
                   "facts": [[k[0], k[1], k[2], v[0], v[1]] for k, v in facts.items()], "facts_all": allf}, open(fn, "w"))
        print(t, "docs", len(dl), "facts", len(facts), flush=True)
    except BaseException as e:
        print(t, "ERROR", repr(e), flush=True)
