# Ground 6: The Hidden Room (sum-of-the-parts triage)

Run date 2026-11-19. Market data: yfinance close of 2026-11-18 (FX the same day). Filings: SEC EDGAR (10-K, 10-Q, 20-F, 40-F, 6-K, 8-K exhibits). No FMP.

Method, applied to every company below: listed stakes at market value, minus tax on the gain over book where a sale would be taxable (21% US federal plus a few points of state unless stated; foreign holders at their home rate); unlisted segments at an explicit, deliberately low multiple of segment profit; the rest of the company at a plain multiple; minus net debt at the parent level (consolidated subsidiaries' own debt stays with the subsidiary when the subsidiary is valued at its listed equity value). "SOTP gap" = conservative SOTP / market cap - 1. A positive gap is the cushion; a negative gap means the hidden asset is already in the price or worth less than it looks.

Conventions: $bn = US$ billions. mcap = yfinance market cap on 2026-11-18 (all share classes where yfinance reports them). "Book" = carrying value in the latest filing.


## NWSA: News Corporation (KEEP (mid))

Hidden asset: 62.0% of REA Group (ASX: REA) plus 80% of Move (realtor.com) (listed stake). Market cap $14.6bn.

| part | basis | value $bn |
|---|---|---:|
| **REA Group 62.0% at market, less 21% tax on a near-zero-basis gain** | A$21.3bn x 0.6713 x 62% = $8.9bn pre-tax | 7.0 |
| Move 80% | 1.0x FY26 revenue ~$0.64bn (EBITDA thin) | 0.5 |
| Dow Jones | 11x FY26 Segment EBITDA $663m | 7.3 |
| Book Publishing (HarperCollins) | 7x FY26 Segment EBITDA $287m | 2.0 |
| News Media | 3x FY26 Segment EBITDA $139m | 0.4 |
| Corporate costs | -6x FY26 Other EBITDA -$203m | -1.2 |
| DAZN stake and other securities | about half of $953m carried (rest is REA's own) | 0.5 |
| less net debt | borrowings $2.01bn - cash $1.78bn, 30 Sep 2026 (cash includes REA's; small double count) | -0.2 |
| **conservative SOTP** | | **16.3** |
| market cap | yfinance 2026-11-18 | 14.6 |
| **gap** | SOTP / mcap - 1 | **+12%** |

News Corp owns 62.0% of REA Group (10-Q, 30 Sep 2026), Australia's dominant property portal, worth A$13.2bn (US$8.9bn) at the 18 Nov 2026 ASX price, against a News Corp market cap of $14.6bn across both share classes. The rest is not junk either: Dow Jones earned $663m of Segment EBITDA in FY Jun-2026 (+13%), HarperCollins $287m, and the parent has only $0.2bn of net debt. Once I tax the REA stake at 21% on a near-zero basis and put plain multiples on the rest, the SOTP is about $16.3bn, a 10-12% cushion, and it is 24% if you assume REA could leave tax-free, which nothing in the filings suggests. The real problem is unlock: REA's price has already dropped from its 2025 highs, the Murdoch family controls the votes, and the only visible lever is a $1bn buyback with $501m left. A real hidden asset with a thin conservative gap and no catalyst.

Sources: https://www.sec.gov/Archives/edgar/data/1564708/000156470826000250/nws-20260930.htm (10-Q Q1 FY27, filed 2026-11-05); https://www.sec.gov/Archives/edgar/data/1564708/000156470826000175/nws-20260630.htm (10-K FY Jun-2026, filed 2026-08-07); yfinance REA.AX, NWSA, NWS, AUDUSD close 2026-11-18
