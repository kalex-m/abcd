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

## LVS: Las Vegas Sands Corp. (DROP (no gap))

Hidden asset: 75.56% of Sands China (HKEX: 1928) plus 100% of Marina Bay Sands (listed stake + segment). Market cap $24.6bn.

| part | basis | value $bn |
|---|---|---:|
| **Sands China 75.56% at market** | HK$84.4bn x 0.1275 x 75.56% | 8.1 |
| Marina Bay Sands | 9x ~$2.75bn annual adjusted property EBITDA (9M-2026 $2,067m) | 24.8 |
| Corporate expense | -8x ~$0.33bn/yr (approx.) | -2.6 |
| less net debt | consolidated net debt $11.0bn (metrics.csv) less ~$5.6bn sitting inside Sands China (approx., not verified) | -5.4 |
| **conservative SOTP** | | **24.9** |
| market cap | yfinance 2026-11-18 | 24.6 |
| **gap** | SOTP / mcap - 1 | **+1%** |

Las Vegas Sands owns 75.56% of Sands China ($8.1bn at the Hong Kong price) and all of Marina Bay Sands, which earned $2,067m of adjusted property EBITDA in 9M-2026 while Macau slipped to $1,592m. At 9x for MBS and with parent net debt of roughly $5.4bn after removing Sands China's own borrowings, the SOTP is about $25bn, the same as the $24.6bn market cap. MBS at 12x would add about $8bn, but that is a bull case for an asset that needs billions of expansion capex. No conservative gap. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1300514/000130051426000103/lvs-20260930.htm (10-Q Q3 2026); yfinance 1928.HK, LVS, HKDUSD close 2026-11-18; triage/metrics.csv

## FMX: Fomento Economico Mexicano (FEMSA) (DROP (priced))

Hidden asset: ~47% of Coca-Cola FEMSA (NYSE: KOF) inside the OXXO retail group (listed stake). Market cap $43.5bn.

| part | basis | value $bn |
|---|---|---:|
| **Coca-Cola FEMSA ~47.2% at market** | KOF mcap $25.05bn x 47.2% (stake % from prior filings, not re-verified) | 11.8 |
| OXXO and other ex-KOF businesses | 8x ex-KOF LTM adjusted EBITDA ~MXN74bn (ND/EBITDA 1.19x on MXN95.2bn; KOF dividends removed, approx.) | 31.3 |
| less net debt | ex-KOF net debt incl. MXN110.8bn lease liabilities, MXN95.2bn (30 Sep 2026) | -5.0 |
| **conservative SOTP** | | **38.1** |
| market cap | yfinance 2026-11-18 | 43.5 |
| **gap** | SOTP / mcap - 1 | **-12%** |

FEMSA's ~47% of Coca-Cola FEMSA is worth about $11.8bn at the NYSE price, 27% of FEMSA's $43.5bn market cap. Ex-KOF, FEMSA reports MXN95.2bn of net debt including leases at 1.19x LTM adjusted EBITDA (3Q-2026 release), implying roughly MXN74bn of EBITDA from OXXO and the smaller units once KOF dividends are removed. At 8x that EBITDA the SOTP is about $38bn, 12% below the market cap: investors already pay more than a conservative multiple for OXXO. The bottler stake is a well-lit room. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1061736/000110465926119381/tm2628435d1_ex99-1.htm (6-K EX-99.1 3Q-2026 results, 2026-10-28); yfinance KOF, FMX, MXNUSD close 2026-11-18

## BN: Brookfield Corporation (DROP (no conservative gap))

Hidden asset: 74% of Brookfield Asset Management (listed) plus listed stakes in BIP (27%), BEP (47%), BBUC (70%) (listed stakes). Market cap $87.7bn.

