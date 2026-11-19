"""Phase 1b: yfinance .info for a ticker list (market cap, sector, analyst count, ownership, short interest...).
Usage: python3 scripts/p1_info.py <tickers.txt> <out.json>
Resumable: skips tickers already in out.json."""
import sys, json, os, time, math
from concurrent.futures import ThreadPoolExecutor, as_completed
import yfinance as yf

src, out = sys.argv[1], sys.argv[2]
tick = [l.strip() for l in open(src) if l.strip()]
res = json.load(open(out)) if os.path.exists(out) else {}
todo = [t for t in tick if t not in res or "err" in res[t]]
KEYS = ["longName","shortName","quoteType","sector","industry","country","marketCap","enterpriseValue","sharesOutstanding",
        "impliedSharesOutstanding","floatShares","numberOfAnalystOpinions","recommendationMean","heldPercentInsiders",
        "heldPercentInstitutions","shortPercentOfFloat","shortRatio","trailingPE","forwardPE","priceToBook","enterpriseToEbitda",
        "enterpriseToRevenue","freeCashflow","operatingCashflow","totalCash","totalDebt","totalRevenue","ebitda","netIncomeToCommon",
        "returnOnEquity","grossMargins","operatingMargins","profitMargins","revenueGrowth","earningsGrowth","dividendYield",
        "payoutRatio","beta","fullTimeEmployees","firstTradeDateMilliseconds","firstTradeDateEpochUtc","currency","financialCurrency",
        "exchange","longBusinessSummary","targetMeanPrice","currentPrice","fiftyTwoWeekHigh","fiftyTwoWeekLow","bookValue",
        "trailingEps","forwardEps","auditRisk","boardRisk","compensationRisk","overallRisk","website","irWebsite"]
def one(t):
    for att in range(4):
        try:
            i = yf.Ticker(t).info
            d = {k: i.get(k) for k in KEYS}
            if d.get("longBusinessSummary"): d["longBusinessSummary"] = d["longBusinessSummary"][:600]
            return t, d
        except Exception as e:
            msg = repr(e)[:150]
            time.sleep(3 * (att + 1) + (10 if "Rate" in msg or "429" in msg else 0))
    return t, {"err": msg}
done = 0
with ThreadPoolExecutor(max_workers=6) as ex:
    futs = [ex.submit(one, t) for t in todo]
    for f in as_completed(futs):
        t, d = f.result(); res[t] = d; done += 1
        if done % 100 == 0:
            json.dump(res, open(out, "w")); print("info", done, "/", len(todo), flush=True)
json.dump(res, open(out, "w"))
print("info done", len(res), "errors", sum(1 for v in res.values() if "err" in v), flush=True)
