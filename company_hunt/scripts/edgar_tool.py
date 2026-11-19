#!/usr/bin/env python3
"""EDGAR research toolkit for the Deep Company Hunt (primary-source access; never FMP).
All requests send a descriptive User-Agent and stay under 10 req/s. Cached under data/raw/.

Commands:
  filings TICKER [FORM] [N]            list recent filings (form, date, accession, items, primary doc URL)
  text URL [--grep REGEX] [--ctx N] [--max N] [--from STR]
                                       fetch a filing document as plain text (cached); optional grep with context;
                                       --from STR starts output at first occurrence of STR (case-insensitive)
  fts "PHRASE" [--ticker T] [--forms 10-K,10-Q] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
                                       EDGAR full-text search (efts.sec.gov), returns hits with URLs
  facts TICKER TAG [--q]               companyfacts series for one us-gaap tag (annual; --q adds quarterly)
  tags TICKER [REGEX]                  list us-gaap/ifrs tags the company reports (optionally filtered)
  insiders TICKER [YEARS]              parse Form 4 XMLs: open-market buys (P) and sells (S) by person, last N years (default 3)
  exhibits TICKER [N] [--item 2.02]    list exhibits (EX-99.x etc.) of the last N 8-Ks (optionally only with an item)
  index URL_OR_ACCESSION TICKER        list all documents inside one filing
  segments TICKER [N_10K] [--rx REGEX] (see below)
  holders TICKER                       list SC 13D / 13G (and /A) filings, last 5 years
  segments TICKER [N_10K] [--rx REGEX] business-segment revenue / operating income by year from inline XBRL of last N 10-Ks
"""
import signal; signal.signal(signal.SIGPIPE, signal.SIG_DFL)
import sys, os, re, json, time, gzip, hashlib, urllib.request, urllib.parse, html, datetime as dt
ROOT = "/home/user/abcd/company_hunt"
CACHE = f"{ROOT}/data/raw"; os.makedirs(CACHE, exist_ok=True)
UA = "AlexBungabong research alex-research@example.com"
_last = [0.0]
import fcntl
def _global_throttle(min_gap=0.125):
    """Cross-process limiter: all toolkit processes share one clock file -> <= 8 req/s total to SEC."""
    fn = f"{ROOT}/data/raw/.sec_clock"
    with open(fn, "a+") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        fh.seek(0); txt = fh.read().strip()
        # robust read: a torn write once left two timestamps glued together; take the first 10.6 digits
        mt = re.match(r"\d{10}(\.\d{1,6})?", txt)
        last = float(mt.group(0)) if mt else 0.0
        wait = min_gap - (time.time() - last)
        if wait > 0: time.sleep(wait)
        fh.seek(0); fh.truncate(); fh.write(f"{time.time():.6f}"); fh.flush(); os.fsync(fh.fileno())
        fcntl.flock(fh, fcntl.LOCK_UN)

def fetch(url, binary=False, cache=True):
    key = hashlib.md5(url.encode()).hexdigest()
    fn = f"{CACHE}/{key}"
    if cache and os.path.exists(fn):
        b = open(fn, "rb").read()
        return b if binary else b.decode("utf-8", "replace")
    for att in range(4):
        _global_throttle()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
            with urllib.request.urlopen(req, timeout=90) as r:
                b = r.read()
                if r.headers.get("Content-Encoding") == "gzip": b = gzip.decompress(b)
            if cache: open(fn, "wb").write(b)
            return b if binary else b.decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (404, 400): raise
            time.sleep(2 * (att + 1))
        except Exception:
            time.sleep(2 * (att + 1))
    raise RuntimeError(f"fetch failed {url}")

_tmap = None
def cik_of(ticker):
    global _tmap
    if _tmap is None:
        d = json.load(open(f"{ROOT}/data/sec/company_tickers_exchange.json"))
        _tmap = {r[2].upper(): r[0] for r in d["data"]}
    t = ticker.upper().replace(".", "-")
    if t not in _tmap: raise SystemExit(f"ticker {ticker} not in EDGAR map")
    return int(_tmap[t])

def submissions(cik):
    j = json.loads(fetch(f"https://data.sec.gov/submissions/CIK{cik:010d}.json", cache=False))
    rec = j["filings"]["recent"]
    rows = list(zip(rec["form"], rec["filingDate"], rec["accessionNumber"], rec.get("items", [""] * len(rec["form"])), rec["primaryDocument"], rec.get("reportDate", [""] * len(rec["form"]))))
    for f in j["filings"].get("files", []):
        try:
            o = json.loads(fetch("https://data.sec.gov/submissions/" + f["name"]))
            rows += list(zip(o["form"], o["filingDate"], o["accessionNumber"], o.get("items", [""] * len(o["form"])), o["primaryDocument"], o.get("reportDate", [""] * len(o["form"]))))
        except Exception:
            pass
    return j, rows

