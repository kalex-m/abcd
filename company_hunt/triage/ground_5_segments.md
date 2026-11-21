# Ground 5: The Many-Weathers, segment evidence (Phase 2, run 2026-11-19, written 2026-11-21)

What was tested: does a company have several revenue streams that move in different directions when the economy turns, so the whole holds and compounds (JPMorgan is the model)? Source: business-segment facts in the inline XBRL of each company's last six 10-K filings on EDGAR (fiscal 2018 to fiscal 2025/26), pulled with `scripts/p2_g5_fetch.py`, analysed with `scripts/p2_g5_analyze.py`, scored with `scripts/p2_g5_score.py`. Market data and per-share growth from `triage/metrics.csv` (split-adjusted, capex incl. capitalized software). Every 10-K URL used is in `triage/ground_5.csv` / `triage/ground_5_all.csv`.

How growth is read: each year-pair comes from the newest single filing that reports both years, so a reorganization never creates fake growth. Years dominated by a big acquisition or divestiture are left out (named under each table; e.g. Cigna 2019 Express Scripts, CVS 2019 Aetna, Fiserv 2019-20 First Data, S&P Global 2022 IHS Markit, Schwab 2021 TD Ameritrade); in the total for that year the bought segment is held at its median clean growth (or flat), so purchases neither inflate nor vanish.

Measures: (1) size-weighted mean pairwise correlation of segment revenue growth; (2) offset ratio, a year-by-year diversification ratio: each segment's growth minus its own average is its 'wave'; ratio = size of the wave left in the total / size it would be if every segment swung the same way (1 = waves line up, 0 = they cancel; survives reorganizations); (3) the same correlation on segment-profit dollar changes, which is where hidden shared drivers (credit reserves, cost trend) show up; (4) worst total segment revenue and segment profit year; (5) share of revenue in segments that shrank in 2020, 2022 and 2023; (6) worst free-cash-flow year since 2019 (net income for banks and insurers) and 10-year margin volatility; (7) 5-year per-share growth. offset_score = 45 x offset + 35 x whole-held + 20 x compounding, minus penalties (one product split by map -15, hidden driver -4/-10, thin sample -10); weights are in the script header.

Gates for the list (all must pass): at least two business segments with 5+ clean growth years; no single hidden driver dominating (severity 2 = the trap); offset sub-score of 0.30 or more; and in at least one named slowdown (2020, 2022, 2023) a segment with 10%+ of revenue shrank 2%+ while another 10%+ segment grew, 8+ points apart. Diversity cap: 4 per yfinance industry (it bound nowhere).

Honest limits: 5-7 annual growth points per company is a small sample; one correlation of -0.5 on six points is not significant and I treat it as a clue, not proof. The period holds one recession (2020, cushioned by stimulus) and one rate shock (2022-23), and no real credit cycle, so offsets in banks and insurers have not been tested by a credit bust. Segment profit is untagged for some insurers (PGR, TRV in part) and marked not verified.

## The list

| rank | ticker | offset score | seg-growth corr | offset ratio | worst seg revenue yr | worst seg profit yr | shrinking share | EPS 5y | P/E now vs 10y median |
|---|---|---|---|---|---|---|---|---|---|
| 1 | INTU | 72.8 | -0.73 | 0.35 | +11.8% | +13.8% | 0.05 | +16.9% | 18.3 vs 50.5 |
| 2 | RJF | 67.0 | 0.10 | 0.55 | +2.6% | -14.6% | 0.18 | +21.6% | 14.6 vs 12.9 |
| 3 | BNY | 59.4 | 0.04 | 0.44 | -4.0% | -15.8% | 0.23 | +13.8% | 17.9 vs 11.3 |
| 4 | HIG | 58.9 | -0.00 | 0.58 | +1.9% | -15.7% | 0.27 | +22.7% | 9.5 vs 9.5 |
| 5 | JPM | 58.1 | -0.24 | 0.63 | +2.6% | -26.2% | 0.32 | +16.8% | 15.1 vs 10.1 |
| 6 | ICE | 54.2 | -0.31 | 0.92 | +0.8% | +1.1% | 0.30 | +8.9% | 29.0 vs 26.3 |
| 7 | BAC | 52.4 | 0.02 | 0.58 | -4.9% | -36.5% | 0.42 | +14.3% | 11.1 vs 10.8 |
| 8 | ACGL | 52.1 | 0.02 | 0.71 | +12.4% | -45.7% | 0.10 | +27.8% | 8.0 vs 10.1 |
| 9 | JNJ | 51.6 | 0.42 | 0.89 | +0.6% | -8.5% | 0.11 | +14.9% | 24.5 vs 20.3 |
| 10 | TXT | 51.0 | 0.15 | 0.78 | -14.5% | -7.7% | 0.38 | +30.5% | 15.2 vs 17.6 |
| 11 | PEP | 48.1 | 0.12 | 0.63 | +0.4% | -9.3% | 0.13 | +3.2% | 23.5 vs 23.3 |
| 12 | MCO | 48.0 | -0.56 | 0.84 | -11.6% | -24.9% | 0.21 | +7.8% | 33.7 vs 34.0 |
| 13 | C | 47.0 | -0.29 | 0.41 | -4.6% | -33.8% | 0.40 | +7.7% | 13.6 vs 8.5 |
| 14 | ABT | 42.3 | 0.19 | 0.76 | -8.1% | -19.9% | 0.37 | +8.2% | 27.7 vs 33.2 |
| 15 | MET | 39.8 | -0.17 | 0.58 | -3.8% | -20.1% | 0.39 | -4.5% | 19.8 vs 11.5 |
| 16 | MKC | 38.5 | 0.04 | 0.75 | +0.5% | -14.9% | 0.34 | +1.1% | 15.8 vs 24.4 |
| 17 | RTX | 27.7 | -0.21 | 0.83 | -23.1% | -85.7% | 0.57 | n/a | 39.6 vs 26.7 |

JPM is Alex's holding (overlap): it ranks on its own numbers and serves as the reference model.

## Kept (ranked) (17)

### INTU, Intuit Inc. (rank 1, offset score 72.8)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2022:creditkarma, 2022:globalbusinesssolutions.

| year | globalbusinesssolutio~ | consumer | protax | creditkarma |
|---|---|---|---|---|
| 2019 | 3,533 | 2,775 | 476 |  |
| 2020 | 4,050 (+15%) | 3,136 (+13%) | 493 (+4%) |  |
| 2021 | 4,688 (+16%) | 3,563 (+14%) | 517 (+5%) | 865 |
| 2022 | 6,460 | 3,915 (+10%) | 546 (+6%) | 1,805 |
| 2023 | 8,038 (+24%) | 4,135 (+6%) | 561 (+3%) | 1,634 (-9%) |
| 2024 | 9,533 (+19%) | 6,752 (+7%) |  (+7%) |  (+5%) |
| 2025 | 11,077 (+16%) | 7,754 (+15%) |  |  |
| 2026 | 12,864 (+16%) | 8,584 (+11%) |  |  |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | globalbusinesssolutio~ | consumer | protax | creditkarma |
|---|---|---|---|---|
| 2019 | 1,722 | 1,820 | 330 |  |
| 2020 | 2,091 | 2,063 | 346 |  |
| 2021 | 2,590 | 2,237 | 372 | 182 |
| 2022 | 3,520 | 2,633 | 447 | 531 |
| 2023 | 5,900 | 3,350 | 489 | 428 |
| 2024 | 7,173 | 5,012 |  |  |
| 2025 | 8,476 | 5,760 |  |  |
| 2026 | 9,887 | 6,308 |  |  |

Correlation of segment revenue growth: globalbusiness/consumer -0.86 (n=6); globalbusiness/protax -0.33 (n=4); consumer/protax +0.02 (n=5). Size-weighted mean -0.73; offset ratio 0.35 (1 = segment waves line up, 0 = they cancel); average wave +2.9%; segment-profit change correlation -0.09. Worst total segment revenue year +11.8% (2022); worst total segment profit year +13.8% (2026); share of revenue that shrank in 2020/2022/2023 0.05. Slowdown years with a segment moving against another: 2023.

Reading: Credit Karma fell 10% in FY2023 while small business grew 24% and consumer tax 6%; segment revenue never grew less than 9%. The waves are small (2.9% average) and the segments share one customer type. Hidden common driver: US consumers and small businesses, and the same AI-substitution risk across all products. Worst free cash flow year since 2019 -3%, EPS growth +16.9% a year over 5 years; P/E 18.3 vs 50.5 own 10-year median (val_disc_avg -66%). Kept.

### RJF, Raymond James Financial, Inc. (rank 2, offset score 67.0)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | privateclientgroup | capitalmarkets | assetmanagement | bank |
|---|---|---|---|---|
| 2018 | 5,121 | 992 | 654 | 816 |
| 2019 | 5,401 (+5%) | 1,117 (+13%) | 691 (+6%) | 1,001 (+23%) |
| 2020 | 5,575 (+3%) | 1,307 (+17%) | 715 (+3%) | 827 (-17%) |
| 2021 | 6,621 (+19%) | 1,895 (+45%) | 867 (+21%) | 714 (-14%) |
| 2022 | 7,752 (+17%) | 1,836 (-3%) | 914 (+5%) | 1,240 (+74%) |
| 2023 | 8,754 (+13%) | 1,299 (-29%) | 885 (-3%) | 3,154 (+154%) |
| 2024 | 9,578 (+9%) | 1,575 (+21%) | 1,027 (+16%) | 3,554 (+13%) |
| 2025 | 10,282 (+7%) | 1,869 (+19%) | 1,188 (+16%) | 3,376 (-5%) |

