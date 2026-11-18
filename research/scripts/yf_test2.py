import yfinance as yf
tk = yf.Ticker("SHEL")
try:
    q = tk.quarterly_income_stmt
    print("SHEL q income rows:", q.shape, list(q.columns)[:5])
    print(q.loc[[r for r in q.index if r in ("Total Revenue","Net Income","Operating Income")]].iloc[:, :4])
except Exception as e:
    print("ERR inc", repr(e)[:300])
try:
    c = tk.quarterly_cashflow
    print("SHEL q cf rows:", c.shape)
    print(c.loc[[r for r in c.index if r in ("Operating Cash Flow","Capital Expenditure","Free Cash Flow","Repurchase Of Capital Stock")]].iloc[:, :4])
except Exception as e:
    print("ERR cf", repr(e)[:300])
try:
    ip = yf.Ticker("JPM").insider_purchases
    print(ip)
except Exception as e:
    print("ERR insider", repr(e)[:300])
