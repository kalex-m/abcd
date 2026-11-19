"""Phase 1a: pull ~3y daily price/volume for every NYSE/Nasdaq/CBOE common-stock ticker on EDGAR's list.
Writes data/yf/px_close.parquet-like CSVs (close, volume) and data/yf/px_stats.csv.
Usage: python3 scripts/p1_prices.py
"""
import json, time, sys, math
import pandas as pd, numpy as np
import yfinance as yf

ROOT = "/home/user/abcd/company_hunt"
d = json.load(open(f"{ROOT}/data/sec/company_tickers_exchange.json"))
rows = [dict(zip(d["fields"], r)) for r in d["data"]]
keep = []
for r in rows:
    if r["exchange"] not in ("NYSE", "Nasdaq", "CBOE"):
        continue
    t = r["ticker"]
    if "-" in t:
        suf = t.split("-", 1)[1]
        if len(suf) != 1 or suf in ("P", "W", "U", "R"):
            continue  # preferreds, warrants, units, rights
    if len(t) == 5 and t[-1] in ("W", "U", "R") and not t.endswith("AU"):
        continue  # SPAC warrants/units/rights
    keep.append(r)
# dedupe ticker
seen = set(); uni = []
for r in keep:
    if r["ticker"] in seen: continue
    seen.add(r["ticker"]); uni.append(r)
print("candidate tickers", len(uni), flush=True)
tick = [r["ticker"] for r in uni]
closes, vols = [], []
CH = 200
for i in range(0, len(tick), CH):
    ch = tick[i:i + CH]
    for att in range(3):
        try:
            df = yf.download(ch, start="2016-11-01", end="2026-11-19", auto_adjust=True, progress=False, threads=True, interval="1wk" if False else "1d")
            break
        except Exception as e:
            print("retry", i, e, flush=True); time.sleep(5 * (att + 1)); df = None
    if df is None or df.empty:
        continue
    c = df["Close"]; v = df["Volume"]
    if isinstance(c, pd.Series): c = c.to_frame(ch[0]); v = v.to_frame(ch[0])
    closes.append(c.astype("float32")); vols.append(v.astype("float32"))
    print(f"chunk {i//CH+1}/{math.ceil(len(tick)/CH)} done, shape {c.shape}", flush=True)
C = pd.concat(closes, axis=1); V = pd.concat(vols, axis=1)
C = C.loc[:, ~C.columns.duplicated()]; V = V.loc[:, ~V.columns.duplicated()]
C.to_pickle(f"{ROOT}/data/yf/close_10y.pkl"); V.to_pickle(f"{ROOT}/data/yf/vol_10y.pkl")
last = C.index[-1]
stats = []
meta = {r["ticker"]: r for r in uni}
for t in C.columns:
    s = C[t].dropna(); vv = V[t].reindex(s.index).fillna(0)
    if len(s) < 20:
        stats.append({"ticker": t, "n_days": len(s)}); continue
    px = float(s.iloc[-1])
    adv = float((s.iloc[-63:] * vv.iloc[-63:]).mean())
    s3 = s[s.index >= last - pd.Timedelta(days=3 * 365)]
    s1 = s[s.index >= last - pd.Timedelta(days=365)]
    stats.append({
        "ticker": t, "cik": meta[t]["cik"], "edgar_name": meta[t]["name"], "exchange": meta[t]["exchange"],
        "n_days": len(s), "first_px_date": str(s.index[0].date()), "last_date": str(s.index[-1].date()),
        "price": px, "adv_usd_3m": adv,
        "hi_3y": float(s3.max()), "dd_from_3y_high": px / float(s3.max()) - 1,
        "hi_52w": float(s1.max()), "lo_52w": float(s1.min()), "dd_from_52w_high": px / float(s1.max()) - 1,
        "ret_1y": px / float(s1.iloc[0]) - 1 if len(s1) else np.nan,
        "ret_3y": px / float(s3.iloc[0]) - 1 if len(s3) else np.nan,
        "ret_5y": px / float(s[s.index >= last - pd.Timedelta(days=5*365)].iloc[0]) - 1,
    })
pd.DataFrame(stats).to_csv(f"{ROOT}/data/yf/px_stats.csv", index=False)
print("done", C.shape, "last", last, flush=True)
