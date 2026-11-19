"""Pull split history for every universe ticker (yfinance). Output data/yf/splits.json {ticker: [[date, ratio], ...]}"""
import json, time, pandas as pd, yfinance as yf
from concurrent.futures import ThreadPoolExecutor
ROOT = "/home/user/abcd/company_hunt"
U = pd.read_csv(f"{ROOT}/universe/universe.csv")
def one(t):
    for a in range(3):
        try:
            s = yf.Ticker(t).splits
            return t, [[str(d.date()), float(v)] for d, v in s.items() if v and v > 0]
        except Exception:
            time.sleep(3)
    return t, None
with ThreadPoolExecutor(8) as ex:
    res = dict(ex.map(one, U["ticker"]))
json.dump(res, open(f"{ROOT}/data/yf/splits.json", "w"))
print("splits", len(res), "with splits since 2014:", sum(1 for v in res.values() if v and any(d >= "2014" for d, _ in v)), "failed", sum(1 for v in res.values() if v is None))
