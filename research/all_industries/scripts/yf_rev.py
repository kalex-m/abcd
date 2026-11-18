"""yfinance annual + quarterly Total Revenue for every company (referee for SEC revenue-tag choice)."""
import json, math, time, yfinance as yf, pandas as pd
from concurrent.futures import ThreadPoolExecutor
import load as L
def get(t):
    for a in range(3):
        try:
            tk = yf.Ticker(t); out = {}
            for nm, df in (("a", tk.income_stmt), ("q", tk.quarterly_income_stmt)):
                if df is not None and "Total Revenue" in df.index:
                    out[nm] = {str(c.date()): float(v) for c, v in df.loc["Total Revenue"].items() if pd.notna(v)}
            return t, out
        except Exception: time.sleep(2 + 3 * a)
    return t, {}
res = {}
with ThreadPoolExecutor(5) as ex:
    for t, d in ex.map(get, list(L.TK2IND)): res[t] = d
json.dump(res, open(f"{L.R}/yf/revenue.json", "w"))
print(len(res), "empty:", [t for t, d in res.items() if not d.get("a")])
