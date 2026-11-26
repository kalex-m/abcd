"""SEC EDGAR client for the investment hunt (CLAUDE.md section 7).

- User-Agent: "AlexBungabong <edgar_contact_email from config.json>" (required by SEC).
- Rate limit: 0.15 s sleep between calls (well under 10 req/s).
- Cache: cache/edgar/<sha1>.json, reused for `max_age_hours` (default 24).
- FMP is refused outright.

Usage from another script:
    sys.path.insert(0, "scripts/lib"); import edgar
    cik = edgar.cik_for("UNP"); subs = edgar.submissions(cik)
CLI:
    python scripts/lib/edgar.py cik UNP
    python scripts/lib/edgar.py filings UNP 10-K,10-Q 8
    python scripts/lib/edgar.py fts "\"pricing model\"" 8-K 2026-10-01 2026-11-26
"""
import gzip, hashlib, json, os, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "cache" / "edgar"
SLEEP = 0.15
_last = [0.0]


def _ua():
    try:
        email = json.loads((ROOT / "config.json").read_text())["edgar_contact_email"]
    except Exception:
        email = "SET-ME@example.com"
    if "SET-ME" in email:
        print("[edgar] warning: edgar_contact_email not set in config.json", file=sys.stderr)
    return f"AlexBungabong {email}"


def _guard(url):
    if "financialmodelingprep" in url.lower():
        raise RuntimeError("FMP is forbidden (CLAUDE.md rule 1)")


def fetch(url, max_age_hours=24, as_json=True, retries=4):
    """GET with cache, rate limit and retry. Returns parsed JSON or text."""
    _guard(url)
    CACHE.mkdir(parents=True, exist_ok=True)
    key = CACHE / (hashlib.sha1(url.encode()).hexdigest() + (".json" if as_json else ".txt"))
    if key.exists() and (time.time() - key.stat().st_mtime) < max_age_hours * 3600:
        raw = key.read_text(encoding="utf-8")
        return json.loads(raw) if as_json else raw
    req = urllib.request.Request(url, headers={"User-Agent": _ua(), "Accept-Encoding": "gzip"})
    for attempt in range(retries):
        wait = SLEEP - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    data = gzip.decompress(data)
            _last[0] = time.time()
            text = data.decode("utf-8", errors="replace")
            tmp = key.with_suffix(key.suffix + ".tmp")
            tmp.write_text(text, encoding="utf-8")
            os.replace(tmp, key)
            return json.loads(text) if as_json else text
        except Exception:
            _last[0] = time.time()
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def tickers():
    return fetch("https://www.sec.gov/files/company_tickers.json", max_age_hours=24 * 7)


def cik_for(ticker):
    t = ticker.upper().replace(".", "-")
    for row in tickers().values():
        if row["ticker"].upper() == t:
            return int(row["cik_str"])
    raise KeyError(f"no CIK for {ticker}")


def _cik(x):
    return f"{int(x) if str(x).isdigit() else cik_for(x):010d}"


def submissions(cik_or_ticker):
    return fetch(f"https://data.sec.gov/submissions/CIK{_cik(cik_or_ticker)}.json", max_age_hours=6)


def companyfacts(cik_or_ticker):
    return fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{_cik(cik_or_ticker)}.json", max_age_hours=24)


def concept(cik_or_ticker, tag, taxonomy="us-gaap"):
    return fetch(f"https://data.sec.gov/api/xbrl/companyconcept/CIK{_cik(cik_or_ticker)}/{taxonomy}/{tag}.json")


def recent_filings(cik_or_ticker, forms=None, limit=20):
    """List of dicts: form, filed, accession, primary_doc, url, items."""
    s = submissions(cik_or_ticker)
    cik = int(s["cik"])
    r = s["filings"]["recent"]
    out = []
    for i, form in enumerate(r["form"]):
        if forms and form not in forms:
            continue
        acc = r["accessionNumber"][i]
        doc = r["primaryDocument"][i]
        out.append({
            "form": form, "filed": r["filingDate"][i], "report_date": r.get("reportDate", [""] * (i + 1))[i],
            "accession": acc, "items": r.get("items", [""] * (i + 1))[i], "primary_doc": doc,
            "url": f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/{doc}",
            "index": f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/",
        })
        if len(out) >= limit:
            break
    return out


def full_text_search(q, forms=None, startdt=None, enddt=None, page_from=0):
    """EDGAR full-text search (efts). q uses EDGAR syntax, e.g. '"share repurchase"'."""
    p = {"q": q}
    if forms:
        p["forms"] = forms if isinstance(forms, str) else ",".join(forms)
    if startdt and enddt:
        p.update(dateRange="custom", startdt=startdt, enddt=enddt)
    if page_from:
        p["from"] = page_from
    return fetch("https://efts.sec.gov/LATEST/search-index?" + urllib.parse.urlencode(p), max_age_hours=6)


def annual_series(facts, tag, unit="USD", taxonomy="us-gaap"):
    """Fiscal-year values from 10-K filings: {fy_end_date: (value, accession, filed)} (latest filing wins)."""
    node = facts.get("facts", {}).get(taxonomy, {}).get(tag, {}).get("units", {}).get(unit, [])
    out = {}
    for f in node:
        if f.get("form") not in ("10-K", "10-K/A", "20-F", "40-F") or f.get("fp") != "FY":
            continue
        if "start" in f:
            days = (time.mktime(time.strptime(f["end"], "%Y-%m-%d")) - time.mktime(time.strptime(f["start"], "%Y-%m-%d"))) / 86400
            if not 350 <= days <= 380:
                continue
        prev = out.get(f["end"])
        if prev is None or f["filed"] > prev[2]:
            out[f["end"]] = (f["val"], f["accn"], f["filed"])
    return dict(sorted(out.items()))


if __name__ == "__main__":
    cmd, *a = sys.argv[1:] or ["help"]
    if cmd == "cik":
        print(cik_for(a[0]))
    elif cmd == "filings":
        forms = a[1].split(",") if len(a) > 1 else None
        for f in recent_filings(a[0], forms, int(a[2]) if len(a) > 2 else 10):
            print(f["filed"], f["form"], f["items"], f["url"])
    elif cmd == "fts":
        res = full_text_search(a[0], a[1] if len(a) > 1 else None, *(a[2:4] if len(a) > 3 else (None, None)))
        hits = res.get("hits", {})
        print("total", hits.get("total", {}).get("value"))
        for h in hits.get("hits", [])[:20]:
            s = h["_source"]
            print(s.get("file_date"), s.get("form"), s.get("display_names", [""])[0], h["_id"])
    else:
        print(__doc__)
