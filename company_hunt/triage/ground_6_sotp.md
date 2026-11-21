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

## MPC: Marathon Petroleum Corporation (DROP (priced, boom earnings))

Hidden asset: ~647m MPLX common units (~64%) plus the MPLX general partner (listed stake). Market cap $101.8bn.

| part | basis | value $bn |
|---|---|---:|
| **MPLX 647m units at market, 15% tax haircut** | 647m x $57.38 = $37.1bn pre-tax; pays MPC ~$3.1bn/yr | 31.5 |
| Refining & Marketing | 5x mid-cycle EBITDA $6.0bn (9M-2026 actual $17.9bn is a boom, not a base) | 30.0 |
| Renewable Diesel | ~1.5x annualised 9M-2026 EBITDA $0.55bn | 1.0 |
| Corporate costs | -5x ~$0.8bn/yr (approx.) | -4.0 |
| less net debt | MPC ex-MPLX: debt $32.9bn - MPLX $26.6bn = $6.3bn; cash+ST inv $13.6bn - MPLX cash $1.3bn = $12.3bn (net cash) | 6.0 |
| **conservative SOTP** | | **64.6** |
| market cap | yfinance 2026-11-18 | 101.8 |
| **gap** | SOTP / mcap - 1 | **-37%** |

MPC owns about 647m MPLX units, worth $37.1bn at market (MPC's own 10-Q prints $36.5bn at the 30 Sep price), plus the GP, and after the 2026 refining boom MPC itself sits on about $6bn of net cash outside MPLX. But Refining & Marketing earned $17.9bn of segment EBITDA in nine months of 2026 against $4.1bn a year earlier, so any SOTP depends on what you call normal. At a mid-cycle $6bn R&M EBITDA and 5x, plus MPLX less a tax haircut, I get about $65bn against a $101.8bn market cap. The MPLX stake is the opposite of hidden and the market is pricing boom margins. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1510295/000151029526000071/mpc-20260930.htm (10-Q Q3 2026); yfinance MPLX, MPC close 2026-11-18

## AR: Antero Resources Corporation (DROP (no gap))

Hidden asset: Equity-method stake in Antero Midstream (fair value $2.8bn at 30 Sep 2026) (listed stake). Market cap $11.3bn.

| part | basis | value $bn |
|---|---|---:|
| **Antero Midstream stake at market less 21% tax on gain** | fair value $2.8bn (10-Q) vs carrying $0.35bn | 2.3 |
| Exploration & production | 6x FY2025 operating cash flow $1.63bn (incl. AM dividends) | 9.8 |
| less net debt | metrics.csv net debt (latest balance sheet) | -2.8 |
| **conservative SOTP** | | **9.3** |
| market cap | yfinance 2026-11-18 | 11.3 |
| **gap** | SOTP / mcap - 1 | **-17%** |

Antero Resources carries its Antero Midstream stake at $348m under equity-method accounting, but its own 10-Q footnotes the market value at $2.8bn (30 Sep 2026), a quarter of AR's $11.3bn market cap. That gap between book and market looks like a hidden asset on a screen, but anyone who reads the footnote sees it. Taxing the gain and putting the E&P business at 6x FY2025 operating cash flow ($1.63bn) gives about $9.5bn less $2.8bn net debt, well under the market cap, which is pricing higher gas. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1433270/000110465926119637/ar-20260930x10q.htm (10-Q Q3 2026, investment note); triage/metrics.csv; yfinance AR, AM close 2026-11-18

## MGM: MGM Resorts International (DROP (lease trap))

Hidden asset: ~56% of MGM China (HKEX: 2282) and 50% of BetMGM (listed stake + JV). Market cap $8.5bn.

| part | basis | value $bn |
|---|---|---:|
| **MGM China ~56% at market** | HK$39.9bn x 0.1275 x 56% | 2.9 |
| **BetMGM 50%** | ~1x MGM's half of revenue (approx.); $25m first distribution in 2026 | 1.5 |
| Las Vegas Strip + Regional, after leases | 7.5x annualised 9M-2026 EBITDAR $3.73bn = $28.0bn less $23.9bn operating lease liabilities (VICI etc.) | 4.1 |
| Corporate expense | approx. -$0.5bn/yr x 5 | -2.5 |
| less net debt | debt ex-MGM China $3.37bn less ~$1.8bn non-China cash (China cash split not disclosed; approx.) | -1.6 |
| **conservative SOTP** | | **4.4** |
| market cap | yfinance 2026-11-18 | 8.5 |
| **gap** | SOTP / mcap - 1 | **-48%** |

MGM looks like a classic hidden-room case on a screen: an $8.5bn market cap holding about 56% of MGM China ($2.9bn at market) and half of BetMGM. The trap is the lease stack: MGM sold its real estate and now carries $23.9bn of operating lease liabilities (30 Sep 2026). Capitalise the Strip and regional EBITDAR ($3.73bn annualised, Strip down 5% year on year) at 7.5x and the equity left after leases is only about $4bn; add the stakes, subtract corporate cost and parent net debt and the SOTP is roughly half the market cap. The hidden assets are real but small next to the rent. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/789570/000078957026000107/mgm-20260930.htm (10-Q Q3 2026); yfinance 2282.HK, MGM, HKDUSD close 2026-11-18

## JD: JD.com, Inc. (KEEP (high gap, high trap))

Hidden asset: Listed subsidiaries JD Logistics (~64%), JD Health (~67%), JD Industrials, plus a profitable JD Retail core masked by New Businesses losses (listed stakes + segment). Market cap $33.7bn.

| part | basis | value $bn |
|---|---|---:|
| **JD Logistics ~64% at market** | HK$58.3bn x 0.1275 x 64% | 4.8 |
| JD Retail incl. JD Health and JD Industrials | 6x ~RMB55bn annual operating income (Q3-2026 RMB15.1bn) = $8.3bn x 6 | 49.6 |
| less minorities in JD Health (~33%) and JD Industrials (~25%) | at HK market prices | -5.5 |
| New Businesses (food delivery, Jingxi, overseas) | -2 years of ~$3.7bn annual losses (approx.) | -7.4 |
| less net debt | half of consolidated net cash: cash+ST inv RMB214.7bn ($32.0bn) - debt RMB60.2bn ($9.0bn); half haircut because payables fund it and part sits in listed subs | 11.5 |
| **conservative SOTP** | | **53.0** |
| market cap | yfinance 2026-11-18 | 33.7 |
| **gap** | SOTP / mcap - 1 | **+57%** |

JD's market cap is $33.7bn. Its share of three Hong Kong-listed subsidiaries is about $17bn at market (JD Logistics ~64%, JD Health ~67%, JD Industrials ~75%), and JD Retail, which includes Health and Industrials, earned RMB15.1bn of operating income in Q3-2026 alone, or roughly $8bn a year. The headline numbers are drowned by New Businesses (food delivery, Jingxi, overseas) losses. Put JD Retail at 6x operating income, take out the minorities, charge two years of New Businesses losses, and credit only half of the $23bn consolidated net cash, and I still get about $54bn, 60% above the market. The catch is that management is buying (CECONOMY for EUR1.34bn this month) rather than unlocking, and China regulation already shows up as a SAMR fine in the release. A big conservative gap with a weak unlock path.

Sources: https://www.sec.gov/Archives/edgar/data/1549802/000119312526464688/d179042dex991.htm (6-K EX-99.1 Q3-2026 results, 2026-11-17); https://www.sec.gov/Archives/edgar/data/1549802/000119312526456897/d114554dex991.htm (6-K CECONOMY completion, 2026-11-12); yfinance JD, 2618.HK, 6618.HK, 7618.HK close 2026-11-18

## BIDU: Baidu, Inc. (KEEP (high gap))

Hidden asset: RMB276.6bn ($41.3bn) of cash and investments plus AI Cloud (+94% y/y), Kunlunxin chips and Apollo Go inside a shrinking search-ad business (cash/investments + fast-growing segment). Market cap $23.6bn.

| part | basis | value $bn |
|---|---|---:|
| **Cash and investments, 15% haircut** | total cash and investments RMB276.6bn = $41.25bn (30 Sep 2026) x 85% | 35.1 |
| Baidu General Business (search ads + AI Cloud) | 4x ~RMB19bn adjusted EBITDA (15% margin on ~RMB32bn/qtr revenue, approx.) | 11.4 |
| iQIYI ~45% | at $0.57bn market cap | 0.3 |
| **Kunlunxin, Apollo Go** | zero in the conservative case | 0.0 |
| less net debt | loans, notes and converts ~RMB100bn ($15.0bn) at 30 Sep 2026 (sum of balance-sheet lines, approx.) | -15.0 |
| **conservative SOTP** | | **31.7** |
| market cap | yfinance 2026-11-18 | 23.6 |
| **gap** | SOTP / mcap - 1 | **+35%** |

Baidu reported RMB276.6bn ($41.3bn) of cash and investments at 30 Sep 2026 against roughly RMB100bn ($15bn) of loans and notes, so net cash and investments of about $26bn exceed the $23.6bn market cap before counting any business at all. Inside sits AI Cloud Infra revenue of RMB8.2bn in Q3-2026, up 94% year on year with GPU cloud up 191%, plus the Kunlunxin chip unit and Apollo Go in 30 cities. Haircut the cash pile 15%, put the general business at 4x EBITDA, give the AI options nothing, and the SOTP is about $31bn, a 35% gap. The traps are real: the cash is onshore RMB that management is spending on AI capex (FY2025 free cash flow was -$2.2bn), and search advertising is shrinking. But the first-ever dividend promised before end-2026 is a concrete step toward handing some of that cash back.

Sources: https://www.sec.gov/Archives/edgar/data/1329099/000119312526462286/d767848dex991.htm (6-K EX-99.1 Q3-2026 results, 2026-11-16); yfinance BIDU, IQ close 2026-11-18; triage/metrics.csv (FY2025 FCF)

## F: Ford Motor Company (KEEP (mid))

Hidden asset: Ford Pro (commercial vehicles, software and service; 2026 EBIT guide ~$7.0bn) and Ford Credit, buried under Model e losses (segment + captive finance). Market cap $45.0bn.

| part | basis | value $bn |
|---|---|---:|
| **Ford Pro** | 6x 2026 EBIT guide $7.0bn (9M-2026 $5.07bn, down from $5.61bn) | 42.0 |
| **Ford Credit** | 6x after-tax 2026 EBT guide $2.8bn x 0.79 | 13.3 |
| Ford Blue | 3x 2026 EBIT guide $5.5bn | 16.5 |
| Ford Model e | -3x 2026 EBIT loss guide -$4.0bn | -12.0 |
| Corporate other | -5x ~$0.6bn/yr (9M-2026 -$477m) | -3.0 |
| less net debt | Company debt excl. Ford Credit $23.7bn - Company cash $25.3bn (30 Sep 2026); pensions ignored | 1.6 |
| **conservative SOTP** | | **58.4** |
| market cap | yfinance 2026-11-18 | 45.0 |
| **gap** | SOTP / mcap - 1 | **+30%** |

Ford guides 2026 to Ford Pro EBIT of about $7.0bn, Ford Blue $5.5bn, Ford Credit EBT $2.8bn and a Model e loss of about $4.0bn (10-Q, Q3 2026), and it holds $25.3bn of Company cash against $23.7bn of Company debt. Pro at 6x EBIT is $42bn, already 93% of Ford's $45bn market cap; adding Credit at 6x after-tax earnings and Blue at 3x, and charging Model e at minus three years of losses, gives about $59bn, a 30% gap. But Pro is not a separate company: it builds Super Duty and Transit in the same plants as Blue, and its EBIT has fallen from about $9bn in 2024 to the $7bn guided this year. A real profit pool the headline numbers drown out, with no route to separate it.

Sources: https://www.sec.gov/Archives/edgar/data/37996/000003799626000191/f-20260930.htm (10-Q Q3 2026, segment note and outlook); yfinance F close 2026-11-18

## THC: Tenet Healthcare Corporation (KEEP (low-mid))

Hidden asset: USPI ambulatory surgery business (Ambulatory Care segment) inside a hospital operator (segment). Market cap $21.6bn.

| part | basis | value $bn |
|---|---|---:|
| **USPI / Ambulatory Care** | 12x ~$2.1bn annual Adjusted EBITDA (9M-2026 $1,563m, +8%) | 25.2 |
| Hospital Operations | 6.5x ~$3.0bn annual Adjusted EBITDA (9M-2026 $2,258m; excludes $1.47bn one-off contract termination revenue) | 19.5 |
| Noncontrolling interests (mostly USPI partners) | -12x ~$0.85bn annual NCI earnings (9M-2026 $642m) | -10.2 |
| less net debt | long-term debt $13.24bn - cash $2.67bn (30 Sep 2026) | -10.6 |
| **conservative SOTP** | | **23.9** |
| market cap | yfinance 2026-11-18 | 21.6 |
| **gap** | SOTP / mcap - 1 | **+11%** |

Tenet's Ambulatory Care segment (USPI) produced $1,563m of Adjusted EBITDA in 9M-2026, up 8%, at a much higher margin than the hospitals' $2,258m, and surgery-center businesses change hands at mid-teens EBITDA multiples. Put USPI at 12x, hospitals at 6.5x, and subtract both $10.6bn of net debt and the minority partners' share (NCI earnings $642m in nine months, capitalised at 12x), and I get about $24bn against a $21.6bn market cap, an 11% gap. At 15x for USPI the gap rises to about 40%, but that is not the conservative case. Management's lever is buybacks, not a spin, and the minority partners quietly take a large slice of the hidden asset. Worth a look, not a table-pounder.

Sources: https://www.sec.gov/Archives/edgar/data/70318/000007031826000050/thc-20260930.htm (10-Q Q3 2026, segment note); yfinance THC close 2026-11-18

## HAS: Hasbro, Inc. (DROP (priced))

Hidden asset: Wizards of the Coast and Digital Gaming (Magic, D&D, licensed digital games) inside a toy company (segment). Market cap $16.6bn.

| part | basis | value $bn |
|---|---|---:|
| **Wizards of the Coast and Digital Gaming** | 12x ~$1.25bn annual segment operating profit (9M-2026 $935m on $2.23bn revenue, 42% margin) | 15.0 |
| Consumer Products | 8x ~$0.22bn annual (9M-2026 $112m) | 1.8 |
| Entertainment | 8x ~$0.05bn | 0.4 |
| Corporate and other | -8x ~$0.15bn | -1.2 |
| less net debt | debt $3.53bn - cash $0.85bn - ST investments $0.58bn (27 Sep 2026) | -2.1 |
| **conservative SOTP** | | **13.9** |
| market cap | yfinance 2026-11-18 | 16.6 |
| **gap** | SOTP / mcap - 1 | **-16%** |

Wizards of the Coast earned $935m of segment operating profit on $2.23bn of revenue in 9M-2026, a 42% margin, against $112m for the far larger toy business (10-Q, Q3 2026). That is exactly the Ground 6 shape, but the market found it: Hasbro is up 62% in a year to $16.6bn. Put Wizards at 12x a ~$1.25bn year, toys at 8x, and subtract $2.1bn of net debt and corporate cost, and the SOTP is about $14bn, below the market cap. The hidden room has been opened. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/46080/000004608026000065/has-20260927.htm (10-Q Q3 2026); yfinance HAS close 2026-11-18

## ECHO: EchoStar Corporation (DROP (priced))

Hidden asset: ~261.8m SpaceX Class A shares receivable at the spectrum closing (targeted 30 Nov 2027), plus AT&T sale cash (private stake (pending) + cash). Market cap $28.2bn.

| part | basis | value $bn |
|---|---|---:|
| **SpaceX shares, at the deal price** | 261.8m x $42.40 (post 5:1 split) = $11.1bn; not yet received | 11.1 |
| Cash and marketable securities | $13.44bn + $0.53bn (30 Sep 2026) | 14.0 |
| Deferred tax liability | -$3.61bn on the spectrum gains | -3.6 |
| Remaining operations (Boost, Hughes) | zero; DISH DBS and DISH Wireless filers deconsolidated in Chapter 11 | 0.0 |
| less net debt | the ~$9.6bn of Seller Notes are repaid by SpaceX out of the purchase price at closing, so excluded | -0.0 |
| **conservative SOTP** | | **21.5** |
| market cap | yfinance 2026-11-18 | 28.2 |
| **gap** | SOTP / mcap - 1 | **-24%** |

EchoStar sold spectrum to AT&T for cash and to SpaceX for up to $11bn of SpaceX stock, about 261.8m shares at a deal value of $42.40 after SpaceX's 5-for-1 split, with the final closing targeted for 30 Nov 2027 (10-Q, Q3 2026). It holds $14.0bn of cash and securities, owes $3.6bn of deferred tax, and its Seller Notes are paid off by SpaceX from the price. At the contract value the SOTP is about $21.5bn against a $28.2bn market cap, so the market already values the SpaceX shares near $67 each, roughly 1.6x the deal price. This is the most visible hidden asset in the market, not an overlooked one. Drop for Ground 6.

Sources: https://www.sec.gov/Archives/edgar/data/1415404/000110465926121675/sats-20260930x10q.htm (10-Q Q3 2026, Note 1 SpaceX Transactions); yfinance ECHO close 2026-11-18

## CCJ: Cameco Corporation (DROP (priced))

Hidden asset: 49% of Westinghouse Electric (with Brookfield), equity-accounted (private stake). Market cap $27.2bn.

| part | basis | value $bn |
|---|---|---:|
| **Westinghouse 49%** | 15x 2026 share-of-adjusted-EBITDA guide US$370-430m (=$6.0bn EV share) less ~$2.2bn share of Westinghouse debt (approx., not verified) | 3.8 |
| Uranium segment | 12x ~C$1.0bn adjusted EBITDA (approx.) x 0.6995 | 8.4 |
| Fuel Services | 10x ~C$0.16bn x 0.6995 | 1.1 |
| less net debt | total debt C$1.0bn - cash C$0.86bn (30 Sep 2026) | -0.1 |
| **conservative SOTP** | | **13.2** |
| market cap | yfinance 2026-11-18 | 27.2 |
| **gap** | SOTP / mcap - 1 | **-51%** |

Cameco guides its 49% share of Westinghouse's 2026 adjusted EBITDA to US$370-430m (Q3-2026 MD&A), which puts the whole of Westinghouse at roughly $0.8bn of EBITDA. Even at 15x, Cameco's share net of an estimated slice of Westinghouse debt is about $4bn, and the uranium and fuel businesses at 10-12x EBITDA add under $10bn, so the conservative SOTP is about $13bn against a $27.2bn market cap. Using the $30bn IPO-trigger value from the US-government deal for all of Westinghouse still leaves the SOTP short of the price. The market already prices both Westinghouse and a strong uranium price. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1009001/000119312526439858/d106072dex992.htm (6-K EX-99.2 Q3-2026 MD&A, 2026); yfinance CCJ, CADUSD close 2026-11-18
