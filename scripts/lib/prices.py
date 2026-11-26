"""yFinance price layer (CLAUDE.md section 7). Always last in any company read.

- Retries 3x with backoff.
- Daily cache: cache/yf/<YYYY-MM-DD>/<TICKER>_<kind>.(csv|json).
- `is_stale(as_of)` enforces price_max_age_trading_days from config.json (Step 6 re-pull rule).

CLI:
    python scripts/lib/prices.py quote UNP CSX NSC
    python scripts/lib/prices.py history SPY 1y
"""
import datetime as dt, json, math, os, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "cache" / "yf"


def _day_dir():
    d = CACHE / dt.date.today().isoformat()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _retry(fn, tries=3):
    for i in range(tries):
        try:
            return fn()
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(2 ** (i + 1))


def history(ticker, period="1y", interval="1d"):
    """DataFrame of OHLCV (auto-adjusted). Cached per day."""
    import pandas as pd, yfinance as yf
    f = _day_dir() / f"{ticker.replace('^', '_')}_hist_{period}_{interval}.csv"
    if f.exists():
        return pd.read_csv(f, index_col=0, parse_dates=True)
    df = _retry(lambda: yf.Ticker(ticker).history(period=period, interval=interval, auto_adjust=True))
    if df is None or df.empty:
        raise RuntimeError(f"yfinance returned no history for {ticker}")
    tmp = f.with_suffix(".tmp")
    df.to_csv(tmp)
    os.replace(tmp, f)
    return df


def quote(ticker):
    """Snapshot dict with an as_of stamp and the source label."""
    import yfinance as yf
    f = _day_dir() / f"{ticker.replace('^', '_')}_quote.json"
    if f.exists():
        return json.loads(f.read_text())
    fi = _retry(lambda: yf.Ticker(ticker).fast_info)
    keys = ["lastPrice", "previousClose", "marketCap", "shares", "yearHigh", "yearLow",
            "fiftyDayAverage", "twoHundredDayAverage", "currency"]
    q = {}
    for k in keys:
        try:
            v = fi[k]
        except Exception:
            v = None
        q[k] = None if (isinstance(v, float) and math.isnan(v)) else v
    q.update(ticker=ticker, as_of=dt.date.today().isoformat(), source=f"https://finance.yahoo.com/quote/{ticker}")
    tmp = f.with_suffix(".tmp")
    tmp.write_text(json.dumps(q, default=str))
    os.replace(tmp, f)
    return q


def trading_days_between(a, b):
    import numpy as np
    return int(np.busday_count(a, b))


def is_stale(as_of, max_days=None):
    """True if as_of (YYYY-MM-DD) is older than max trading days (default from config)."""
    if max_days is None:
        try:
            max_days = json.loads((ROOT / "config.json").read_text())["price_max_age_trading_days"]
        except Exception:
            max_days = 1
    return trading_days_between(as_of, dt.date.today().isoformat()) > max_days


if __name__ == "__main__":
    cmd, *a = sys.argv[1:] or ["help"]
    if cmd == "quote":
        for t in a:
            print(json.dumps(quote(t), default=str))
    elif cmd == "history":
        print(history(a[0], a[1] if len(a) > 1 else "1y").tail())
    else:
        print(__doc__)