| part | basis | value $bn |
|---|---|---:|
| **BAM 74% at market** | BAM mcap $80.5bn x 74% | 59.6 |
| **BIP group 27%** | BIP $33.9bn + BIPC $5.3bn = $39.2bn x 27% | 10.6 |
| **BEP group 47%** | $20.9bn x 47% | 9.8 |
| **BBUC 70%** | $5.67bn x 70% | 4.0 |
| Wealth Solutions operations (ex its BAM and BBUC shares) | 8x ~$1.4bn DE (approx., not verified) | 11.0 |
| Real estate (BPG) and other | well below book; $8bn placeholder (not verified) | 8.0 |
| Preferred equity | -$4.09bn | -4.1 |
| less net debt | corporate borrowings $16.06bn (30 Sep 2026); corporate cash not netted | -16.1 |
| **conservative SOTP** | | **82.8** |
| market cap | yfinance 2026-11-18 | 87.7 |
| **gap** | SOTP / mcap - 1 | **-6%** |

Brookfield Corporation holds 74% of BAM ($59.6bn at market), 27% of the BIP group, 47% of the BEP group and 70% of BBUC (Q3-2026 interim report), together about $84bn against an $87.7bn market cap. Add rough values for the insurance operations and the real estate book, and subtract $16.1bn of corporate borrowings and $4.1bn of preferred equity, and the SOTP lands near $83bn, slightly under the price. Management's own plan value is far higher, but it leans on carried interest and growth I would not put in a conservative case. A famous discount that, measured strictly, is not there today. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/1001085/000100108526000030/a2026-q3bninterimreport.htm (6-K Q3-2026 interim report, 2026-11-16); yfinance BAM, BIP, BIPC, BEP, BBUC close 2026-11-18/20

## HMC: Honda Motor Co., Ltd. (KEEP (high gap))

Hidden asset: The world's largest motorcycle business (H1 FY3/27 operating profit JPY439bn, +19%) and Honda Financial Services, inside a car maker earning ~nothing on autos (segment + captive finance). Market cap $43.7bn.

| part | basis | value $bn |
|---|---|---:|
| **Motorcycle business** | 10x annualised H1 FY3/27 operating profit JPY439.0bn x2 = JPY878bn ($5.5bn) | 54.9 |
| **Financial Services** | 6x annualised pre-tax operating profit JPY210.9bn x2 = JPY422bn ($2.6bn) | 15.8 |
| Automobile business | H1 auto profit ~JPY-6bn by difference (consolidated JPY648.7bn - segments); full-year guide JPY780bn implies H2 EV losses; valued at -$5bn | -5.0 |
| Power products and other | H1 profit JPY4.4bn; nil | 0.0 |
| less net debt | industrial net cash JPY448bn per metrics.csv (yfinance-filled, approx.); equity-method JV stakes ignored | 2.8 |
| **conservative SOTP** | | **68.5** |
| market cap | yfinance 2026-11-18 | 43.7 |
| **gap** | SOTP / mcap - 1 | **+57%** |

Honda's motorcycle business made JPY439.0bn of operating profit in the six months to Sep-2026, up 19.2%, and Financial Services made JPY210.9bn, against consolidated operating profit of JPY648.7bn (6-K, Nov 2026). Take those numbers at face value and the car business, Honda's headline product, earned roughly nothing in the half, and the full-year guide of JPY780bn implies EV losses ahead. Motorcycles at 10x annualised operating profit are worth about $55bn, more than Honda's entire $43.7bn market cap, and that multiple is a fraction of what listed Indian two-wheeler makers fetch. Even after charging $5bn for the autos and valuing the finance arm at 6x pre-tax, the SOTP is about $69bn, a 57% gap. The risk is that car losses keep burning motorcycle cash and nobody at Honda wants to separate the two. The cleanest hidden-segment case on this list.

Sources: https://www.sec.gov/Archives/edgar/data/715153/000119312526456637/d178380d6k.htm (6-K H1 FY3/27 results MD&A, Nov-2026); https://www.sec.gov/Archives/edgar/data/715153/000119312526454310/d164844d6k.htm (6-K earnings summary with FY forecast and share data); yfinance HMC, JPYUSD close 2026-11-18; triage/metrics.csv

