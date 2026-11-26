"""Bootstrap smoke test: one cheap call per data source in CLAUDE.md section 7.
Writes logs/smoke-test.json and appends one line per source to logs/events.log.
Usage: python scripts/smoke_test.py
"""
import datetime as dt, json, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))
import edgar, prices, validate  # noqa: E402

UA = "investment-hunt smoke-test"


def http(url, expect=None, ua=UA):
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read(400_000).decode("utf-8", errors="replace")
        code = r.status
    if expect and expect not in body:
        raise RuntimeError(f"HTTP {code} but expected marker {expect!r} not found")
    return f"HTTP {code}, {len(body):,} bytes"


def _bls():
    req = urllib.request.Request("https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0", headers={"User-Agent": UA})
    j = json.loads(urllib.request.urlopen(req, timeout=30).read())
    if j.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"{j.get('status')}: {' '.join(j.get('message', []))[:140]} (fix: free BLS API key)")
    d = j["Results"]["series"][0]["data"][0]
    return f"CPI-U latest {d['year']}-{d['periodName']} = {d['value']}"


def run():
    y = dt.date.today().year
    tests = {
        "sec_edgar_submissions": lambda: f"JPM recent filings: {len(edgar.submissions(19617)['filings']['recent']['form'])}",
        "sec_edgar_companyfacts": lambda: f"JPM us-gaap tags: {len(edgar.companyfacts(19617)['facts']['us-gaap'])}",
        "sec_edgar_full_text_search": lambda: f"hits: {edgar.full_text_search(chr(34)+'share repurchase'+chr(34), '8-K')['hits']['total']['value']}",
        "yfinance": lambda: (lambda h: f"SPY last close {h['Close'].iloc[-1]:.2f} on {h.index[-1].date()}")(prices.history("SPY", "5d")),
        "fred": lambda: (lambda b: f"DGS10 last row {b.strip().splitlines()[-1]}")(urllib.request.urlopen(urllib.request.Request("https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10", headers={"User-Agent": UA}), timeout=60).read().decode()),
        "bls": lambda: _bls(),
        "bea": lambda: http("https://www.bea.gov/news/current-releases", "BEA"),
        "census": lambda: http("https://www.census.gov/economic-indicators/", "Census"),
        "federal_reserve": lambda: http("https://www.federalreserve.gov/feeds/press_all.xml", "<rss"),
        "treasury_yields": lambda: http(f"https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/{y}/all?type=daily_treasury_yield_curve&field_tdr_date_value={y}&page&_format=csv", "Date"),
        "treasury_fiscaldata": lambda: http("https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?sort=-auction_date&page%5Bsize%5D=1", "auction_date"),
        "eia": lambda: http("https://www.eia.gov/petroleum/supply/weekly/", "Weekly"),
        "aar": lambda: http("https://www.aar.org/data-center/rail-traffic-data/", "Rail"),
        "cftc": lambda: http("https://publicreporting.cftc.gov/resource/6dca-aqww.json?$limit=1", "report_date"),
        "cboe": lambda: http("https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv", "DATE"),
        "ferc": lambda: http("https://www.ferc.gov/news-events", "FERC"),
        "stb": lambda: http("https://www.stb.gov/", "Surface Transportation Board"),
        "fcc": lambda: http("https://www.fcc.gov/news-events/headlines", "FCC"),
        "fda": lambda: http("https://api.fda.gov/drug/enforcement.json?limit=1", "results"),
        "federal_register": lambda: http("https://www.federalregister.gov/api/v1/documents.json?per_page=1", "results"),
        "ustr": lambda: http("https://ustr.gov/about-us/policy-offices/press-office/press-releases", "USTR"),
        "ofac": lambda: http("https://ofac.treasury.gov/recent-actions", "OFAC"),
        "court_dockets_courtlistener": lambda: http("https://www.courtlistener.com/api/rest/v4/search/?q=antitrust&type=r", "count"),
    }
    results = {}
    for name, fn in tests.items():
        t0 = time.time()
        try:
            detail = fn()
            results[name] = {"status": "ok", "detail": detail}
        except Exception as e:
            results[name] = {"status": "unreachable", "detail": f"{type(e).__name__}: {str(e)[:160]}"}
        results[name]["ms"] = int((time.time() - t0) * 1000)
        validate.log("smoke_test", f"{name}\t{results[name]['status']}\t{results[name]['detail']}")
        print(f"{results[name]['status']:<12} {name:<30} {results[name]['detail']}")
    # Not testable from a script by design:
    for name, why in {
        "company_ir_sites": "per-company; tested on first use, blocked fetches logged as unreachable",
        "ibkr": "unavailable: no IBKR MCP connector attached to this session (skip silently, use yFinance)",
        "perplexity_finance": "cross-check only; no connector attached",
        "fmp": "FORBIDDEN: never called (denied in .claude/settings.json)",
    }.items():
        results[name] = {"status": "n/a", "detail": why}
        validate.log("smoke_test", f"{name}\tn/a\t{why}")
        print(f"{'n/a':<12} {name:<30} {why}")
    out = {"as_of": validate.now(), "results": results, "complete": True}
    validate.atomic_json(ROOT / "logs" / "smoke-test.json", out)
    return results


if __name__ == "__main__":
    run()