Segment profit, $M (rjf:IncomeLossFromContinuingOperationsBeforeIncomeTaxesAndAfterEquityMethodInvestmentsAndNoncontrollingInterest, us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | privateclientgroup | capitalmarkets | assetmanagement | bank |
|---|---|---|---|---|
| 2018 | 576 | 91 | 235 | 492 |
| 2019 | 579 | 110 | 253 | 515 |
| 2020 | 539 | 225 | 284 | 196 |
| 2021 | 749 | 532 | 389 | 367 |
| 2022 | 1,030 | 415 | 386 | 382 |
| 2023 | 1,763 | -91 | 351 | 371 |
| 2024 | 1,785 | 67 | 421 | 380 |
| 2025 | 1,720 | 146 | 503 | 491 |

Correlation of segment revenue growth: privateclientg/capitalmarkets +0.00 (n=7); privateclientg/assetmanagemen +0.25 (n=7); privateclientg/bank +0.34 (n=7); capitalmarkets/assetmanagemen +0.87 (n=7); capitalmarkets/bank -0.92 (n=7); assetmanagemen/bank -0.71 (n=7). Size-weighted mean 0.10; offset ratio 0.55 (1 = segment waves line up, 0 = they cancel); average wave +13.0%; segment-profit change correlation 0.02. Worst total segment revenue year +2.6% (2020); worst total segment profit year -14.6% (2020); share of revenue that shrank in 2020/2022/2023 0.18. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: Bank revenue rose 74% and 154% in 2022-23 while capital markets fell 3% and 29%, a real offset; but private client (60%+) and the bank both ride the same rate tailwind. Hidden common driver: Rates: the bank's NII and the private client group's cash-sweep fees both rise with rates; deals drive capital markets. Worst net income year since 2019 -21%, EPS growth +21.6% a year over 5 years; P/E 14.6 vs 12.9 own 10-year median (val_disc_avg +13%). Kept.

### BNY, The Bank of New York Mellon Corporation (rank 3, offset score 59.4)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | investmentservices | investmentandwealthma~ | securitiesservices | marketandwealthservic~ |
|---|---|---|---|---|
| 2018 | 12,347 | 4,071 |  |  |
| 2019 |  (-2%) | 3,707 (-9%) | 7,357 | 4,695 |
| 2020 |  | 3,692 (-0%) | 7,375 (+0%) | 4,806 (+2%) |
| 2021 |  | 4,042 (+9%) | 7,244 (-2%) | 4,741 (-1%) |
| 2022 |  | 3,563 (-12%) | 8,002 (+11%) | 5,299 (+11%) |
| 2023 |  | 3,155 (-11%) | 8,598 (+7%) | 5,870 (+11%) |
| 2024 |  | 3,389 (+7%) | 8,916 (+4%) | 6,264 (+7%) |
| 2025 |  | 3,258 (-4%) | 9,730 (+9%) | 7,000 (+12%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | investmentservices | investmentandwealthma~ | securitiesservices | marketandwealthservic~ |
|---|---|---|---|---|
| 2018 | 4,246 | 1,254 |  |  |
| 2019 |  | 1,061 | 1,911 | 2,061 |
| 2020 |  | 971 | 1,604 | 2,092 |
| 2021 |  | 1,230 | 1,526 | 2,132 |
| 2022 |  | 47 | 1,713 | 2,356 |
| 2023 |  | 383 | 2,141 | 2,624 |
| 2024 |  | 605 | 2,564 | 2,892 |
| 2025 |  | 543 | 3,219 | 3,424 |

Correlation of segment revenue growth: investmentandw/securitiesserv -0.81 (n=6); investmentandw/marketandwealt -0.79 (n=6); securitiesserv/marketandwealt +0.97 (n=6). Size-weighted mean 0.04; offset ratio 0.44 (1 = segment waves line up, 0 = they cancel); average wave +5.3%; segment-profit change correlation 0.33. Worst total segment revenue year -4.0% (2019); worst total segment profit year -15.8% (2022); share of revenue that shrank in 2020/2022/2023 0.23. Slowdown years with a segment moving against another: 2022,2023.

Reading: Securities services and market & wealth services rose 11% in 2022 while investment & wealth management fell 12%; segment revenue never fell after 2019, but the weak segment's profit went from $1.23B to $47M. Hidden common driver: Global asset levels and custody volumes feed every segment; the offset comes from rates (deposit NII up when asset values fall). Worst net income year since 2019 -32%, EPS growth +13.8% a year over 5 years; P/E 17.9 vs 11.3 own 10-year median (val_disc_avg +58%). Kept.

### HIG, The Hartford Insurance Group, Inc. (rank 4, offset score 58.9)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: hig:Earnedpremiumsandfeeincome, us-gaap:Revenues.

| year | pcbusinessinsurance | pcpersonalinsurance | employeebenefits | hartfordfunds |
|---|---|---|---|---|
| 2018 | 7,081 | 3,439 | 5,598 | 1,032 |
| 2019 | 8,325 (+18%) | 3,235 (-6%) | 5,603 (+0%) | 999 (-3%) |
| 2020 | 8,940 (+7%) | 3,042 (-6%) | 5,536 (-1%) | 989 (-1%) |
| 2021 | 9,575 (+7%) | 2,986 (-2%) | 5,687 (+3%) | 1,189 (+20%) |
| 2022 | 11,639 (+11%) | 3,157 (-0%) | 6,459 (+7%) | 1,029 (-12%) |
| 2023 | 13,059 (+12%) | 3,353 (+6%) | 6,939 (+7%) | 1,000 (-3%) |
| 2024 | 14,406 (+10%) | 3,779 (+13%) | 7,066 (+2%) | 1,067 (+7%) |
| 2025 | 15,807 (+10%) | 4,088 (+8%) | 7,140 (+1%) | 1,113 (+4%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | pcbusinessinsurance | pcpersonalinsurance | employeebenefits | hartfordfunds |
|---|---|---|---|---|
| 2018 | 1,212 | -32 | 340 | 148 |
| 2019 | 1,192 | 318 | 536 | 149 |
| 2020 | 856 | 718 | 383 | 170 |
| 2021 | 1,757 | 385 | 256 | 217 |
| 2022 | 1,624 | 91 | 327 | 162 |
| 2023 | 2,085 | -39 | 535 | 174 |
| 2024 | 2,349 | 208 | 561 | 192 |
| 2025 | 2,780 | 447 | 557 | 213 |

Correlation of segment revenue growth: pcbusinessinsu/pcpersonalinsu -0.12 (n=7); pcbusinessinsu/employeebenefi +0.06 (n=7); pcbusinessinsu/hartfordfunds -0.48 (n=7); pcpersonalinsu/employeebenefi +0.31 (n=7); pcpersonalinsu/hartfordfunds +0.16 (n=7); employeebenefi/hartfordfunds -0.30 (n=7). Size-weighted mean -0.00; offset ratio 0.58 (1 = segment waves line up, 0 = they cancel); average wave +3.4%; segment-profit change correlation -0.04. Worst total segment revenue year +1.9% (2020); worst total segment profit year -15.7% (2022); share of revenue that shrank in 2020/2022/2023 0.27. Slowdown years with a segment moving against another: 2020.

Reading: Personal insurance fell 6% a year in 2019-20 while business insurance grew 7-18%, and segment revenue never fell; segment net income fell 16% in the worst year. A genuine mix, small enough to stay simple. Hidden common driver: No single shared driver found: commercial P&C (pricing cycle), personal P&C (auto inflation), group benefits (employment and mortality), funds (market levels). Worst net income year since 2019 -23%, EPS growth +22.7% a year over 5 years; P/E 9.5 vs 9.5 own 10-year median (val_disc_avg -1%). Kept.

### JPM, JPMorgan Chase & Co. (rank 5, offset score 58.1)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenuesNetOfInterestExpense.

| year | consumercommunitybank~ | cib | assetandwealthmanagem~ |
|---|---|---|---|
| 2018 | 51,271 | 46,718 | 13,427 |
| 2019 | 55,133 (+8%) | 48,529 (+4%) | 13,591 (+1%) |
| 2020 | 51,268 (-7%) | 58,597 (+21%) | 14,240 (+5%) |
| 2021 | 49,879 (-2%) | 61,951 (+5%) | 16,957 (+19%) |
| 2022 | 54,814 (+10%) | 59,635 (-4%) | 17,748 (+5%) |
| 2023 | 70,148 (+28%) | 64,353 (+8%) | 19,827 (+12%) |
| 2024 | 71,507 (+2%) | 70,114 (+9%) | 21,578 (+9%) |
| 2025 | 76,029 (+6%) | 78,454 (+12%) | 24,073 (+12%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | consumercommunitybank~ | cib | assetandwealthmanagem~ |
|---|---|---|---|
| 2018 | 14,707 | 16,063 | 2,945 |
| 2019 | 16,541 | 15,912 | 2,867 |
| 2020 | 8,217 | 19,672 | 2,992 |
| 2021 | 20,957 | 26,353 | 4,737 |
| 2022 | 14,916 | 19,138 | 4,365 |
| 2023 | 21,232 | 20,272 | 5,227 |
| 2024 | 17,603 | 24,846 | 5,421 |
| 2025 | 18,245 | 27,761 | 6,522 |

Correlation of segment revenue growth: consumercommun/cib -0.40 (n=7); consumercommun/assetandwealth +0.01 (n=7); cib/assetandwealth +0.05 (n=7). Size-weighted mean -0.24; offset ratio 0.63 (1 = segment waves line up, 0 = they cancel); average wave +7.0%; segment-profit change correlation 0.64. Worst total segment revenue year +2.6% (2022); worst total segment profit year -26.2% (2022); share of revenue that shrank in 2020/2022/2023 0.32. Slowdown years with a segment moving against another: 2020,2022.

Reading: The model: consumer banking fell 7% in 2020 while CIB rose 21%, and CIB fell 4% in 2022 while consumer banking rose 10%, so segment revenue never fell; profit still swung with credit reserves. Alex already owns it. Hidden common driver: US interest rates and the credit cycle: rates move consumer-bank NII and the 2020/2022 reserve builds and 2021 releases hit all three segments' profit together (segment profit changes correlate +0.64). Worst net income year since 2019 -22%, EPS growth +16.8% a year over 5 years; P/E 15.1 vs 10.1 own 10-year median (val_disc_avg +50%). Kept.

### ICE, Intercontinental Exchange, Inc. (rank 6, offset score 54.2)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2019:mortgagetechnology, 2020:mortgagetechnology, 2021:mortgagetechnology, 2023:mortgagetechnology, 2024:mortgagetechnology.

| year | exchanges | fixedincomeanddataser~ | mortgagetechnology |
|---|---|---|---|
| 2018 | 4,573 | 1,681 | 22 |
| 2019 | 4,652 (+2%) | 1,756 (+4%) | 139 |
| 2020 | 5,839 (+26%) | 1,810 (+3%) | 595 |
| 2021 | 5,878 (+1%) | 1,883 (+4%) | 1,407 |
| 2022 | 6,415 (+9%) | 2,092 (+11%) | 1,129 (-20%) |
| 2023 | 6,355 (-1%) | 2,231 (+7%) | 1,317 |
| 2024 | 7,441 (+17%) | 2,298 (+3%) | 2,022 |
| 2025 | 8,120 (+9%) | 2,419 (+5%) | 2,101 (+4%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | exchanges | fixedincomeanddataser~ | mortgagetechnology |
|---|---|---|---|
| 2018 | 2,162 | 416 | 5 |
| 2019 | 2,167 | 439 | 67 |
| 2020 | 2,389 | 492 | 152 |
| 2021 | 2,523 | 529 | 397 |
| 2022 | 2,862 | 719 | 57 |
| 2023 | 3,159 | 811 | -276 |
| 2024 | 3,636 | 843 | -170 |
| 2025 | 3,982 | 933 | 14 |

Correlation of segment revenue growth: exchanges/fixedincomeand -0.31 (n=7). Size-weighted mean -0.31; offset ratio 0.92 (1 = segment waves line up, 0 = they cancel); average wave +7.0%; segment-profit change correlation 0.38. Worst total segment revenue year +0.8% (2023); worst total segment profit year +1.1% (2019); share of revenue that shrank in 2020/2022/2023 0.30. Slowdown years with a segment moving against another: 2022.

Reading: Mortgage technology fell 20% in 2022 while exchanges rose 9%, and total segment revenue never fell (worst +0.8%); but mortgage growth was bought (Ellie Mae 2020, Black Knight 2023), so only 2 clean mortgage years exist. Hidden common driver: No single shared driver: exchanges ride volatility, fixed income & data are subscriptions, mortgage technology rides mortgage originations (rates); a rate shock helps the first and hurts the third. Worst free cash flow year since 2019 -1%, EPS growth +8.9% a year over 5 years; P/E 29.0 vs 26.3 own 10-year median (val_disc_avg +11%). Kept.

### BAC, Bank of America Corporation (rank 7, offset score 52.4)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: bac:RevenuesNetOfInterestExpenseFullTaxEquivalentBasis.

| year | consumerbanking | globalwealthandinvest~ | globalbanking | globalmarkets |
|---|---|---|---|---|
| 2018 | 37,618 | 19,453 | 20,001 | 16,183 |
| 2019 | 38,587 (+3%) | 19,538 (+0%) | 20,483 (+2%) | 15,614 (-4%) |
| 2020 | 33,262 (-14%) | 18,584 (-5%) | 18,987 (-7%) | 18,765 (+20%) |
| 2021 | 34,005 (+2%) | 20,748 (+12%) | 20,875 (+10%) | 19,255 (+3%) |
| 2022 | 38,635 (+14%) | 21,748 (+5%) | 22,229 (+6%) | 18,138 (-6%) |
| 2023 | 42,031 (+9%) | 21,105 (-3%) | 24,555 (+12%) | 19,533 (+8%) |
| 2024 | 41,436 (-1%) | 22,929 (+9%) | 23,748 (-3%) | 21,812 (+12%) |
| 2025 | 43,673 (+5%) | 24,883 (+9%) | 24,108 (+2%) | 24,096 (+10%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | consumerbanking | globalwealthandinvest~ | globalbanking | globalmarkets |
|---|---|---|---|---|
| 2018 | 12,132 | 3,988 | 8,325 | 3,958 |
| 2019 | 12,962 | 4,251 | 8,073 | 3,500 |
| 2020 | 6,504 | 3,071 | 3,466 | 5,252 |
| 2021 | 11,891 | 4,327 | 9,814 | 4,557 |
| 2022 | 12,516 | 4,675 | 7,807 | 4,182 |
| 2023 | 11,593 | 3,947 | 10,072 | 4,682 |
| 2024 | 10,759 | 4,263 | 7,984 | 5,622 |
| 2025 | 12,245 | 4,670 | 7,793 | 6,111 |

Correlation of segment revenue growth: consumerbankin/globalwealthan +0.31 (n=7); consumerbankin/globalbanking +0.78 (n=7); consumerbankin/globalmarkets -0.76 (n=7); globalwealthan/globalbanking +0.21 (n=7); globalwealthan/globalmarkets -0.27 (n=7); globalbanking/globalmarkets -0.62 (n=7). Size-weighted mean 0.02; offset ratio 0.58 (1 = segment waves line up, 0 = they cancel); average wave +6.7%; segment-profit change correlation 0.00. Worst total segment revenue year -4.9% (2020); worst total segment profit year -36.5% (2020); share of revenue that shrank in 2020/2022/2023 0.42. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: Global Markets (+20% in 2020) offset a 14% consumer-banking fall, but total segment revenue still fell 4.9% and segment profit 36.5% in 2020; a rate-sensitive bank with one trading hedge. Hidden common driver: Fed funds rate: net interest income sits inside consumer, wealth and global banking at once; the 2020 reserve build cut profit in three of four segments. Worst net income year since 2019 -35%, EPS growth +14.3% a year over 5 years; P/E 11.1 vs 10.8 own 10-year median (val_disc_avg +3%). Kept.

### ACGL, Arch Capital Group Ltd. (rank 8, offset score 52.1)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:PremiumsEarnedNet.

| year | insurance | reinsurance | mortgage |
|---|---|---|---|
| 2018 | 2,206 | 1,261 | 1,186 |
| 2019 | 2,397 (+9%) | 1,466 (+16%) | 1,366 (+15%) |
| 2020 | 2,871 (+20%) | 2,162 (+47%) | 1,398 (+2%) |
| 2021 | 3,625 (+26%) | 2,841 (+31%) | 1,283 (-8%) |
| 2022 | 4,560 (+26%) | 3,959 (+39%) | 1,160 (-10%) |
| 2023 | 5,446 (+19%) | 5,836 (+47%) | 1,158 (-0%) |
| 2024 | 6,627 (+22%) | 7,242 (+24%) | 1,231 (+6%) |
| 2025 | 7,771 (+17%) | 8,122 (+12%) | 1,172 (-5%) |

Segment profit, $M (acgl:UnderwritingIncomeLossSegment):

| year | insurance | reinsurance | mortgage |
|---|---|---|---|
| 2018 | -29 | 69 | 857 |
| 2019 | -35 | 81 | 1,041 |
| 2020 | -129 | 16 | 593 |
| 2021 | 115 | 168 | 954 |
| 2022 | 224 | 315 | 1,257 |
| 2023 | 450 | 1,098 | 1,064 |
| 2024 | 345 | 1,222 | 1,094 |
| 2025 | 375 | 1,558 | 1,000 |

Correlation of segment revenue growth: insurance/reinsurance +0.48 (n=7); insurance/mortgage -0.82 (n=7); reinsurance/mortgage -0.30 (n=7). Size-weighted mean 0.02; offset ratio 0.71 (1 = segment waves line up, 0 = they cancel); average wave +8.1%; segment-profit change correlation 0.29. Worst total segment revenue year +12.4% (2019); worst total segment profit year -45.7% (2020); share of revenue that shrank in 2020/2022/2023 0.10. Slowdown years with a segment moving against another: 2022.

Reading: Mortgage premiums fell 8-10% in 2021-22 while insurance and reinsurance grew 25-39%, a real offset in revenue; but underwriting income fell 56% in its worst year and the diversifier is fading. Hidden common driver: Insurance and reinsurance share the P&C pricing cycle (now 93% of premiums); mortgage insurance on US housing credit is the diversifier but has shrunk from 25% to 7% of premiums. Worst net income year since 2019 -32%, EPS growth +27.8% a year over 5 years; P/E 8.0 vs 10.1 own 10-year median (val_disc_avg -21%). Kept.

### JNJ, Johnson & Johnson (rank 9, offset score 51.6)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | consumer | innovativemedicine | medtech |
|---|---|---|---|
| 2018 | 13,853 | 40,734 | 26,994 |
| 2019 | 13,898 (+0%) | 42,198 (+4%) | 25,963 (-4%) |
| 2020 | 14,450 (+1%) | 45,175 (+8%) | 22,959 (-12%) |
| 2021 |  (+4%) | 51,680 (+14%) | 27,060 (+18%) |
| 2022 |  | 52,563 (+2%) | 27,427 (+1%) |
| 2023 |  | 54,759 (+4%) | 30,400 (+11%) |
| 2024 |  | 56,964 (+4%) | 31,857 (+5%) |
| 2025 |  | 60,401 (+6%) | 33,792 (+6%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | consumer | innovativemedicine | medtech |
|---|---|---|---|
| 2019 | 2,061 | 8,816 | 7,286 |
| 2020 | -852 | 15,250 | 3,044 |
| 2021 |  | 17,750 | 4,208 |
| 2022 |  | 15,647 | 4,447 |
| 2023 |  | 18,246 | 4,669 |
| 2024 |  | 18,919 | 3,740 |
| 2025 |  | 22,266 | 4,113 |

Correlation of segment revenue growth: innovativemedi/medtech +0.42 (n=7). Size-weighted mean 0.42; offset ratio 0.89 (1 = segment waves line up, 0 = they cancel); average wave +4.8%; segment-profit change correlation -0.59. Worst total segment revenue year +0.6% (2019); worst total segment profit year -8.5% (2022); share of revenue that shrank in 2020/2022/2023 0.11. Slowdown years with a segment moving against another: 2020.

Reading: Medtech fell 12% in 2020 while pharma rose 8%, a real offset, and segment revenue never fell; but only two segments now, and pharma's patent cliffs (Stelara) are a single-stream risk. Hidden common driver: Pharma and medtech have different drivers (patents and launches vs elective procedures); consumer health was spun off in 2023. Worst free cash flow year since 2019 -13%, EPS growth +14.9% a year over 5 years; P/E 24.5 vs 20.3 own 10-year median (val_disc_avg +56%). Kept.

### TXT, Textron Inc. (rank 10, offset score 51.0)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | textronaviation | bell | textronsystems | industrial |
|---|---|---|---|---|
| 2018 | 4,971 | 3,180 | 1,464 | 4,291 |
| 2019 | 5,187 (+4%) | 3,254 (+2%) | 1,325 (-9%) | 3,798 (-11%) |
| 2020 | 3,974 (-23%) | 3,309 (+2%) | 1,313 (-1%) | 3,000 (-21%) |
| 2021 | 4,566 (+15%) | 3,364 (+2%) | 1,273 (-3%) | 3,130 (+4%) |
| 2022 | 5,073 (+11%) | 3,091 (-8%) | 1,172 (-8%) | 3,465 (+11%) |
| 2023 | 5,373 (+6%) | 3,147 (+2%) | 1,235 (+5%) | 3,841 (+11%) |
| 2024 | 5,284 (-2%) | 3,579 (+14%) | 1,241 (+0%) | 3,515 (-8%) |
| 2025 | 5,955 (+13%) | 4,282 (+20%) | 1,247 (+0%) | 3,213 (-9%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | textronaviation | bell | textronsystems | industrial |
|---|---|---|---|---|
| 2022 | 560 | 282 | 132 | 155 |
| 2023 | 649 | 320 | 147 | 228 |
| 2024 | 566 | 370 | 154 | 151 |
| 2025 | 694 | 363 | 175 | 145 |

Correlation of segment revenue growth: textronaviatio/bell +0.04 (n=7); textronaviatio/textronsystems -0.16 (n=7); textronaviatio/industrial +0.71 (n=7); bell/textronsystems +0.47 (n=7); bell/industrial -0.44 (n=7); textronsystems/industrial +0.08 (n=7). Size-weighted mean 0.15; offset ratio 0.78 (1 = segment waves line up, 0 = they cancel); average wave +9.2%; segment-profit change correlation n/a. Worst total segment revenue year -14.5% (2020); worst total segment profit year -7.7% (2024); share of revenue that shrank in 2020/2022/2023 0.38. Slowdown years with a segment moving against another: 2020,2022.

Reading: Textron Aviation fell 23% and Industrial 21% in 2020 while Bell grew 2%; the weak segments were the big ones, so the total fell 14.5%. Hidden common driver: Business jets, helicopters, defense and auto parts have different drivers. Worst free cash flow year since 2019 -33%, EPS growth +30.5% a year over 5 years; P/E 15.2 vs 17.6 own 10-year median (val_disc_avg -14%). Kept.

### PEP, PepsiCo, Inc. (rank 11, offset score 48.1)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | fritolaynorthamerica | quakerfoodsnorthameri~ | pepsicobeveragesnorth~ | latinamerica | europe | africamiddleeastandso~ | asiapacificaustraliaa~ | pepsicofoodsnorthamer~ | internationalbeverage~ | europemiddleeastafrica | latinamericafoods | asiapacificfoods |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2018 | 16,346 | 2,465 | 21,072 | 7,354 | 10,973 | 3,657 | 2,794 |  |  |  |  |  |
| 2019 | 17,078 (+4%) | 2,482 (+1%) | 21,730 (+3%) | 7,573 (+3%) | 11,728 (+7%) | 3,651 (-0%) | 2,919 (+4%) |  |  |  |  |  |
| 2020 | 18,189 (+7%) | 2,742 (+10%) | 22,559 (+4%) | 6,942 (-8%) | 11,922 (+2%) | 4,573 (+25%) | 3,445 (+18%) |  |  |  |  |  |
| 2021 | 19,608 (+8%) | 2,751 (+0%) | 25,276 (+12%) | 8,108 (+17%) | 13,038 (+9%) | 6,078 (+33%) | 4,615 (+34%) |  |  |  |  |  |
| 2022 | 23,291 (+19%) | 3,160 (+15%) | 26,213 (+4%) | 9,779 (+21%) | 12,724 (-2%) | 6,438 (+6%) | 4,787 (+4%) |  |  |  |  |  |
| 2023 |  (+7%) |  (-2%) | 27,626 (+5%) |  (+19%) |  (+4%) |  (-5%) |  (+0%) | 28,015 | 4,559 | 16,210 | 10,576 | 4,485 |
| 2024 |  |  | 27,769 (+1%) |  |  |  |  | 27,431 (-2%) | 4,879 (+7%) | 16,658 (+3%) | 10,568 (-0%) | 4,549 (+1%) |
| 2025 |  |  | 28,197 (+2%) |  |  |  |  | 27,528 (+0%) | 4,997 (+2%) | 18,025 (+8%) | 10,549 (-0%) | 4,629 (+2%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | fritolaynorthamerica | quakerfoodsnorthameri~ | pepsicobeveragesnorth~ | latinamerica | europe | africamiddleeastandso~ | asiapacificaustraliaa~ | pepsicofoodsnorthamer~ | internationalbeverage~ | europemiddleeastafrica | latinamericafoods | asiapacificfoods |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2018 | 5,008 | 637 | 2,276 | 1,049 | 1,256 | 661 | 619 |  |  |  |  |  |
| 2019 | 5,258 | 544 | 2,179 | 1,141 | 1,327 | 671 | 477 |  |  |  |  |  |
| 2020 | 5,340 | 669 | 1,937 | 1,033 | 1,353 | 600 | 590 |  |  |  |  |  |
| 2021 | 5,633 | 578 | 2,442 | 1,369 | 1,292 | 858 | 673 |  |  |  |  |  |
| 2022 | 6,135 | 604 | 5,426 | 1,627 | -1,380 | 666 | 537 |  |  |  |  |  |
| 2023 |  |  | 2,584 |  |  |  |  | 7,247 | 567 | 1,764 | 1,898 | 301 |
| 2024 |  |  | 2,302 |  |  |  |  | 6,619 | 1,462 | 1,971 | 2,052 | 377 |
| 2025 |  |  | 1,089 |  |  |  |  | 6,173 | 1,769 | 2,106 | 2,010 | 369 |

Correlation of segment revenue growth: fritolaynortha/quakerfoodsnor +0.74 (n=5); fritolaynortha/pepsicobeverag -0.12 (n=5); fritolaynortha/latinamerica +0.55 (n=5); fritolaynortha/europe -0.74 (n=5); fritolaynortha/africamiddleea -0.08 (n=5); fritolaynortha/asiapacificaus -0.20 (n=5); quakerfoodsnor/pepsicobeverag -0.43 (n=5); quakerfoodsnor/latinamerica -0.16 (n=5). Size-weighted mean 0.12; offset ratio 0.63 (1 = segment waves line up, 0 = they cancel); average wave +5.2%; segment-profit change correlation -0.02. Worst total segment revenue year +0.4% (2024); worst total segment profit year -9.3% (2023); share of revenue that shrank in 2020/2022/2023 0.13. Slowdown years with a segment moving against another: 2020,2022.

Reading: Latin America fell 8% in 2020 while Asia rose 18%; segment revenue never fell, but the segments are one product family on different maps. Hidden common driver: Consumer staples across regions; offsets are mostly currency and regional timing. Worst free cash flow year since 2019 -20%, EPS growth +3.2% a year over 5 years; P/E 23.5 vs 23.3 own 10-year median (val_disc_avg +1%). Kept.

### MCO, Moody's Corporation (rank 12, offset score 48.0)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | moodysinvestorsservice | moodysanalytics |
|---|---|---|
| 2018 | 2,836 | 1,743 |
| 2019 | 3,009 (+6%) | 1,963 (+13%) |
| 2020 | 3,440 (+14%) | 2,086 (+6%) |
| 2021 | 3,977 (+16%) | 2,413 (+16%) |
| 2022 | 2,873 (-28%) | 2,777 (+15%) |
| 2023 | 3,046 (+6%) | 3,069 (+11%) |
| 2024 | 3,986 (+31%) | 3,308 (+8%) |
| 2025 | 4,317 (+8%) | 3,611 (+9%) |

Segment profit, $M (mco:AdjustedOperatingIncome):

| year | moodysinvestorsservice | moodysanalytics |
|---|---|---|
| 2018 | 1,657 | 460 |
| 2019 | 1,745 | 546 |
| 2020 | 2,053 | 614 |
| 2021 | 2,474 | 627 |
| 2022 | 1,488 | 840 |
| 2023 | 1,660 | 937 |
| 2024 | 2,394 | 1,014 |
| 2025 | 2,746 | 1,196 |

Correlation of segment revenue growth: moodysinvestor/moodysanalytic -0.56 (n=7). Size-weighted mean -0.56; offset ratio 0.84 (1 = segment waves line up, 0 = they cancel); average wave +10.8%; segment-profit change correlation -0.68. Worst total segment revenue year -11.6% (2022); worst total segment profit year -24.9% (2022); share of revenue that shrank in 2020/2022/2023 0.21. Slowdown years with a segment moving against another: 2022.

Reading: Ratings fell 28% in 2022 while analytics rose 15%: a real offset, but ratings were 62% of revenue so the total still fell 11.6% and profit 25%. The weak segment is the large one. Hidden common driver: Two segments with different drivers (bond issuance vs subscriptions); the cyclical one is the bigger one. Worst free cash flow year since 2019 -36%, EPS growth +7.8% a year over 5 years; P/E 33.7 vs 34.0 own 10-year median (val_disc_avg -4%). Kept.

### C, Citigroup Inc. (rank 13, offset score 47.0)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | globalconsumerbanking | institutionalclientsg~ | personalbankingandwea~ | services | markets | banking | uspersonalbanking | wealth |
|---|---|---|---|---|---|---|---|---|
| 2018 | 32,339 | 38,325 |  |  |  |  |  |  |
| 2019 | 33,221 (+2%) | 39,824 (+3%) |  |  |  |  |  |  |
| 2020 |  (-9%) | 41,093 (+13%) | 25,140 |  |  |  |  |  |
| 2021 |  |  (-3%) |  (-7%) | 12,523 | 19,399 | 7,783 | 15,845 | 7,542 |
| 2022 |  |  |  | 15,665 (+25%) | 19,945 (+4%) | 5,527 (-31%) | 16,872 (+6%) | 7,355 (-1%) |
| 2023 |  |  |  | 18,062 (+16%) | 18,649 (-6%) | 4,715 (-15%) | 18,900 (+14%) | 6,997 (-5%) |
| 2024 |  |  |  | 19,618 (+9%) | 19,836 (+6%) | 6,201 (+32%) | 20,055 (+6%) | 7,483 (+7%) |
| 2025 |  |  |  | 21,256 (+8%) | 21,970 (+11%) | 8,215 (+32%) | 20,971 (+5%) | 8,559 (+14%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest):

| year | globalconsumerbanking | institutionalclientsg~ | personalbankingandwea~ | services | markets | banking | uspersonalbanking | wealth |
|---|---|---|---|---|---|---|---|---|
| 2018 | 5,309 | 12,574 |  |  |  |  |  |  |
| 2019 | 5,579 | 12,776 |  |  |  |  |  |  |
| 2020 |  | 10,811 | 1,322 |  |  |  |  |  |
| 2021 |  |  |  | 3,768 | 6,661 | 4,105 | 6,099 | 1,968 |
| 2022 |  |  |  | 4,948 | 5,852 | 334 | 2,770 | 995 |
| 2023 |  |  |  | 4,701 | 3,938 | -31 | 1,820 | 419 |
| 2024 |  |  |  | 6,584 | 5,005 | 1,529 | 1,382 | 1,002 |
| 2025 |  |  |  | 7,139 | 5,928 | 2,324 | 3,097 | 1,490 |

Correlation of segment revenue growth: services/markets -0.40 (n=4); services/banking -0.95 (n=4); services/uspersonalbank +0.24 (n=4); services/wealth -0.73 (n=4); markets/banking +0.65 (n=4); markets/uspersonalbank -0.98 (n=4); markets/wealth +0.89 (n=4); banking/uspersonalbank -0.51 (n=4). Size-weighted mean -0.29; offset ratio 0.41 (1 = segment waves line up, 0 = they cancel); average wave +7.0%; segment-profit change correlation 0.55. Worst total segment revenue year -4.6% (2021); worst total segment profit year -33.8% (2022); share of revenue that shrank in 2020/2022/2023 0.40. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: Services (+25% in 2022) offset a 31% fall in Banking, which is real offsetting, but segment profit fell 34% in 2022 and EPS has compounded only 7.7% a year; the offsets protect revenue, not earnings. Hidden common driver: Citi's own restructuring (exits, transformation spending) and rates; segment profit changes correlate +0.55. Worst net income year since 2019 -43%, EPS growth +7.7% a year over 5 years; P/E 13.6 vs 8.5 own 10-year median (val_disc_avg +60%). Kept.

### ABT, Abbott Laboratories (rank 14, offset score 42.3)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | establishedpharmaceut~ | nutritionalproducts | diagnosticproducts | medicaldevices |
|---|---|---|---|---|
| 2018 | 4,422 | 7,229 | 7,495 | 11,370 |
| 2019 | 4,486 (+1%) | 7,409 (+2%) | 7,713 (+3%) | 12,239 (+8%) |
| 2020 | 4,303 (-4%) | 7,647 (+3%) | 10,805 (+40%) | 11,787 (-4%) |
| 2021 | 4,718 (+10%) | 8,294 (+8%) | 15,526 (+45%) | 14,485 (+22%) |
| 2022 | 4,912 (+4%) | 7,459 (-10%) | 16,469 (+6%) | 14,802 (+2%) |
| 2023 | 5,066 (+3%) | 8,154 (+9%) | 9,988 (-39%) | 16,887 (+14%) |
| 2024 | 5,194 (+3%) | 8,413 (+3%) | 9,341 (-6%) | 18,986 (+12%) |
| 2025 | 5,536 (+7%) | 8,451 (+0%) | 8,937 (-4%) | 21,387 (+13%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | establishedpharmaceut~ | nutritionalproducts | diagnosticproducts | medicaldevices |
|---|---|---|---|---|
| 2018 | 894 | 1,652 | 1,868 | 3,500 |
| 2019 | 904 | 1,705 | 1,912 | 3,769 |
| 2020 | 794 | 1,751 | 3,725 | 3,038 |
| 2021 | 889 | 1,763 | 6,237 | 4,533 |
| 2022 | 1,049 | 706 | 6,640 | 4,436 |
| 2023 | 1,206 | 1,333 | 2,433 | 5,306 |
| 2024 | 1,233 | 1,505 | 2,073 | 6,153 |
| 2025 | 1,290 | 1,558 | 1,740 | 7,212 |

Correlation of segment revenue growth: establishedpha/nutritionalpro +0.09 (n=7); establishedpha/diagnosticprod -0.02 (n=7); establishedpha/medicaldevices +0.84 (n=7); nutritionalpro/diagnosticprod -0.04 (n=7); nutritionalpro/medicaldevices +0.57 (n=7); diagnosticprod/medicaldevices -0.17 (n=7). Size-weighted mean 0.19; offset ratio 0.76 (1 = segment waves line up, 0 = they cancel); average wave +12.1%; segment-profit change correlation -0.07. Worst total segment revenue year -8.1% (2023); worst total segment profit year -19.9% (2023); share of revenue that shrank in 2020/2022/2023 0.37. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: Diagnostics rose 40% and 45% in 2020-21 then fell 39% in 2023 while devices grew 14%; total fell 8% in 2023. The offsets are real but the wave came from one event. Hidden common driver: No single shared driver across nutrition, diagnostics, devices and established pharma; COVID testing created the big wave. Worst free cash flow year since 2019 -35%, EPS growth +8.2% a year over 5 years; P/E 27.7 vs 33.2 own 10-year median (val_disc_avg -13%). Kept.

### MET, MetLife, Inc. (rank 15, offset score 39.8)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | unitedstates | asia | latinamerica | emea | metlifeholdings | groupbenefits | retirementandincomeso~ | metlifeinvestmentmana~ |
|---|---|---|---|---|---|---|---|---|
| 2018 | 37,037 | 11,764 | 5,084 | 2,921 | 10,726 |  |  |  |
| 2019 | 35,787 (-3%) | 12,053 (+2%) | 5,132 (+1%) | 2,945 (+1%) | 10,406 (-3%) |  |  |  |
| 2020 | 36,195 (+1%) | 12,462 (+3%) | 4,289 (-16%) | 3,013 (+2%) | 10,095 (-3%) |  |  |  |
| 2021 |  (+2%) | 13,172 (+7%) | 5,061 (+17%) | 2,923 (-3%) | 10,898 (+10%) | 23,703 | 12,521 |  |
| 2022 |  | 11,255 (-15%) | 6,031 (+19%) | 2,441 (-16%) | 9,037 (-17%) | 24,402 (+3%) | 20,518 (+64%) |  |
| 2023 |  | 10,926 (-3%) | 7,371 (+22%) | 2,543 (+4%) |  (-9%) | 25,230 (+3%) | 16,635 (-19%) | 722 |
| 2024 |  | 11,415 (+4%) | 7,586 (+3%) | 2,770 (+9%) |  | 26,122 (+4%) | 17,076 (+3%) | 725 (+0%) |
| 2025 |  | 11,955 (+5%) | 8,304 (+9%) | 3,154 (+14%) |  | 26,881 (+3%) | 21,036 (+23%) | 938 (+29%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | unitedstates | asia | latinamerica | emea | metlifeholdings | groupbenefits | retirementandincomeso~ | metlifeinvestmentmana~ |
|---|---|---|---|---|---|---|---|---|
| 2018 | 2,804 | 1,237 | 592 | 277 | 1,255 |  |  |  |
| 2019 | 2,838 | 1,405 | 609 | 282 | 1,034 |  |  |  |
| 2020 | 3,224 | 1,565 | 280 | 327 | 976 |  |  |  |
| 2021 |  | 2,517 | 274 | 306 | 2,103 | 463 | 2,591 |  |
| 2022 |  | 1,617 | 729 | 249 | 1,031 | 1,332 | 1,635 |  |
| 2023 |  | 1,282 | 840 | 265 |  | 1,655 | 1,708 | 70 |
| 2024 |  | 1,621 | 881 | 283 |  | 1,606 | 1,667 | 55 |
| 2025 |  | 1,702 | 798 | 367 |  | 1,692 | 1,671 | 200 |

Correlation of segment revenue growth: asia/latinamerica -0.42 (n=7); asia/emea +0.74 (n=7); asia/metlifeholding +0.92 (n=5); asia/groupbenefits +0.37 (n=4); asia/retirementandi -0.63 (n=4); latinamerica/emea -0.30 (n=7); latinamerica/metlifeholding -0.18 (n=5); latinamerica/groupbenefits -0.25 (n=4). Size-weighted mean -0.17; offset ratio 0.58 (1 = segment waves line up, 0 = they cancel); average wave +8.3%; segment-profit change correlation -0.12. Worst total segment revenue year -3.8% (2023); worst total segment profit year -20.1% (2022); share of revenue that shrank in 2020/2022/2023 0.39. Slowdown years with a segment moving against another: 2022,2023.

Reading: Retirement (pension risk transfer, lumpy) swung +64% and -19% while Latin America grew 17-22% a year; segment revenue fell 3.8% in 2023 and segment profit 20% in 2022. Real offsets, but a rate machine underneath. Hidden common driver: Interest rates and credit spreads on the general-account portfolio feed every segment's earnings. Worst net income year since 2019 -63%, EPS growth -4.5% a year over 5 years; P/E 19.8 vs 11.5 own 10-year median (val_disc_avg +71%). Kept.

### MKC, McCormick & Company, Incorporated (rank 16, offset score 38.5)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | consumer | flavorsolutions |
|---|---|---|
| 2018 | 3,247 | 2,056 |
| 2019 | 3,270 (+1%) | 2,078 (+1%) |
| 2020 | 3,597 (+10%) | 2,005 (-4%) |
| 2021 | 3,938 (+9%) | 2,380 (+19%) |
| 2022 | 3,758 (-5%) | 2,593 (+9%) |
| 2023 | 3,807 (+1%) | 2,855 (+10%) |
| 2024 | 3,848 (+1%) | 2,875 (+1%) |
| 2025 | 3,950 (+3%) | 2,890 (+1%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | consumer | flavorsolutions |
|---|---|---|
| 2018 | 612 | 279 |
| 2019 | 663 | 294 |
| 2020 | 768 | 232 |
| 2021 | 757 | 258 |
| 2022 | 687 | 177 |
| 2023 | 700 | 263 |
| 2024 | 737 | 323 |
| 2025 | 721 | 350 |

Correlation of segment revenue growth: consumer/flavorsolution +0.04 (n=7). Size-weighted mean 0.04; offset ratio 0.75 (1 = segment waves line up, 0 = they cancel); average wave +5.5%; segment-profit change correlation 0.07. Worst total segment revenue year +0.5% (2022); worst total segment profit year -14.9% (2022); share of revenue that shrank in 2020/2022/2023 0.34. Slowdown years with a segment moving against another: 2020,2022.

Reading: Consumer rose 10% in 2020 while flavor solutions fell 3.5%; in 2022 consumer fell 4.6% while flavor rose 9%. Textbook offset, but small business, slow growth (EPS +1% a year). Hidden common driver: No single shared driver: consumer spices (home cooking) vs flavor solutions (food makers and restaurants). Worst free cash flow year since 2019 -34%, EPS growth +1.1% a year over 5 years; P/E 15.8 vs 24.4 own 10-year median (val_disc_avg -34%). Kept.

### RTX, RTX Corporation (rank 17, offset score 27.7)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2019:collinsaerospace.

| year | collinsaerospace | prattandwhitney | raytheon |
|---|---|---|---|
| 2018 | 16,634 | 19,402 |  |
| 2019 | 26,028 | 20,902 |  |
| 2020 | 19,288 (-26%) | 16,799 (-20%) | 22,465 |
| 2021 | 21,152 (-4%) | 18,150 (+8%) | 26,611 (+37%) |
| 2022 | 23,052 (+9%) | 20,530 (+13%) | 25,176 (-5%) |
| 2023 | 26,253 (+14%) | 18,296 (-11%) | 26,350 (+5%) |
| 2024 | 28,284 (+8%) | 28,066 (+53%) | 26,713 (+1%) |
| 2025 | 30,196 (+7%) | 32,916 (+17%) | 28,043 (+5%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | collinsaerospace | prattandwhitney | raytheon |
|---|---|---|---|
| 2018 | 2,397 | 1,402 |  |
| 2019 | 4,508 | 1,801 |  |
| 2020 | 1,466 | -564 | 1,900 |
| 2021 | 2,380 | 454 | 3,399 |
| 2022 | 2,816 | 1,075 | 2,448 |
| 2023 | 3,825 | -1,455 | 2,379 |
| 2024 | 4,135 | 2,015 | 2,594 |
| 2025 | 4,923 | 2,596 | 3,227 |

Correlation of segment revenue growth: collinsaerospa/prattandwhitne +0.48 (n=6); collinsaerospa/raytheon -0.86 (n=5); prattandwhitne/raytheon -0.23 (n=5). Size-weighted mean -0.21; offset ratio 0.83 (1 = segment waves line up, 0 = they cancel); average wave +15.8%; segment-profit change correlation 0.10. Worst total segment revenue year -23.1% (2020); worst total segment profit year -85.7% (2020); share of revenue that shrank in 2020/2022/2023 0.57. Slowdown years with a segment moving against another: 2022,2023.

Reading: Collins and Pratt fell 26% and 20% in 2020; Raytheon held, but it was too small to stop a 23% fall; Pratt's 2023 engine recall is company-specific. Hidden common driver: Commercial air traffic drives Collins and Pratt (two-thirds of revenue); defense budget drives Raytheon. Worst free cash flow year since 2019 -17%, EPS growth n/a a year over 5 years; P/E 39.6 vs 26.7 own 10-year median (val_disc_avg +22%). Kept.

## Dropped: one hidden common driver (the trap) (25)

### BRO, Brown & Brown, Inc. (offset score 72.8; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | retail | programs | specialtydistribution |
|---|---|---|---|
| 2018 | 1,043 | 494 | 287 |
| 2019 | 1,367 (+31%) | 518 (+5%) | 310 (+8%) |
| 2020 | 1,473 (+8%) | 611 (+18%) | 353 (+14%) |
| 2021 | 1,768 (+20%) | 702 (+15%) | 403 (+14%) |
| 2022 | 2,157 (+18%) | 958 (+22%) | 453 (+12%) |
| 2023 | 2,508 (+16%) |  (+22%) | 1,714 (+19%) |
| 2024 | 2,729 (+9%) |  | 2,016 (+18%) |
| 2025 | 3,406 (+25%) |  | 2,409 (+19%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | retail | programs | specialtydistribution |
|---|---|---|---|
| 2019 | 223 | 144 | 83 |
| 2020 | 262 | 183 | 94 |
| 2021 | 334 | 242 | 95 |
| 2022 | 477 | 283 | 118 |
| 2023 | 537 |  | 677 |
| 2024 | 602 |  | 778 |
| 2025 | 707 |  | 865 |

Correlation of segment revenue growth: retail/programs -0.74 (n=5); retail/specialtydistr -0.39 (n=7); programs/specialtydistr +0.77 (n=5). Size-weighted mean -0.34; offset ratio 0.62 (1 = segment waves line up, 0 = they cancel); average wave +6.3%; segment-profit change correlation -0.14. Worst total segment revenue year +11.0% (2020); worst total segment profit year +13.7% (2024); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Segment revenue grew 11-23% every year; the negative correlation (-0.34) is timing noise between two commission books. Hidden common driver: Retail and specialty distribution both earn commissions on P&C premium rates; growth is heavily acquired. Worst net income year since 2019 +6%, EPS growth +14.1% a year over 5 years; P/E 22.9 vs 22.7 own 10-year median (val_disc_avg +1%). Dropped: one hidden common driver (the trap).

### PGR, The Progressive Corporation (offset score 61.7; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:SupplementaryInsuranceInformationPremiumRevenue.

| year | personallines | commerciallines |
|---|---|---|
| 2018 | 27,322 | 3,611 |
| 2019 | 31,765 (+16%) | 4,428 (+23%) |
| 2020 | 34,386 (+8%) | 4,876 (+10%) |
| 2021 | 37,416 (+9%) | 6,945 (+42%) |
| 2022 | 40,150 (+7%) | 9,088 (+31%) |
| 2023 | 48,765 (+21%) | 9,899 (+9%) |
| 2024 | 60,091 (+23%) | 10,707 (+8%) |
| 2025 | 70,778 (+18%) | 10,881 (+2%) |

Segment profit: not tagged by segment in a single-axis XBRL context (not verified).

Correlation of segment revenue growth: personallines/commercialline -0.65 (n=7). Size-weighted mean -0.65; offset ratio 0.58 (1 = segment waves line up, 0 = they cancel); average wave +6.9%; segment-profit change correlation n/a. Worst total segment revenue year +8.5% (2020); worst total segment profit year n/a (n/a); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Premium growth correlates -0.65 between personal and commercial auto, but that is two auto books whose pricing cycles happened to be out of step; segment profit is not tagged. One stream. Hidden common driver: Both segments are auto insurance; personal lines are 87% of premiums and the only driver is US auto loss costs. Worst net income year since 2019 -78%, EPS growth +14.6% a year over 5 years; P/E 11.7 vs 15.3 own 10-year median (val_disc_avg -23%). Dropped: one hidden common driver (the trap).

### ADP, Automatic Data Processing, Inc. (offset score 52.2; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:Revenues.

| year | employerservices | professionalemployeeo~ |
|---|---|---|
| 2019 | 9,943 | 4,178 |
| 2020 | 10,087 (+1%) | 4,512 (+8%) |
| 2021 | 10,195 (+1%) | 4,818 (+7%) |
| 2022 | 10,968 (+8%) | 5,546 (+15%) |
| 2023 | 12,043 (+10%) | 5,984 (+8%) |
| 2024 | 12,981 (+8%) | 6,234 (+4%) |
| 2025 | 13,883 (+7%) | 6,690 (+7%) |
| 2026 | 14,831 (+7%) | 7,128 (+7%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | employerservices | professionalemployeeo~ |
|---|---|---|
| 2020 | 3,058 | 609 |
| 2021 | 3,052 | 719 |
| 2022 | 3,406 | 871 |
| 2023 | 3,974 | 977 |
| 2024 | 4,556 | 922 |
| 2025 | 5,008 | 950 |
| 2026 | 5,437 | 936 |

Correlation of segment revenue growth: employerservic/professionalem +0.12 (n=7). Size-weighted mean 0.12; offset ratio 0.91 (1 = segment waves line up, 0 = they cancel); average wave +2.7%; segment-profit change correlation -0.48. Worst total segment revenue year +2.8% (2021); worst total segment profit year +2.8% (2021); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Both segments grew every year; one employment driver. Hidden common driver: US employment and wage levels drive both employer services and PEO. Worst free cash flow year since 2019 -1%, EPS growth +12.5% a year over 5 years; P/E 27.3 vs 25.6 own 10-year median (val_disc_avg +6%). Dropped: one hidden common driver (the trap).

### IDXX, IDEXX Laboratories, Inc. (offset score 49.7; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | companionanimalgroup | water | livestockandpoultrydi~ |
|---|---|---|---|
| 2018 | 1,935 | 125 | 131 |
| 2019 | 2,119 (+9%) | 133 (+6%) | 133 (+2%) |
| 2020 | 2,386 (+13%) | 129 (-3%) | 146 (+10%) |
| 2021 | 2,890 (+21%) | 147 (+14%) | 136 (-7%) |
| 2022 | 3,059 (+6%) | 156 (+6%) | 123 (-10%) |
| 2023 | 3,352 (+10%) | 168 (+8%) | 122 (-1%) |
| 2024 | 3,574 (+7%) | 185 (+10%) | 122 (+0%) |
| 2025 | 3,953 (+11%) | 201 (+9%) | 132 (+8%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | companionanimalgroup | water | livestockandpoultrydi~ |
|---|---|---|---|
| 2018 | 413 | 57 | 19 |
| 2019 | 463 | 62 | 25 |
| 2020 | 575 | 59 | 40 |
| 2021 | 824 | 65 | 29 |
| 2022 | 801 | 73 | 20 |
| 2023 | 1,013 | 74 | 10 |

Correlation of segment revenue growth: companionanima/water +0.27 (n=7); companionanima/livestockandpo -0.04 (n=7); water/livestockandpo -0.58 (n=7). Size-weighted mean 0.11; offset ratio 0.92 (1 = segment waves line up, 0 = they cancel); average wave +4.6%; segment-profit change correlation -0.40. Worst total segment revenue year +5.2% (2022); worst total segment profit year -2.7% (2022); share of revenue that shrank in 2020/2022/2023 0.05. Slowdown years with a segment moving against another: none.

Reading: A single stream (vet diagnostics) with two small side businesses. Hidden common driver: Companion-animal diagnostics is 92% of revenue. Worst free cash flow year since 2019 -38%, EPS growth +14.3% a year over 5 years; P/E 51.9 vs 52.5 own 10-year median (val_disc_avg -4%). Dropped: one hidden common driver (the trap).

### UNH, UnitedHealth Group Incorporated (offset score 41.4; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | unitedhealthcare | optumhealth | optuminsight | optumrx |
|---|---|---|---|---|
| 2018 | 183,476 | 24,145 | 9,008 | 69,536 |
| 2019 | 193,842 (+6%) | 30,317 (+26%) | 10,006 (+11%) | 74,288 (+7%) |
| 2020 | 200,875 (+4%) | 39,808 (+31%) | 10,802 (+8%) | 87,498 (+18%) |
| 2021 | 222,899 (+11%) | 54,065 (+36%) | 12,199 (+13%) | 91,314 (+4%) |
| 2022 | 249,741 (+12%) | 71,174 (+32%) | 14,581 (+20%) | 99,773 (+9%) |
| 2023 | 281,360 (+13%) | 95,319 (+34%) | 18,932 (+30%) | 116,087 (+16%) |
| 2024 | 298,208 (+6%) | 105,358 (+11%) | 18,757 (-1%) | 133,231 (+15%) |
| 2025 | 344,903 (+16%) | 101,957 (-3%) | 19,417 (+4%) | 154,726 (+16%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | unitedhealthcare | optumhealth | optuminsight | optumrx |
|---|---|---|---|---|
| 2018 | 9,113 | 2,430 | 2,243 | 3,558 |
| 2019 | 10,326 | 2,963 | 2,494 | 3,902 |
| 2020 | 12,359 | 3,434 | 2,725 | 3,887 |
| 2021 | 11,975 | 4,462 | 3,398 | 4,135 |
| 2022 | 14,379 | 6,032 | 3,588 | 4,436 |
| 2023 | 16,415 | 6,560 | 4,268 | 5,115 |
| 2024 | 15,584 | 7,770 | 3,097 | 5,836 |
| 2025 | 9,425 | -278 | 2,624 | 7,193 |

Correlation of segment revenue growth: unitedhealthca/optumhealth -0.26 (n=7); unitedhealthca/optuminsight +0.36 (n=7); unitedhealthca/optumrx -0.02 (n=7); optumhealth/optuminsight +0.69 (n=7); optumhealth/optumrx -0.39 (n=7); optuminsight/optumrx -0.12 (n=7). Size-weighted mean -0.10; offset ratio 0.54 (1 = segment waves line up, 0 = they cancel); average wave +5.7%; segment-profit change correlation -0.07. Worst total segment revenue year +7.8% (2019); worst total segment profit year -41.3% (2025); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Revenue offsets look fine (no segment fell before 2024), but segment profit fell 41% in 2025 when UHC and Optum Health were hit by the same cost trend. The trap in practice. Hidden common driver: Medical cost trend and Medicare Advantage funding drive UnitedHealthcare and Optum Health together, and Optum Rx and Insight are fed by UHC's own members. Worst free cash flow year since 2019 -22%, EPS growth -3.8% a year over 5 years; P/E 26.0 vs 20.3 own 10-year median (val_disc_avg +23%). Dropped: one hidden common driver (the trap).

### ADBE, Adobe Inc. (offset score 40.4; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | digitalmedia | digitalexperience | publishingandadvertis~ |
|---|---|---|---|
| 2018 | 6,325 | 2,073 | 632 |
| 2019 | 7,707 (+22%) | 2,795 (+35%) | 669 (+6%) |
| 2020 | 9,233 (+20%) | 3,125 (+12%) | 510 (-24%) |
| 2021 | 11,520 (+25%) | 3,867 (+24%) | 398 (-22%) |
| 2022 | 12,842 (+11%) | 4,422 (+14%) | 342 (-14%) |
| 2023 | 14,216 (+11%) | 4,893 (+11%) | 300 (-12%) |
| 2024 | 15,864 (+12%) | 5,366 (+10%) | 275 (-8%) |
| 2025 | 17,649 (+11%) | 5,864 (+9%) | 256 (-7%) |

Segment profit, $M (us-gaap:GrossProfit):

| year | digitalmedia | digitalexperience | publishingandadvertis~ |
|---|---|---|---|
| 2018 | 6,076 | 1,394 | 365 |
| 2019 | 7,417 | 1,739 | 342 |
| 2020 | 8,881 | 1,999 | 266 |
| 2021 | 11,091 | 2,546 | 283 |
| 2022 | 12,281 | 2,920 | 240 |
| 2023 | 13,551 | 3,290 | 214 |
| 2024 | 15,184 | 3,777 | 186 |
| 2025 | 16,808 | 4,239 | 171 |

Correlation of segment revenue growth: digitalmedia/digitalexperie +0.75 (n=7); digitalmedia/publishinganda -0.16 (n=7); digitalexperie/publishinganda +0.45 (n=7). Size-weighted mean 0.64; offset ratio 0.93 (1 = segment waves line up, 0 = they cancel); average wave +6.3%; segment-profit change correlation 0.76. Worst total segment revenue year +10.2% (2023); worst total segment profit year +10.5% (2023); share of revenue that shrank in 2020/2022/2023 0.03. Slowdown years with a segment moving against another: none.

Reading: Digital media and digital experience move together (+0.64); the shrinking third segment is 1% of revenue. Hidden common driver: Seat-based creative and marketing software; one AI-substitution risk across both big segments. Worst free cash flow year since 2019 -6%, EPS growth +9.0% a year over 5 years; P/E 12.3 vs 46.1 own 10-year median (val_disc_avg -74%). Dropped: one hidden common driver (the trap).

### RMD, ResMed Inc. (offset score 39.3; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | sleepandbreathingheal~ | residentialcaresoftwa~ |
|---|---|---|
| 2019 | 2,331 | 276 |
| 2020 | 2,602 (+12%) | 355 (+29%) |
| 2021 | 2,823 (+8%) | 374 (+5%) |
| 2022 | 3,177 (+13%) | 401 (+7%) |
| 2023 | 3,725 (+17%) | 498 (+24%) |
| 2024 | 4,101 (+10%) | 584 (+17%) |
| 2025 | 4,505 (+10%) | 641 (+10%) |
| 2026 | 4,978 (+10%) | 676 (+5%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | sleepandbreathingheal~ | residentialcaresoftwa~ |
|---|---|---|
| 2019 | 766 | 75 |
| 2020 | 935 | 82 |
| 2021 | 1,170 | 92 |
| 2022 | 1,280 | 94 |
| 2023 | 1,447 | 116 |
| 2024 | 1,681 | 154 |
| 2025 | 1,964 | 205 |
| 2026 | 2,204 | 218 |

Correlation of segment revenue growth: sleepandbreath/residentialcar +0.56 (n=7). Size-weighted mean 0.56; offset ratio 0.96 (1 = segment waves line up, 0 = they cancel); average wave +3.1%; segment-profit change correlation 0.77. Worst total segment revenue year +8.1% (2021); worst total segment profit year +11.1% (2021); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: A single stream with a small software arm; correlation +0.56. Hidden common driver: Sleep and breathing devices are 88% of revenue. Worst free cash flow year since 2019 -66%, EPS growth +26.3% a year over 5 years; P/E 22.4 vs 36.3 own 10-year median (val_disc_avg -38%). Dropped: one hidden common driver (the trap).

### JKHY, Jack Henry & Associates, Inc. (offset score 38.8; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | core | payments | complementary |
|---|---|---|---|
| 2019 | 523 | 549 | 429 |
| 2020 | 561 (+7%) | 598 (+9%) | 484 (+13%) |
| 2021 | 564 (+0%) | 653 (+7%) | 491 (+4%) |
| 2022 | 622 (+10%) | 719 (+10%) | 544 (+11%) |
| 2023 | 649 (+4%) | 767 (+7%) | 584 (+7%) |
| 2024 | 685 (+6%) | 818 (+7%) | 636 (+6%) |
| 2025 | 733 (+7%) | 873 (+7%) | 695 (+9%) |
| 2026 | 768 (+5%) | 936 (+7%) | 752 (+8%) |

Segment profit, $M (us-gaap:GrossProfit):

| year | core | payments | complementary |
|---|---|---|---|
| 2019 | 287 | 276 | 245 |
| 2020 | 321 | 278 | 280 |
| 2021 | 317 | 294 | 283 |
| 2022 | 361 | 333 | 318 |
| 2023 | 372 | 346 | 351 |
| 2024 | 400 | 376 | 380 |
| 2025 | 438 | 413 | 425 |
| 2026 | 464 | 456 | 465 |

Correlation of segment revenue growth: core/payments +0.59 (n=7); core/complementary +0.76 (n=7); payments/complementary +0.66 (n=7). Size-weighted mean 0.66; offset ratio 0.97 (1 = segment waves line up, 0 = they cancel); average wave +2.0%; segment-profit change correlation 0.53. Worst total segment revenue year +4.2% (2021); worst total segment profit year +2.3% (2021); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: All three grow 4-13% together (+0.66). One customer base. Hidden common driver: Core, payments and complementary products all sold to the same community banks and credit unions. Worst free cash flow year since 2019 -45%, EPS growth +11.1% a year over 5 years; P/E 24.2 vs 31.8 own 10-year median (val_disc_avg -26%). Dropped: one hidden common driver (the trap).

### IQV, IQVIA Holdings Inc. (offset score 38.1; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | technologyandanalytic~ | researchanddevelopmen~ | contractsalesandmedic~ |
|---|---|---|---|
| 2018 | 4,137 | 5,465 | 810 |
| 2019 | 4,486 (+8%) | 5,788 (+6%) | 814 (+0%) |
| 2020 | 4,858 (+8%) | 5,760 (-0%) | 741 (-9%) |
| 2021 | 5,534 (+14%) | 7,556 (+31%) | 784 (+6%) |
| 2022 | 5,746 (+4%) | 7,921 (+5%) | 743 (-5%) |
| 2023 | 5,862 (+2%) | 8,395 (+6%) | 727 (-2%) |
| 2024 | 6,160 (+5%) | 8,527 (+2%) | 718 (-1%) |
| 2025 | 6,626 (+8%) | 8,896 (+4%) | 788 (+10%) |

Segment profit, $M (us-gaap:GrossProfit):

| year | technologyandanalytic~ | researchanddevelopmen~ | contractsalesandmedic~ |
|---|---|---|---|
| 2018 | 1,041 | 1,055 | 61 |
| 2019 | 1,101 | 1,141 | 52 |
| 2020 | 1,216 | 1,048 | 57 |
| 2021 | 1,458 | 1,476 | 75 |
| 2022 | 1,550 | 1,695 | 42 |
| 2023 | 1,490 | 1,915 | 49 |
| 2024 | 1,522 | 1,948 | 47 |
| 2025 | 1,595 | 1,873 | 48 |

Correlation of segment revenue growth: technologyanda/researchanddev +0.71 (n=7); technologyanda/contractsalesa +0.44 (n=7); researchanddev/contractsalesa +0.50 (n=7). Size-weighted mean 0.66; offset ratio 0.97 (1 = segment waves line up, 0 = they cancel); average wave +6.6%; segment-profit change correlation 0.23. Worst total segment revenue year +2.4% (2020); worst total segment profit year -0.0% (2025); share of revenue that shrank in 2020/2022/2023 0.23. Slowdown years with a segment moving against another: none.

Reading: Technology & analytics and R&D solutions move together (+0.66). One customer base. Hidden common driver: All segments sell to pharma R&D and commercial budgets. Worst free cash flow year since 2019 -31%, EPS growth +40.5% a year over 5 years; P/E 31.2 vs 46.4 own 10-year median (val_disc_avg -28%). Dropped: one hidden common driver (the trap).

### ALL, The Allstate Corporation (offset score 36.7; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2021, 2025:allstatehealthandbenefits.

| year | propertyliability | protectionservices | lifeandannuities | allstatehealthandbene~ |
|---|---|---|---|---|
| 2018 | 34,513 | 1,318 | 2,870 | 1,203 |
| 2019 | 38,712 (+12%) | 1,649 (+25%) |  (+14%) | 1,240 (+3%) |
| 2020 | 38,848 (+0%) | 1,922 (+17%) |  | 1,180 (-5%) |
| 2021 | 46,030 | 2,361 |  | 2,274 |
| 2022 | 46,638 (+1%) | 2,487 (+5%) |  | 2,259 (-1%) |
| 2023 | 49,972 (+11%) | 2,773 (+11%) |  | 1,820 (+5%) |
| 2024 | 55,761 (+12%) | 3,223 (+16%) |  | 1,883 (+3%) |
| 2025 | 59,733 (+7%) | 3,550 (+10%) |  | 676 |

Segment profit, $M (all:OperatingIncomeLossAfterTax):

| year | protectionservices | lifeandannuities | allstatehealthandbene~ |
|---|---|---|---|
| 2018 | 8 | 426 | 124 |
| 2019 | 38 |  | 115 |
| 2020 | 153 |  | 96 |
| 2021 | 179 |  | 223 |
| 2022 | 169 |  | 245 |
| 2023 | 106 |  | 195 |
| 2024 | 217 |  | 156 |
| 2025 | 218 |  | 43 |

Correlation of segment revenue growth: propertyliabil/protectionserv +0.47 (n=6); propertyliabil/allstatehealth +0.92 (n=5); protectionserv/allstatehealth +0.14 (n=5). Size-weighted mean 0.64; offset ratio 0.98 (1 = segment waves line up, 0 = they cancel); average wave +4.7%; segment-profit change correlation -0.73. Worst total segment revenue year +0.8% (2020); worst total segment profit year -24.0% (2019); share of revenue that shrank in 2020/2022/2023 0.02. Slowdown years with a segment moving against another: none.

Reading: A single auto-and-home insurer with protection plans attached; the 2022-23 auto loss spike is the one weather and segment income fell 24% in its worst year. Hidden common driver: Property-liability (US auto and home) is about 90% of revenue; one stream with small side businesses. Worst net income year since 2019 -100%, EPS growth +16.6% a year over 5 years; P/E 6.5 vs 9.9 own 10-year median (val_disc_avg -35%). Dropped: one hidden common driver (the trap).

### AMP, Ameriprise Financial, Inc. (offset score 35.4; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | adviceandwealthmanage~ | assetmanagement | retirementandprotecti~ |
|---|---|---|---|
| 2019 | 6,735 | 2,913 | 3,123 |
| 2020 | 6,734 (-0%) | 2,891 (-1%) | 3,094 (-1%) |
| 2021 | 8,033 (+19%) | 3,682 (+27%) | 3,230 (+5%) |
| 2022 | 8,537 (+6%) | 3,506 (-5%) | 3,124 (-3%) |
| 2023 | 9,979 (+17%) | 3,278 (-7%) | 3,476 (+11%) |
| 2024 | 11,442 (+15%) | 3,515 (+7%) | 3,773 (+9%) |
| 2025 | 12,172 (+6%) | 3,621 (+3%) | 3,955 (+5%) |

Segment profit, $M (amp:SegmentReportingInformationOperatingEarnings, us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | adviceandwealthmanage~ | assetmanagement | retirementandprotecti~ |
|---|---|---|---|
| 2018 | 1,389 | 728 | 721 |
| 2019 | 1,509 | 661 | 724 |
| 2020 | 1,321 | 697 | 480 |
| 2021 | 1,743 | 1,096 | 618 |
| 2022 | 2,192 | 844 | 867 |
| 2023 | 2,851 | 720 | 685 |
| 2024 | 3,233 | 920 | 726 |
| 2025 | 3,411 | 1,016 | 846 |

Correlation of segment revenue growth: adviceandwealt/assetmanagemen +0.52 (n=6); adviceandwealt/retirementandp +0.74 (n=6); assetmanagemen/retirementandp +0.13 (n=6). Size-weighted mean 0.55; offset ratio 0.90 (1 = segment waves line up, 0 = they cancel); average wave +6.9%; segment-profit change correlation 0.17. Worst total segment revenue year -0.4% (2020); worst total segment profit year -13.7% (2020); share of revenue that shrank in 2020/2022/2023 0.56. Slowdown years with a segment moving against another: 2022,2023.

Reading: All three segments fell or stalled together in 2020 and 2022-23 (shrinking share 0.56 in slowdown years); a market-levels business. Hidden common driver: Asset levels drive advice fees, asset-management fees and annuity results. Worst net income year since 2019 -19%, EPS growth +24.3% a year over 5 years; P/E 12.2 vs 12.5 own 10-year median (val_disc_avg -3%). Dropped: one hidden common driver (the trap).

### AJG, Arthur J. Gallagher & Co. (offset score 35.4; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | brokerage | riskmanagement |
|---|---|---|
| 2018 | 4,247 | 940 |
| 2019 | 4,902 (+15%) | 977 (+4%) |
| 2020 | 5,167 (+5%) | 973 (-0%) |
| 2021 | 5,968 (+15%) | 1,101 (+13%) |
| 2022 | 7,304 (+22%) | 1,223 (+11%) |
| 2023 | 8,637 (+18%) | 1,433 (+17%) |
| 2024 | 9,934 (+15%) | 1,605 (+12%) |
| 2025 | 12,192 (+23%) | 1,749 (+9%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | brokerage | riskmanagement |
|---|---|---|
| 2018 | 562 | 70 |
| 2019 | 700 | 66 |
| 2020 | 861 | 67 |
| 2021 | 1,008 | 90 |
| 2022 | 1,197 | 116 |
| 2023 | 1,163 | 154 |
| 2024 | 1,678 | 175 |
| 2025 | 2,043 | 183 |

Correlation of segment revenue growth: brokerage/riskmanagement +0.62 (n=7). Size-weighted mean 0.62; offset ratio 0.99 (1 = segment waves line up, 0 = they cancel); average wave +5.2%; segment-profit change correlation -0.22. Worst total segment revenue year +4.5% (2020); worst total segment profit year +0.3% (2023); share of revenue that shrank in 2020/2022/2023 0.06. Slowdown years with a segment moving against another: none.

Reading: Both segments rose almost every year (+0.62 correlation); growth is partly bought. One weather. Hidden common driver: Brokerage and risk management both ride P&C premium rates, plus a steady stream of acquisitions. Worst net income year since 2019 -13%, EPS growth +6.4% a year over 5 years; P/E 48.4 vs 30.7 own 10-year median (val_disc_avg +58%). Dropped: one hidden common driver (the trap).

### DOV, Dover Corporation (offset score 33.9; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | engineeredproducts | cleanenergyfueling | imagingidentification | pumpsprocesssolutions | climatesustainability~ |
|---|---|---|---|---|---|
| 2018 | 1,633 | 1,466 | 1,110 | 1,332 | 1,453 |
| 2019 | 1,698 (+4%) | 1,620 (+11%) | 1,084 (-2%) | 1,339 (+0%) | 1,397 (-4%) |
| 2020 | 1,531 (-10%) | 1,476 (-9%) | 1,038 (-4%) | 1,324 (-1%) | 1,316 (-6%) |
| 2021 | 1,781 (+16%) | 1,648 (+12%) | 1,163 (+12%) | 1,709 (+29%) | 1,608 (+22%) |
| 2022 | 1,380 (+15%) | 1,879 (+14%) | 1,124 (-3%) | 1,728 (+1%) | 1,738 (+8%) |
| 2023 | 1,251 (-9%) | 1,788 (-5%) | 1,117 (-1%) | 1,756 (+2%) | 1,779 (+2%) |
| 2024 | 1,202 (-4%) | 1,937 (+8%) | 1,137 (+2%) | 1,895 (+8%) | 1,580 (-11%) |
| 2025 | 1,086 (-10%) | 2,131 (+10%) | 1,173 (+3%) | 2,149 (+13%) | 1,560 (-1%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | engineeredproducts | cleanenergyfueling | imagingidentification | pumpsprocesssolutions | climatesustainability~ |
|---|---|---|---|---|---|
| 2019 | 292 | 232 | 229 | 240 | 119 |
| 2020 | 265 | 290 | 224 | 349 | 126 |
| 2021 | 278 | 327 | 267 | 576 | 186 |
| 2022 | 240 | 353 | 268 | 533 | 254 |
| 2023 | 224 | 329 | 273 | 484 | 305 |
| 2024 | 231 | 360 | 302 | 537 | 251 |
| 2025 | 217 | 418 | 315 | 652 | 266 |

Correlation of segment revenue growth: engineeredprod/cleanenergyfue +0.70 (n=7); engineeredprod/imagingidentif +0.38 (n=7); engineeredprod/pumpsprocessso +0.42 (n=7); engineeredprod/climatesustain +0.73 (n=7); cleanenergyfue/imagingidentif +0.40 (n=7); cleanenergyfue/pumpsprocessso +0.44 (n=7); cleanenergyfue/climatesustain +0.35 (n=7); imagingidentif/pumpsprocessso +0.99 (n=7). Size-weighted mean 0.56; offset ratio 0.88 (1 = segment waves line up, 0 = they cancel); average wave +8.3%; segment-profit change correlation 0.25. Worst total segment revenue year -6.3% (2020); worst total segment profit year -3.2% (2020); share of revenue that shrank in 2020/2022/2023 0.57. Slowdown years with a segment moving against another: 2022,2023.

Reading: All five fell in 2020 (total -6.3%); correlation +0.56. Hidden common driver: Industrial capital spending across all five segments. Worst free cash flow year since 2019 -37%, EPS growth +14.9% a year over 5 years; P/E 25.5 vs 18.7 own 10-year median (val_disc_avg +27%). Dropped: one hidden common driver (the trap).

### STT, State Street Corporation (offset score 30.0; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | investmentservicing | investmentmanagement |
|---|---|---|
| 2018 | 10,183 | 1,956 |
| 2019 | 9,834 (-3%) | 1,922 (-2%) |
| 2020 | 9,729 (-1%) | 1,974 (+3%) |
| 2021 | 9,797 (+1%) | 2,119 (+7%) |
| 2022 | 10,139 (+3%) | 1,986 (-6%) |
| 2023 | 10,160 (+0%) | 2,079 (+5%) |
| 2024 | 10,656 (+5%) | 2,344 (+13%) |
| 2025 | 11,331 (+6%) | 2,634 (+12%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | investmentservicing | investmentmanagement |
|---|---|---|
| 2019 | 2,684 | 387 |
| 2020 | 2,570 | 503 |
| 2021 | 2,648 | 674 |
| 2022 | 2,859 | 590 |
| 2023 | 2,701 | 539 |
| 2024 | 2,894 | 689 |
| 2025 | 3,216 | 859 |

Correlation of segment revenue growth: investmentserv/investmentmana +0.53 (n=7). Size-weighted mean 0.53; offset ratio 0.92 (1 = segment waves line up, 0 = they cancel); average wave +3.7%; segment-profit change correlation 0.29. Worst total segment revenue year -3.2% (2019); worst total segment profit year -6.1% (2023); share of revenue that shrank in 2020/2022/2023 0.34. Slowdown years with a segment moving against another: 2022.

Reading: Investment servicing and investment management move together (+0.53); a custody bank is one weather. Hidden common driver: Both segments earn fees on asset levels and NII on the same deposits. Worst net income year since 2019 -30%, EPS growth +8.5% a year over 5 years; P/E 15.3 vs 10.7 own 10-year median (val_disc_avg +43%). Dropped: one hidden common driver (the trap).

### DPZ, Domino's Pizza, Inc. (offset score 27.8; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | usstores | supplychain | internationalfranchise |
|---|---|---|---|
| 2019 | 1,273 | 2,232 | 241 |
| 2020 | 1,451 (+14%) | 2,553 (+14%) | 250 (+4%) |
| 2021 | 1,498 (+3%) | 2,700 (+6%) | 298 (+19%) |
| 2022 | 1,487 (-1%) | 2,755 (+7%) | 295 (-1%) |
| 2023 | 1,454 (-2%) | 2,715 (-1%) | 310 (+5%) |
| 2024 | 1,542 (+6%) | 2,846 (+5%) | 319 (+3%) |
| 2025 | 1,612 (+5%) | 2,990 (+5%) | 339 (+6%) |

Segment profit, $M (dpz:SegmentIncomeLoss):

| year | usstores | supplychain | internationalfranchise |
|---|---|---|---|
| 2019 | 362 | 200 | 187 |
| 2020 | 435 | 238 | 198 |
| 2021 | 455 | 230 | 242 |
| 2022 | 439 | 209 | 236 |
| 2023 | 521 | 245 | 260 |
| 2024 | 565 | 281 | 261 |
| 2025 | 575 | 320 | 289 |

Correlation of segment revenue growth: usstores/supplychain +0.83 (n=6); usstores/internationalf -0.01 (n=6); supplychain/internationalf -0.12 (n=6). Size-weighted mean 0.61; offset ratio 0.94 (1 = segment waves line up, 0 = they cancel); average wave +4.6%; segment-profit change correlation 0.29. Worst total segment revenue year -1.3% (2023); worst total segment profit year -4.6% (2022); share of revenue that shrank in 2020/2022/2023 0.44. Slowdown years with a segment moving against another: none.

Reading: US stores and supply chain move together (+0.61). One stream. Hidden common driver: Supply chain revenue is US franchise store volume passed through; one pizza demand stream. Worst free cash flow year since 2019 -31%, EPS growth +7.2% a year over 5 years; P/E 19.3 vs 27.5 own 10-year median (val_disc_avg -34%). Dropped: one hidden common driver (the trap).

### NTRS, Northern Trust Corporation (offset score 27.7; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:NoninterestIncome.

| year | assetservicing | wealthmanagement |
|---|---|---|
| 2018 | 2,590 | 1,688 |
| 2019 | 2,622 (+1%) | 1,790 (+6%) |
| 2020 | 2,820 (+8%) | 1,856 (+4%) |
| 2021 | 3,028 (+7%) | 2,076 (+12%) |
| 2022 | 3,028 (+0%) | 2,082 (+0%) |
| 2023 | 2,938 (-3%) | 2,042 (-2%) |
| 2024 | 3,151 (+7%) | 2,219 (+9%) |
| 2025 | 3,366 (+7%) | 2,334 (+5%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | assetservicing | wealthmanagement |
|---|---|---|
| 2018 | 903 | 798 |
| 2019 | 714 | 796 |
| 2020 | 521 | 729 |
| 2021 | 641 | 936 |
| 2022 | 762 | 807 |
| 2023 | 677 | 729 |
| 2024 | 685 | 908 |
| 2025 | 883 | 981 |

Correlation of segment revenue growth: assetservicing/wealthmanageme +0.76 (n=7). Size-weighted mean 0.76; offset ratio 0.97 (1 = segment waves line up, 0 = they cancel); average wave +4.1%; segment-profit change correlation 0.37. Worst total segment revenue year -2.5% (2023); worst total segment profit year -17.2% (2020); share of revenue that shrank in 2020/2022/2023 0.33. Slowdown years with a segment moving against another: none.

Reading: Asset servicing and wealth management fee income move together (correlation +0.76); one market driver. Hidden common driver: Both segments earn fees on client asset levels; only fee income is tagged by segment before 2022. Worst net income year since 2019 -19%, EPS growth +9.3% a year over 5 years; P/E 17.9 vs 13.8 own 10-year median (val_disc_avg +29%). Dropped: one hidden common driver (the trap).

### CBOE, Cboe Global Markets, Inc. (offset score 27.6; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax.

| year | options | northamericanequities | futures | europeandasiapacific | globalfx |
|---|---|---|---|---|---|
| 2018 | 1,058 | 1,373 | 150 | 132 | 56 |
| 2019 | 983 (-7%) | 1,213 (-12%) | 136 (-9%) | 111 (-16%) | 53 (-6%) |
| 2020 | 1,330 (+35%) | 1,790 (+48%) | 109 (-20%) | 140 (+27%) | 58 (+9%) |
| 2021 | 1,505 (+13%) | 1,570 (-12%) | 121 (+10%) | 240 (+71%) | 58 (+1%) |
| 2022 | 1,823 (+21%) | 1,682 (+7%) | 120 (-1%) | 265 (+10%) | 69 (+19%) |
| 2023 | 1,940 (+6%) | 1,353 (-20%) | 129 (+8%) | 281 (+6%) | 75 (+9%) |
| 2024 | 2,003 (+3%) | 1,547 (+14%) | 141 (+9%) | 324 (+15%) | 80 (+7%) |
| 2025 | 2,434 (+22%) | 1,672 (+8%) | 136 (-4%) | 379 (+17%) | 94 (+17%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | options | northamericanequities | futures | europeandasiapacific | globalfx |
|---|---|---|---|---|---|
| 2018 | 391 | 140 | 86 | 24 | -12 |
| 2019 | 334 | 132 | 83 | 20 | -5 |
| 2020 | 430 | 160 | 54 | 34 | 6 |
| 2021 | 538 | 156 | 66 | 56 | 3 |
| 2022 | 740 | 147 | 55 | 38 | 9 |
| 2023 | 851 | 118 | 86 | 33 | 25 |
| 2024 | 878 | 169 | 99 | 42 | 33 |
| 2025 | 1,113 | 188 | 74 | 54 | 46 |

Correlation of segment revenue growth: options/northamericane +0.73 (n=7); options/futures -0.46 (n=7); options/europeandasiap +0.41 (n=7); options/globalfx +0.65 (n=7); northamericane/futures -0.65 (n=7); northamericane/europeandasiap +0.07 (n=7); northamericane/globalfx +0.36 (n=7); futures/europeandasiap +0.34 (n=7). Size-weighted mean 0.48; offset ratio 0.90 (1 = segment waves line up, 0 = they cancel); average wave +15.9%; segment-profit change correlation -0.07. Worst total segment revenue year -9.8% (2019); worst total segment profit year -11.1% (2019); share of revenue that shrank in 2020/2022/2023 0.17. Slowdown years with a segment moving against another: 2023.

Reading: Options, equities, futures and FX volumes rise and fall together (+0.48); North American equities fell 20% in 2023 while options rose 6%, but the shared driver is volatility. Hidden common driver: Every segment is transaction volume driven by market volatility. Worst free cash flow year since 2019 -61%, EPS growth +19.6% a year over 5 years; P/E 34.1 vs 25.8 own 10-year median (val_disc_avg +26%). Dropped: one hidden common driver (the trap).

### GOOGL, Alphabet Inc. (offset score 26.4; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | googleservices | googlecloud |
|---|---|---|
| 2018 | 130,524 | 5,838 |
| 2019 | 151,825 (+16%) | 8,918 (+53%) |
| 2020 | 168,635 (+11%) | 13,059 (+46%) |
| 2021 | 237,529 (+41%) | 19,206 (+47%) |
| 2022 | 253,528 (+7%) | 26,280 (+37%) |
| 2023 | 272,543 (+8%) | 33,088 (+26%) |
| 2024 | 304,930 (+12%) | 43,229 (+31%) |
| 2025 | 342,721 (+12%) | 58,705 (+36%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | googleservices | googlecloud |
|---|---|---|
| 2018 | 43,137 | -4,348 |
| 2019 | 48,999 | -4,645 |
| 2020 | 54,606 | -5,607 |
| 2021 | 88,132 | -2,282 |
| 2022 | 82,699 | -1,922 |
| 2023 | 95,858 | 1,716 |
| 2024 | 121,263 | 6,112 |
| 2025 | 139,404 | 13,910 |

Correlation of segment revenue growth: googleservices/googlecloud +0.51 (n=7). Size-weighted mean 0.51; offset ratio 1.00 (1 = segment waves line up, 0 = they cancel); average wave +10.5%; segment-profit change correlation 0.52. Worst total segment revenue year +9.0% (2022); worst total segment profit year -6.2% (2022); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: One dominant stream (ads) plus a fast-growing cloud; correlation +0.51. Hidden common driver: Advertising is 85% of revenue; cloud grows on its own trend. Worst free cash flow year since 2019 -10%, EPS growth n/a a year over 5 years; P/E 26.3 vs 23.6 own 10-year median (val_disc_avg +35%). Dropped: one hidden common driver (the trap).

### WRB, W. R. Berkley Corporation (offset score 23.6; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | insurancedomestic | reinsuranceandmonolin~ |
|---|---|---|
| 2018 | 6,208 | 849 |
| 2019 | 6,397 (+3%) | 878 (+3%) |
| 2020 | 6,479 (+1%) | 1,009 (+15%) |
| 2021 | 7,579 (+17%) | 1,204 (+19%) |
| 2022 | 8,749 (+18%) | 1,590 (+15%) |
| 2023 | 9,828 (+12%) | 1,615 (+2%) |
| 2024 | 11,182 (+14%) | 1,697 (+5%) |
| 2025 | 12,096 (+8%) | 1,782 (+5%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | insurancedomestic | reinsuranceandmonolin~ |
|---|---|---|
| 2018 | 717 | 201 |
| 2019 | 815 | 189 |
| 2020 | 668 | 206 |
| 2021 | 1,220 | 271 |
| 2022 | 1,435 | 337 |
| 2023 | 1,630 | 449 |
| 2024 | 1,942 | 467 |
| 2025 | 2,027 | 518 |

Correlation of segment revenue growth: insurancedomes/reinsuranceand +0.30 (n=7). Size-weighted mean 0.30; offset ratio 0.93 (1 = segment waves line up, 0 = they cancel); average wave +6.1%; segment-profit change correlation 0.35. Worst total segment revenue year +2.9% (2020); worst total segment profit year -13.0% (2020); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Two specialty P&C books, correlation +0.30; one weather. Hidden common driver: Both segments are specialty P&C; the same pricing cycle. Worst net income year since 2019 -22%, EPS growth -64.9% a year over 5 years; P/E history not verified (metrics artifact). Dropped: one hidden common driver (the trap).

### AME, AMETEK, Inc. (offset score 23.2; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax.

| year | electronicinstruments~ | electromechanicalgroup |
|---|---|---|
| 2018 | 3,029 | 1,817 |
| 2019 | 3,323 (+10%) | 1,836 (+1%) |
| 2020 | 2,990 (-10%) | 1,550 (-16%) |
| 2021 | 3,764 (+26%) | 1,783 (+15%) |
| 2022 | 4,229 (+12%) | 1,921 (+8%) |
| 2023 | 4,624 (+9%) | 1,973 (+3%) |
| 2024 | 4,660 (+1%) | 2,281 (+16%) |
| 2025 | 4,919 (+6%) | 2,482 (+9%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | electronicinstruments~ | electromechanicalgroup |
|---|---|---|
| 2018 | 782 | 364 |
| 2019 | 865 | 388 |
| 2020 | 771 | 325 |
| 2021 | 958 | 437 |
| 2022 | 1,090 | 504 |
| 2023 | 1,311 | 497 |
| 2024 | 1,428 | 457 |
| 2025 | 1,447 | 579 |

Correlation of segment revenue growth: electronicinst/electromechani +0.66 (n=7). Size-weighted mean 0.66; offset ratio 0.94 (1 = segment waves line up, 0 = they cancel); average wave +9.9%; segment-profit change correlation 0.29. Worst total segment revenue year -12.0% (2020); worst total segment profit year -12.6% (2020); share of revenue that shrank in 2020/2022/2023 0.33. Slowdown years with a segment moving against another: none.

Reading: Both fell in 2020 (-10% and -16%); correlation +0.66. Hidden common driver: Two segments of industrial instruments and motors on the same capital cycle. Worst free cash flow year since 2019 -13%, EPS growth +11.1% a year over 5 years; P/E 36.5 vs 27.9 own 10-year median (val_disc_avg +36%). Dropped: one hidden common driver (the trap).

### UHS, Universal Health Services, Inc. (offset score 18.7; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | acutecarehospitalserv~ | behavioralhealthservi~ |
|---|---|---|
| 2018 | 5,720 | 5,039 |
| 2019 | 6,165 (+8%) | 5,210 (+3%) |
| 2020 | 6,337 (+3%) | 5,209 (-0%) |
| 2021 | 7,108 (+12%) | 5,504 (+6%) |
| 2022 | 7,647 (+8%) | 5,730 (+4%) |
| 2023 | 8,081 (+6%) | 6,191 (+8%) |
| 2024 | 8,944 (+11%) | 6,873 (+11%) |
| 2025 | 9,926 (+11%) | 7,426 (+8%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | acutecarehospitalserv~ | behavioralhealthservi~ |
|---|---|---|
| 2018 | 509 | 754 |
| 2019 | 483 | 734 |
| 2020 | 470 | 852 |
| 2021 | 501 | 853 |
| 2022 | 178 | 800 |
| 2023 | 274 | 897 |

Correlation of segment revenue growth: acutecarehospi/behavioralheal +0.64 (n=7). Size-weighted mean 0.64; offset ratio 0.95 (1 = segment waves line up, 0 = they cancel); average wave +3.0%; segment-profit change correlation 0.66. Worst total segment revenue year +1.5% (2020); worst total segment profit year -27.8% (2022); share of revenue that shrank in 2020/2022/2023 0.15. Slowdown years with a segment moving against another: none.

Reading: Two hospital types moving together (+0.64); segment profit fell 28% in 2022 on labor costs. Hidden common driver: Acute and behavioral hospitals share payers (Medicare, Medicaid) and the same nurse labor market. Worst free cash flow year since 2019 -98%, EPS growth +15.9% a year over 5 years; P/E 7.2 vs 13.7 own 10-year median (val_disc_avg -32%). Dropped: one hidden common driver (the trap).

### ITW, Illinois Tool Works Inc. (offset score 16.8; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | automotiveoem | foodequipment | testandmeasurementand~ | welding | polymersandfluids | constructionproducts | specialtyproducts |
|---|---|---|---|---|---|---|---|
| 2018 | 3,338 | 2,214 | 2,171 | 1,691 | 1,724 | 1,700 | 1,951 |
| 2019 | 3,063 (-8%) | 2,188 (-1%) | 2,121 (-2%) | 1,638 (-3%) | 1,669 (-3%) | 1,625 (-4%) | 1,825 (-6%) |
| 2020 | 2,571 (-16%) | 1,739 (-21%) | 1,963 (-7%) | 1,384 (-16%) | 1,622 (-3%) | 1,652 (+2%) | 1,660 (-9%) |
| 2021 | 2,800 (+9%) | 2,078 (+19%) | 2,346 (+20%) | 1,650 (+19%) | 1,804 (+11%) | 1,945 (+18%) | 1,854 (+12%) |
| 2022 | 2,969 (+6%) | 2,444 (+18%) | 2,828 (+21%) | 1,894 (+15%) | 1,905 (+6%) | 2,113 (+9%) | 1,799 (-3%) |
| 2023 | 3,235 (+9%) | 2,622 (+7%) | 2,832 (+0%) | 1,902 (+0%) | 1,804 (-5%) | 2,033 (-4%) | 1,697 (-6%) |
| 2024 | 3,188 (-1%) | 2,647 (+1%) | 2,818 (-0%) | 1,851 (-3%) | 1,764 (-2%) | 1,909 (-6%) | 1,743 (+3%) |
| 2025 | 3,288 (+3%) | 2,699 (+2%) | 2,825 (+0%) | 1,890 (+2%) | 1,765 (+0%) | 1,820 (-5%) | 1,775 (+2%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | automotiveoem | foodequipment | testandmeasurementand~ | welding | polymersandfluids | constructionproducts | specialtyproducts |
|---|---|---|---|---|---|---|---|
| 2018 | 751 | 572 | 523 | 474 | 369 | 414 | 522 |
| 2019 | 659 | 578 | 542 | 453 | 381 | 383 | 472 |
| 2020 | 457 | 342 | 507 | 376 | 402 | 421 | 432 |
| 2021 | 545 | 469 | 643 | 490 | 457 | 530 | 504 |
| 2022 | 499 | 618 | 684 | 583 | 479 | 548 | 481 |
| 2023 | 561 | 713 | 686 | 605 | 482 | 578 | 449 |
| 2024 | 625 | 719 | 703 | 597 | 484 | 559 | 528 |
| 2025 | 693 | 753 | 694 | 621 | 493 | 550 | 553 |

Correlation of segment revenue growth: automotiveoem/foodequipment +0.90 (n=7); automotiveoem/testandmeasure +0.69 (n=7); automotiveoem/welding +0.83 (n=7); automotiveoem/polymersandflu +0.48 (n=7); automotiveoem/constructionpr +0.36 (n=7); automotiveoem/specialtyprodu +0.59 (n=7); foodequipment/testandmeasure +0.89 (n=7); foodequipment/welding +0.97 (n=7). Size-weighted mean 0.72; offset ratio 0.95 (1 = segment waves line up, 0 = they cancel); average wave +8.5%; segment-profit change correlation 0.51. Worst total segment revenue year -10.9% (2020); worst total segment profit year -15.3% (2020); share of revenue that shrank in 2020/2022/2023 0.46. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: All seven segments fell in 2020 (total -10.9%); correlation +0.72. Seven names, one weather. Hidden common driver: All seven segments sell to industrial and auto customers on the same capital-spending cycle. Worst free cash flow year since 2019 -14%, EPS growth +9.6% a year over 5 years; P/E 26.2 vs 21.9 own 10-year median (val_disc_avg +20%). Dropped: one hidden common driver (the trap).

### GS, The Goldman Sachs Group, Inc. (offset score 14.1; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenuesNetOfInterestExpense. Acquisition/divestiture years left out of growth: 2025:platformsolutions.

| year | globalbankingandmarke~ | assetandwealthmanagem~ | platformsolutions |
|---|---|---|---|
| 2020 | 30,469 | 13,757 | 334 |
| 2021 | 36,734 (+21%) | 21,965 (+60%) | 640 (+92%) |
| 2022 | 32,487 (-12%) | 13,376 (-39%) | 1,502 (+135%) |
| 2023 | 29,994 (-8%) | 14,202 (+4%) | 2,058 (+58%) |
| 2024 | 35,067 (+17%) | 16,316 (+15%) | 2,129 (+3%) |
| 2025 | 41,453 (+18%) | 16,679 (+2%) | 151 |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | globalbankingandmarke~ | assetandwealthmanagem~ | platformsolutions |
|---|---|---|---|
| 2020 | 7,860 | 2,193 | -594 |
| 2021 | 13,890 | 8,582 | -837 |
| 2022 | 11,830 | 1,092 | -1,661 |
| 2023 | 8,723 | 1,398 | -1,605 |
| 2024 | 11,275 | 3,775 | -774 |
| 2025 | 13,813 | 3,244 | 119 |

Correlation of segment revenue growth: globalbankinga/assetandwealth +0.75 (n=5); globalbankinga/platformsoluti -0.50 (n=4); assetandwealth/platformsoluti -0.35 (n=4). Size-weighted mean 0.63; offset ratio 0.93 (1 = segment waves line up, 0 = they cancel); average wave +19.4%; segment-profit change correlation 0.56. Worst total segment revenue year -20.2% (2022); worst total segment profit year -42.5% (2022); share of revenue that shrank in 2020/2022/2023 0.84. Slowdown years with a segment moving against another: 2023.

Reading: Both big segments fell in 2022 (-12% and -39%); total segment revenue -20%, profit -48%. Two names for one market cycle. Hidden common driver: Capital-markets activity: deal fees, trading and asset marks drive both Global Banking & Markets and Asset & Wealth Management. Worst net income year since 2019 -48%, EPS growth +15.6% a year over 5 years; P/E 14.7 vs 10.7 own 10-year median (val_disc_avg +37%). Dropped: one hidden common driver (the trap).

### DHR, Danaher Corporation (offset score 11.9; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2020:lifesciences, 2021:biotechnology.

| year | lifesciences | diagnostics | environmentalapplieds~ | biotechnology |
|---|---|---|---|---|
| 2018 | 6,471 | 6,258 | 4,320 |  |
| 2019 | 6,951 (+7%) | 6,561 (+5%) | 4,399 (+2%) |  |
| 2020 | 5,300 | 7,403 (+13%) | 4,305 (-2%) | 5,276 |
| 2021 | 6,388 (+21%) | 9,844 (+33%) |  (+8%) | 8,570 |
| 2022 | 7,036 (+10%) | 10,849 (+10%) |  | 8,758 (+2%) |
| 2023 | 7,141 (+1%) | 9,577 (-12%) |  | 7,172 (-18%) |
| 2024 | 7,329 (+3%) | 9,787 (+2%) |  | 6,759 (-6%) |
| 2025 | 7,334 (+0%) | 9,941 (+2%) |  | 7,293 (+8%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | lifesciences | diagnostics | environmentalapplieds~ | biotechnology |
|---|---|---|---|---|
| 2018 | 1,229 | 1,074 | 988 |  |
| 2019 | 1,401 | 1,134 | 1,052 |  |
| 2020 | 972 | 1,538 | 979 | 1,082 |
| 2021 | 1,293 | 2,313 |  | 3,074 |
| 2022 | 1,414 | 3,436 |  | 3,008 |
| 2023 | 1,209 | 2,406 |  | 1,909 |
| 2024 | 879 | 2,625 |  | 1,685 |
| 2025 | 520 | 2,650 |  | 1,864 |

Correlation of segment revenue growth: lifesciences/diagnostics +0.93 (n=6); lifesciences/biotechnology +0.20 (n=4); diagnostics/biotechnology +0.79 (n=4). Size-weighted mean 0.67; offset ratio 0.93 (1 = segment waves line up, 0 = they cancel); average wave +9.2%; segment-profit change correlation 0.43. Worst total segment revenue year -10.3% (2023); worst total segment profit year -29.7% (2023); share of revenue that shrank in 2020/2022/2023 0.38. Slowdown years with a segment moving against another: 2020,2023.

Reading: Biotechnology and diagnostics fell together in 2023 (-18% and -12%); correlation +0.67. One customer, three names. Hidden common driver: All segments sell to the same pharma, biotech and diagnostics labs. Worst free cash flow year since 2019 -22%, EPS growth n/a a year over 5 years; P/E 44.5 vs 31.8 own 10-year median (val_disc_avg +25%). Dropped: one hidden common driver (the trap).

### SCHW, The Charles Schwab Corporation (offset score -3.1; dropped: one hidden common driver (the trap))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2021.

| year | investorservices | advisorservices |
|---|---|---|
| 2018 | 7,321 | 2,811 |
| 2019 | 7,623 (+4%) | 3,098 (+10%) |
| 2020 | 8,608 (+13%) | 3,083 (-0%) |
| 2021 | 14,461 | 4,059 |
| 2022 | 15,846 (+8%) | 4,916 (+28%) |
| 2023 | 14,650 (-8%) | 4,187 (-15%) |
| 2024 | 15,558 (+6%) | 4,048 (-3%) |
| 2025 | 18,999 (+22%) | 4,922 (+22%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | investorservices | advisorservices |
|---|---|---|
| 2018 | 3,176 | 1,386 |
| 2019 | 3,339 | 1,509 |
| 2020 | 3,079 | 1,221 |
| 2021 | 6,172 | 1,541 |
| 2022 | 7,133 | 2,255 |
| 2023 | 5,211 | 1,167 |
| 2024 | 6,320 | 1,372 |
| 2025 | 9,321 | 2,138 |

Correlation of segment revenue growth: investorservic/advisorservice +0.64 (n=6). Size-weighted mean 0.64; offset ratio 0.96 (1 = segment waves line up, 0 = they cancel); average wave +9.8%; segment-profit change correlation 0.89. Worst total segment revenue year -9.3% (2023); worst total segment profit year -32.1% (2023); share of revenue that shrank in 2020/2022/2023 0.43. Slowdown years with a segment moving against another: none.

Reading: Investor services and advisor services fell together in 2023 (-7.5% and -14.8%; segment profit -32%); the split is by client type, not by weather. Hidden common driver: Both segments earn on the same client cash (sweep NII) and trading; 2023 cash sorting hit both. Worst net income year since 2019 -100%, EPS growth -70.8% a year over 5 years; P/E history not verified (metrics artifact). Dropped: one hidden common driver (the trap).

## Dropped: no segment moved against another in 2020/2022/2023 (8)

### FICO, Fair Isaac Corporation (offset score 63.9; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | scores | software |
|---|---|---|
| 2019 | 421 | 739 |
| 2020 | 529 (+25%) | 766 (+4%) |
| 2021 | 654 (+24%) | 662 (-14%) |
| 2022 | 707 (+8%) | 671 (+1%) |
| 2023 | 774 (+10%) | 740 (+10%) |
| 2024 | 920 (+19%) | 798 (+8%) |
| 2025 | 1,169 (+27%) | 822 (+3%) |
| 2026 | 1,652 (+41%) | 883 (+7%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | scores | software |
|---|---|---|
| 2019 | 361 | 126 |
| 2020 | 454 | 130 |
| 2021 | 564 | 107 |
| 2022 | 619 | 183 |
| 2023 | 681 | 241 |
| 2024 | 813 | 258 |
| 2025 | 1,026 | 248 |
| 2026 | 1,490 | 250 |

Correlation of segment revenue growth: scores/software -0.05 (n=7). Size-weighted mean -0.05; offset ratio 0.84 (1 = segment waves line up, 0 = they cancel); average wave +8.2%; segment-profit change correlation -0.41. Worst total segment revenue year +1.7% (2021); worst total segment profit year +13.9% (2021); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Software fell 14% in FY2021 while scores rose 24%, a real offset; scores are now 65% of revenue on price increases. Hidden common driver: Credit-score pricing power (and its regulatory challenge from FHFA and the credit bureaus) drives the dominant scores segment. Worst free cash flow year since 2019 -8%, EPS growth +22.1% a year over 5 years; P/E 17.4 vs 49.6 own 10-year median (val_disc_avg -62%). Dropped: no segment moved against another in 2020/2022/2023.

### MSCI, MSCI Inc. (offset score 63.8; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | index | analytics | sustainabilityandclim~ | privateassets |
|---|---|---|---|---|
| 2018 | 835 | 480 |  |  |
| 2019 | 921 (+10%) | 497 (+4%) | 91 | 49 |
| 2020 | 1,016 (+10%) | 514 (+3%) | 111 (+23%) | 54 (+9%) |
| 2021 | 1,252 (+23%) | 544 (+6%) | 166 (+49%) | 81 (+51%) |
| 2022 | 1,303 (+4%) | 576 (+6%) | 228 (+37%) |  (+73%) |
| 2023 | 1,452 (+11%) | 616 (+7%) | 288 (+26%) |  |
| 2024 | 1,596 (+10%) | 675 (+10%) | 327 (+14%) |  |
| 2025 | 1,787 (+12%) | 714 (+6%) | 354 (+8%) |  |

Segment profit, $M (msci:OperatingSegmentProfitability):

| year | index | analytics | sustainabilityandclim~ | privateassets |
|---|---|---|---|---|
| 2018 | 608 | 144 |  |  |
| 2019 | 670 | 152 | 22 | 6 |
| 2020 | 766 | 173 | 23 | 9 |
| 2021 | 951 | 199 | 30 | 17 |
| 2022 | 985 | 248 | 61 |  |
| 2023 | 1,107 | 275 | 92 |  |
| 2024 | 1,222 | 328 | 105 |  |
| 2025 | 1,366 | 343 | 128 |  |

Correlation of segment revenue growth: index/analytics +0.01 (n=7); index/sustainability +0.43 (n=6); analytics/sustainability -0.24 (n=6). Size-weighted mean 0.08; offset ratio 0.82 (1 = segment waves line up, 0 = they cancel); average wave +4.6%; segment-profit change correlation -0.13. Worst total segment revenue year +7.8% (2019); worst total segment profit year +9.4% (2019); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Every segment grew every year (index 4-23%, analytics 3-10%); low correlation (+0.08) from small wiggles. Steady, not offsetting. Hidden common driver: All segments sell to the same asset managers; index fees ride equity market levels. Worst free cash flow year since 2019 +5%, EPS growth +17.1% a year over 5 years; P/E 37.9 vs 37.1 own 10-year median (val_disc_avg -1%). Dropped: no segment moved against another in 2020/2022/2023.

### GL, Globe Life Inc. (offset score 60.8; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: gl:SegmentRevenuesExcludingRealizedInvestmentGainsLosses.

| year | life | health | investment |
|---|---|---|---|
| 2018 | 2,407 | 1,015 | 883 |
| 2019 | 2,518 (+5%) | 1,077 (+6%) | 910 (+3%) |
| 2020 | 2,673 (+6%) | 1,141 (+6%) | 927 (+2%) |
| 2021 | 2,894 (+8%) | 1,201 (+5%) | 957 (+3%) |
| 2022 | 3,028 (+5%) | 1,282 (+7%) | 992 (+4%) |
| 2023 | 3,137 (+4%) | 1,319 (+3%) | 1,057 (+7%) |
| 2024 | 3,261 (+4%) | 1,405 (+7%) | 1,136 (+7%) |
| 2025 | 3,363 (+3%) | 1,527 (+9%) | 1,130 (-0%) |

Segment profit, $M (gl:SegmentProfitLoss, us-gaap:GrossProfit):

| year | life | health | investment |
|---|---|---|---|
| 2018 | 652 | 236 | 245 |
| 2019 | 703 | 244 | 258 |
| 2020 | 675 | 272 | 244 |
| 2021 | 1,162 | 352 | 97 |
| 2022 | 1,130 | 377 | 105 |
| 2023 | 1,193 | 378 | 130 |
| 2024 | 1,353 | 372 | 164 |
| 2025 | 1,509 | 390 | 138 |

Correlation of segment revenue growth: life/health -0.21 (n=7); life/investment -0.18 (n=7); health/investment -0.61 (n=7). Size-weighted mean -0.26; offset ratio 0.52 (1 = segment waves line up, 0 = they cancel); average wave +1.6%; segment-profit change correlation -0.44. Worst total segment revenue year +3.8% (2025); worst total segment profit year -2.1% (2021); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Every segment grew 3-8% every year; the low correlations come from tiny wiggles (average wave 1.6%). Steady, but steady as one stream, not as offsetting streams. Hidden common driver: Life and health are sold by the same agency channels to the same lower-middle-income US households; the investment segment is the float. Worst net income year since 2019 -13%, EPS growth +15.6% a year over 5 years; P/E 10.1 vs 11.6 own 10-year median (val_disc_avg -13%). Dropped: no segment moved against another in 2020/2022/2023.

### CB, Chubb Limited (offset score 60.8; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:PremiumsEarnedNet. Acquisition/divestiture years left out of growth: 2022:life, 2023:life.

| year | nacommercial | napersonal | naagriculture | overseasgeneral | globalreinsurance | life |
|---|---|---|---|---|---|---|
| 2018 | 12,402 | 4,593 | 1,569 | 8,612 | 670 | 2,218 |
| 2019 | 12,922 (+4%) | 4,694 (+2%) | 1,795 (+14%) | 8,882 (+3%) | 654 (-2%) | 2,343 (+6%) |
| 2020 | 13,964 (+8%) | 4,866 (+4%) | 1,822 (+2%) | 9,285 (+5%) | 698 (+7%) | 2,482 (+6%) |
| 2021 | 15,461 (+11%) | 4,915 (+1%) | 2,338 (+28%) | 10,441 (+12%) | 798 (+14%) | 2,339 (-3%) |
| 2022 | 17,107 (+11%) | 5,180 (+5%) | 2,838 (+21%) | 10,803 (+3%) | 922 (+16%) | 3,510 |
| 2023 | 18,416 (+8%) | 5,536 (+7%) | 3,169 (+12%) | 12,231 (+13%) | 962 (+4%) | 5,398 |
| 2024 | 20,008 (+9%) | 6,188 (+12%) | 2,705 (-15%) | 13,400 (+10%) | 1,272 (+32%) | 6,273 (+16%) |
| 2025 | 20,381 (+2%) | 6,763 (+9%) | 2,919 (+8%) | 14,374 (+7%) | 1,353 (+6%) | 7,224 (+15%) |

Segment profit, $M (cb:SegmentUnderwritingIncomeLossandNetInvestmentIncomeLoss):

| year | nacommercial | napersonal | naagriculture | overseasgeneral | globalreinsurance | life |
|---|---|---|---|---|---|---|
| 2018 | 3,665 | 378 | 383 | 1,401 | 277 | 308 |
| 2019 | 3,942 | 660 | 90 | 1,273 | 376 | 366 |
| 2020 | 2,925 | 679 | 148 | 904 | 357 | 401 |
| 2021 | 4,359 | 955 | 256 | 1,970 | 262 | 427 |
| 2022 | 5,083 | 915 | 174 | 2,230 | 256 | 661 |
| 2023 | 6,390 | 914 | 183 | 2,649 | 445 | 1,049 |
| 2024 | 6,737 | 1,437 | 412 | 2,858 | 433 | 1,098 |
| 2025 | 7,559 | 1,048 | 577 | 3,167 | 634 | 1,242 |

Correlation of segment revenue growth: nacommercial/napersonal -0.25 (n=7); nacommercial/naagriculture +0.22 (n=7); nacommercial/overseasgenera +0.25 (n=7); nacommercial/globalreinsura +0.53 (n=7); nacommercial/life -0.53 (n=5); napersonal/naagriculture -0.75 (n=7); napersonal/overseasgenera +0.18 (n=7); napersonal/globalreinsura +0.55 (n=7). Size-weighted mean 0.03; offset ratio 0.51 (1 = segment waves line up, 0 = they cancel); average wave +3.9%; segment-profit change correlation 0.06. Worst total segment revenue year +4.1% (2019); worst total segment profit year -19.3% (2020); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Premium growth never fell below 4% a year and segment growth barely correlates (+0.03), but that is mostly six P&C books growing at different speeds; segment profit fell 19% in 2020 on COVID and catastrophe losses. Hidden common driver: The P&C pricing and catastrophe cycle runs through every P&C segment (about 85% of premiums); Asian life insurance is the real diversifier. Worst net income year since 2019 -38%, EPS growth +26.9% a year over 5 years; P/E 13.7 vs 13.0 own 10-year median (val_disc_avg +6%). Dropped: no segment moved against another in 2020/2022/2023.

### BR, Broadridge Financial Solutions, Inc. (offset score 54.6; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | investorcommunication~ | globaltechnologyandop~ |
|---|---|---|
| 2019 | 3,468 | 996 |
| 2020 | 3,461 (+1%) | 1,107 (+18%) |
| 2021 | 3,820 (+11%) | 1,174 (+7%) |
| 2022 | 4,257 (+11%) | 1,452 (+24%) |
| 2023 | 4,536 (+7%) | 1,525 (+5%) |
| 2024 | 4,858 (+7%) | 1,649 (+8%) |
| 2025 | 5,113 (+5%) | 1,776 (+8%) |
| 2026 | 5,561 (+9%) | 1,916 (+8%) |

Segment profit: not tagged by segment in a single-axis XBRL context (not verified).

Correlation of segment revenue growth: investorcommun/globaltechnolo +0.01 (n=7). Size-weighted mean 0.01; offset ratio 0.77 (1 = segment waves line up, 0 = they cancel); average wave +3.9%; segment-profit change correlation n/a. Worst total segment revenue year +4.5% (2020); worst total segment profit year n/a (n/a); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Investor communications and global technology & operations both grew every year; correlation +0.01 from small wiggles. Steady, not offsetting. Hidden common driver: Both segments are sold to the same brokers and fund companies. Worst free cash flow year since 2019 -31%, EPS growth +15.6% a year over 5 years; P/E 18.6 vs 28.8 own 10-year median (val_disc_avg -29%). Dropped: no segment moved against another in 2020/2022/2023.

### CVS, CVS Health Corporation (offset score 50.7; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2019.

| year | pharmacyservices | retaillongtermcare | healthcarebenefits | healthservices | pharmacyandconsumerhe~ |
|---|---|---|---|---|---|
| 2018 | 134,736 | 83,989 | 8,962 |  |  |
| 2019 | 141,491 | 86,608 | 69,604 |  |  |
| 2020 | 141,938 (+0%) | 91,198 (+5%) | 75,467 (+8%) |  |  |
| 2021 |  (+8%) |  (+10%) | 82,119 (+9%) | 153,892 | 101,620 |
| 2022 |  |  | 91,350 (+11%) | 169,576 (+10%) | 108,596 (+7%) |
| 2023 |  |  | 105,646 (+16%) | 186,843 (+10%) | 116,763 (+8%) |
| 2024 |  |  | 130,665 (+24%) | 173,605 (-7%) | 124,500 (+7%) |
| 2025 |  |  | 143,354 (+10%) | 190,425 (+10%) | 139,367 (+12%) |

Segment profit, $M (cvs:AdjustedOperatingIncomeLoss):

| year | pharmacyservices | retaillongtermcare | healthcarebenefits | healthservices | pharmacyandconsumerhe~ |
|---|---|---|---|---|---|
| 2018 | 4,955 | 7,403 | 528 |  |  |
| 2019 | 5,129 | 6,705 | 5,202 |  |  |
| 2020 | 5,688 | 6,146 | 6,188 |  |  |
| 2021 |  |  | 5,110 | 6,492 | 7,260 |
| 2022 |  |  | 6,338 | 6,781 | 6,531 |
| 2023 |  |  | 5,577 | 7,312 | 5,963 |
| 2024 |  |  | 307 | 7,243 | 5,774 |
| 2025 |  |  | 2,939 | 7,151 | 6,040 |

Correlation of segment revenue growth: healthcarebene/healthservices -0.91 (n=4); healthcarebene/pharmacyandcon -0.61 (n=4); healthservices/pharmacyandcon +0.41 (n=4). Size-weighted mean -0.28; offset ratio 0.45 (1 = segment waves line up, 0 = they cancel); average wave +5.3%; segment-profit change correlation -0.18. Worst total segment revenue year +3.7% (2020); worst total segment profit year -29.3% (2024); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Health services fell 7% in 2024 while Aetna grew 24%, so revenue held, but segment profit fell 29% in 2024 on Aetna's medical costs; the offsets protect revenue, not profit. Hidden common driver: Drug pricing and medical cost trend run through the PBM, the insurer and the pharmacy at once. Worst free cash flow year since 2019 -39%, EPS growth -23.9% a year over 5 years; P/E 58.9 vs 11.7 own 10-year median (val_disc_avg +216%). Dropped: no segment moved against another in 2020/2022/2023.

### CI, The Cigna Group (offset score 41.6; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: ci:SegmentRevenues. Acquisition/divestiture years left out of growth: 2019.

| year | evernorth | usmedical | cignahealthcare |
|---|---|---|---|
| 2018 | 6,606 | 32,791 |  |
| 2019 | 96,447 |  | 39,089 |
| 2020 | 116,130 (+20%) |  | 41,135 (+5%) |
| 2021 | 131,912 (+14%) |  | 44,643 (+9%) |
| 2022 | 140,335 (+6%) |  | 45,037 (+1%) |
| 2023 | 153,499 (+9%) |  | 51,205 (+14%) |
| 2024 | 202,155 (+32%) |  | 52,914 (+3%) |
| 2025 | 234,953 (+16%) |  | 47,163 (-11%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | evernorth | usmedical | cignahealthcare |
|---|---|---|---|
| 2018 | 329 | 3,342 |  |
| 2019 | 3,983 |  | 4,071 |
| 2020 | 3,684 |  | 4,291 |
| 2021 | 3,908 |  | 3,804 |
| 2022 | 4,421 |  | 3,470 |
| 2023 | 4,768 |  | 2,664 |
| 2024 | 3,929 |  | 3,315 |
| 2025 | 5,826 |  | 4,344 |

Correlation of segment revenue growth: evernorth/cignahealthcar -0.14 (n=6). Size-weighted mean -0.14; offset ratio 0.88 (1 = segment waves line up, 0 = they cancel); average wave +7.0%; segment-profit change correlation 0.21. Worst total segment revenue year +5.0% (2022); worst total segment profit year -5.8% (2023); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Cigna Healthcare fell 11% in 2025 (sale of Medicare business) while Evernorth grew 16%; segment revenue never fell after the 2019 merger, but one segment is most of the company. Hidden common driver: Drug-pricing policy (PBM reform) hits Evernorth; employer health costs hit Cigna Healthcare; Evernorth is now 83% of revenue. Worst free cash flow year since 2019 -31%, EPS growth -0.8% a year over 5 years; P/E 12.6 vs 15.2 own 10-year median (val_disc_avg -12%). Dropped: no segment moved against another in 2020/2022/2023.

### PNC, The PNC Financial Services Group, Inc. (offset score 40.3; dropped: no segment moved against another in 2020/2022/2023)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:InterestIncomeExpenseNet+us-gaap:NoninterestIncome, us-gaap:Revenues.

| year | retailbanking | corporateinstitutiona~ | assetmanagementgroup |
|---|---|---|---|
| 2018 | 7,750 | 5,957 | 1,179 |
| 2019 | 8,168 (+5%) | 6,174 (+4%) | 1,279 (+8%) |
| 2020 | 8,128 (-0%) | 7,061 (+14%) | 1,211 (-5%) |
| 2021 | 9,002 (+11%) | 8,309 (+18%) | 1,463 (+21%) |
| 2022 | 10,507 (+17%) | 8,800 (+6%) | 1,544 (+6%) |
| 2023 | 12,939 (+23%) | 9,269 (+5%) | 1,419 (-6%) |
| 2024 | 14,547 (+12%) | 10,229 (+10%) | 1,562 (+10%) |
| 2025 | 14,863 (+2%) | 11,228 (+10%) | 1,710 (+9%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperations, us-gaap:NetIncomeLoss):

| year | retailbanking | corporateinstitutiona~ | assetmanagementgroup |
|---|---|---|---|
| 2018 | 1,064 | 2,508 | 202 |
| 2019 | 1,213 | 2,448 | 262 |
| 2020 | 844 | 1,674 | 255 |
| 2021 | 1,648 | 4,324 | 406 |
| 2022 | 1,974 | 3,870 | 330 |
| 2023 | 3,779 | 4,049 | 234 |
| 2024 | 5,063 | 4,729 | 376 |
| 2025 | 5,045 | 5,446 | 472 |

Correlation of segment revenue growth: retailbanking/corporateinsti -0.38 (n=7); retailbanking/assetmanagemen -0.12 (n=7); corporateinsti/assetmanagemen +0.38 (n=7). Size-weighted mean -0.27; offset ratio 0.64 (1 = segment waves line up, 0 = they cancel); average wave +6.0%; segment-profit change correlation 0.35. Worst total segment revenue year +4.9% (2019); worst total segment profit year -29.3% (2020); share of revenue that shrank in 2020/2022/2023 0.23. Slowdown years with a segment moving against another: none.

Reading: Corporate & institutional banking rose 14% in 2020 while retail and asset management fell, and segment revenue never fell; profit fell 29% in 2020 on reserves. A smaller, less diversified JPM. Hidden common driver: Rates and US middle-market credit; segment profit changes correlate +0.35. Worst net income year since 2019 -24%, EPS growth -0.0% a year over 5 years; P/E 12.5 vs 10.1 own 10-year median (val_disc_avg +25%). Dropped: no segment moved against another in 2020/2022/2023.

## Dropped: its only slowdown offset (2020) came from industrial segments sold in 2022 (1)

### ROP, Roper Technologies, Inc. (offset score 57.0; dropped: its only slowdown offset (2020) came from industrial segments sold in 2022)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | applicationsoftware | networksoftwareandsys~ | measurementandanalyti~ | processtechnologies | technologyenabledprod~ |
|---|---|---|---|---|---|
| 2018 | 1,453 | 1,345 | 1,706 | 688 |  |
| 2019 | 1,588 (+9%) | 1,004 (+14%) | 1,544 (-6%) | 591 (-5%) |  |
| 2020 | 1,786 (+13%) | 1,069 (+17%) |  (-8%) |  (-23%) | 1,167 |
| 2021 | 2,367 (+33%) | 1,224 (+14%) |  |  | 1,243 (+7%) |
| 2022 | 2,640 (+12%) | 1,378 (+13%) |  |  | 1,354 (+9%) |
| 2023 | 3,187 (+21%) | 1,439 (+4%) |  |  | 1,552 (+15%) |
| 2024 | 3,868 (+21%) | 1,476 (+3%) |  |  | 1,695 (+9%) |
| 2025 | 4,483 (+16%) | 1,601 (+8%) |  |  | 1,819 (+7%) |

Segment profit, $M (rop:SegmentOperatingProfit):

| year | applicationsoftware | networksoftwareandsys~ | measurementandanalyti~ | processtechnologies | technologyenabledprod~ |
|---|---|---|---|---|---|
| 2018 | 358 | 484 | 524 | 234 |  |
| 2019 | 405 | 389 | 491 | 211 |  |
| 2020 | 468 | 383 |  |  | 412 |
| 2021 | 633 | 477 |  |  | 416 |
| 2022 | 714 | 571 |  |  | 449 |
| 2023 | 821 | 632 |  |  | 519 |
| 2024 | 1,023 | 666 |  |  | 574 |
| 2025 | 1,203 | 696 |  |  | 627 |

Correlation of segment revenue growth: applicationsof/networksoftwar -0.21 (n=7); applicationsof/technologyenab -0.19 (n=5); networksoftwar/technologyenab -0.61 (n=5). Size-weighted mean -0.29; offset ratio 0.60 (1 = segment waves line up, 0 = they cancel); average wave +5.1%; segment-profit change correlation -0.29. Worst total segment revenue year +2.7% (2020); worst total segment profit year -2.4% (2020); share of revenue that shrank in 2020/2022/2023 0.15. Slowdown years with a segment moving against another: 2020.

Reading: Segment revenue never fell after the 2022 exit from industrial businesses; offsets are small and timing-driven. Hidden common driver: Vertical software sold to niche markets; growth largely bought (Vertafore, Frontline, Procare, CentralReach). Worst free cash flow year since 2019 -64%, EPS growth +9.6% a year over 5 years; P/E 30.4 vs 29.5 own 10-year median (val_disc_avg -13%). Dropped: its only slowdown offset (2020) came from industrial segments sold in 2022.

## Dropped: segment waves line up or are too small (offset < 0.30) (19)

### FISV, Fiserv, Inc. (offset score 51.6; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2019, 2020.

| year | financial | payments | merchant |
|---|---|---|---|
| 2018 | 5,834 | 2,408 |  |
| 2019 | 5,884 | 3,909 | 5,142 |
| 2020 | 5,802 | 5,504 | 11,044 |
| 2021 | 6,044 (+4%) | 5,833 (+6%) | 12,958 (+17%) |
| 2022 | 8,681 (+5%) |  (+7%) | 7,883 (+13%) |
| 2023 | 9,101 (+5%) |  | 8,722 (+11%) |
| 2024 | 9,477 (+4%) |  | 9,631 (+10%) |
| 2025 | 9,664 (+2%) |  | 10,140 (+5%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | financial | payments | merchant |
|---|---|---|---|
| 2018 | 851 | 1,081 |  |
| 2019 | 885 | 1,658 | 764 |
| 2020 | 992 | 2,361 | 1,427 |
| 2021 | 1,081 | 2,557 | 1,996 |
| 2022 | 3,806 |  | 2,441 |
| 2023 | 4,178 |  | 2,974 |
| 2024 | 4,485 |  | 3,561 |
| 2025 | 4,380 |  | 3,502 |

Correlation of segment revenue growth: merchant/financial +0.66 (n=5). Size-weighted mean 0.66; offset ratio 0.99 (1 = segment waves line up, 0 = they cancel); average wave +2.6%; segment-profit change correlation 0.82. Worst total segment revenue year +3.6% (2025); worst total segment profit year -2.0% (2025); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: After skipping the 2019-20 merger years, five clean years show the two segments moving together (+0.66). Hidden common driver: Merchant acquiring (consumer spending, Clover) vs bank processing; the First Data merger (2019) dominates the history. Worst free cash flow year since 2019 -15%, EPS growth +35.2% a year over 5 years; P/E 9.2 vs 26.3 own 10-year median (val_disc_avg -63%). Dropped: segment waves line up or are too small (offset < 0.30).

### MRSH, Marsh & McLennan Companies, Inc. (offset score 49.5; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax.

| year | riskandinsuranceservi~ | consulting |
|---|---|---|
| 2018 | 8,228 | 6,779 |
| 2019 | 9,599 (+17%) | 7,143 (+5%) |
| 2020 | 10,337 (+8%) | 6,976 (-2%) |
| 2021 | 12,085 (+17%) | 7,789 (+12%) |
| 2022 | 12,645 (+5%) | 8,139 (+4%) |
| 2023 | 14,089 (+11%) | 8,709 (+7%) |
| 2024 | 15,395 (+9%) | 9,133 (+5%) |
| 2025 | 17,265 (+12%) | 9,794 (+7%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | riskandinsuranceservi~ | consulting |
|---|---|---|
| 2018 | 1,864 | 1,099 |
| 2019 | 1,833 | 1,210 |
| 2020 | 2,346 | 994 |
| 2021 | 3,080 | 1,504 |
| 2022 | 3,089 | 1,553 |
| 2023 | 3,945 | 1,666 |
| 2024 | 4,365 | 1,770 |
| 2025 | 4,636 | 1,896 |

Correlation of segment revenue growth: riskandinsuran/consulting +0.63 (n=7). Size-weighted mean 0.63; offset ratio 1.00 (1 = segment waves line up, 0 = they cancel); average wave +3.7%; segment-profit change correlation 0.28. Worst total segment revenue year +3.4% (2020); worst total segment profit year +1.3% (2022); share of revenue that shrank in 2020/2022/2023 0.14. Slowdown years with a segment moving against another: 2020.

Reading: Consulting fell 2% in 2020 while risk & insurance rose 8%, but the two move together most years (+0.63). Hidden common driver: Risk & insurance services rides premium rates; consulting rides corporate budgets; both ride the same corporate clients. Worst free cash flow year since 2019 -8%, EPS growth +16.4% a year over 5 years; P/E 23.5 vs 24.7 own 10-year median (val_disc_avg -8%). Dropped: segment waves line up or are too small (offset < 0.30).

### TRV, The Travelers Companies, Inc. (offset score 49.3; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:PremiumsEarnedNet.

| year | businessandinternatio~ | bondandspecialtyinsur~ | personalinsurance |
|---|---|---|---|
| 2018 | 14,722 | 2,420 | 9,917 |
| 2019 | 15,300 (+4%) | 2,565 (+6%) | 10,407 (+5%) |
| 2020 | 15,294 (-0%) | 2,823 (+10%) | 10,927 (+5%) |
| 2021 | 15,734 (+3%) | 3,138 (+11%) | 11,983 (+10%) |
| 2022 | 17,095 (+9%) | 3,418 (+9%) | 13,250 (+11%) |
| 2023 | 19,144 (+12%) | 3,655 (+7%) | 14,962 (+13%) |
| 2024 | 21,345 (+11%) | 3,958 (+8%) | 16,638 (+11%) |
| 2025 | 22,412 (+5%) | 4,107 (+4%) | 17,395 (+5%) |

Segment profit, $M (trv:OperatingIncomeLossNetOfTax):

| year | businessandinternatio~ | bondandspecialtyinsur~ | personalinsurance |
|---|---|---|---|
| 2018 | 1,638 | 793 | 297 |
| 2019 | 1,392 | 618 | 824 |
| 2020 | 1,309 | 473 | 1,195 |
| 2021 | 2,385 | 668 | 760 |
| 2022 | 2,531 | 908 | -140 |
| 2023 | 2,583 | 942 | -128 |
| 2024 | 3,306 | 815 | 1,249 |
| 2025 | 3,695 | 950 | 2,053 |

Correlation of segment revenue growth: businessandint/bondandspecial -0.23 (n=7); businessandint/personalinsura +0.80 (n=7); bondandspecial/personalinsura +0.35 (n=7). Size-weighted mean 0.56; offset ratio 0.93 (1 = segment waves line up, 0 = they cancel); average wave +3.5%; segment-profit change correlation -0.08. Worst total segment revenue year +2.7% (2020); worst total segment profit year -13.5% (2022); share of revenue that shrank in 2020/2022/2023 0.18. Slowdown years with a segment moving against another: none.

Reading: Premiums in all three segments rose every year; the segments differ in timing, not direction (+0.56 correlation); after-tax segment income fell 14% in its worst year. Hidden common driver: US loss-cost inflation and catastrophes hit business, specialty and personal insurance together. Worst net income year since 2019 -22%, EPS growth +21.1% a year over 5 years; P/E 12.8 vs 11.4 own 10-year median (val_disc_avg +12%). Dropped: segment waves line up or are too small (offset < 0.30).

### MSFT, Microsoft Corporation (offset score 48.6; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | productivityandbusine~ | intelligentcloud | morepersonalcomputing |
|---|---|---|---|
| 2019 | 41,160 | 38,985 | 45,698 |
| 2020 | 46,398 (+13%) | 48,366 (+24%) | 48,251 (+6%) |
| 2021 | 53,915 (+16%) | 59,728 (+24%) | 54,445 (+12%) |
| 2022 | 63,364 (+18%) | 74,965 (+26%) | 59,941 (+10%) |
| 2023 | 94,151 (+9%) | 72,944 (+17%) | 44,820 (-9%) |
| 2024 | 106,820 (+13%) | 87,464 (+20%) | 50,838 (+13%) |
| 2025 | 120,810 (+13%) | 106,265 (+21%) | 54,649 (+7%) |
| 2026 | 139,996 (+16%) | 137,791 (+30%) | 54,052 (-1%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | productivityandbusine~ | intelligentcloud | morepersonalcomputing |
|---|---|---|---|
| 2019 | 16,219 | 13,920 | 12,820 |
| 2020 | 18,724 | 18,324 | 15,911 |
| 2021 | 24,351 | 26,471 | 19,094 |
| 2022 | 29,690 | 33,203 | 20,490 |
| 2023 | 50,074 | 28,411 | 10,038 |
| 2024 | 59,661 | 37,813 | 11,959 |
| 2025 | 69,773 | 44,589 | 14,166 |
| 2026 | 83,879 | 56,972 | 14,386 |

Correlation of segment revenue growth: productivityan/intelligentclo +0.79 (n=7); productivityan/morepersonalco +0.60 (n=7); intelligentclo/morepersonalco +0.15 (n=7). Size-weighted mean 0.55; offset ratio 0.87 (1 = segment waves line up, 0 = they cancel); average wave +4.1%; segment-profit change correlation 0.33. Worst total segment revenue year +6.9% (2023); worst total segment profit year +6.2% (2023); share of revenue that shrank in 2020/2022/2023 0.10. Slowdown years with a segment moving against another: 2023.

Reading: More personal computing fell 9% in 2023 while the other two grew 9-17%; total never below +6.9%. Strong, but one customer (enterprise IT) and correlation +0.55. Hidden common driver: Enterprise IT budgets run through all three; PCs are the cyclical one. Worst free cash flow year since 2019 -9%, EPS growth +17.4% a year over 5 years; P/E 28.2 vs 32.9 own 10-year median (val_disc_avg +17%). Dropped: segment waves line up or are too small (offset < 0.30).

### CMCSA, Comcast Corporation (offset score 47.9; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2019:skylimited.

| year | cablecommunications | cablenetworks | broadcasttelevision | filmedentertainment | themeparks | skylimited | media | studios | residentialconnectivi~ | businessservicesconne~ |
|---|---|---|---|---|---|---|---|---|---|---|
| 2018 | 56,033 | 11,773 | 11,439 | 7,152 | 5,683 | 4,587 |  |  |  |  |
| 2019 | 58,082 (+4%) |  (-2%) |  (-10%) |  (-9%) | 6,213 (+4%) | 19,219 | 19,947 | 9,352 |  |  |
| 2020 | 60,051 (+3%) |  |  |  |  (-66%) | 18,594 (-3%) |  (-5%) |  (-13%) |  |  |
| 2021 | 64,328 (+7%) |  |  |  |  | 20,285 (+9%) |  |  |  |  |
| 2022 |  (+3%) |  |  |  | 7,541 |  (-12%) | 26,719 | 12,257 | 72,386 | 8,819 |
| 2023 |  |  |  |  | 8,947 (+19%) |  | 25,355 (-5%) | 11,625 (-5%) | 71,946 (-1%) | 9,255 (+5%) |
| 2024 |  |  |  |  | 8,617 (-4%) |  | 28,148 (+11%) | 11,092 (-5%) | 71,574 (-1%) | 9,701 (+5%) |
| 2025 |  |  |  |  | 9,836 (+14%) |  | 27,090 (-4%) | 11,286 (+2%) | 70,704 (-1%) | 10,237 (+6%) |

Segment profit, $M (cmcsa:AdjustedEBITDA):

| year | cablecommunications | cablenetworks | broadcasttelevision | filmedentertainment | themeparks | skylimited | media | studios | residentialconnectivi~ | businessservicesconne~ |
|---|---|---|---|---|---|---|---|---|---|---|
| 2018 | 21,681 | 4,428 | 1,657 | 734 | 2,455 | 692 |  |  |  |  |
| 2019 | 23,266 |  |  |  | 2,498 | 3,099 | 5,834 | 1,058 |  |  |
| 2020 | 25,270 |  |  |  |  | 1,954 |  |  |  |  |
| 2021 | 28,097 |  |  |  |  | 2,359 |  |  |  |  |
| 2022 |  |  |  |  | 2,683 |  | 3,598 | 961 | 26,111 | 5,060 |
| 2023 |  |  |  |  | 3,345 |  | 2,955 | 1,269 | 26,948 | 5,291 |
| 2024 |  |  |  |  | 2,949 |  | 3,130 | 1,404 | 27,338 | 5,500 |
| 2025 |  |  |  |  | 3,080 |  | 3,196 | 1,099 | 26,653 | 5,725 |

Correlation of segment revenue growth: themeparks/media +0.13 (n=4); themeparks/studios +0.86 (n=4); media/studios +0.14 (n=4). Size-weighted mean 0.25; offset ratio 0.90 (1 = segment waves line up, 0 = they cancel); average wave +3.5%; segment-profit change correlation -0.16. Worst total segment revenue year -4.4% (2020); worst total segment profit year -6.7% (2020); share of revenue that shrank in 2020/2022/2023 0.53. Slowdown years with a segment moving against another: 2020,2022.

Reading: Theme parks fell 66% in 2020 while broadband held; segment revenue fell 4.4% in its worst year; the 2022 reorganization and Sky make clean pairs scarce. Hidden common driver: Broadband subscriber losses (fiber and wireless competition) are a structural decline in the biggest segment. Worst free cash flow year since 2019 -21%, EPS growth +18.8% a year over 5 years; P/E 4.5 vs 11.0 own 10-year median (val_disc_avg -48%). Dropped: segment waves line up or are too small (offset < 0.30).

### TDY, Teledyne Technologies Incorporated (offset score 42.6; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2021:digitalimaging, 2022:digitalimaging.

| year | instrumentation | digitalimaging | aerospaceanddefenseel~ | engineeredsystems |
|---|---|---|---|---|
| 2018 | 1,021 | 875 | 640 | 365 |
| 2019 | 1,105 (+8%) | 993 (+13%) | 690 (+8%) | 376 (+3%) |
| 2020 | 1,094 (-1%) | 986 (-1%) | 589 (-15%) | 416 (+11%) |
| 2021 | 1,167 (+7%) | 2,413 | 629 (+7%) | 406 (-3%) |
| 2022 | 1,254 (+7%) | 3,111 | 682 (+9%) | 411 (+1%) |
| 2023 | 1,326 (+6%) | 3,144 (+1%) | 726 (+6%) | 439 (+7%) |
| 2024 | 1,383 (+4%) | 3,071 (-2%) | 777 (+7%) | 440 (+0%) |
| 2025 | 1,457 (+5%) | 3,164 (+3%) | 1,059 (+36%) | 436 (-1%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | instrumentation | digitalimaging | aerospaceanddefenseel~ | engineeredsystems |
|---|---|---|---|---|
| 2018 | 147 | 156 | 132 | 38 |
| 2019 | 200 | 176 | 143 | 36 |
| 2020 | 213 | 193 | 81 | 50 |
| 2021 | 254 | 326 | 133 | 49 |
| 2022 | 295 | 519 | 184 | 39 |
| 2023 | 338 | 517 | 200 | 45 |
| 2024 | 370 | 442 | 222 | 33 |
| 2025 | 400 | 528 | 262 | 47 |

Correlation of segment revenue growth: instrumentatio/digitalimaging +0.69 (n=5); instrumentatio/aerospaceandde +0.53 (n=7); instrumentatio/engineeredsyst -0.66 (n=7); digitalimaging/aerospaceandde +0.20 (n=5); digitalimaging/engineeredsyst -0.19 (n=5); aerospaceandde/engineeredsyst -0.69 (n=7). Size-weighted mean 0.27; offset ratio 0.83 (1 = segment waves line up, 0 = they cancel); average wave +4.5%; segment-profit change correlation 0.08. Worst total segment revenue year -2.4% (2020); worst total segment profit year -3.6% (2020); share of revenue that shrank in 2020/2022/2023 0.29. Slowdown years with a segment moving against another: 2020.

Reading: Segments move together (+0.27); FLIR (2021) dominates growth; segment profit never fell more than 4%. Hidden common driver: Industrial and defense electronics with a common instrument-buyer base. Worst free cash flow year since 2019 -45%, EPS growth +12.2% a year over 5 years; P/E 32.3 vs 27.4 own 10-year median (val_disc_avg +13%). Dropped: segment waves line up or are too small (offset < 0.30).

### DIS, The Walt Disney Company (offset score 42.1; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | disneymediaandenterta~ | disneyparksexperience~ | entertainment | sports | experiences |
|---|---|---|---|---|---|
| 2019 | 42,821 | 26,786 |  |  |  |
| 2020 | 48,350 (+13%) | 17,038 (-36%) |  |  |  |
| 2021 |  (+5%) |  (-3%) | 36,489 | 15,960 | 15,961 |
| 2022 |  |  | 39,569 (+8%) | 17,270 (+8%) | 28,085 (+76%) |
| 2023 |  |  | 40,635 (+3%) | 17,111 (-1%) | 32,549 (+16%) |
| 2024 |  |  | 41,186 (+1%) | 17,619 (+3%) | 34,151 (+5%) |
| 2025 |  |  | 42,466 (+3%) | 17,672 (+0%) | 36,156 (+6%) |
| 2026 |  |  | 46,562 (+10%) | 18,632 (+5%) | 39,566 (+9%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | disneymediaandenterta~ | disneyparksexperience~ | entertainment | sports | experiences |
|---|---|---|---|---|---|
| 2019 | 7,528 | 7,319 |  |  |  |
| 2020 | 7,653 | 455 |  |  |  |
| 2021 |  |  | 5,196 | 2,690 | -120 |
| 2022 |  |  | 2,126 | 2,710 | 7,285 |
| 2023 |  |  | 1,444 | 2,465 | 8,954 |
| 2024 |  |  | 3,923 | 2,406 | 9,272 |
| 2025 |  |  | 4,674 | 2,882 | 9,995 |
| 2026 |  |  | 5,443 | 3,094 | 11,191 |

Correlation of segment revenue growth: entertainment/sports +0.78 (n=5); entertainment/experiences +0.52 (n=5); sports/experiences +0.71 (n=5). Size-weighted mean 0.63; offset ratio 0.94 (1 = segment waves line up, 0 = they cancel); average wave +9.3%; segment-profit change correlation -0.30. Worst total segment revenue year -6.1% (2020); worst total segment profit year -45.4% (2020); share of revenue that shrank in 2020/2022/2023 0.20. Slowdown years with a segment moving against another: 2020.

Reading: Parks fell 36% in 2020 while media rose 13%, so revenue fell only 6%; but operating income fell 45% because parks carried the profit. Hidden common driver: Consumer discretionary spending and the structural decline of linear TV run through parks, entertainment and sports. Worst free cash flow year since 2019 +5%, EPS growth +38.8% a year over 5 years; P/E 21.1 vs 18.9 own 10-year median (val_disc_avg +2%). Dropped: segment waves line up or are too small (offset < 0.30).

### GD, General Dynamics Corporation (offset score 38.5; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | aerospace | marinesystems | combatsystems | technologies |
|---|---|---|---|---|
| 2018 | 8,455 | 8,502 | 6,241 | 12,995 |
| 2019 | 9,801 (+16%) | 9,183 (+8%) | 7,007 (+12%) | 13,359 (+3%) |
| 2020 | 8,075 (-18%) | 9,979 (+9%) | 7,223 (+3%) | 12,648 (-5%) |
| 2021 | 8,135 (+1%) | 10,526 (+5%) | 7,351 (+2%) | 12,457 (-2%) |
| 2022 | 8,567 (+5%) | 11,040 (+5%) | 7,308 (-1%) | 12,492 (+0%) |
| 2023 | 8,621 (+1%) | 12,461 (+13%) | 8,268 (+13%) | 12,922 (+3%) |
| 2024 | 11,249 (+30%) | 14,343 (+15%) | 8,997 (+9%) | 13,127 (+2%) |
| 2025 | 13,110 (+17%) | 16,723 (+17%) | 9,246 (+3%) | 13,471 (+3%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | aerospace | marinesystems | combatsystems | technologies |
|---|---|---|---|---|
| 2018 | 1,490 | 761 | 962 | 1,267 |
| 2019 | 1,532 | 785 | 996 | 1,311 |
| 2020 | 1,083 | 854 | 1,041 | 1,211 |
| 2021 | 1,031 | 874 | 1,067 | 1,275 |
| 2022 | 1,130 | 897 | 1,075 | 1,227 |
| 2023 | 1,182 | 874 | 1,147 | 1,202 |
| 2024 | 1,464 | 935 | 1,276 | 1,260 |
| 2025 | 1,746 | 1,177 | 1,331 | 1,277 |

Correlation of segment revenue growth: aerospace/marinesystems +0.50 (n=7); aerospace/combatsystems +0.31 (n=7); aerospace/technologies +0.71 (n=7); marinesystems/combatsystems +0.38 (n=7); marinesystems/technologies +0.48 (n=7); combatsystems/technologies +0.58 (n=7). Size-weighted mean 0.51; offset ratio 0.92 (1 = segment waves line up, 0 = they cancel); average wave +5.7%; segment-profit change correlation 0.30. Worst total segment revenue year -3.6% (2020); worst total segment profit year -9.4% (2020); share of revenue that shrank in 2020/2022/2023 0.26. Slowdown years with a segment moving against another: 2020.

Reading: Aerospace fell 18% in 2020 while marine rose 9% and combat 3%, so the total fell only 3.6% and the weak segment was the smaller one (25%); but that was the only offset year, and in 2023-25 all four segments grew together (correlation +0.51), so the data show one good year, not a pattern. Hidden common driver: No shared driver: business jets (Gulfstream: wealthy buyers, corporate profits) vs defense (US budget). Worst free cash flow year since 2019 -19%, EPS growth +7.0% a year over 5 years; P/E 22.4 vs 17.1 own 10-year median (val_disc_avg +32%). Dropped: segment waves line up or are too small (offset < 0.30).

### NDAQ, Nasdaq, Inc. (offset score 35.7; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | marketservices | corporateplatforms | investmentintelligence | markettechnology | marketplatforms | capitalaccessplatforms | antifinancialcrime | financialtechnology |
|---|---|---|---|---|---|---|---|---|
| 2018 | 2,709 | 487 | 714 | 270 |  |  |  |  |
| 2019 | 2,616 (-3%) | 490 (+2%) | 768 (+9%) | 338 (+25%) |  |  |  |  |
| 2020 |  (+46%) |  (+6%) |  (+17%) |  (+6%) | 4,179 | 1,287 | 116 |  |
| 2021 | 3,471 |  |  |  |  (-3%) | 1,566 (+22%) |  (+99%) | 772 |
| 2022 | 3,632 (+5%) |  |  |  |  | 1,682 (+7%) |  | 864 (+12%) |
| 2023 | 3,156 (-13%) |  |  |  |  | 1,744 (+5%) |  | 1,099 (+27%) |
| 2024 | 3,771 (+19%) |  |  |  |  | 1,945 (+12%) |  | 1,621 (+47%) |
| 2025 | 4,214 (+12%) |  |  |  |  | 2,137 (+10%) |  | 1,850 (+14%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | marketservices | corporateplatforms | investmentintelligence | markettechnology | marketplatforms | capitalaccessplatforms | antifinancialcrime | financialtechnology |
|---|---|---|---|---|---|---|---|---|
| 2018 | 544 | 155 | 460 | 34 |  |  |  |  |
| 2019 | 508 | 177 | 480 | 54 |  |  |  |  |
| 2020 |  |  |  |  | 784 | 651 | 35 |  |
| 2021 | 664 |  |  |  |  | 842 |  | 259 |
| 2022 | 627 |  |  |  |  | 914 |  |  |
| 2023 | 582 |  |  |  |  | 973 |  | 494 |
| 2024 | 597 |  |  |  |  | 1,137 |  |  |
| 2025 | 764 |  |  |  |  | 1,274 |  | 860 |

Correlation of segment revenue growth: marketservices/capitalaccessp +0.98 (n=4); marketservices/financialtechn +0.32 (n=4); capitalaccessp/financialtechn +0.45 (n=4). Size-weighted mean 0.67; offset ratio 0.97 (1 = segment waves line up, 0 = they cancel); average wave +9.8%; segment-profit change correlation 0.62. Worst total segment revenue year -2.5% (2023); worst total segment profit year +0.8% (2023); share of revenue that shrank in 2020/2022/2023 0.20. Slowdown years with a segment moving against another: 2023.

Reading: Segment growth correlates +0.67 and market services fell 13% in 2023; the reorganizations (2021, 2024) leave few clean pairs. Hidden common driver: Market services rides volatility, capital access rides listings and index asset levels, fintech is subscriptions; Adenza (2023) dominates recent growth. Worst free cash flow year since 2019 -14%, EPS growth +10.6% a year over 5 years; P/E 32.8 vs 26.8 own 10-year median (val_disc_avg +40%). Dropped: segment waves line up or are too small (offset < 0.30).

### ETN, Eaton Corporation plc (offset score 31.8; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | electricalamericas | electricalglobal | hydraulics | aerospace | vehicle | emobility |
|---|---|---|---|---|---|---|
| 2018 | 7,914 | 5,159 | 2,392 | 2,335 | 3,489 | 320 |
| 2019 | 8,175 (+3%) | 5,172 (+0%) | 2,204 (-8%) | 2,480 (+6%) | 3,038 (-13%) | 321 (+0%) |
| 2020 | 6,680 (-18%) | 4,703 (-9%) | 1,842 (-16%) | 2,223 (-10%) | 2,118 (-30%) | 292 (-9%) |
| 2021 | 7,242 (+8%) | 5,516 (+17%) | 1,300 (-29%) | 2,648 (+19%) | 2,579 (+22%) | 343 (+17%) |
| 2022 | 8,497 (+17%) | 5,848 (+6%) |  | 3,039 (+15%) | 2,830 (+10%) | 538 (+57%) |
| 2023 | 10,098 (+19%) | 6,084 (+4%) |  | 3,413 (+12%) | 2,965 (+5%) | 636 (+18%) |
| 2024 | 11,436 (+13%) | 6,248 (+3%) |  | 3,744 (+10%) | 2,790 (-6%) | 662 (+4%) |
| 2025 | 13,276 (+16%) | 6,815 (+9%) |  | 4,249 (+13%) | 2,505 (-10%) | 604 (-9%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | electricalamericas | electricalglobal | hydraulics | aerospace | vehicle | emobility |
|---|---|---|---|---|---|---|
| 2018 | 1,372 | 833 | 267 | 503 | 611 | 44 |
| 2019 | 1,549 | 897 | 193 | 595 | 460 | 17 |
| 2020 | 1,352 | 750 | 186 | 414 | 243 | -8 |
| 2021 | 1,495 | 1,034 | 177 | 580 | 449 | -29 |
| 2022 | 1,913 | 1,134 |  | 705 | 453 | -9 |
| 2023 | 2,675 | 1,176 |  | 780 | 482 | -21 |
| 2024 | 3,455 | 1,149 |  | 859 | 502 | -7 |
| 2025 | 3,972 | 1,323 |  | 1,013 | 419 | -14 |

Correlation of segment revenue growth: electricalamer/electricalglob +0.67 (n=7); electricalamer/aerospace +0.88 (n=7); electricalamer/vehicle +0.68 (n=7); electricalamer/emobility +0.50 (n=7); electricalglob/aerospace +0.93 (n=7); electricalglob/vehicle +0.87 (n=7); electricalglob/emobility +0.35 (n=7); aerospace/vehicle +0.89 (n=7). Size-weighted mean 0.76; offset ratio 0.91 (1 = segment waves line up, 0 = they cancel); average wave +9.7%; segment-profit change correlation 0.45. Worst total segment revenue year -16.5% (2020); worst total segment profit year -20.9% (2020); share of revenue that shrank in 2020/2022/2023 0.33. Slowdown years with a segment moving against another: none.

Reading: Every segment fell in 2020 (total -16.5%); correlation +0.76. Electrical is now 70% of revenue. Hidden common driver: Industrial and construction capital spending; data-center electrical demand now dominates growth. Worst free cash flow year since 2019 -38%, EPS growth +24.5% a year over 5 years; P/E 32.2 vs 26.6 own 10-year median (val_disc_avg +38%). Dropped: segment waves line up or are too small (offset < 0.30).

### SPGI, S&P Global Inc. (offset score 31.2; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2022:marketintelligence, 2022:energy, 2022p:marketintelligence, 2023p:marketintelligence.

| year | ratings | marketintelligence | energy | indices | mobility |
|---|---|---|---|---|---|
| 2018 | 2,883 | 1,833 | 815 | 837 |  |
| 2019 | 3,106 (+8%) | 1,959 (+7%) | 844 (+4%) | 918 (+10%) |  |
| 2020 | 3,606 (+16%) | 2,046 (+8%) | 938 (+4%) | 989 (+8%) |  |
| 2021 | 4,097 (+14%) | 2,185 (+7%) | 1,012 (+8%) | 1,149 (+16%) |  |
| 2022 | 2,906 (-26%) | 3,797 | 1,685 | 1,328 (+17%) | 1,142 |
| 2023 | 3,177 (+9%) | 4,365 (+15%) | 1,946 (+15%) | 1,392 (+5%) | 1,484 (+30%) |
| 2024 | 4,207 (+32%) | 4,633 (+6%) | 2,142 (+10%) | 1,617 (+16%) | 1,609 (+8%) |
| 2025 | 4,549 (+8%) | 4,902 (+6%) | 2,299 (+7%) | 1,839 (+14%) | 1,747 (+9%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | ratings | marketintelligence | energy | indices | mobility |
|---|---|---|---|---|---|
| 2018 | 1,554 | 500 | 401 | 566 |  |
| 2019 | 1,783 | 566 | 457 | 632 |  |
| 2020 | 2,223 | 569 | 478 | 666 |  |
| 2021 | 2,629 | 676 | 544 | 798 |  |
| 2022 | 1,672 | 2,488 | 591 | 927 | 213 |
| 2023 | 1,864 | 714 | 704 | 925 | 260 |
| 2024 | 2,707 | 875 | 845 | 1,103 | 312 |
| 2025 | 3,013 | 991 | 943 | 1,271 | 378 |

Correlation of segment revenue growth: ratings/marketintellig -0.29 (n=6); ratings/energy +0.13 (n=6); ratings/indices -0.14 (n=7); marketintellig/energy +0.75 (n=6); marketintellig/indices -0.76 (n=6); energy/indices -0.19 (n=6). Size-weighted mean -0.11; offset ratio 0.89 (1 = segment waves line up, 0 = they cancel); average wave +11.5%; segment-profit change correlation 0.56. Worst total segment revenue year -7.5% (2022); worst total segment profit year -14.3% (2022); share of revenue that shrank in 2020/2022/2023 0.26. Slowdown years with a segment moving against another: 2022.

Reading: Ratings fell 26% in 2022 while indices rose 17%; on the pre-merger mix the total fell about 7.5% that year. IHS Markit (2022) makes the history hard to read. Hidden common driver: Financial-market activity feeds ratings (issuance) and indices (asset levels); market intelligence and commodity insights are subscriptions. Worst free cash flow year since 2019 -29%, EPS growth +8.7% a year over 5 years; P/E 28.9 vs 30.4 own 10-year median (val_disc_avg -1%). Dropped: segment waves line up or are too small (offset < 0.30).

### TMO, Thermo Fisher Scientific Inc. (offset score 27.9; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2022:laboratoryproductsandbiopharmaservices.

| year | lifesciencessolutions | analyticalinstruments | specialtydiagnostics | laboratoryproductsand~ |
|---|---|---|---|---|
| 2018 | 6,269 | 5,469 | 3,724 | 10,035 |
| 2019 | 6,856 (+9%) | 5,522 (+1%) | 3,718 (-0%) | 10,599 (+6%) |
| 2020 | 12,168 (+77%) | 5,124 (-7%) | 5,343 (+44%) | 12,245 (+16%) |
| 2021 | 15,631 (+28%) | 6,069 (+18%) | 5,659 (+6%) | 14,862 (+21%) |
| 2022 | 13,532 (-13%) | 6,624 (+9%) | 4,763 (-16%) | 22,511 |
| 2023 | 9,977 (-26%) | 7,263 (+10%) | 4,405 (-8%) | 23,041 (+2%) |
| 2024 | 9,631 (-3%) | 7,463 (+3%) | 4,512 (+2%) | 23,157 (+1%) |
| 2025 | 10,374 (+8%) | 7,554 (+1%) | 4,676 (+4%) | 23,984 (+4%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | lifesciencessolutions | analyticalinstruments | specialtydiagnostics | laboratoryproductsand~ |
|---|---|---|---|---|
| 2018 | 2,158 | 1,247 | 952 | 1,258 |
| 2019 | 2,446 | 1,273 | 930 | 1,324 |
| 2020 | 6,109 | 808 | 1,368 | 1,271 |
| 2021 | 7,817 | 1,197 | 1,280 | 1,844 |
| 2022 | 5,582 | 1,507 | 1,024 | 2,872 |
| 2023 | 3,420 | 1,908 | 1,124 | 3,358 |
| 2024 | 3,503 | 1,955 | 1,159 | 3,090 |
| 2025 | 3,768 | 1,736 | 1,256 | 3,350 |

Correlation of segment revenue growth: lifesciencesso/analyticalinst -0.48 (n=7); lifesciencesso/specialtydiagn +0.94 (n=7); lifesciencesso/laboratoryprod +0.72 (n=6); analyticalinst/specialtydiagn -0.62 (n=7); analyticalinst/laboratoryprod +0.29 (n=6); specialtydiagn/laboratoryprod +0.54 (n=6). Size-weighted mean 0.39; offset ratio 0.88 (1 = segment waves line up, 0 = they cancel); average wave +15.3%; segment-profit change correlation -0.13. Worst total segment revenue year -5.8% (2023); worst total segment profit year -16.9% (2022); share of revenue that shrank in 2020/2022/2023 0.46. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: Life sciences solutions rose 78% in 2020 then fell 13% and 26% in 2022-23; total fell 5.8% in 2023. Different segments, one customer base. Hidden common driver: Pharma and biotech lab spending (and its funding cycle) feeds every segment; COVID boom and bust. Worst free cash flow year since 2019 -13%, EPS growth +2.2% a year over 5 years; P/E 38.2 vs 32.5 own 10-year median (val_disc_avg +29%). Dropped: segment waves line up or are too small (offset < 0.30).

### BRK-B, Berkshire Hathaway Inc. (offset score 27.1; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | manufacturingbusiness~ | mclanecompany | serviceandretailingbu~ | burlingtonnorthernsan~ | berkshirehathawayener~ | berkshirehathawayinsu~ | pilottravelcentersllc |
|---|---|---|---|---|---|---|---|
| 2018 | 61,883 | 49,987 | 28,939 | 23,855 | 19,987 | 62,936 |  |
| 2019 | 62,730 (+1%) | 50,458 (+1%) | 29,487 (+2%) | 23,515 (-1%) | 20,114 (+1%) | 67,693 (+8%) |  |
| 2020 | 59,079 (-6%) | 46,840 (-7%) | 28,178 (-4%) | 20,869 (-11%) | 21,100 (+5%) | 69,361 (+2%) |  |
| 2021 | 68,730 (+16%) | 49,450 (+6%) | 34,832 (+24%) | 23,282 (+12%) | 25,096 (+19%) | 75,122 (+8%) |  |
| 2022 | 75,781 (+10%) | 53,209 (+8%) | 38,303 (+10%) | 25,888 (+11%) | 26,393 (+5%) | 82,310 (+10%) |  |
| 2023 | 75,405 (-0%) | 52,607 (-1%) | 39,996 (+4%) | 23,876 (-8%) | 26,008 (-1%) | 95,022 (+15%) | 51,739 |
| 2024 | 77,231 (+2%) | 51,907 (-1%) | 39,874 (-0%) | 23,572 (-1%) | 26,348 (+1%) | 105,069 (+11%) | 46,891 (-9%) |
| 2025 | 78,487 (+2%) | 50,998 (-2%) | 42,647 (+7%) | 23,533 (-0%) | 26,297 (-0%) | 104,212 (-1%) | 42,198 (-10%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest, us-gaap:OperatingIncomeLoss):

| year | berkshirehathawayinsu~ | burlingtonnorthernsan~ | berkshirehathawayener~ | manufacturingbusiness~ | mclanecompany | serviceandretailingbu~ | pilottravelcentersllc |
|---|---|---|---|---|---|---|---|
| 2018 | 7,513 | 6,863 | 2,472 | 9,366 | 246 | 2,696 |  |
| 2019 | 7,017 | 7,250 | 2,618 | 9,522 | 288 | 2,555 |  |
| 2020 | 6,787 | 6,792 | 2,548 | 8,010 | 251 | 2,628 |  |
| 2021 | 6,760 | 7,861 | 3,293 | 9,841 | 230 | 4,481 |  |
| 2022 | 7,702 | 7,708 | 3,146 | 11,177 | 271 | 4,771 |  |
| 2023 | 18,494 | 6,614 | 940 | 11,445 | 455 | 4,721 | 968 |
| 2024 | 28,153 | 6,648 | 2,292 | 11,895 | 634 | 3,700 | 614 |
| 2025 | 24,721 | 7,175 | 2,342 | 12,571 | 676 | 4,039 | 190 |

Correlation of segment revenue growth: manufacturingb/mclanecompany +0.91 (n=7); manufacturingb/serviceandreta +0.93 (n=7); manufacturingb/burlingtonnort +0.96 (n=7); manufacturingb/berkshirehatha +0.76 (n=7); manufacturingb/berkshirehatha +0.22 (n=7); mclanecompany/serviceandreta +0.77 (n=7); mclanecompany/burlingtonnort +0.93 (n=7); mclanecompany/berkshirehatha +0.49 (n=7). Size-weighted mean 0.51; offset ratio 0.92 (1 = segment waves line up, 0 = they cancel); average wave +5.4%; segment-profit change correlation 0.04. Worst total segment revenue year -3.4% (2020); worst total segment profit year -7.9% (2020); share of revenue that shrank in 2020/2022/2023 0.42. Slowdown years with a segment moving against another: 2020.

Reading: Rail, manufacturing, McLane and retail all fell in 2020 (total -3.4%) while insurance and energy grew; segment revenue correlates +0.51, profit only +0.04. Hidden common driver: The US economy runs through BNSF, manufacturing, McLane, retail and Pilot; insurance is the one different weather. Worst free cash flow year since 2019 -61%, EPS growth n/a a year over 5 years; P/E history not verified (metrics artifact). Dropped: segment waves line up or are too small (offset < 0.30).

### MS, Morgan Stanley (offset score 25.6; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenuesNetOfInterestExpense. Acquisition/divestiture years left out of growth: 2021:wealthmanagement, 2021:investmentmanagement.

| year | institutionalsecuriti~ | wealthmanagement | investmentmanagement |
|---|---|---|---|
| 2018 | 20,582 | 17,242 | 2,746 |
| 2019 | 20,496 (-1%) | 17,746 (+3%) | 3,763 (+37%) |
| 2020 | 26,476 (+29%) | 19,086 (+8%) | 3,734 (-1%) |
| 2021 | 29,833 | 24,243 | 6,220 |
| 2022 | 24,393 (-18%) | 24,417 (+1%) | 5,375 (-14%) |
| 2023 | 23,060 (-5%) | 26,268 (+8%) | 5,370 (-0%) |
| 2024 | 28,080 (+22%) | 28,420 (+8%) | 5,861 (+9%) |
| 2025 | 33,080 (+18%) | 31,754 (+12%) | 6,525 (+11%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | institutionalsecuriti~ | wealthmanagement | investmentmanagement |
|---|---|---|---|
| 2018 | 4,906 | 3,472 | 376 |
| 2019 | 4,599 | 3,728 | 719 |
| 2020 | 7,012 | 3,361 | 615 |
| 2021 | 8,957 | 4,734 | 1,347 |
| 2022 | 5,242 | 5,139 | 660 |
| 2023 | 3,453 | 5,022 | 639 |
| 2024 | 6,666 | 5,888 | 859 |
| 2025 | 8,650 | 7,130 | 1,122 |

Correlation of segment revenue growth: institutionals/wealthmanageme +0.73 (n=6); institutionals/investmentmana +0.18 (n=6); wealthmanageme/investmentmana +0.06 (n=6). Size-weighted mean 0.56; offset ratio 0.93 (1 = segment waves line up, 0 = they cancel); average wave +10.4%; segment-profit change correlation 0.43. Worst total segment revenue year -10.1% (2022); worst total segment profit year -26.6% (2022); share of revenue that shrank in 2020/2022/2023 0.41. Slowdown years with a segment moving against another: 2022,2023.

Reading: Wealth management held flat in 2022 while institutional securities fell 18%, so the mix is better than GS, but segment revenue still fell 10% and profit 27% in 2022. Hidden common driver: Market levels and deal flow: wealth fees ride asset prices, institutional securities rides deals and trading. Worst net income year since 2019 -27%, EPS growth +9.4% a year over 5 years; P/E 16.8 vs 10.9 own 10-year median (val_disc_avg +54%). Dropped: segment waves line up or are too small (offset < 0.30).

### WFC, Wells Fargo & Company (offset score 25.4; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenuesNetOfInterestExpense.

| year | consumerbankingandlen~ | commercialbanking | corporateandinvestmen~ | wealthandinvestmentma~ |
|---|---|---|---|---|
| 2018 | 39,915 | 13,080 | 14,071 | 15,869 |
| 2019 | 37,891 (-5%) | 11,702 (-6%) | 14,450 (+1%) | 14,412 (-1%) |
| 2020 | 34,016 (-10%) | 9,175 (-22%) | 13,928 (-4%) | 13,213 (-8%) |
| 2021 | 34,877 (+3%) | 8,549 (-7%) | 13,839 (-1%) | 14,346 (+9%) |
| 2022 | 35,810 (+3%) | 10,920 (+28%) | 15,242 (+10%) | 14,822 (+3%) |
| 2023 | 37,919 (+6%) | 13,449 (+23%) | 19,191 (+26%) | 14,691 (-1%) |
| 2024 | 36,201 (-5%) | 12,778 (-5%) | 19,344 (+1%) | 15,436 (+5%) |
| 2025 | 37,362 (+3%) | 11,978 (-6%) | 19,232 (-1%) | 16,328 (+6%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | consumerbankingandlen~ | commercialbanking | corporateandinvestmen~ | wealthandinvestmentma~ |
|---|---|---|---|---|
| 2018 | 8,907 | 4,308 | 4,931 | 2,495 |
| 2019 | 5,895 | 3,662 | 5,188 | 1,681 |
| 2020 | 1,076 | -689 | 950 | 1,538 |
| 2021 | 8,555 | 3,134 | 6,062 | 2,027 |
| 2022 | 5,441 | 4,018 | 5,878 | 2,422 |
| 2023 | 7,939 | 5,104 | 6,426 | 1,964 |
| 2024 | 7,009 | 4,689 | 7,338 | 1,902 |
| 2025 | 7,865 | 4,184 | 7,283 | 2,119 |

Correlation of segment revenue growth: consumerbankin/commercialbank +0.72 (n=7); consumerbankin/corporateandin +0.64 (n=7); consumerbankin/wealthandinves +0.61 (n=7); commercialbank/corporateandin +0.85 (n=7); commercialbank/wealthandinves +0.21 (n=7); corporateandin/wealthandinves -0.07 (n=7). Size-weighted mean 0.55; offset ratio 0.89 (1 = segment waves line up, 0 = they cancel); average wave +7.3%; segment-profit change correlation 0.64. Worst total segment revenue year -10.4% (2020); worst total segment profit year -82.5% (2020); share of revenue that shrank in 2020/2022/2023 0.40. Slowdown years with a segment moving against another: none.

Reading: All four segments fell together in 2020 (total -10.4%, segment profit -82.5%); segment growth correlates +0.55. One weather, four names. Hidden common driver: US rates and credit, plus the 2018-2025 asset cap that held every segment back at once. Worst net income year since 2019 -83%, EPS growth +51.8% a year over 5 years; P/E 11.4 vs 10.3 own 10-year median (val_disc_avg +11%). Dropped: segment waves line up or are too small (offset < 0.30).

### L, Loews Corporation (offset score 24.6; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | cnafinancialcorporati~ | boardwalkpipelinepart~ | loewshotelsholdingcor~ |
|---|---|---|---|
| 2018 | 10,134 | 1,227 | 755 |
| 2019 | 10,788 (+6%) | 1,300 (+6%) | 692 (-8%) |
| 2020 | 10,827 (+0%) | 1,302 (+0%) | 278 (-60%) |
| 2021 | 11,908 (+10%) | 1,349 (+4%) | 480 (+73%) |
| 2022 | 11,879 (-0%) | 1,446 (+7%) | 721 (+50%) |
| 2023 | 13,299 (+12%) | 1,636 (+13%) | 852 (+18%) |
| 2024 | 14,270 (+7%) | 2,065 (+26%) | 933 (+10%) |
| 2025 | 14,989 (+5%) | 2,324 (+13%) | 945 (+1%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | cnafinancialcorporati~ | boardwalkpipelinepart~ | loewshotelsholdingcor~ |
|---|---|---|---|
| 2018 | 726 | 135 | 48 |
| 2019 | 894 | 209 | -31 |
| 2020 | 618 | 206 | -212 |
| 2021 | 1,061 | 235 | -14 |
| 2022 | 612 | 247 | 117 |
| 2023 | 1,094 | 283 | 147 |
| 2024 | 879 | 413 | 70 |
| 2025 | 1,173 | 444 | 31 |

Correlation of segment revenue growth: cnafinancialco/boardwalkpipel +0.35 (n=7); cnafinancialco/loewshotelshol +0.38 (n=7); boardwalkpipel/loewshotelshol +0.11 (n=7). Size-weighted mean 0.35; offset ratio 0.88 (1 = segment waves line up, 0 = they cancel); average wave +5.6%; segment-profit change correlation 0.03. Worst total segment revenue year -2.9% (2020); worst total segment profit year -33.7% (2022); share of revenue that shrank in 2020/2022/2023 0.31. Slowdown years with a segment moving against another: none.

Reading: Hotels fell 60% in 2020 at a 5% share, so the weak part was small and segment revenue fell only 2.9%; but segment profit fell 43% that year because CNA dominates. Hidden common driver: CNA (P&C insurance, about 85% of revenue) dominates; Boardwalk pipelines and Loews Hotels are small. Worst net income year since 2019 -100%, EPS growth n/a a year over 5 years; P/E 13.3 vs 14.0 own 10-year median (val_disc_avg -5%). Dropped: segment waves line up or are too small (offset < 0.30).

### IBM, International Business Machines Corporation (offset score 23.8; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | cloudandcognitivesoft~ | globalbusinessservices | globaltechnologyservi~ | systems | software | consulting | infrastructure |
|---|---|---|---|---|---|---|---|
| 2018 | 25,047 | 17,121 | 30,018 | 8,848 |  |  |  |
| 2019 |  (+3%) |  (-0%) |  (-5%) |  (-6%) | 22,408 | 16,939 | 15,774 |
| 2020 |  |  |  |  | 22,124 (+2%) | 16,257 (-4%) | 14,533 (-8%) |
| 2021 |  |  |  |  | 23,426 (+6%) | 17,844 (+10%) | 14,188 (-2%) |
| 2022 |  |  |  |  | 23,629 (+7%) | 20,058 (+7%) | 15,288 (+8%) |
| 2023 |  |  |  |  | 25,011 (+6%) | 20,884 (+4%) | 14,593 (-5%) |
| 2024 |  |  |  |  | 27,085 (+8%) | 20,692 (-1%) | 14,020 (-4%) |
| 2025 |  |  |  |  | 29,962 (+11%) | 21,055 (+2%) | 15,718 (+12%) |

Segment profit, $M (us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest):

| year | cloudandcognitivesoft~ | globalbusinessservices | globaltechnologyservi~ | systems | software | consulting | infrastructure |
|---|---|---|---|---|---|---|---|
| 2018 | 8,914 | 1,602 | 1,781 | 904 |  |  |  |
| 2019 |  |  |  |  | 5,025 | 1,344 | 2,481 |
| 2020 |  |  |  |  | 3,423 | 1,034 | 1,654 |
| 2021 |  |  |  |  | 4,849 | 1,449 | 2,025 |
| 2022 |  |  |  |  | 7,012 | 1,871 | 2,671 |
| 2023 |  |  |  |  | 7,499 | 2,130 | 2,828 |
| 2024 |  |  |  |  | 8,684 | 2,054 | 2,450 |
| 2025 |  |  |  |  | 9,920 | 2,464 | 3,458 |

Correlation of segment revenue growth: software/consulting +0.20 (n=6); software/infrastructure +0.76 (n=6); consulting/infrastructure +0.33 (n=6). Size-weighted mean 0.41; offset ratio 0.86 (1 = segment waves line up, 0 = they cancel); average wave +4.0%; segment-profit change correlation 0.81. Worst total segment revenue year -2.5% (2020); worst total segment profit year -31.9% (2020); share of revenue that shrank in 2020/2022/2023 0.28. Slowdown years with a segment moving against another: 2020,2023.

Reading: Infrastructure fell 8% in 2020 and 4-5% in 2023-24 while software grew; segment profit fell 32% in 2020; correlation +0.41. Hidden common driver: Enterprise IT budgets. Worst free cash flow year since 2019 -31%, EPS growth +12.4% a year over 5 years; P/E 20.4 vs 17.0 own 10-year median (val_disc_avg +66%). Dropped: segment waves line up or are too small (offset < 0.30).

### AMZN, Amazon.com, Inc. (offset score 20.1; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | northamerica | international | amazonwebservices |
|---|---|---|---|
| 2018 | 141,366 | 65,866 | 25,655 |
| 2019 | 170,773 (+21%) | 74,723 (+13%) | 35,026 (+37%) |
| 2020 | 236,282 (+38%) | 104,412 (+40%) | 45,370 (+30%) |
| 2021 | 279,833 (+18%) | 127,787 (+22%) | 62,202 (+37%) |
| 2022 | 315,880 (+13%) | 118,007 (-8%) | 80,096 (+29%) |
| 2023 | 352,828 (+12%) | 131,200 (+11%) | 90,757 (+13%) |
| 2024 | 387,497 (+10%) | 142,906 (+9%) | 107,556 (+19%) |
| 2025 | 426,305 (+10%) | 161,894 (+13%) | 128,725 (+20%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | northamerica | international | amazonwebservices |
|---|---|---|---|
| 2018 | 7,267 | -2,142 | 7,296 |
| 2019 | 7,033 | -1,693 | 9,201 |
| 2020 | 8,651 | 717 | 13,531 |
| 2021 | 7,271 | -924 | 18,532 |
| 2022 | -2,847 | -7,746 | 22,841 |
| 2023 | 14,877 | -2,656 | 24,631 |
| 2024 | 24,967 | 3,792 | 39,834 |
| 2025 | 29,619 | 4,750 | 45,606 |

Correlation of segment revenue growth: northamerica/international +0.81 (n=7); northamerica/amazonwebservi +0.51 (n=7); international/amazonwebservi +0.25 (n=7). Size-weighted mean 0.64; offset ratio 0.99 (1 = segment waves line up, 0 = they cancel); average wave +9.5%; segment-profit change correlation 0.50. Worst total segment revenue year +9.4% (2022); worst total segment profit year -22.5% (2022); share of revenue that shrank in 2020/2022/2023 0.09. Slowdown years with a segment moving against another: 2022.

Reading: International fell 8% in 2022 while AWS rose 29%; segment operating income fell 51% that year. One real diversifier. Hidden common driver: North America and International are one retail business by map; AWS is the one different stream. Worst free cash flow year since 2019 -100%, EPS growth +28.0% a year over 5 years; P/E 37.3 vs 74.6 own 10-year median (val_disc_avg -46%). Dropped: segment waves line up or are too small (offset < 0.30).

### LH, Labcorp Holdings Inc. (offset score 13.9; dropped: segment waves line up or are too small (offset < 0.30))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: lh:SegmentRevenues, us-gaap:Revenues.

| year | diagnostics | drugdevelopment |
|---|---|---|
| 2018 | 7,031 | 4,313 |
| 2019 | 7,000 (-0%) | 4,578 (+6%) |
| 2020 | 9,253 (+32%) | 4,878 (+7%) |
| 2021 | 10,364 (+12%) | 2,861 (+20%) |
| 2022 | 9,204 (-11%) | 2,697 (-6%) |
| 2023 | 9,415 (+2%) | 2,774 (+3%) |
| 2024 | 10,144 (+8%) | 2,923 (+5%) |
| 2025 | 10,876 (+7%) | 3,098 (+6%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | diagnostics | drugdevelopment |
|---|---|---|
| 2018 | 1,167 | 304 |
| 2019 | 1,086 | 412 |
| 2020 | 2,801 | 722 |
| 2021 | 3,206 | 501 |
| 2022 | 2,026 | 389 |
| 2023 | 1,591 | 396 |
| 2024 | 1,606 | 459 |
| 2025 | 1,780 | 498 |

Correlation of segment revenue growth: diagnostics/drugdevelopmen +0.51 (n=7). Size-weighted mean 0.51; offset ratio 1.00 (1 = segment waves line up, 0 = they cancel); average wave +9.5%; segment-profit change correlation -0.42. Worst total segment revenue year -10.0% (2022); worst total segment profit year -34.9% (2022); share of revenue that shrank in 2020/2022/2023 0.33. Slowdown years with a segment moving against another: none.

Reading: Diagnostics rose 32% in 2020 on COVID tests then fell 11% in 2022; drug development did not offset (correlation +0.51); Fortrea spin (2023) makes the history choppy. Hidden common driver: US healthcare utilization and pharma R&D budgets; COVID testing created the 2020-21 wave. Worst free cash flow year since 2019 -43%, EPS growth -8.0% a year over 5 years; P/E 34.3 vs 14.6 own 10-year median (val_disc_avg +107%). Dropped: segment waves line up or are too small (offset < 0.30).

## Dropped: one product split by map/channel/vertical (7)

### LULU, lululemon athletica inc. (offset score 40.0; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | corporateownedstores | directtoconsumer | americas | chinamainlands | othercountry | chinamainland |
|---|---|---|---|---|---|---|
| 2018 | 2,126 | 859 |  |  |  |  |
| 2019 | 2,501 (+18%) | 1,138 (+32%) |  |  |  |  |
| 2020 | 1,659 (-34%) | 2,284 (+101%) |  |  |  |  |
| 2021 |  (+70%) |  (+22%) | 5,300 | 434 | 522 |  |
| 2022 |  |  | 6,817 (+29%) | 577 (+33%) | 717 (+37%) |  |
| 2023 |  |  | 7,632 (+12%) |  (+67%) | 1,024 (+43%) | 964 |
| 2024 |  |  | 7,928 (+4%) |  | 1,299 (+27%) | 1,361 (+41%) |
| 2025 |  |  | 7,847 (-1%) |  | 1,501 (+16%) | 1,755 (+29%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | americas | chinamainlands | othercountry | chinamainland |
|---|---|---|---|---|
| 2022 | 2,504 | 197 | 103 |  |
| 2023 | 2,937 |  | 202 | 337 |
| 2024 | 3,016 |  | 315 | 510 |
| 2025 | 2,561 |  | 346 | 701 |

Correlation of segment revenue growth: americas/othercountry +0.71 (n=4). Size-weighted mean 0.71; offset ratio 0.45 (1 = segment waves line up, 0 = they cancel); average wave +25.8%; segment-profit change correlation n/a. Worst total segment revenue year +4.9% (2025); worst total segment profit year -6.1% (2025); share of revenue that shrank in 2020/2022/2023 0.23. Slowdown years with a segment moving against another: 2020.

Reading: Store sales fell 34% in 2020 while e-commerce doubled: the same customer changing channel. One stream. Hidden common driver: One apparel brand split by channel and map. Worst free cash flow year since 2019 -67%, EPS growth +24.1% a year over 5 years; P/E 8.1 vs 41.1 own 10-year median (val_disc_avg -75%). Dropped: one product split by map/channel/vertical.

### FDS, FactSet Research Systems Inc. (offset score 27.5; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | americas | emea | asiapacific |
|---|---|---|---|
| 2020 | 944 | 406 | 144 |
| 2021 | 1,008 (+7%) | 428 (+5%) | 156 (+8%) |
| 2022 | 1,174 (+16%) | 484 (+13%) | 186 (+19%) |
| 2023 | 1,335 (+14%) | 540 (+11%) | 210 (+13%) |
| 2024 | 1,420 (+6%) | 563 (+4%) | 220 (+5%) |
| 2025 | 1,506 (+6%) | 580 (+3%) | 235 (+7%) |
| 2026 | 1,617 (+7%) | 605 (+4%) | 253 (+8%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | americas | emea | asiapacific |
|---|---|---|---|
| 2020 | 182 | 165 | 92 |
| 2021 | 218 | 160 | 96 |
| 2022 | 159 | 196 | 120 |
| 2023 | 239 | 243 | 147 |
| 2024 | 262 | 283 | 157 |
| 2025 | 306 | 274 | 168 |
| 2026 | 260 | 258 | 182 |

Correlation of segment revenue growth: americas/emea +0.99 (n=6); americas/asiapacific +0.97 (n=6); emea/asiapacific +0.94 (n=6). Size-weighted mean 0.98; offset ratio 1.00 (1 = segment waves line up, 0 = they cancel); average wave +4.1%; segment-profit change correlation 0.25. Worst total segment revenue year +5.4% (2025); worst total segment profit year -6.5% (2026); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Americas, EMEA and Asia move almost identically (correlation +0.98). One stream by map. Hidden common driver: One product (financial data workstations) split by region. Worst free cash flow year since 2019 -1%, EPS growth +7.1% a year over 5 years; P/E 20.9 vs 30.3 own 10-year median (val_disc_avg -33%). Dropped: one product split by map/channel/vertical.

### COST, Costco Wholesale Corporation (offset score 18.2; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:Revenues.

| year | unitedstates | canada | otherinternational |
|---|---|---|---|
| 2023 | 176,630 | 33,056 | 32,604 |
| 2024 | 184,143 (+4%) | 34,874 (+5%) | 35,436 (+9%) |
| 2025 | 200,046 (+9%) | 36,923 (+6%) | 38,266 (+8%) |
| 2026 | 219,823 (+10%) | 40,561 (+10%) | 42,770 (+12%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | unitedstates | canada | otherinternational |
|---|---|---|---|
| 2023 | 5,392 | 1,448 | 1,274 |
| 2024 | 6,217 | 1,648 | 1,420 |
| 2025 | 6,878 | 1,849 | 1,656 |
| 2026 | 7,647 | 2,107 | 1,931 |

Correlation of segment revenue growth: no segment pair with 4+ common growth years. Size-weighted mean n/a; offset ratio 0.96 (1 = segment waves line up, 0 = they cancel); average wave +2.2%; segment-profit change correlation n/a. Worst total segment revenue year +5.0% (2024); worst total segment profit year +11.8% (2025); share of revenue that shrank in 2020/2022/2023 n/a. Slowdown years with a segment moving against another: none.

Reading: Only 3 growth years tagged; one stream by map. Hidden common driver: One warehouse-club model in three geographies. Worst free cash flow year since 2019 -35%, EPS growth +13.0% a year over 5 years; P/E 52.7 vs 37.4 own 10-year median (val_disc_avg +45%). Dropped: one product split by map/channel/vertical.

### WMT, Walmart Inc. (offset score 13.9; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax, us-gaap:Revenues. Acquisition/divestiture years left out of growth: 2021:walmartinternational.

| year | walmartus | walmartinternational | samsclubus |
|---|---|---|---|
| 2018 | 331,666 | 120,824 | 57,839 |
| 2019 | 341,004 (+3%) | 120,130 (-1%) | 58,792 (+2%) |
| 2020 | 369,963 (+8%) | 121,360 (+1%) | 63,910 (+9%) |
| 2021 | 393,247 (+6%) | 100,959 | 73,556 (+15%) |
| 2022 | 422,398 (+7%) | 102,604 (+0%) | 86,253 (+15%) |
| 2023 | 443,802 (+5%) | 116,049 (+13%) | 88,230 (+2%) |
| 2024 | 465,009 (+5%) | 123,363 (+6%) | 92,561 (+5%) |
| 2025 | 485,599 (+4%) | 131,988 (+7%) | 95,540 (+3%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | walmartus | walmartinternational | samsclubus |
|---|---|---|---|
| 2018 | 17,386 | 4,883 | 1,520 |
| 2019 | 17,380 | 3,370 | 1,642 |
| 2020 | 19,116 | 3,660 | 1,906 |
| 2021 | 21,587 | 3,758 | 2,259 |
| 2022 | 20,620 | 2,965 | 1,964 |
| 2023 | 22,154 | 4,909 | 2,192 |
| 2024 | 23,882 | 5,501 | 2,404 |
| 2025 | 25,158 | 5,103 | 2,442 |

Correlation of segment revenue growth: walmartus/walmartinterna -0.21 (n=6); walmartus/samsclubus +0.70 (n=7); walmartinterna/samsclubus -0.51 (n=6). Size-weighted mean 0.08; offset ratio 0.69 (1 = segment waves line up, 0 = they cancel); average wave +2.5%; segment-profit change correlation 0.71. Worst total segment revenue year +1.9% (2019); worst total segment profit year -7.4% (2022); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Walmart US, Sam's and International all ride the same shopper; International's -17% in 2021 was divestitures (skipped). Hidden common driver: One retail customer in three formats and maps. Worst free cash flow year since 2019 -57%, EPS growth +11.5% a year over 5 years; P/E 46.2 vs 28.2 own 10-year median (val_disc_avg +116%). Dropped: one product split by map/channel/vertical.

### ACN, Accenture plc (offset score 12.6; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | communicationsmediaan~ | financialservices | healthandpublicservice | products | resources | northamerica | emea | growthmarkets | americas | asiapacific |
|---|---|---|---|---|---|---|---|---|---|---|
| 2019 | 8,757 | 8,495 | 7,162 | 12,026 | 6,775 |  |  |  |  |  |
| 2020 | 8,313 (+1%) | 8,519 (+0%) | 8,024 (+12%) | 12,858 (+2%) | 6,614 (-2%) |  |  |  |  |  |
| 2021 | 9,801 (+18%) | 9,933 (+17%) | 9,498 (+18%) | 14,439 (+12%) | 6,863 (+4%) |  |  |  |  |  |
| 2022 |  (+24%) |  (+19%) |  (+18%) |  (+27%) |  (+18%) | 29,121 | 21,104 | 11,369 |  |  |
| 2023 |  |  |  |  |  |  (+4%) | 22,293 (+6%) |  (+1%) | 32,193 | 9,626 |
| 2024 |  |  |  |  |  |  | 22,818 (+2%) |  | 32,552 (+1%) | 9,526 (-1%) |
| 2025 |  |  |  |  |  |  | 24,644 (+8%) |  | 35,057 (+8%) | 9,972 (+5%) |
| 2026 |  |  |  |  |  |  | 26,959 (+9%) |  | 36,547 (+4%) | 10,678 (+7%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | northamerica | emea | growthmarkets | americas | asiapacific |
|---|---|---|---|---|---|
| 2022 | 4,977 | 2,517 | 1,874 |  |  |
| 2023 |  | 2,483 |  | 4,644 | 1,682 |
| 2024 |  | 2,804 |  | 5,080 | 1,713 |
| 2025 |  | 3,091 |  | 5,324 | 1,810 |
| 2026 |  | 3,436 |  | 6,244 | 1,725 |

Correlation of segment revenue growth: no segment pair with 4+ common growth years. Size-weighted mean n/a; offset ratio 0.98 (1 = segment waves line up, 0 = they cancel); average wave +6.0%; segment-profit change correlation n/a. Worst total segment revenue year +1.2% (2024); worst total segment profit year -5.9% (2023); share of revenue that shrank in 2020/2022/2023 0.05. Slowdown years with a segment moving against another: 2020.

Reading: One stream by map; reorganized segments leave no clean pairs. Hidden common driver: One consulting and outsourcing business split by region (by industry before FY2022). Worst free cash flow year since 2019 -4%, EPS growth +8.2% a year over 5 years; P/E 16.1 vs 24.4 own 10-year median (val_disc_avg -35%). Dropped: one product split by map/channel/vertical.

### CTSH, Cognizant Technology Solutions Corporation (offset score 7.7; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax.

| year | financialservices | healthsciences | productsandresources | communicationsmediaan~ |
|---|---|---|---|---|
| 2018 | 5,845 | 4,668 | 3,415 | 2,197 |
| 2019 | 5,869 (+0%) | 4,695 (+1%) | 3,770 (+10%) | 2,449 (+11%) |
| 2020 | 5,621 (-4%) | 4,852 (+3%) | 3,696 (-2%) | 2,483 (+1%) |
| 2021 | 6,051 (+8%) | 5,337 (+10%) | 4,276 (+16%) | 2,843 (+14%) |
| 2022 | 6,072 (+0%) | 5,631 (+6%) | 4,566 (+7%) | 3,159 (+11%) |
| 2023 | 5,809 (-4%) | 5,674 (+1%) | 4,628 (+1%) | 3,242 (+3%) |
| 2024 | 5,753 (-1%) | 5,932 (+5%) | 4,782 (+3%) | 3,269 (+1%) |
| 2025 | 6,173 (+7%) | 6,347 (+7%) | 5,285 (+11%) | 3,303 (+1%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | financialservices | healthsciences | productsandresources | communicationsmediaan~ |
|---|---|---|---|---|
| 2018 | 1,713 | 1,416 | 1,023 | 692 |
| 2019 | 1,605 | 1,261 | 1,028 | 732 |
| 2020 | 1,419 | 1,357 | 1,058 | 780 |
| 2021 | 1,296 | 1,247 | 960 | 691 |
| 2022 | 1,323 | 1,190 | 1,071 | 769 |
| 2023 | 1,156 | 1,352 | 984 | 625 |
| 2024 | 915 | 1,073 | 771 | 393 |
| 2025 | 1,233 | 1,029 | 787 | 436 |

Correlation of segment revenue growth: financialservi/healthsciences +0.81 (n=7); financialservi/productsandres +0.90 (n=7); financialservi/communications +0.41 (n=7); healthsciences/productsandres +0.60 (n=7); healthsciences/communications +0.30 (n=7); productsandres/communications +0.70 (n=7). Size-weighted mean 0.66; offset ratio 0.91 (1 = segment waves line up, 0 = they cancel); average wave +4.3%; segment-profit change correlation 0.61. Worst total segment revenue year -0.8% (2020); worst total segment profit year -23.4% (2024); share of revenue that shrank in 2020/2022/2023 0.30. Slowdown years with a segment moving against another: none.

Reading: Financial services fell in 2020 and 2023 while health sciences grew, but the verticals move together (+0.66). Hidden common driver: One IT services business split by client industry. Worst free cash flow year since 2019 -24%, EPS growth +12.1% a year over 5 years; P/E 11.6 vs 17.4 own 10-year median (val_disc_avg -36%). Dropped: one product split by map/channel/vertical.

### AFL, Aflac Incorporated (offset score 3.8; dropped: one product split by map/channel/vertical)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | aflacjapan | aflacus |
|---|---|---|
| 2018 | 15,206 | 6,443 |
| 2019 | 15,313 (+1%) | 6,550 (+2%) |
| 2020 | 15,371 (+0%) | 6,565 (+0%) |
| 2021 | 14,373 (-3%) | 6,489 (-1%) |
| 2022 | 11,890 (-17%) | 6,486 (-0%) |
| 2023 | 10,664 (-10%) | 6,623 (+2%) |
| 2024 | 9,659 (-9%) | 6,739 (+2%) |
| 2025 | 9,357 (-3%) | 6,903 (+2%) |

Segment profit, $M (us-gaap:OperatingIncomeLoss):

| year | aflacjapan | aflacus |
|---|---|---|
| 2018 | 3,208 | 1,285 |
| 2019 | 3,261 | 1,272 |
| 2020 | 3,263 | 1,268 |
| 2021 | 3,756 | 1,356 |
| 2022 | 3,281 | 1,359 |
| 2023 | 3,234 | 1,501 |
| 2024 | 3,494 | 1,419 |
| 2025 | 3,440 | 1,421 |

Correlation of segment revenue growth: aflacjapan/aflacus +0.03 (n=7). Size-weighted mean 0.03; offset ratio 0.94 (1 = segment waves line up, 0 = they cancel); average wave +4.5%; segment-profit change correlation 0.35. Worst total segment revenue year -11.9% (2022); worst total segment profit year -9.2% (2022); share of revenue that shrank in 2020/2022/2023 0.55. Slowdown years with a segment moving against another: 2023.

Reading: Japan revenue fell 17%, 10% and 9% a year in 2022-24, mostly the yen, while US revenue grew 0-2%; two maps of one product, not two weathers. Hidden common driver: One product line (supplemental health and cancer cover) in two countries; Aflac Japan's dollar revenue rides the yen. Worst net income year since 2019 -33%, EPS growth +0.4% a year over 5 years; P/E 17.0 vs 9.7 own 10-year median (val_disc_avg +75%). Dropped: one product split by map/channel/vertical.

## Dropped: thin sample (2)

### USB, U.S. Bancorp (offset score 27.6; dropped: thin sample)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | wealthcorporatecommer~ | consumerandbusinessba~ | paymentservices |
|---|---|---|---|
| 2022 | 9,241 | 8,802 | 6,298 |
| 2023 | 11,957 (+30%) | 10,295 (+18%) | 6,665 (+6%) |
| 2024 | 12,151 (+2%) | 9,231 (-10%) | 7,026 (+5%) |
| 2025 | 12,083 (-1%) | 8,873 (-4%) | 7,407 (+5%) |

Segment profit, $M (us-gaap:NetIncomeLoss):

| year | wealthcorporatecommer~ | consumerandbusinessba~ | paymentservices |
|---|---|---|---|
| 2022 | 3,713 | 2,210 | 1,345 |
| 2023 | 4,585 | 2,500 | 1,051 |
| 2024 | 4,761 | 1,887 | 1,087 |
| 2025 | 4,626 | 1,723 | 1,282 |

Correlation of segment revenue growth: no segment pair with 4+ common growth years. Size-weighted mean n/a; offset ratio 1.00 (1 = segment waves line up, 0 = they cancel); average wave +9.7%; segment-profit change correlation n/a. Worst total segment revenue year -1.8% (2024); worst total segment profit year -4.9% (2024); share of revenue that shrank in 2020/2022/2023 0.00. Slowdown years with a segment moving against another: none.

Reading: Only 2022-2025 segment data is tagged (3 growth years), too thin to test; dropped on sample size, not on merit. Hidden common driver: Rates and US consumer spending (card fees in Payment Services). Worst net income year since 2019 -28%, EPS growth +8.1% a year over 5 years; P/E 12.0 vs 10.4 own 10-year median (val_disc_avg +16%). Dropped: thin sample.

### MKL, Markel Group Inc. (offset score 20.8; dropped: thin sample)

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:Revenues.

| year | insurance | reinsurance | investing | markelventures | otherinsuranceoperati~ |
|---|---|---|---|---|---|
| 2021 | 5,465 | 1,042 | 2,353 | 3,644 |  |
| 2022 | 6,528 (+19%) | 1,063 (+2%) | -1,168 (-150%) | 4,758 (+31%) | 494 |
| 2023 | 7,283 (+12%) | 1,014 (-5%) | 2,241 | 4,985 (+5%) | 280 (-43%) |
| 2024 | 7,408 (+2%) | 1,028 (+1%) | 2,773 (+24%) | 5,120 (+3%) | 292 (+4%) |

Segment profit, $M (mkl:SegmentProfitLoss):

| year | insurance | reinsurance | investing | markelventures | otherinsuranceoperati~ |
|---|---|---|---|---|---|
| 2021 | 696 | -55 | 2,353 | 273 |  |
| 2022 | 550 | 84 | -1,168 | 404 | 295 |
| 2023 | 162 | -19 | 2,241 | 520 | 205 |
| 2024 | 422 | -5 | 2,773 | 520 | 184 |

Correlation of segment revenue growth: no segment pair with 4+ common growth years. Size-weighted mean n/a; offset ratio 0.98 (1 = segment waves line up, 0 = they cancel); average wave +8.6%; segment-profit change correlation n/a. Worst total segment revenue year -10.6% (2022); worst total segment profit year -108.8% (2022); share of revenue that shrank in 2020/2022/2023 0.16. Slowdown years with a segment moving against another: 2022.

Reading: Three growth years; investing revenue was negative in 2022 (mark-to-market losses). Too thin to test. Hidden common driver: Insurance pricing cycle and investment marks; only 2021-2024 segment data is tagged. Worst net income year since 2019 -100%, EPS growth +23.1% a year over 5 years; P/E 11.3 vs 11.2 own 10-year median (val_disc_avg +0%). Dropped: thin sample.

## Dropped: offsetting segments separated (Solstice 2025, Honeywell Aerospace 2026) (1)

### HON, Honeywell International Inc. (offset score 26.7; dropped: offsetting segments separated (Solstice 2025, Honeywell Aerospace 2026))

Segment revenue, $M, newest-filing basis; (YoY growth read from one filing per year-pair). Tags: us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax. Acquisition/divestiture years left out of growth: 2019.

| year | aerospace | homeandbuildingtechno~ | performancematerialsa~ | safetyandproductivity~ | aerospacetechnologies | industrialautomation | buildingautomation | energyandsustainabili~ |
|---|---|---|---|---|---|---|---|---|
| 2018 | 15,493 | 9,298 | 10,674 | 6,337 |  |  |  |  |
| 2019 | 14,054 | 5,717 | 10,834 | 6,104 |  |  |  |  |
| 2020 | 11,544 (-18%) | 5,189 (-9%) | 9,423 (-13%) | 6,481 (+6%) |  |  |  |  |
| 2021 | 11,026 (-4%) | 5,539 (+7%) | 10,013 (+6%) | 7,814 (+21%) |  |  |  |  |
| 2022 |  (+7%) |  (+8%) |  (+7%) |  (-12%) | 11,827 | 11,638 | 6,000 | 5,996 |
| 2023 |  |  |  |  | 13,624 (+15%) | 10,756 (-8%) | 6,031 (+1%) | 2,586 (+4%) |
| 2024 |  |  |  |  | 15,458 (+13%) | 10,051 (-7%) | 6,540 (+8%) | 2,644 (+2%) |
| 2025 |  |  |  |  | 17,510 (+13%) | 9,401 (-6%) | 7,367 (+13%) | 3,134 (+19%) |

Segment profit, $M (hon:SegmentReportingSegmentProfitLoss, us-gaap:OperatingIncomeLoss):

| year | aerospace | homeandbuildingtechno~ | performancematerialsa~ | safetyandproductivity~ | aerospacetechnologies | industrialautomation | buildingautomation | energyandsustainabili~ |
|---|---|---|---|---|---|---|---|---|
| 2018 | 3,503 | 1,608 | 2,328 | 1,032 |  |  |  |  |
| 2019 | 3,607 | 1,165 | 2,433 | 790 |  |  |  |  |
| 2020 | 2,904 | 1,099 | 1,851 | 907 |  |  |  |  |
| 2021 | 3,051 | 1,238 | 2,120 | 1,029 |  |  |  |  |
| 2022 |  |  |  |  | 3,247 | 2,152 | 1,464 | 1,555 |
| 2023 |  |  |  |  | 3,760 | 2,209 | 1,529 | 569 |
| 2024 |  |  |  |  | 3,988 | 1,962 | 1,681 | 615 |
| 2025 |  |  |  |  | 4,284 | 1,743 | 1,953 | 692 |

Correlation of segment revenue growth: no segment pair with 4+ common growth years. Size-weighted mean n/a; offset ratio 0.75 (1 = segment waves line up, 0 = they cancel); average wave +6.8%; segment-profit change correlation n/a. Worst total segment revenue year -11.1% (2020); worst total segment profit year -15.4% (2020); share of revenue that shrank in 2020/2022/2023 0.46. Slowdown years with a segment moving against another: 2020,2022,2023.

Reading: Aerospace grew 13-15% a year in 2023-25 while industrial automation fell 7% a year, a textbook offset; but Solstice (materials) was spun in 2025 and Honeywell Aerospace separated in mid-2026 (8-K filed 2026-06-29), so the offsetting parts now trade apart. Hidden common driver: None in the data (aerospace, building automation, industrial automation, materials had different cycles), but the structure no longer exists. Worst free cash flow year since 2019 -12%, EPS growth +1.8% a year over 5 years; P/E 14.9 vs 24.1 own 10-year median (val_disc_avg -44%). Dropped: offsetting segments separated (Solstice 2025, Honeywell Aerospace 2026).

## Dropped: single reportable segment (9)

### CHKP, Check Point Software Technologies Ltd. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (network security software). Not a many-weathers business by definition.

### CHTR, Charter Communications, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (cable broadband and video). Not a many-weathers business by definition.

### MEDP, Medpace Holdings, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (clinical trial services to small biotech). Not a many-weathers business by definition.

### NOW, ServiceNow, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (workflow software subscriptions).

### ORLY, O'Reilly Automotive, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (auto parts retail).

### PAYC, Paycom Software, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (payroll software).

### PAYX, Paychex, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (payroll and HR services).

### VEEV, Veeva Systems Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (life-sciences software).

### VRSN, VeriSign, Inc. (dropped: single reportable segment)

No business-segment facts in the last six 10-K inline-XBRL filings: the company reports one segment. One stream (.com and .net registry fees).

## Why this list looks like this

Of 89 companies examined (79 company files pulled in the first pass plus 10 added in this pass for clearly missing multi-segment structures: USB, NTRS, STT, CBOE, NDAQ, LH, ACGL, WRB, TDY, ROP), only 17 pass, so the list is shorter than 25 on purpose and padding it would mean admitting names that fail the definition: 9 report a single segment, 7 split one product by map or client industry (Accenture, Costco, FactSet, Lululemon, Walmart, Aflac, Cognizant), 2 have too few tagged years (USB, Markel), 25 fall into the trap of one hidden driver behind several names (custody banks on asset levels, Schwab on client cash, P&C insurers and brokers on the pricing cycle, every lab-tools and CRO name on pharma budgets, Progressive's two auto books, UnitedHealth, whose clean revenue offsets hid a 41% segment-profit fall in 2025 when UnitedHealthcare and Optum Health took the same cost hit), 19 have segment waves that line up or barely move (Berkshire, Morgan Stanley, Wells Fargo, S&P Global, General Dynamics, Microsoft), 8 never had a segment move against another in 2020, 2022 or 2023 (Chubb, PNC, FICO, MSCI, Globe Life, Broadridge, CVS, Cigna), and two have sold or spun the parts that did the offsetting (Honeywell Aerospace separated in mid-2026; Roper's 2020 offset came from industrial units sold in 2022). The 17 survivors differ from the rest exactly where the ground says they should: their segment growth correlates at a median +0.02 against +0.54 for the other 63 scored names, and their offset ratio is 0.63 against 0.92, so roughly a third of their segment swings cancel inside the total. The payoff is smaller than the picture suggests, though: their worst total segment-revenue year was a median +0.4%, no better than +1.2% for the names that failed, and their worst segment-profit year was worse (-15.8% against -9.2%), because the companies that need offsets are the ones with violent streams (bank interest income, trading, bond issuance, catastrophes, business jets), while the failed list is full of steady single-weather compounders (brokers, payroll processors, index providers) that never needed one. Offsets also show up in revenue far more than in profit: at JPMorgan segment revenue growth correlates -0.24 but segment-profit changes correlate +0.64, because the 2020 and 2022 reserve builds and the 2021 release hit consumer banking, CIB and asset & wealth management at the same time; Citi (+0.55 on profit against -0.29 on revenue), ICE (+0.38 against -0.31) and BNY (+0.33) show the same pattern, most others sit near zero, and only Moody's (-0.68) and J&J (-0.59) clearly offset in profit too. Ten of the 17 are financials (eight balance-sheet businesses plus ICE and Moody's), which is the honest result of the test rather than a quirk: a universal bank or multi-line insurer is the most common structure in which one environment's loser is another's winner, and the market already pays for it in the banks (JPM 15.1x earnings against a 10.1x own median, BNY 17.9x against 11.3x, Citi 13.6x against 8.5x), while the names below their own history are Intuit (18.3x against 50.5x, priced for an AI substitution that would hit all its streams at once), Arch Capital (8.0x against 10.1x, with its mortgage diversifier shrinking from 25% to 7% of premiums), Textron (15.2x against 17.6x), McCormick (15.8x against 24.4x on 1% a year EPS growth), Abbott (27.7x against 33.2x), with Hartford and Moody's at their own medians. With five to seven yearly points per company and no true credit bust in the sample, every correlation here is a clue, not a proof. Takeaway: genuine many-weathers businesses are rare (17 of 89 even on generous rules), they buy steadier revenue rather than steadier profit, and the only ones priced below their own history are Intuit, Arch, Textron, McCormick and Abbott, each with one specific reason that has to be checked before it counts.