## DAL: Delta Air Lines, Inc. (DROP (trap: inseparable))

Hidden asset: SkyMiles loyalty program and the American Express co-brand contract (data/loyalty asset). Market cap $55.8bn.

| part | basis | value $bn |
|---|---|---:|
| **SkyMiles** | 3x annualised cash sales from marketing agreements ($6.8bn in 9M-2026 -> ~$9.2bn/yr); the 2020 appraisal was ~4.7x | 27.6 |
| Airline ex-loyalty | 6x ~$1.5bn pre-tax left after stripping a ~50% loyalty margin from ~$6bn group pre-tax (approx.) | 9.0 |
| less net debt | metrics.csv net debt (leases excluded) | -8.3 |
| **conservative SOTP** | | **28.3** |
| market cap | yfinance 2026-11-18 | 55.8 |
| **gap** | SOTP / mcap - 1 | **-49%** |

Delta sold $6.8bn of miles to partners in 9M-2026, mostly to American Express, up 13% from $6.0bn (10-Q, Q3 2026). That stream is why loyalty programs were appraised at more than their airlines in 2020. But a mile is only worth something if Delta keeps flying, so the asset cannot be separated, and if you value SkyMiles at 3x cash sales and the airline on what is left, the SOTP is about $28bn net of debt against a $55.8bn market cap. The market already pays for the Amex contract and then some. UAL and AAL have the same structure and the same problem. Drop.

Sources: https://www.sec.gov/Archives/edgar/data/27904/000002790426000038/dal-20260930.htm (10-Q Q3 2026, loyalty note); yfinance DAL close 2026-11-18; triage/metrics.csv

## Screened but not given a full SOTP (one-line parts check)

These were tested against the Ground 6 definition and dropped on a quick parts check, or could not be built from what is filed. Values use yfinance closes of 2026-11-18 and the filings named; stake percentages marked "approx." were not re-verified in this run.

| ticker | hidden asset tested | quick parts check | why dropped |
|---|---|---|---|
| WDC | 19.9% Sandisk stake retained at the 2025 split | Sandisk is now a $110bn company, but WDC's 10-Q for the quarter to 2 Oct 2026 (filed 2026-10-23) no longer mentions a Sandisk holding | Already disposed of; the room is empty |
| STLA | ~21% of Leapmotor (approx.) | HK$43.7bn x 0.1275 x 21% = ~$1.2bn vs $10.3bn market cap (11%) | Too small next to Stellantis's own losses (stock -64% in a year) |
| WYNN | ~71% of Wynn Macau (10-Q) | HK$21.2bn x 0.1275 x 71% = $1.9bn vs $8.5bn cap, with $10.7bn consolidated debt | Same debt logic as MGM; stake is small |
| TCOM | stakes in Tongcheng, MakeMyTrip and others | Q3-2026 results not out until 2 Dec 2026; Q2 showed a RMB5.2bn SAMR penalty and contra-revenue | A cheap-after-penalty question (Ground 1), not a hidden room |
| BABA | 33% of Ant Group, Alibaba Cloud | Sept-quarter results not yet filed on EDGAR at the run date | Not examined: could not verify current numbers |
| MUFG | ~22-23% of Morgan Stanley (approx.) | MS $283bn x ~22.5% = ~$64bn vs $226bn cap; MUFG ex-MS trades near 10x its remaining earnings | Visible equity-method stake; no gap |
| BTI | ~23% of ITC (approx.) | ITC INR3.77tn x 0.01072 x ~23% = ~$9.3bn vs $125.6bn cap (7%) | Too small; already being sold down to fund buybacks |
| ALB | 49% of Windfield (Greenbushes lithium mine) | IGO trades at A$3.59bn for a ~25% look-through plus other assets, implying ~$4bn for ALB's 49% vs a $10.1bn cap | Rest of ALB at plain multiples brings the parts to about the market cap |
| GM | GM Financial captive finance | 2026 EBIT-adjusted guide $14.5-15.5bn; Automotive cash and securities $23.1bn (10-Q Q3 2026); GMF at 6x after-tax plus auto at 4x is about the $69bn cap | No gap |
| KHC | split into two companies | Q3-2026 10-Q says separation work is paused; segments are geographic, no fast-growing line | Unlock withdrawn; nothing hidden |
| FISV | Clover inside a processor | Clover revenue is not broken out in the Q3-2026 10-Q | Could not build a segment SOTP from filings |
| PAG | 28.9% of Penske Transportation Solutions (10-Q) | Equity-method share of a freight-cyclical lessor; worth roughly a fifth of PAG at generous multiples | Not big enough, and PAG already trades near 15x earnings |
| SRE | 80% of Oncor; Sempra Infrastructure stake sale to KKR | Regulated, fully disclosed; the KKR deal already marked SI Partners | Not hidden |
| GHC | marketable equities $1.07bn at fair value (cost $0.26bn) plus pension surplus | 20% of the $5.27bn cap in securities alone | Budget ran out before a segment-by-segment build; worth a later look |
| UAL, AAL | MileagePlus, AAdvantage | Same structure as DAL | Same trap: the program cannot leave the airline |
| KO, MO, CME, ADM, SEIC | bottler/Monster stakes; AB InBev stake; 27% of S&P Dow Jones Indices; ~22% of Wilmar; 38.7% of LSV | Each is under ~15% of the parent's market cap (Wilmar S$18.2bn x 22% x 0.7755 = ~$3.1bn vs ADM $32.3bn) | Real but too small to move the SOTP |
| OXY, FANG, NXST, MOS, TM, CMCSA, PYPL, HON | WES and Viper stakes; Food Network JV; Ma'aden shares; Toyota cross-holdings; Versant spin; Venmo; post-spin Honeywell | not built | Lower priority under the run budget; NXST's Food Network stake looks like a value trap (declining cable network) |