def doc_url(cik, acc, doc):
    return f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/{doc}"

def to_text(raw):
    raw = re.sub(r"(?is)<(script|style).*?</\1>", " ", raw)
    raw = re.sub(r"(?is)<ix:header>.*?</ix:header>", " ", raw)
    raw = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</tr>|</h\d>|</li>", "\n", raw)
    raw = re.sub(r"(?i)</td>|</th>", " | ", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    raw = html.unescape(raw)
    raw = re.sub(r"[ \t\xa0]+", " ", raw)
    raw = re.sub(r"\n\s*\n+", "\n", raw)
    return raw.strip()

def cmd_filings(a):
    t = a[0]; form = a[1] if len(a) > 1 else None; n = int(a[2]) if len(a) > 2 else 20
    cik = cik_of(t); j, rows = submissions(cik)
    print(f"# {j['name']} CIK {cik} SIC {j.get('sic')} {j.get('sicDescription')} FYE {j.get('fiscalYearEnd')}")
    k = 0
    for f, d, acc, it, doc, rd in rows:
        if form and f != form: continue
        print(f"{f}\t{d}\tperiod={rd}\t{acc}\titems={it}\t{doc_url(cik, acc, doc)}")
        k += 1
        if k >= n: break

def cmd_text(a):
    url = a[0]; grep = None; ctx = 300; mx = 20000; frm = None
    if "--grep" in a: grep = a[a.index("--grep") + 1]
    if "--ctx" in a: ctx = int(a[a.index("--ctx") + 1])
    if "--max" in a: mx = int(a[a.index("--max") + 1])
    if "--from" in a: frm = a[a.index("--from") + 1]
    t = to_text(fetch(url))
    if frm:
        i = t.lower().find(frm.lower())
        if i >= 0: t = t[i:]
    if grep:
        out = []; last_end = -1
        for m in re.finditer(grep, t, flags=re.I):
            s, e = max(0, m.start() - ctx), min(len(t), m.end() + ctx)
            if s < last_end: continue
            out.append(f"...[{m.start()}] " + t[s:e].replace("\n", " ") + " ...")
            last_end = e
        res = "\n\n".join(out)
        print(f"# {len(out)} matches in {len(t)} chars"); print(res[:mx])
    else:
        print(f"# {len(t)} chars"); print(t[:mx])

def cmd_fts(a):
    q = a[0]; p = {"q": f'"{q}"' if " " in q and not q.startswith('"') else q}
    if "--forms" in a: p["forms"] = a[a.index("--forms") + 1]
    if "--from" in a: p["startdt"] = a[a.index("--from") + 1]; p["dateRange"] = "custom"
    if "--to" in a: p["enddt"] = a[a.index("--to") + 1]; p["dateRange"] = "custom"
    if "startdt" in p and "enddt" not in p: p["enddt"] = dt.date.today().isoformat()
    if "--ticker" in a: p["ciks"] = f"{cik_of(a[a.index('--ticker') + 1]):010d}"
    url = "https://efts.sec.gov/LATEST/search-index?" + urllib.parse.urlencode(p)
    j = json.loads(fetch(url, cache=False))
    hits = j.get("hits", {}).get("hits", [])
    print(f"# total {j.get('hits', {}).get('total', {}).get('value')} (showing {len(hits)})")
    for h in hits:
        s = h["_source"]; acc, doc = h["_id"].split(":", 1)
        cik = s["ciks"][0].lstrip("0")
        print(f"{s.get('form')}\t{s.get('file_date')}\t{s.get('display_names', [''])[0][:60]}\t{doc_url(cik, acc, doc)}")

def cmd_facts(a):
    t, tag = a[0], a[1]; q = "--q" in a
    cik = cik_of(t)
    j = json.loads(fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json", cache=False))
    for tax in ("us-gaap", "ifrs-full", "dei"):
        node = j["facts"].get(tax, {}).get(tag)
        if not node: continue
        for unit, rows in node["units"].items():
            seen = {}
            for r in rows:
                if r.get("form") not in ("10-K", "10-K/A", "20-F", "40-F", "10-Q", "10-Q/A", "6-K"): continue
                start = r.get("start"); end = r["end"]
                days = (dt.date.fromisoformat(end) - dt.date.fromisoformat(start)).days if start else 0
                kind = "I" if not start else ("FY" if days > 300 else ("Q" if days < 100 else f"{days}d"))
                if kind not in ("I", "FY") and not (q and kind == "Q"): continue
                k = (start, end)
                if k not in seen or r["filed"] > seen[k]["filed"]: seen[k] = dict(r, kind=kind)
            print(f"# {tax}:{tag} [{unit}]")
            for k in sorted(seen, key=lambda x: x[1]):
                r = seen[k]
                print(f"{r['kind']}\t{r.get('start', '')}\t{r['end']}\t{r['val']:,}\t{r['form']}\tfiled {r['filed']}\t{r.get('accn')}")

def cmd_tags(a):
    t = a[0]; rx = a[1] if len(a) > 1 else "."
    cik = cik_of(t)
    j = json.loads(fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json", cache=False))
    for tax, d in j["facts"].items():
        for tag in d:
            if re.search(rx, tag, re.I): print(f"{tax}:{tag}")

def cmd_insiders(a):
    t = a[0]; yrs = float(a[1]) if len(a) > 1 else 3
    cik = cik_of(t); j, rows = submissions(cik)
    cut = (dt.date.today() - dt.timedelta(days=int(365 * yrs))).isoformat()
    agg = {}; tx = []
    n = 0
    for f, d, acc, it, doc, rd in rows:
        if f != "4" or d < cut: continue
        n += 1
        base = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/"
        xml_doc = doc.split("/")[-1]
        if not xml_doc.endswith(".xml"):
            try:
                idx = json.loads(fetch(base + "index.json"))
                xs = [x["name"] for x in idx["directory"]["item"] if x["name"].endswith(".xml")]
                if not xs: continue
                xml_doc = xs[0]
            except Exception:
                continue
        try:
            x = fetch(base + xml_doc)
        except Exception:
            continue
        name = re.search(r"<rptOwnerName>(.*?)</rptOwnerName>", x, re.S)
        name = html.unescape(name.group(1).strip()) if name else "?"
        title = re.search(r"<officerTitle>(.*?)</officerTitle>", x, re.S)
        title = html.unescape(title.group(1).strip()) if title else ("Director" if "<isDirector>1" in x or "<isDirector>true" in x else "")
        for m in re.finditer(r"<nonDerivativeTransaction>(.*?)</nonDerivativeTransaction>", x, re.S):
            b = m.group(1)
            code = re.search(r"<transactionCode>(.*?)</transactionCode>", b, re.S)
            code = code.group(1).strip() if code else "?"
            if code not in ("P", "S"): continue
            sh = re.search(r"<transactionShares>.*?<value>(.*?)</value>", b, re.S)
            px = re.search(r"<transactionPricePerShare>.*?<value>(.*?)</value>", b, re.S)
            tdate = re.search(r"<transactionDate>.*?<value>(.*?)</value>", b, re.S)
            plan = "10b5-1" if "10b5-1" in x else ""
            try:
                shv = float(sh.group(1)); pxv = float(px.group(1)) if px else 0.0
            except Exception:
                continue
            k = (name, title, code)
            a_ = agg.setdefault(k, [0, 0.0, 0]); a_[0] += shv; a_[1] += shv * pxv; a_[2] += 1
            tx.append((tdate.group(1)[:10] if tdate else d, name, title, code, shv, pxv, plan))
    print(f"# {j['name']}: {n} Form 4 filings since {cut}")
    print("# open-market summary (P=buy, S=sell): name | title | code | shares | $value | n")
    for k, v in sorted(agg.items(), key=lambda kv: -kv[1][1]):
        print(f"{k[0]} | {k[1]} | {k[2]} | {v[0]:,.0f} | ${v[1]:,.0f} | {v[2]}")
    buys = [t_ for t_ in tx if t_[3] == "P"]
    print(f"# open-market BUYS detail ({len(buys)}):")
    for t_ in sorted(buys)[-40:]:
        print(f"{t_[0]} {t_[1]} ({t_[2]}) {t_[4]:,.0f} sh @ ${t_[5]:,.2f}")
    tb = sum(v[1] for k, v in agg.items() if k[2] == "P"); ts = sum(v[1] for k, v in agg.items() if k[2] == "S")
    print(f"# TOTAL buys ${tb:,.0f} | sells ${ts:,.0f} | net ${tb - ts:,.0f}")

def filing_index(cik, acc):
    base = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/"
    idx = json.loads(fetch(base + "index.json"))
    return base, [x["name"] for x in idx["directory"]["item"]]

def cmd_exhibits(a):
    t = a[0]; n = int(a[1]) if len(a) > 1 and not a[1].startswith("--") else 8
    item = a[a.index("--item") + 1] if "--item" in a else None
    cik = cik_of(t); j, rows = submissions(cik)
    k = 0
    for f, d, acc, it, doc, rd in rows:
        if f not in ("8-K", "6-K"): continue
        if item and item not in (it or ""): continue
        base, names = filing_index(cik, acc)
        # exhibit names via the -index.htm (has types)
        try:
            ih = fetch(base + f"{acc}-index.htm")
            types = re.findall(r'<td[^>]*>\s*<a href="[^"]*/([^"/]+)">[^<]*</a>\s*</td>\s*<td[^>]*>([^<]*)</td>', ih)
            typ = {}
            for m in re.finditer(r'href="/Archives/edgar/data/[^"]*/([^"/]+)"[^>]*>[^<]*</a></td>\s*<td[^>]*>([^<]*)</td>', ih):
                typ[m.group(1)] = m.group(2).strip()
        except Exception:
            typ = {}
        print(f"{f} {d} items={it} {acc}")
        for nm in names:
            if nm.endswith((".htm", ".html", ".pdf", ".txt", ".xlsx")) and "index" not in nm:
                print(f"    {typ.get(nm, ''):12s} {base}{nm}")
        k += 1
        if k >= n: break

def cmd_index(a):
    x, t = a[0], a[1]
    cik = cik_of(t)
    acc = re.search(r"(\d{10}-?\d{2}-?\d{6})", x).group(1)
    if "-" not in acc: acc = f"{acc[:10]}-{acc[10:12]}-{acc[12:]}"
    base, names = filing_index(cik, acc)
    for nm in names: print(base + nm)


def parse_ixbrl_segments(raw, name_rx):
    """Extract facts with a single business-segment dimension from an inline-XBRL 10-K."""
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
        if not re.search(name_rx, nm, re.I): continue
        cid = re.search(r'contextRef="([^"]+)"', attrs).group(1)
        if cid not in ctx: continue
        end, mems = ctx[cid]
        segm = [mv for d, mv in mems if "Segment" in d]
        other = [mv for d, mv in mems if "Segment" not in d and not (d.endswith("ConsolidationItemsAxis") and "OperatingSegments" in mv)]
        if len(segm) != 1 or other: continue
        v = re.sub(r"<[^>]+>", "", val).replace(",", "").strip()
        if v in ("", "-", "—"): v = "0"
        try: v = float(v)
        except Exception: continue
        sc = re.search(r'scale="(-?\d+)"', attrs); v *= 10 ** int(sc.group(1)) if sc else 1
        if 'sign="-"' in attrs: v = -v
        out[(nm.split(":")[-1], segm[0].split(":")[-1], end)] = v
    return out

def cmd_segments(a):
    """segments TICKER [N_10K] [--rx REGEX]: business-segment facts (revenue, operating income, segment profit) from the last N 10-K inline XBRL docs."""
    t = a[0]; n = int(a[1]) if len(a) > 1 and not a[1].startswith("--") else 3
    rx = a[a.index("--rx") + 1] if "--rx" in a else r"Revenue|OperatingIncome|SegmentProfit|OperatingProfit|IncomeLossFromContinuingOperationsBefore|SegmentEarnings|AdjustedEBITDA|NetIncomeLoss"
    cik = cik_of(t); j, rows = submissions(cik)
    docs = [(d, acc, doc) for f, d, acc, it, doc, rd in rows if f in ("10-K", "20-F")][:n]
    allf = {}
    for d, acc, doc in reversed(docs):
        try:
            raw = fetch(doc_url(cik, acc, doc))
        except Exception as e:
            print("# fetch failed", doc, e); continue
        allf.update(parse_ixbrl_segments(raw, rx))
    if not allf: print("# no inline-XBRL segment facts found (older filing or no segment axis)"); return
    tags = sorted(set(k[0] for k in allf)); ends = sorted(set(k[2] for k in allf))
    for tg in tags:
        segs = sorted(set(k[1] for k in allf if k[0] == tg))
        print(f"\n# {tg} ($M) | years: {', '.join(e[:7] for e in ends)}")
        for sg in segs:
            vals = [allf.get((tg, sg, e)) for e in ends]
            print(f"{sg[:60]:60s} " + " ".join(f"{(v/1e6):>10,.0f}" if v is not None else f"{'-':>10s}" for v in vals))

def cmd_holders(a):
    t = a[0]; cik = cik_of(t)
    # 13D/G are filed under the SUBJECT company's CIK too
    j, rows = submissions(cik)
    cut = (dt.date.today() - dt.timedelta(days=5 * 365)).isoformat()
    for f, d, acc, it, doc, rd in rows:
        if d >= cut and ("13D" in f or "13G" in f):
            print(f"{f}\t{d}\t{doc_url(cik, acc, doc)}")

if __name__ == "__main__":
    if len(sys.argv) < 2: print(__doc__); sys.exit()
    {"filings": cmd_filings, "text": cmd_text, "fts": cmd_fts, "facts": cmd_facts, "tags": cmd_tags, "insiders": cmd_insiders,
     "exhibits": cmd_exhibits, "index": cmd_index, "holders": cmd_holders, "segments": cmd_segments}[sys.argv[1]](sys.argv[2:])
