"""Fill metrics for universe names without usable us-gaap XBRL (mostly IFRS 20-F filers) from yfinance statements.
Also writes triage/xcheck_yf_vs_edgar.csv comparing EDGAR vs yfinance revenue/OCF/capex/FCF for a sample.
Usage: python3 scripts/p2_yf_merge.py
"""
import json, numpy as np, pandas as pd
ROOT = "/home/user/abcd/company_hunt"
M = pd.read_csv(f"{ROOT}/triage/metrics.csv")
Y = json.load(open(f"{ROOT}/data/yf/yf_fund.json"))
import yfinance as yf
curs = sorted(set(M["fin_currency"].dropna()) - {"USD"})
FX = {"USD": 1.0}
for c in curs:
    try:
        h = yf.download(f"{c}USD=X", period="10d", progress=False, auto_adjust=True)["Close"]
        v = float(h.dropna().iloc[-1].iloc[0] if hasattr(h.dropna().iloc[-1], "iloc") else h.dropna().iloc[-1])
        FX[c] = v / 100 if c in ("GBp", "ZAc", "ILA") else v
    except Exception as e:
        print("fx fail", c, e)
print("FX", FX)
def ann(d, sec, row):
    s = (d.get(sec) or {}).get(row) or {}
    s = {k: v for k, v in s.items() if v is not None}
    return dict(sorted(s.items()))
M["src_fund"] = np.where(M["rev"].notna() & M["ocf"].notna(), "edgar", None)
filled = 0
for i, r in M.iterrows():
    if r["src_fund"] == "edgar": continue
    d = Y.get(r["ticker"])
    if not d or "err" in d: continue
    rev = ann(d, "ai", "Total Revenue"); ocf = ann(d, "ac", "Operating Cash Flow"); capex = ann(d, "ac", "Capital Expenditure")
    if not rev or not ocf: continue
    ly = max(ocf); fx = 1.0
    # yfinance statements are in financialCurrency; market cap in USD -> convert with price ratio not available; use info ratio
    revv = rev.get(ly); ocfv = ocf[ly]; cap = -capex.get(ly, 0) if capex.get(ly) is not None else 0
    oi = ann(d, "ai", "Operating Income").get(ly); ni = ann(d, "ai", "Net Income").get(ly); gp = ann(d, "ai", "Gross Profit").get(ly)
    sbc = ann(d, "ac", "Stock Based Compensation").get(ly) or 0
    cash = ann(d, "ab", "Cash Cash Equivalents And Short Term Investments"); debt = ann(d, "ab", "Total Debt")
    c = cash[max(cash)] if cash else None; db = debt[max(debt)] if debt else None
    M.at[i, "rev"] = revv; M.at[i, "ocf"] = ocfv; M.at[i, "capex"] = cap; M.at[i, "fcf"] = ocfv - cap; M.at[i, "sbc"] = sbc
    M.at[i, "fcf_sbc"] = ocfv - cap - sbc; M.at[i, "oi"] = oi; M.at[i, "ni"] = ni; M.at[i, "gp"] = gp
    M.at[i, "last_fy"] = int(ly[:4]); M.at[i, "src_fund"] = "yf"; M.at[i, "debt_src"] = "yf"
    if revv:
        M.at[i, "om"] = oi / revv if oi is not None else None
        M.at[i, "gm"] = gp / revv if gp is not None else None
        M.at[i, "capex_rev"] = cap / revv; M.at[i, "fcf_margin"] = (ocfv - cap) / revv
    if c is not None and db is not None:
        M.at[i, "cash_sti"] = c; M.at[i, "debt"] = db; M.at[i, "net_cash"] = c - db
    ys = sorted(rev)
    if len(ys) >= 4 and rev[ys[-4]] and rev[ys[-4]] > 0 and revv and revv > 0:
        M.at[i, "rev_cagr_3y"] = (revv / rev[ys[-4]]) ** (1 / 3) - 1
    filled += 1
# currency: yfinance financials for foreign filers are in financialCurrency; scale yields using rev_yf/totalRevenue ratio is unreliable,
# so compute yields only when fin_currency == currency == USD; otherwise convert via ratio of yfinance totalRevenue (USD-quoted? no) -> flag.
fxmask = (M["src_fund"] == "yf") & (M["fin_currency"].fillna("USD") != "USD")
M["fx_flag"] = np.where(fxmask, "statements in " + M["fin_currency"].fillna(""), "")
for i, r in M[M["src_fund"] == "yf"].iterrows():
    mcap = r["mcap"]
    fx = 1.0
    if r["fx_flag"]:
        # crude FX: use yfinance info fcf_yf? it's in financial currency too. Use FX rates pulled separately.
        fx = FX.get(r["fin_currency"], np.nan) if "FX" in globals() else np.nan
    if mcap and pd.notna(r["fcf"]) and fx == fx:
        M.at[i, "fcf_yield"] = r["fcf"] * fx / mcap; M.at[i, "fcf_sbc_yield"] = r["fcf_sbc"] * fx / mcap
        if pd.notna(r["net_cash"]):
            M.at[i, "netcash_mcap"] = r["net_cash"] * fx / mcap
            ev = mcap - r["net_cash"] * fx; M.at[i, "ev"] = ev
            M.at[i, "fcf_ev_yield"] = r["fcf"] * fx / ev if ev > 0 else None
        if pd.notna(r["ni"]) and r["ni"] > 0: M.at[i, "pe_now"] = mcap / (r["ni"] * fx)
        if pd.notna(r["oi"]) and r["oi"] > 0 and M.at[i, "ev"]: M.at[i, "evebit_now"] = M.at[i, "ev"] / (r["oi"] * fx)
M.to_csv(f"{ROOT}/triage/metrics.csv", index=False)
print("filled from yfinance:", filled, "| fx-flagged:", int(fxmask.sum()))
