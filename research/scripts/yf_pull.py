"""yfinance market data for whole universe + statements for foreign filers.
Usage: python3 -I yf_pull.py <out_dir>"""
import sys, json, math
import yfinance as yf
import pandas as pd
out = sys.argv[1]
U = {
 "bank": ["JPM","BAC","WFC","C","GS","MS","USB","PNC","COF"],
 "oil": ["XOM","CVX","COP","EOG","OXY","SHEL","TTE","BP"],
 "semi": ["NVDA","TSM","AVGO","AMD","ASML","MU","INTC","QCOM"],
 "hyper": ["MSFT","AMZN","GOOGL","META","ORCL","AAPL"],
 "soft": ["ADBE","CRM","NOW","INTU","SAP","PLTR","WDAY"],
 "air": ["DAL","UAL","AAL","LUV","ALK","JBLU"],
 "pharma": ["LLY","JNJ","ABBV","MRK","PFE","BMY","AMGN","NVO"],
 "side": ["BRK-B","KO","DHI","LEN","PHM","NVR","TOL","SPY","^GSPC","XLE","XLK","XLF","XLV","IGV","SMH","JETS","ITB"],
}
FX = ["EURUSD=X","DKK=X","TWD=X","GBPUSD=X","CL=F","BZ=F","^TNX","^IRX"]
FOREIGN = ["SHEL","TTE","BP","TSM","ASML","SAP","NVO"]
allt = [t for v in U.values() for t in v]
px = yf.download(allt + FX, start="2025-01-02", end="2026-11-19", auto_adjust=True, progress=False, threads=True)["Close"]
px.to_csv(f"{out}/closes.csv")
print("closes", px.shape, "last date", px.index[-1])
mkt = {}
for t in allt + FX:
    try:
        fi = yf.Ticker(t).fast_info
        d = {k: fi.get(k) for k in ["lastPrice","marketCap","shares","yearHigh","yearLow","fiftyDayAverage","twoHundredDayAverage","currency","previousClose"]}
        mkt[t] = {k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in d.items()}
    except Exception as e:
        mkt[t] = {"err": repr(e)[:120]}
json.dump(mkt, open(f"{out}/market.json", "w"), indent=0, default=str)
print("market ok", len(mkt))
ROWS_I = ["Total Revenue","Gross Profit","Operating Income","Pretax Income","Tax Provision","Net Income","Net Income Common Stockholders","Diluted Average Shares","Interest Expense","Reconciled Depreciation","EBITDA"]
ROWS_C = ["Operating Cash Flow","Capital Expenditure","Free Cash Flow","Repurchase Of Capital Stock","Cash Dividends Paid","Common Stock Dividend Paid","Stock Based Compensation","Issuance Of Debt","Repayment Of Debt"]
ROWS_B = ["Total Assets","Stockholders Equity","Total Debt","Net Debt","Cash And Cash Equivalents","Cash Cash Equivalents And Short Term Investments","Goodwill And Other Intangible Assets","Ordinary Shares Number"]
def grab(df, rows, n):
    o = {}
    if df is None or df.empty: return o
    for r in rows:
        if r in df.index:
            s = df.loc[r].iloc[:n]
            o[r] = {str(k.date()): (None if pd.isna(v) else float(v)) for k, v in s.items()}
    return o
fin = {}
for t in FOREIGN:
    tk = yf.Ticker(t)
    rec = {}
    for nm, attr, rows, n in [("qi","quarterly_income_stmt",ROWS_I,6),("qc","quarterly_cashflow",ROWS_C,6),("ai","income_stmt",ROWS_I,5),("ac","cashflow",ROWS_C,5),("qb","quarterly_balance_sheet",ROWS_B,1)]:
        try: rec[nm] = grab(getattr(tk, attr), rows, n)
        except Exception as e: rec[nm] = {"err": repr(e)[:120]}
    fin[t] = rec
    print(t, "qi rows", len(rec.get("qi", {})), "qc rows", len(rec.get("qc", {})))
json.dump(fin, open(f"{out}/foreign_fin.json", "w"), indent=0)
