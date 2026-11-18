import yfinance as yf, json, sys
for t in ["JPM","COP","SHEL","TWD=X"]:
    try:
        tk = yf.Ticker(t)
        fi = tk.fast_info
        print(t, "price", round(fi.get("lastPrice") or 0, 3), "mcap", fi.get("marketCap"), "ccy", fi.get("currency"))
    except Exception as e:
        print(t, "ERR", repr(e)[:200])
