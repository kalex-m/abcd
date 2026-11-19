"""Refresh market data and extend monthly history to 2009 (for 10y+ own-valuation history)."""
import json, math, time, sys
import yfinance as yf, pandas as pd
from concurrent.futures import ThreadPoolExecutor
import load as L
tks = list(L.TK2IND)
ETF = ["SPY","RSP","XLK","XLC","XLY","XLP","XLV","XLF","XLI","XLE","XLB","XLU","XLRE"]
FX = ["EURUSD=X","GBPUSD=X","DKK=X","TWD=X","JPY=X","CHF=X","INR=X","CAD=X","AUD=X","SEK=X","BRL=X"]
m = yf.download(tks + ETF + FX, start="2009-01-01", interval="1mo", auto_adjust=True, progress=False, threads=True)["Close"]
m.to_csv(f"{L.R}/yf/monthly_tr.csv")
mu = yf.download(tks, start="2009-01-01", interval="1mo", auto_adjust=False, progress=False, threads=True)["Close"]
mu.to_csv(f"{L.R}/yf/monthly_close_splitadj.csv")
d = yf.download(tks + ETF, period="3y", interval="1d", auto_adjust=True, progress=False, threads=True)["Close"]
d.to_csv(f"{L.R}/yf/daily_tr_3y.csv")
print("prices", m.shape, mu.shape, d.shape, m.index[0], m.index[-1], d.index[-1], flush=True)
info = json.load(open(f"{L.R}/yf/info.json"))
def fi(t):
    for a in range(3):
        try:
            f = yf.Ticker(t).fast_info; return t, f["lastPrice"], f["marketCap"]
        except Exception: time.sleep(2 + 2 * a)
    return t, None, None
with ThreadPoolExecutor(6) as ex:
    for t, p, mc in ex.map(fi, tks):
        if p and mc: info[t]["lastPrice"] = p; info[t]["marketCap"] = mc
json.dump(info, open(f"{L.R}/yf/info.json", "w"))
print("mcaps refreshed")
