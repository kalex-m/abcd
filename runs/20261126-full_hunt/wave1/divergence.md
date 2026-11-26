# Divergence scan (Wave 1, Lane B), run 20261126-full_hunt

As of: prices through the 2026-11-25 close (yFinance, daily); fundamentals from SEC EDGAR XBRL companyfacts and the latest 10-Q/8-K. Universe: 121 large US tickers screened (119 scored; FI and TMHC had no EDGAR CIK match; CP and CNI file 40-F/foreign forms and had no usable quarters). Method: discrete quarters from 10-Q/10-K facts (3-month durations, or year-to-date differences), last two quarters compared with the same quarters a year earlier. Free cash flow = operating cash flow minus capex. Analyst views and news were not used. Banks: cash-flow lines are noisy, so only revenue and pre-tax income count. Stale or sparse XBRL (not scored): JPM (2014 data), C (Dec 2025), MTH (2022), NEE/SO/DUK (Mar 2026), COST (May 2026), XOM operating cash flow missing.

## Result in one line
Several real divergences survived the filing check, mostly in software, industrial machinery and brokers. None is a clean "nobody cares" case. Each has a named explanation to test next.

## Top divergences (price down while fundamentals improved)

| Ticker | Price 3m / 6m | Last two quarters YoY (rev / op inc / FCF) | Filing | Type | Check next |
|---|---|---|---|---|---|
| CAT | -34% / -40% | +24%,+17% / +50%,+38% / +47%,+19% | 10-Q 0000018230-26-000057; EX-99.1 2026-10-29 | price down, record backlog | order trend, AI-power theme unwind |
| DDOG | -30% / -29% | +36%,+35% / +115%,+1386% / +65%,+19% | 10-Q 0001628280-26-070292 | down after strong quarter | usage vs seat pricing |
| INTU | -21% / -11% | +14%,+12% / +40%,+63% / +256%,+65% | 10-Q 0000896878-26-000045 | down, results beat guidance | AI-agent fear vs consumer data |
| NVDA | -29% / -30% | release: +103% rev, +115% op inc | 8-K 0001045810-26-000088 (10-Q not yet filed) | down after strong quarter plus CEO swap | governance 8-Ks |
| FIS | -31% / -33% | +29%,+27% (pro forma +3.7%) / +24%,+44% / +28%,+33% | 10-Q 0001136893-26-000063 | acquisition-inflated | debt, organic growth |
| GS / MS | -23% / -21% | +11%,+9% rev; pre-tax +30% / +7% | 10-Q 0000886982-26-000532; 0000895421-26-000293 | breaks from regional banks | which revenue line |
| INTC | -38% / -55% | +25%,+21% / +157%,+269% / +397%,+774% | 10-Q 0000050863-26-000191 | round trip after a big run | Q4 guide (EPS $0.25 non-GAAP vs $0.52) |

Group moves worth knowing, not scored as single-name cards:
- Software sold as a group over 3 months while revenue still grows 11-35%: DDOG -30%, NOW -27% (but GAAP operating income -33% to -55%, so not clean), INTU -21%, ADBE -15% (rev +13%), TEAM -14%, SNOW -15%, HUBS -11%. CRM -4% and WDAY -5% 3m are up 6m. ZM (the relevance-loss reference) shows flat fundamentals: revenue +5%, operating income -2% to +2%, FCF -7% to -9%, price -11% 6m. That looks like losing growth, not a divergence.
- Trucking and freight: ODFL -12%/-20%, JBHT -13%/-16%, CHRW -4%/-17% (3m/6m) while revenue grew 10-30% and operating income rose in the last two quarters (JBHT +2% latest). CHRW operating cash flow fell 55-84%; check working capital before reading this as a divergence. XBRL: ODFL 0000878927-26-000033, JBHT 0001437749-26-033365, CHRW 0001043277-26-000043.
- Big tech with AI capex: GOOGL -30% 6m and META (3m +6%, 6m -4%) have revenue +24-28% but free cash flow falling or negative because of capex. That is a capex worry, not an unexplained gap. ORCL -45% 6m: revenue +30%, FCF -1391% in a quarter (capex).

## Peer breaks and macro driver
- Airlines vs fuel: Brent about $90.5 on 2026-11-26 (3m +1%, 6m -3%, high $118), per yFinance BZ=F. Oil has not fallen much in 3 months, so no "fuel fell, airlines did not rise" test is possible. Peers split: LUV +14%/+6%, DAL 0%/+2% (op income -11%/-14%), UAL -9%/-7%, AAL -9%/-16% (op income -61%/-24%), ALK -16%/-21%. AAL and ALK fell with weak operating income, which is consistent. Filings: AAL 0000006201-26-000065, DAL 0000027904-26-000038, LUV 0000092380-26-000107.
- Banks: capital-markets and card names (GS, MS, BAC, COF, SCHW) fell while WFC (+8%), USB (+9%) and PNC (+2%) rose over 6 months. WFC 10-Q 0000072971-26-000327.
- Payments: V +30% and MA +34% 6m with revenue +13-14%, operating income +11-18%: price and fundamentals agree. PYPL +33% 6m with operating income -5% to -8% is a mild warning.
- Rails: UNP +8%, CSX +9%, NSC +1% (6m), revenue +10-15%, operating income up. No divergence.

## Reverse warnings (price up, fundamentals weaker)
- Homebuilders: PHM +14% 6m, TOL +11%, DHI +7%; revenue -3% to -10%, operating income -10% to -26%. LEN is -33% off its high with revenue -5% to -9%, operating income -36% to -51%, so LEN is consistent. NVR -26% off high, KBH -27%/-20% revenue.
- GPN +32% 6m: revenue +64% bought, operating income -68%, free cash flow negative.
- MSFT +19% 6m with FCF -23%/-27% (capex); revenue and operating income +18-21% so a mild flag only.

## Confidence and gaps
- Quarter derivation is mine from XBRL facts, with spot checks against the filings for CAT, DDOG, FIS, INTC, INTU, NVDA. Check any ticker again before acting on it.
- NVDA XBRL for the October quarter is not yet filed; NVDA numbers come from the 8-K release.
- FRED, BLS and other macro layers were not needed for this lane. The prior view's 10-year yield of 5.10% (Nov 17) is not confirmed here: yFinance ^TNX shows 4.85% on 2026-11-25. Treat the rate numbers as unverified.
- Not covered: peer groups outside the 121 names, earnings-date effects, price after 11-25 (market closed 11-26).

<!-- COMPLETE -->
