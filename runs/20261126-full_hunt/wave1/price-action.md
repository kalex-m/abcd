# Price-action scan (Wave 1, Lane B), run 20261126-full_hunt

Source for every number: yFinance daily data (dividend-adjusted closes), pulled in one batch, last close 2026-11-25 (market closed 11-26). Per-ticker pages: https://finance.yahoo.com/quote/<TICKER>/history/. Price is a pointer, not a verdict. "1m" = 21 trading days, "3m" = 63. "Rel" = percentage points versus SPY. No news or analyst views used.

## Headline
**The whole market is under stress, and that matters more than any one sector.** SPY is -6.9% over 1m, -6.8% over 3m, 8.0% below its 2026-10-06 high, still +5.7% YTD (yFinance, as of 2026-11-25). Almost every sector "outperforms" only because SPY fell: defensives (staples, utilities, REITs, health care) are up while tech and semis are crushed.

## (a) 11 sector ETFs (return %, rel = vs SPY)
| ETF | 1m | 1m rel | 3m | 3m rel | YTD |
|---|---|---|---|---|---|
| XLP staples | +5.9 | +12.8 | +9.2 | +16.0 | +21.1 |
| XLV health | +2.5 | +9.4 | +7.5 | +14.3 | +19.6 |
| XLRE real estate | +3.3 | +10.2 | -1.0 | +5.9 | +11.2 |
| XLU utilities | +1.8 | +8.7 | +1.7 | +8.6 | +3.1 |
| XLY discretionary | +1.8 | +8.6 | +1.6 | +8.4 | -0.1 |
| XLC comm. services | +1.7 | +8.6 | -5.1 | +1.7 | -9.0 |
| XLF financials | +1.1 | +8.0 | -2.0 | +4.8 | +4.1 |
| XLB materials | -1.1 | +5.8 | -3.4 | +3.5 | +12.5 |
| XLI industrials | -3.0 | +3.9 | -8.6 | -1.8 | +4.0 |
| XLE energy | -10.7 | -3.8 | -1.7 | +5.2 | +36.1 |
| XLK technology | -17.8 | -10.9 | -17.3 | -10.5 | +8.4 |

Reads (confidence medium; one data source): energy is still best YTD (+36.1%) but fell 10.7% in a month, its worst relative stretch of the year so far visible here; communication services is worst YTD (-9.0%), confirming the prior view; technology is the clear 1m and 3m laggard, which the prior view did not stress.

## (b) Industry ETFs and baskets
| Group | 1m | 1m rel | 3m | 3m rel | YTD |
|---|---|---|---|---|---|
| SMH semis | -24.3 | -17.4 | -26.3 | -19.4 | +13.2 |
| IGV software | -15.0 | -8.1 | -13.9 | -7.0 | -7.4 |
| XOP oil & gas E&P | -16.0 | -9.2 | -9.1 | -2.3 | +31.9 |
| KRE regional banks | -3.8 | +3.1 | -5.5 | +1.3 | +8.9 |
| KBE banks | -3.0 | +3.9 | -5.8 | +1.1 | +6.6 |
| IYT transport | -0.5 | +6.4 | -5.1 | +1.7 | +9.4 |
| Rail basket (UNP CSX NSC CP CNI, equal-weight) | -0.6 | +6.2 | -1.8 | +5.1 | n/a |
| XRT retail | +2.7 | +9.6 | +3.8 | +10.6 | +5.1 |
| XHB homebuilders/housing | +4.5 | +11.4 | -0.3 | +6.6 | +0.2 |
| JETS airlines | +4.1 | +11.0 | -4.2 | +2.7 | -0.6 |
| Payments basket (V MA AXP PYPL FISV FIS GPN) | +5.5 | +12.4 | -0.3 | +6.6 | n/a |
| KIE insurance | +5.8 | +12.6 | +4.1 | +10.9 | +12.3 |
| ITB homebuilders | +8.8 | +15.7 | +3.7 | +10.5 | +2.1 |

What breaks the prior view: homebuilders (ITB, XHB) and airlines (JETS) are not depressed on a 1-month basis; they are up while the market falls, though both are flat to negative YTD (JETS -0.6%, ITB +2.1%). "Depressed" is true only on a longer view.

## (c) Known-name flags (universe: about 140 US large names across the 11 sectors plus rail and payments baskets; EA and WBD returned too little history and were skipped; Fiserv's old ticker FI returns no data, so FISV was used)
Flag rules: new 52-week high or low in last 10 trading days; 1m move beyond +/-10 points versus own sector ETF; 20-day average volume at least 1.3x the 90-day average, or a single day at least 3x.

- **52-week lows (12 names):** NVDA, ORCL, FIS, CAT, BA, NKE, BKNG, NVR, SRE, PLD, GOOGL, NFLX. (heavy in tech and communication).
- **52-week highs (about 17):** staples and defensives dominate (COST, PG, KO, MO, MDLZ, CL, TGT), plus insurers (BRK-B, PGR, CB), utilities (DUK), WM, DIS, YUM, LLY, JNJ, ABBV, HUM, AAPL.
- **Big moves versus own ETF (1m):** up: FISV +25, CMG +32, AAPL +20, LOW +17, CMCSA +16, GPN +17, IBM +16, DPZ +14, DIS +12, HD +12, TMUS +12, MCD +12, TGT +11, SHW +12, MSFT +10, ADBE +12. Down: FIS -24, NOW -23, INTC -24, FCX -25, CAT -21, UNH -18, MU -18, GOOGL -17, PM -15, NVDA -14, GS -13, DOW -11, MS -11, COF -11, CVS -14.
- **Unusual volume (single day at or above 3x):** NVDA 4.7x (2026-11-23), UNH 3.6x (2026-11-19), SO 3.4x (2026-11-13), GPN 3.3x (2026-11-12), TGT 2.9x (2026-11-18, just under). NVDA, GPN also at 20d/90d of 2.08 and 1.53.

## Lead cards (8, see leads/price-action.json)
1. Semis/AI hardware slide (SMH, NVDA, MU, INTC, AMD).
2. Software repeat sell-off (IGV, NOW, ADBE), matches prior view.
3. Payments split (FISV and GPN up, FIS at a 52-week low).
4. Homebuilders rally, contradicts prior view (ITB; NVR is the exception).
5. Big banks and card lenders lag (GS, MS, COF) while insurers hit highs.
6. Energy leadership cracking (XLE, XOP).
7. UnitedHealth 3.6x volume drop, CVS weak.
8. Railroads resilient (weak pointer).

## Limits
Single source (yFinance), no cross-check; no filings were read, so every card is a question, not a finding. Equal-weight baskets, not index-weighted. Prices are dividend-adjusted, so "52-week high" is on adjusted closes.

<!-- COMPLETE -->
