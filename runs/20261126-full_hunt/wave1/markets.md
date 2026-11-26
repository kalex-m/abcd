# Markets scanner (Wave 1, Lane A), run 20261126-full_hunt

Last trading close: **2026-11-25** (11-26 is Thanksgiving; ignore the repeated 11-26 rows in yFinance). 1m = vs 2026-10-26, 3m = vs 2026-08-25 (nearest closes). Sources are listed per row; yFinance prices come via `scripts/lib/prices.py` (pages: https://finance.yahoo.com/quote/<ticker>).

## Bottom line
Markets are pricing **disinflation plus growth/risk fear**, not the stagflation-leaning story in the prior view. Oil is down 18% in a month, 10y breakeven inflation fell 22bp, yields rallied, the dollar rose, tech sold off hard and VIX is 28. The one thing that still fits stagflation is that credit spreads widened. The hard data we could check (CPI hot, ISM factory index 55.5 with prices paid 75) disagrees with the market on both inflation and growth.

## Signal table
| Signal | Level (11-25) | 1m chg | 3m chg | Source | Meaning |
|---|---|---|---|---|---|
| 2y Treasury | 4.61% | -9bp (4.70) | +42bp (4.19) | Treasury yield CSV (https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&page&_format=csv) | Prior view 4.80 is stale; market is pricing fewer Fed hikes than on 11-18 (4.80). Still far above 3.47 at start of year. |
| 10y Treasury | 4.85% | -14bp (4.99) | +18bp (4.67) | same | Rallied 22bp from 5.07 on 11-18. Prior "~5.10" was right for 11-17/18 but no longer. |
| 30y Treasury | 5.24% | -6bp (5.30) | +5bp (5.19) | same | Prior 5.46 overstated (5.41 on 11-18). Long end barely moved over 3m: term premium (extra yield for holding long bonds) stays high. |
| 2s10s spread | +24bp | -5bp (+29) | -23bp (+47) | same (computed) | Curve flattening because front end rose more than long end over 3m. Not inverted, no recession signal from shape. |
| HY credit spread (ICE BofA, FRED) | 3.72% (11-24; 11-25 not yet posted) | +42bp (3.30) | +105bp (2.67) | FRED https://fred.stlouisfed.org/graph/fredgraph.csv?id=BAMLH0A0HYM2 | Widest of 2026 (2026 range 2.60 to 3.76, peak 3.76 on 11-20). Real stress building, yet still modest in absolute terms. |
| HYG/IEF price ratio (proxy check) | 0.831 | -1.7% | -2.3% | yFinance | Agrees with FRED direction. |
| Copper/gold ratio (HG=F / GC=F, x1000) | 1.51 | -6.4% | +5.5% | yFinance | Mixed. Both metals crashed (copper -18%/-21%, gold -12%/-25% over 1m/3m), so ratio is distorted by gold's collapse from 5,318 (2026-01-29) to 3,536. Copper falling 18% in a month is a growth warning. |
| WTI (CL=F) | $83.68 | -17.8% | +1.6% | yFinance | Oil bounced to ~$102 WTI on 10-26 and has since fallen back. |
| Brent (BZ=F) | $94.61 | -18.3% (115.81) | +6.8% | yFinance | 2026 front-month high 118.35 on 03-31 (prior "126" not confirmed by yFinance; unverified). Missing from prior view: Brent retested ~$116 on 10-26, then fell 20% in 3 weeks. |
| Dollar index (DX-Y.NYB) | 103.67 | +1.7% | +4.8% | yFinance | Dollar strength = global tightening, risk-off. |
| 10y breakeven (FRED T10YIE) | 2.12% | -22bp (2.34) | -20bp (2.32) | FRED https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10YIE; cross-check Treasury nominal minus real = 2.12 (https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_real_yield_curve&field_tdr_date_value=2026&page&_format=csv) | Falling inflation expectations while CPI is hot. Real 10y yield rose to 2.73 from 2.64 (1m) and 2.34 (3m): the rate squeeze is real yields, not inflation. |
| Cyclicals vs defensives ((XLY+XLI)/(XLP+XLU)) | 2.06 | -4.2% | -10.0% | yFinance | Clear defensive rotation: XLP +4.9% 1m / +7.4% 3m, XLI -8.4% 3m. |
| Small vs large (IWM/SPY) | 0.375 | +3.7% | -4.0% | yFinance | Small caps down less than SPY over 1m (IWM -2.9%, SPY -6.4%) but down ~10% over 3m. Not a clean read. |
| VIX | 28.29 | +10.1 pts (18.39) | +13.9 pts (about 14.4) | Cboe CSV (https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv) | Spiked to 35.89 close on 11-20 (day SPY fell to 689.81), partial reversal. Elevated fear. |
| CFTC WTI managed money net (11-17) | +15.8k contracts | -15.3k vs 10-27 (31.1k) | -68k vs 08-25 (84k) | CFTC Socrata (https://publicreporting.cftc.gov/resource/72hh-3qpy.json) | Speculators have unwound from 111.7k (9-08) to near flat. Oil positioning is clean; little left to sell. |
| CFTC 10y note leveraged-fund net (11-17) | -2.48M | -255k vs 10-27 | -270k vs 08-25 | CFTC TFF (https://publicreporting.cftc.gov/resource/gpe5-46if.json) | Hedge funds more short 10y futures (basis trade, a hedge-fund bond-vs-futures spread bet, mostly), asset managers net long 3.27M. Crowded; a funding squeeze would force buying or selling. Weekly, last report 11-17. |

Equity context (yFinance): SPY 716.7, -6.4% 1m, -6.2% 3m, 8% below its 2026-10-06 high (779). XLK -16.4% 1m. XLE -12.6% 1m. XLC +1.5% 1m. XHB +5.8% 1m. KRE -4.0% 1m. XLF +0.9% 1m.

## Findings (fact, source, meaning, confidence)
1. **Inflation expectations are collapsing while realized inflation is hot.** 10y breakeven 2.12% vs 2.34% a month ago (FRED T10YIE, 11-25); Brent -18% in a month (yFinance). Oct CPI +0.4% m/m after +0.6% in Sep, core +0.3%, above forecasts (BLS release 2026-11-10; search summary only, BLS site not fetched: https://www.bls.gov/schedule/2026/11_sched_list.htm). Meaning: market is looking past energy-driven CPI; either oil's fall is real disinflation or the market is wrong. Confidence medium.
2. **Growth fear in markets vs growth strength in factory data.** ISM manufacturing Oct 55.5, 10th straight month of expansion, prices paid 75.2 (https://www.webull.com/news/15854774774635520, 2026-11-02; secondary page, prices-paid figure single-sourced). Against that: copper -18% 1m, XLI -8.4% 3m, cyclicals/defensives -10% 3m, SPY -6%. Meaning: either ISM is lagging, or the market is pricing something the survey has not seen. Confidence medium-low (hard data not directly verified).
3. **Credit is stressing but not breaking.** HY spread 3.72% vs 2.67% in August (FRED). Meaning: lenders are demanding more; still below crisis levels. It confirms the equity selloff is more than a tech wobble. Confidence medium-high.
4. **The Fed-hike story is being priced down.** 2y 4.61% vs 4.80% on 11-18 (Treasury CSV); 10y 4.85% vs 5.07%. Meaning: the prior view's "hike odds high" for Dec 8-9 looks less supported by the front end (not verified against fed funds futures, which I could not reach). Confidence medium.
5. **Prior view partly broken.** Energy is no longer leading (XLE -12.6% 1m, price tracks oil). Communication services is not the laggard now; technology is (XLK -16% 1m). Yields are lower than the prior figures. Regime read: stagflation is still defensible on hard data but markets lean to slowdown/risk-off with falling inflation expectations.
6. **Gold -25% in 3 months** (5,318 peak in January to 3,536) alongside a rising dollar and higher real yields. Gold is not acting as a fear hedge; it is trading on real yields and dollar. Nothing here that implies a safe-haven bid. Confidence medium.

## Unremarkable
- 2s10s spread: positive, no recession signal on shape alone.
- Small vs large caps: mixed, no clean message.
- WTI speculator positioning: neutral after the unwind.

## Unreachable / not done
- Fed funds futures (December hike odds): not checked; no primary source tried.
- BLS site: not fetched (blocked per brief); CPI/ISM cited via search summaries, marked secondary.
- Cboe CSV needed redirect-follow; worked.

<!-- COMPLETE -->
