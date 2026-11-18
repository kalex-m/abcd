import sys, json, math
import yfinance as yf, pandas as pd
out = sys.argv[1]; tickers = sys.argv[2:]
ROWS_B = ["Total Debt","Net Debt","Cash Cash Equivalents And Short Term Investments","Cash And Cash Equivalents","Stockholders Equity","Goodwill And Other Intangible Assets","Total Assets","Capital Lease Obligations","Long Term Debt","Current Debt","Preferred Stock","Ordinary Shares Number","Inventory","Accounts Receivable","Net PPE"]
ROWS_C = ["Operating Cash Flow","Capital Expenditure","Free Cash Flow","Stock Based Compensation","Repurchase Of Capital Stock","Cash Dividends Paid","Depreciation And Amortization"]
ROWS_I = ["Total Revenue","Operating Income","Net Income","EBITDA","Diluted Average Shares","Interest Expense","Pretax Income","Tax Provision"]
res = {}
for t in tickers:
    tk = yf.Ticker(t); r = {}
    try:
        b = tk.quarterly_balance_sheet
        if b is not None and not b.empty:
            col = b.columns[0]; r["bs_date"] = str(col.date())
            for k in ROWS_B:
                if k in b.index and not pd.isna(b.loc[k, col]): r[k] = float(b.loc[k, col])
    except Exception as e: r["bs_err"] = repr(e)[:80]
    for nm, attr, rows in [("qc", "quarterly_cashflow", ROWS_C), ("qi", "quarterly_income_stmt", ROWS_I)]:
        try:
            df = getattr(tk, attr)
            if df is not None and not df.empty:
                r[nm] = {k: {str(c.date()): (None if pd.isna(df.loc[k, c]) else float(df.loc[k, c])) for c in df.columns[:5]} for k in rows if k in df.index}
        except Exception as e: r[nm + "_err"] = repr(e)[:80]
    res[t] = r
    print(t, r.get("bs_date"), "debt", round((r.get("Total Debt") or 0)/1e9, 1), "cash+sti", round((r.get("Cash Cash Equivalents And Short Term Investments") or 0)/1e9, 1), "eq", round((r.get("Stockholders Equity") or 0)/1e9, 1))
json.dump(res, open(out, "w"))
