"""yfinance: quotes/info, monthly total-return history, daily closes (3y), splits, FX, and quarterly statements for 20-F filers.
Usage: python3 yf_pull.py <universe.json> <out_dir>"""
import json, sys, time, math
import yfinance as yf, pandas as pd
from concurrent.futures import ThreadPoolExecutor

upath, out = sys.argv[1:3]
u = json.load(open(upath))
tks = [t for s in u.values() for i in s.values() for t in i]
ETF = ["SPY","RSP","XLK","XLC","XLY","XLP","XLV","XLF","XLI","XLE","XLB","XLU","XLRE","SMH","IGV","ITB","XRT","JETS","KRE","IYT","XOP","OIH","XME","IHI","IBB","PBJ","ITA","KIE","IAI","AMLP"]
FX = ["EURUSD=X","GBPUSD=X","DKK=X","TWD=X","JPY=X","CHF=X","INR=X","CAD=X","AUD=X","SEK=X","BRL=X"]
def clean(x):
    if isinstance(x, float) and (math.isnan(x) or math.isinf(x)): return None
    return x

# 1) info (fundamental snapshot used for price/mcap/currency only; no analyst targets used in scoring)
KEEP = ["shortName","longName","sector","industry","currency","financialCurrency","marketCap","enterpriseValue","sharesOutstanding",
        "impliedSharesOutstanding","currentPrice","regularMarketPrice","fiftyTwoWeekHigh","fiftyTwoWeekLow","beta","trailingPE","forwardPE",
        "priceToBook","dividendYield","payoutRatio","totalDebt","totalCash","bookValue","trailingEps","quoteType","exchange","country",
        "heldPercentInsiders","heldPercentInstitutions","shortPercentOfFloat","fullTimeEmployees","fiveYearAvgDividendYield"]
def info(t):
    # quoteSummary (.info) is crumb/rate-limited from this network -> use chart-based fast_info + splits
    for a in range(3):
        try:
            tk = yf.Ticker(t); fi = tk.fast_info; d = {}
            for k in ["lastPrice","marketCap","shares","currency","yearHigh","yearLow","quoteType","exchange"]:
                try: d[k] = clean(fi[k])
                except Exception: d[k] = None
            try:
                sp = tk.splits; d["splits"] = [[str(k.date()), float(v)] for k, v in sp.items()] if sp is not None else []
            except Exception: d["splits"] = []
            if d.get("lastPrice"): return t, d
        except Exception: pass
        time.sleep(2 + 3 * a)
    return t, {"err": True}
res = {}
with ThreadPoolExecutor(6) as ex:
    for t, d in ex.map(info, tks + ETF):
        res[t] = d
json.dump(res, open(f"{out}/info.json", "w"))
print("info", len(res), "missing price:", [t for t, d in res.items() if not d.get("lastPrice")], flush=True)

# 2) monthly total-return closes since 2014, and daily closes 3y
allt = tks + ETF + FX
m = yf.download(allt, start="2014-01-01", interval="1mo", auto_adjust=True, progress=False, threads=True)["Close"]
m.to_csv(f"{out}/monthly_tr.csv")
mu = yf.download(tks, start="2014-01-01", interval="1mo", auto_adjust=False, progress=False, threads=True)["Close"]
mu.to_csv(f"{out}/monthly_close_splitadj.csv")
d = yf.download(tks + ETF, period="3y", interval="1d", auto_adjust=True, progress=False, threads=True)["Close"]
d.to_csv(f"{out}/daily_tr_3y.csv")
print("prices", m.shape, d.shape, flush=True)

# 3) quarterly statements for 20-F filers (fresh TTM; SEC 20-F is annual only)
FOREIGN = ["TSM","ASML","SAP","NVO","AZN","NVS","SHEL","TTE","BP","TM","STLA","BHP","RIO","BTI","INFY","SPOT","CP"]
qs = {}
def stm(t):
    tk = yf.Ticker(t); r = {}
    for name, df in [("qi", tk.quarterly_income_stmt), ("qc", tk.quarterly_cashflow), ("qb", tk.quarterly_balance_sheet),
                     ("ai", tk.income_stmt), ("ac", tk.cashflow)]:
        try:
            r[name] = {row: {str(c.date()): clean(float(v)) for c, v in df.loc[row].items() if pd.notna(v)} for row in df.index}
        except Exception: r[name] = {}
    return t, r
with ThreadPoolExecutor(4) as ex:
    for t, r in ex.map(stm, [t for t in FOREIGN if t in tks]):
        qs[t] = r
json.dump(qs, open(f"{out}/foreign_stmts.json", "w"))
print("foreign stmts", list(qs), flush=True)
