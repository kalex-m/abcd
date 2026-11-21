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

## L: Loews Corporation (DROP (gap too small))

Hidden asset: ~92% of CNA Financial (listed) plus 100% Boardwalk Pipelines and Loews Hotels (listed stake + unlisted segments). Market cap $22.2bn.

| part | basis | value $bn |
|---|---|---:|
| **CNA ~92% at market** | CNA mcap $13.12bn x 92%; held since 1974, inside the tax group so a spin could be tax-free | 12.1 |
| Boardwalk Pipelines equity | 9x annualised 9M-2026 EBITDA $901m (=$1.20bn) less ~$3.6bn Boardwalk+Hotels debt (consolidated $8.94bn - parent $1.8bn - CNA ~$3.5bn) | 7.2 |
| Loews Hotels equity | placeholder at $1.5bn; hotel EBITDA not broken out in the 10-Q (not verified) | 1.5 |
| less net debt | parent cash and investments net $4.4bn less parent notes $1.8bn (30 Sep 2026) | 2.6 |
| **conservative SOTP** | | **23.4** |
| market cap | yfinance 2026-11-18 | 22.2 |
| **gap** | SOTP / mcap - 1 | **+5%** |

Loews is the textbook hidden-room structure: ~92% of CNA ($12.1bn at market), all of Boardwalk Pipelines (9M-2026 EBITDA $901m), Loews Hotels, and $4.4bn of parent cash and investments against $1.8bn of parent notes. Add them up with Boardwalk at 9x EBITDA net of its debt and a cautious $1.5bn for the hotels and I get about $23.4bn against a $22.2bn market cap, a 5% cushion. Boardwalk at 11x would add $2.4bn, so the gap is sensitive to one multiple, but the conservative case is nearly closed. The Tisch family has bought back 3.2m shares this year and shows no sign of a spin, so there is neither a big gap nor a lever. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/60086/000006008626000056/l-20260930.htm (10-Q Q3 2026, filed 2026-11-02); https://www.sec.gov/Archives/edgar/data/60086/000006008626000008/l-20251231.htm (10-K 2025, debt note 11); yfinance CNA, L close 2026-11-18

## BIO: Bio-Rad Laboratories, Inc. (DROP (priced))

Hidden asset: 38% of Sartorius AG ordinary and 28% of preference shares (Frankfurt-listed) plus a EUR400m loan secured on Sartorius trust interests (listed stake). Market cap $10.0bn.

| part | basis | value $bn |
|---|---|---:|
| **Sartorius stake at market less 21% US tax** | 12.99m ord x EUR239.0 + 9.59m pref x EUR304.1 = $6.62bn pre-tax | 5.2 |
| **EUR400m loan to Sartorius family trust vehicle** | at par; value-appreciation rights ignored | 0.4 |
| Bio-Rad operating business | 10x FY2025 FCF $0.37bn (GAAP op margin 2%; revenue $2.58bn flat) | 3.7 |
| less net debt | debt $1.20bn - cash $0.47bn - short-term investments $1.20bn (30 Sep 2026) | 0.5 |
| **conservative SOTP** | | **9.8** |
| market cap | yfinance 2026-11-18 | 10.0 |
| **gap** | SOTP / mcap - 1 | **-1%** |

Bio-Rad owns 12.99m Sartorius ordinary and 9.59m preference shares (10-Q, 30 Sep 2026), worth $6.6bn at Frankfurt prices, plus a EUR400m loan secured on trust interests that turn into Sartorius ordinary shares when the family trust ends in mid-2028. That stake alone is 67% of Bio-Rad's $10.0bn market cap. But the stake is held at a near-zero tax basis, so a sale costs about $1.4bn of US tax, and the operating business is weak: FY2025 revenue $2.58bn, flat for three years, GAAP operating margin 2%, FCF $0.37bn. Taxed stake plus core at 10x FCF plus $0.5bn net cash comes to about $9.8bn, roughly the market cap. The hidden asset is real and widely known; the market already pays for it.

Sources: https://www.sec.gov/Archives/edgar/data/12208/000001220826000058/bio-20260930.htm (10-Q Q3 2026); yfinance SRT.DE, SRT3.DE, BIO, EURUSD close 2026-11-18; triage/metrics.csv (FY2025 revenue, FCF)

## EQH: Equitable Holdings, Inc. (DROP (no gap))

Hidden asset: 68.3% economic interest in AllianceBernstein (199.3m AB Units + GP interest) (listed stake). Market cap $14.2bn.

| part | basis | value $bn |
|---|---|---:|
| **AB 68.3% at AB Holding unit price, 10% tax haircut** | 199.4m units x $31.86 = $6.35bn pre-tax | 5.7 |
| Retirement segment | 6x annualised 9M-2026 operating earnings $1,230m (=$1.64bn) | 9.8 |
| Wealth Management | 12x annualised $193m (=$0.26bn) | 3.1 |
| Corporate and Other (incl. holdco interest, legacy VA) | -6x annualised -$318m | -2.5 |
| Preferred stock | ~$1.6bn liquidation (approx., not re-verified this run) | -1.6 |
| less net debt | holdco interest already inside Corporate and Other | -0.0 |
| **conservative SOTP** | | **14.5** |
| market cap | yfinance 2026-11-18 | 14.2 |
| **gap** | SOTP / mcap - 1 | **+2%** |

Equitable holds 199.3m AB Units plus the 1% GP interest, a 68.3% economic interest in AllianceBernstein (10-Q, 30 Sep 2026), worth $6.4bn at the AB Holding unit price against a $14.2bn market cap. The rest earns real money: Retirement $1,230m and Wealth Management $193m of operating earnings in 9M-2026, less $318m of corporate drag. At 6x for the insurer, 12x for wealth and a 10% tax haircut on AB, the parts sum to about $14.6bn, within 2% of the market price. The AB stake is visible, not hidden, and management is buying more of it rather than unlocking it. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1333986/000133398626000060/eqh-20260930.htm (10-Q Q3 2026); yfinance AB, EQH close 2026-11-18
