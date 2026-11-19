"""yfinance annual + quarterly fundamentals for a ticker list (fallback for IFRS/20-F filers, and cross-check sample).
Usage: python3 scripts/p2_yf_fund.py <tickers.txt> <out.json>"""
import sys, json, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd, yfinance as yf
src, out = sys.argv[1], sys.argv[2]
tick = [l.strip() for l in open(src) if l.strip()]
res = json.load(open(out)) if os.path.exists(out) else {}
RI = ["Total Revenue","Gross Profit","Operating Income","Pretax Income","Tax Provision","Net Income","Net Income Common Stockholders","Diluted Average Shares","Interest Expense","Reconciled Depreciation","EBITDA","EBIT","Research And Development"]
RC = ["Operating Cash Flow","Capital Expenditure","Free Cash Flow","Repurchase Of Capital Stock","Cash Dividends Paid","Stock Based Compensation","Issuance Of Capital Stock","Acquisitions Net"]
RB = ["Total Assets","Stockholders Equity","Total Debt","Net Debt","Cash And Cash Equivalents","Cash Cash Equivalents And Short Term Investments","Goodwill And Other Intangible Assets","Ordinary Shares Number","Long Term Debt","Current Debt"]
def grab(df, rows):
    o = {}
    if df is None or df.empty: return o
    for r in rows:
        if r in df.index:
            o[r] = {str(k.date()): (None if pd.isna(v) else float(v)) for k, v in df.loc[r].items()}
    return o
def one(t):
    for att in range(3):
        try:
            tk = yf.Ticker(t)
            return t, {"ai": grab(tk.income_stmt, RI), "ac": grab(tk.cashflow, RC), "ab": grab(tk.balance_sheet, RB),
                       "qi": grab(tk.quarterly_income_stmt, RI), "qc": grab(tk.quarterly_cashflow, RC), "qb": grab(tk.quarterly_balance_sheet, RB)}
        except Exception as e:
            err = repr(e)[:120]; time.sleep(4 * (att + 1))
    return t, {"err": err}
todo = [t for t in tick if t not in res]
with ThreadPoolExecutor(max_workers=4) as ex:
    for i, f in enumerate(as_completed([ex.submit(one, t) for t in todo])):
        t, d = f.result(); res[t] = d
        if i % 50 == 0: json.dump(res, open(out, "w")); print("yf fund", i, flush=True)
json.dump(res, open(out, "w")); print("yf fund done", len(res), flush=True)