Quant flags from `ground_6_full.csv` that are normal operating structures, not hidden assets: midstream general partners and their JVs (PAGP, PAA, KMI, MPLX, OKE, WMB, DTM, KNTK, AM, SOBO, EQT), utilities whose "investments" are nuclear decommissioning trusts (EIX, ETR, DTE, D), REITs with property JVs (VNO, REG, KIM, FR, PLD), alternative asset managers' fund stakes (ARES, BX, HLNE, STEP, AMG, BAM), insurer portfolios (CVS), auto suppliers' and industrials' small JVs (MGA, APTV, LEA, CNH, CMI, CARR, JCI, APG, WWD, GE, MMM, VMI, AWI), and one-off accounting artifacts (HPE equity income from the sold H3C stake; DKNG, TAL, ZM, SBUX, THC flags). None was carried forward.

## Names on Alex's list or under research (flagged, not ranked)

| ticker | does it fit Ground 6? | reading |
|---|---|---|
| GOOGL | Yes in shape (Waymo/Other Bets, stakes in Anthropic and SpaceX, Cloud inside an ad company) | Not rebuilt here because Alex is researching it; at Alphabet's size even generous private marks on the AI and space stakes are a few percent of the market cap, so the case rests on Cloud and Waymo, not on a stake discount |
| META | Inverse shape: Reality Labs losses hide how much Family of Apps earns | Not a stake or separable-asset story; belongs in Alex's own work |
| UBER | Holds listed and private equity stakes carried at fair value | Visible in the 10-Q and small relative to a $140bn cap; does not fit |
| SPGI | S&P Dow Jones Indices is the best asset inside a plainer name | The Mobility unit (CARFAX) is already spun off; the remaining indices business is disclosed as a segment; unlock has largely happened |
| INTU | Credit Karma inside a tax/accounting software name | Reported as its own segment; not hidden |
| AZN, JPM, UNP | No hidden-room structure found (UNP's land is operating real estate tied to the network) | Do not fit |

## Final ranking (written to `triage/ground_6.csv`)

| rank | ticker | conservative SOTP gap | hidden asset | why this rank |
|---:|---|---:|---|---|
| 1 | HMC | +57% | Motorcycles (JPY878bn annualised operating profit) + Honda Financial Services | Best asset quality, largest gap, and the gap rests on segment profit Honda reports, not on a market price that can fall; heavy buybacks |
| 2 | BIDU | +35% | $41.3bn of cash and investments + AI Cloud (+94%) | Gap is mostly cash; first-ever dividend promised before end-2026 is a real unlock step |
| 3 | JD | +57% | Listed JDL/JD Health/JD Industrials + a ~$8bn/yr retail profit masked by New Businesses losses | Gap as big as Honda's but rests on a 6x multiple and on New Businesses losses shrinking; acquisitive (CECONOMY) and China-regulated |
| 4 | F | +30% | Ford Pro (2026 EBIT guide ~$7.0bn) + Ford Credit | Real profit pool, but cannot be separated and Pro EBIT is falling |
| 5 | NWSA | +12% | 62.0% of REA Group | High-quality listed stake, thin taxed gap, no unlock intent |
| 6 | THC | +11% | USPI ambulatory surgery | High-quality segment, but minority partners take a big slice |
| 7-11 | L, EQH, LVS, BIO, BN | +5% to -6% | CNA; AllianceBernstein; Sands China/MBS; Sartorius; BAM and the Brookfield LPs | Watch list: real hidden-room structures where the conservative gap is already closed; they matter only if the price falls 10-20% |

I stopped at 11 rather than 25 because only six of the 19 full SOTPs clear a 10% conservative gap, and padding the list with negative-gap names would misstate the ground.

## Why this list looks like this

I built full conservative SOTPs for 19 companies and quick parts checks for about 25 more, and the result is that the famous hidden rooms of the US market are mostly open: the median conservative gap across the 19 is -1%, and only six clear +10%. The classic holding-company structures price close to their parts once you tax the stakes and use plain multiples: Loews +5% (CNA ~92% worth $12.1bn, parent net cash $2.6bn), Equitable +2% (AB stake $6.4bn), Las Vegas Sands +1% (Sands China 75.56% worth $8.1bn), Bio-Rad -1% (Sartorius $6.6bn pre-tax but $1.4bn of tax on a near-zero basis), Brookfield -6% (BAM 74% worth $59.6bn, but $16.1bn of corporate borrowings and $4.1bn of preferreds), FEMSA -12%. The visible-and-already-priced cases are worse: EchoStar's SpaceX receivable is worth $11.1bn at the contract price, yet the market cap implies about 1.6x that; Cameco's Westinghouse share is $370-430m of EBITDA and the stock needs more than the $30bn IPO-trigger value to make sense; Hasbro's Wizards earns 42% margins but the stock is up 62% in a year; MPC's $37bn MPLX stake sits beside boom refining EBITDA ($17.9bn in nine months) that the price already capitalises. Two traps showed up exactly as the brief warned: MGM's stakes look large against an $8.5bn cap until $23.9bn of lease liabilities are counted (-48%), and Delta's SkyMiles stream ($6.8bn of partner cash sales in nine months) cannot leave the airline and is already paid for (-49%). The real gaps sit where a profitable business is drowned by a loss-making headline: Honda's motorcycles (JPY439bn of operating profit in one half, worth more than the whole $43.7bn company at 10x) behind a car business that earned roughly nothing, Baidu's $26bn of net cash and investments behind a shrinking search business, JD's ~$8bn retail profit and $17bn of listed subsidiaries behind food-delivery losses, and Ford Pro's ~$7bn of EBIT behind a $4bn Model e loss. None of the four has a management that has said it will separate the hidden asset, so the gaps are paid for with patience, buybacks and, in Baidu's case, a first dividend. The hidden room in late 2026 is not in the holding companies everyone already discounts; it is in large Asian and industrial companies whose best segment is buried under a loss-making headline business, and Honda is the cleanest example.
