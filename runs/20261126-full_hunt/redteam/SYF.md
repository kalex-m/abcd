# SYF · Synchrony Financial · Red team (run 20261126-full_hunt)

As of 2026-11-28. I read only `theses/SYF.md` and `deepdive/SYF/`. Everything else below comes from primary sources pulled today: SEC EDGAR, Treasury, FRED, Congress.gov, GovInfo and the National Archives, with yFinance used for prices only. I used one news item, PBS/AP, and only for the fact of a public statement.

Terms used:
- **ROTCE** is profit to common shareholders divided by tangible common equity.
- **TBV** is tangible book value.
- **COE** is cost of equity, the return shareholders require.
- **RSA** is retailer share arrangements, the profit shared with partner retailers.
- **NCO** is net charge-offs.
- **CET1** is the core regulatory capital ratio.
- "Old basis" means before the June 2026 recast that stopped deducting capitalised software from TBV.

## Verdict
**broken**

The cushion and "the mistake" only exist at the thesis's 10% COE. Synchrony's own perpetual preferred stock, which ranks ahead of the common, yields 8.3–8.4% in the market today. At no year-end since the 2014 IPO has the market priced the common at an implied COE below about 11%. At 11%, the thesis's own probability weighting gives −2%.

The catalysts point the other way. A 10% cap now has presidential and incoming-majority backing. The 10-K lets partners terminate early on exactly the changes a cap would force. Credit's leading indicator is flat. Capital above management's own 11% CET1 target is about $2B, not $6.2B. Status should move to Watch.

## Strongest case against

### 1. "The mistake" is an assumed discount rate, not a market error
- **The headline rests on one input.** The thesis says P/TBV of 1.63x "implies ~14.4% ROTCE". That is true only at a 10% COE (with 3% growth, the thesis's own formula). At 11% the price implies 16.0%, at 12% it implies 17.7%, and at 13% it implies 19.3%. Put the other way, at the thesis's own base ROTCE of 20%, today's price implies a COE of 13.4%. My calculation uses `scripts/lib/valuation.py` with TBV of $42.79 and a price of $69.77.
- **Synchrony's senior securities say 10% is too low.**
  - Series A preferred (5.625% fixed, perpetual, $25 depositary) closed at $16.69, a current yield of 8.43%.
  - Series B (8.250% fixed-rate reset) closed at $24.83, a yield of 8.31%.
  - Series C was sold in June 2026 at 7.250%.
  - Coupons come from the 10-Q (2026-09-30) and FY2025 10-K. Prices are yFinance SYF-PA and SYF-PB, 2026-11-27.
  - The common is junior to all of these and more volatile. A 10% COE gives it only about 1.6 points over the preferred's market yield.
- **The cost-of-equity arithmetic agrees.** The 10-year Treasury was 4.94% on 2026-11-27 (Treasury), and SYF's beta is 1.395 (yFinance). On those inputs, a 10% COE implies an equity risk premium of only 3.6%. The equity risk premium is the extra return investors demand for owning shares over Treasuries.
- **Eleven years of pricing say the same.**
  - I rebuilt old-basis TBV per share from XBRL: equity less preferred, goodwill and intangibles, divided by the cover-page share count. My Dec 2025 figure of $37.19 matches the company's reported $37.21.
  - I paired it with year-end closes from yFinance. Year-end P/TBV ran from 1.33x (2018) to 2.35x (2016–17).
  - Against the 2015–2025 average ROTCE of 24.4%, the market-implied COE ranged from 12.0% to 19.1%. Excluding the 2021 reserve-release year (average 22.7%), it ranged from 11.3% to 17.8%.
  - It never reached 10%, even at the record close of $88.47 on 2026-01-06 (2.38x old basis, about 12.0%).
- **The base value needs a multiple SYF has never had.** The $104 base value is 2.43x recast TBV, about 2.67x old basis. That is above every year-end multiple since the IPO and 18% above the highest close ever. The bull value of $128 is 45% above it.
- **What it means:** the market isn't misreading Synchrony this year. It has always priced it at a 12–19% required return, and it now adds a live rate-cap risk on top. "What makes the market notice" would need a re-rating the stock has never had.

### 2. At a cost of equity just above the thesis's, the cushion is gone
This is the thesis's own model and its own probability weights: a 20–30% chance of a cap law, and the base-to-bear midpoint otherwise. I scaled the cap-case value ($25 at 10%) by the same model.

| COE | Base (20%) | Bear (16%) | Midpoint | Value with 20% cap odds | Value with 30% cap odds | Cap odds at which value = price |
|---|---|---|---|---|---|---|
| 10% (thesis) | $103.9 | $79.5 | $91.7 | $78.4 (+12%) | $71.7 (+3%) | 33% |
| 11% | $90.9 | $69.5 | $80.2 | $68.6 (−2%) | $62.7 (−10%) | 18% |
| 12% | $80.8 | $61.8 | $71.3 | $60.9 (−13%) | $55.8 (−20%) | 3% |

The weighting also gives zero probability to the thesis's own "partial cap" row ($49). It also gives zero probability to any non-cap outcome worse than a 16% ROTCE held forever.

### 3. The cap risk is bigger than a guessed 20–30%, and the size of the cap case isn't sourced
- **Political support.** On 2026-11-21 the President said he would work with the incoming Congress to cap card rates. The article says Democrats will control both chambers and that Sen. Warren is expected to chair Senate Banking. Sen. Hawley (R) called for passing his own bill (PBS/AP, 2026-11-21). Supporters now include the President, the incoming majority's committee chair and a Republican co-author.
- **What S.381 would do.** The APR would be capped at "10 percentage points, inclusive of all finance charges". Other fees could not exceed total finance charges. Charging above the cap knowingly would forfeit all interest. The cap would sunset on 2031-01-01 (GovInfo bill text, introduced 2025-02-04).
- **Size of the hit.** Synchrony's FY2025 loan yield was 21.64% (10-K). Interest and fees were $21,698M, pre-tax profit $4,621M and RSA $4,005M (XBRL / 10-K, FY2025).
  - A 10% all-in yield on the roughly $100B book would remove about $11.7B of revenue a year.
  - That is more than pre-tax profit plus the entire RSA ($8.6B).
  - On a static book, before keeping fees that are not finance charges and before cutting credit lines, profit would swing to a pre-tax loss of about $3B.
  - The thesis's 11% and 6% ROTCE "cap" rows have no source. `dd-regulatory` F3 found no quantified impact.
- **Guidance excludes the main risk.** Management's 2026 outlook baseline assumes "No regulatory or legislative changes" and a "Stable macroeconomic environment" (3Q26 deck, 2026-10-20). Guidance, and the "double-digit 2027 EPS" framework cited in `dd-transcripts`, leave it out.
- **The catalyst as written can't be observed.** The thesis's catalyst is "the rate-cap bills stalling once the new Congress sets its agenda". S.381 and H.R.1944 have had no action since referral to committee (Congress.gov API: 2025-02-04 and 2025-03-06). Both are 119th-Congress bills, and that Congress's terms end at noon on 2027-01-03 (20th Amendment). Unenacted bills have to be reintroduced; I could not reach a Senate or Congress.gov glossary page to cite for this rule. So their "stalling" proves nothing. The thing to watch is new bills and a Senate Banking markup in the 120th Congress.
- **This risk isn't new.** It has been a filed risk factor since February: the FY2025 10-K says "policy discussions in January 2026 regarding caps on credit card interest rates could result in certain constraints on the pricing of our credit products". This contradicts `dd-edgar` F5, which says neither 10-K mentions a cap.

### 4. The partner contracts protect least in the scenario that matters
- **What the 10-K allows.** The FY2025 10-K says a partner may terminate early if Synchrony changes "certain key cardholder terms or our credit criteria". It may also terminate if Synchrony misses new-account approval targets because of credit-criteria changes, is "not adequately capitalized", or if "a significant change in law occurs and the parties cannot agree on program changes to mitigate the economic impact". Some partners may then buy the accounts and receivables "at fair market value or a stated price".
- **What a cap would force.** The CEO has said a 10% cap would force issuers to cut credit (`dd-regulatory` F3, American Banker, 2026-02-02).
- **What it means:** the 2030–2035 terms the thesis uses to pass the "losing relevance" test fail in the same scenario as the cap. The top five partners are 54% of interest and fees, and three are each over 10% (FY2025 10-K).

### 5. The "credit stress" case isn't a stress case
- **2020, the one public-company stress year.** Synchrony reported a FY2020 ROTCE of 14.4% (old basis), with Q2 2020 at 1.6%. That happened while NCOs *fell* to 4.58%, because stimulus held losses down; the damage came from the reserve build (4Q20 financial tables, filed 2021-01-29). On the recast basis it would be roughly 1.5–1.9 points lower (`dd-diff` F2). The thesis's bear case is a 16% ROTCE held forever.
- **2009–2010, the real credit test.** For the predecessor, NCOs were 11.3% in 2009 and 9.3% in 2010, and 30+ day delinquency was 8.2% at Dec 2009. Net earnings were $401M in 2009, against $1,979M in 2013 (IPO S-1/A, 2014-07-18).
- **What it means:** today's NCO rate is 5.21% (9M 2026). RSA absorbs only about 32–49% of a loss swing, and the reserve build under CECL (the accounting rule that books expected lifetime losses up front) lands on Synchrony in full (`dd-ir` F3). A true consumer-credit recession is not in the valuation table.

### 6. The credit improvement is running out
- **Delinquency is flat.** 30+ day delinquency was 4.4% in Oct 2026 against 4.5% a year earlier, and January–July 2026 matched 2025 month for month (credit 8-K, data to 2026-10-31). Delinquency leads charge-offs, so the year-on-year NCO gain (12-month adjusted rate about 5.2% vs 5.8%) should fade into 2027.
- **The first catalyst is likely to disappoint.** November 2026 has 30 charge-off cycle dates against 28 a year earlier (same 8-K). The December 8-K, the thesis's first catalyst, should look mechanically worse.
- **Synchrony gains least among peers.** Its delinquency improvement is the smallest of the peer group (`dd-peers` F2).
- **Management expects 2027 to be worse.** Management has said 2027 charge-offs may rise as OnePay accounts season. This rests on third-party transcripts that `dd-diff` F8 could not match to any filing.

### 7. Capital room is about $2B, not $6.2B, and buybacks must slow
- **Management's own target.** CET1 was 12.9% on $105.7B of risk-weighted assets (10-Q, 2026-09-30). Management's long-term target is "~11.0% CET1" (Feb 2023 investor deck), repeated on calls (`dd-transcripts` F5). That leaves about $2.0B of excess capital, not the $6.2B the thesis measures against the 7.0% regulatory floor. `dd-credit` F7 marked the target `nothing_found`.
- **Pace of capital return.** Q3 returned about 139% of net earnings. At that pace the 11% target is reached in about 5 quarters (`dd-ir` F8), and management said the $1.1B Q3 buyback "is not a run rate" (`dd-transcripts` F5).
- **Buybacks are carrying EPS.** Q3 net earnings fell 17% while EPS fell only 6% (3Q26 release).

### 8. Rates moved against management's plan
- **The policy rate is above plan.** The fed funds upper bound was raised from 3.75% to 4.00% on 2026-09-17 and is still 4.00% (FRED DFEDTARU, 2026-11-27). Management's January plan assumed 3.25% by year-end 2026 (4Q25 deck, 2026-01-27).
- **Funding costs are exposed in 2027.** $31.5B of CDs, about two-thirds of all CDs, mature in 2027 (`dd-credit` F3). Management expects higher deposit betas (`dd-transcripts` F3). A deposit beta is the share of a rate change that passes through to what deposits cost.

### 9. Smaller items the thesis does not weigh
- **AML control gap.** The FY2025 10-K's anti-money-laundering risk factor now says controls "in certain instances, have not sufficiently detected errors and omissions". No enforcement action is disclosed. It is an admitted control gap that is missing from the kill-switch table.
- **Accounts are flat.** Average active accounts were flat at 68.3M (3Q26 release), even with OnePay live. The FY2025 10-K had expected 2026 growth in average active accounts.
- **Costs are rising.** The efficiency ratio is 35.9%, and other expense rose 10%, driven by "higher operational losses, technology investments and marketing" (3Q26 release). Management guides Q4 expense in line with Q3.

## What would prove it right
- **No cap moves in the new Congress.** No cap bill introduced in the 120th Congress gets a Senate Banking markup by mid-2027 (check Congress.gov). Alternatively, any cap that passes is narrow or temporary. S.381 itself sunsets on 2031-01-01, while the thesis's cap rows treat a cap as permanent, so a sunset cap would do less damage than modelled.
- **Earnings hold without a re-rating.** This is the stronger bull path, and it doesn't need the market to "notice". At 7.3x trailing earnings (yFinance trailing P/E 7.28, a 13.7% earnings yield), holders would earn roughly the earnings yield plus growth if ROTCE stays at 20% or more and capital keeps coming back. That beats a 12% COE even if P/TBV never moves. It still needs no cap and no credit recession.
- **Credit improves again.** Monthly 8-Ks would need to show 30+ day delinquency beating 2025 by at least 0.2 points through Q1 2027, and the January 2027 outlook would need to put 2027 NCOs at or below 5.5%.
- **Q4 2026 and the 2027 outlook deliver.** That means double-digit EPS growth with the efficiency ratio back under 34%.
- **The market confirms it.** The Series A preferred yield would fall clearly below 8% (a price above about $19), and short interest would come down from 11.75% of float (yFinance, 2026-11-13 data).

## Facts the thesis leaned on most

| Fact | Does it hold? | Source |
|---|---|---|
| ROTCE 24.3% (9M26) / 25.2% (Q3), TBV $42.79, price $69.77, P/TBV 1.63x | The numbers hold. The inference "price assumes ~14%" holds only at a 10% COE; at 13.4% the price equals the base case | 3Q26 release (2026-10-20); XBRL (2026-09-30); yFinance (2026-11-27) |
| 10% COE (implicit in §2–3) | **No.** Preferred trades at 8.3–8.4%, the implied equity risk premium is 3.6%, and the market-implied COE has been at least 11.3% at every year-end 2015–2025 | 10-Q; yFinance; Treasury (2026-11-27); XBRL |
| Charge-offs improving year on year (12-month ~5.2% vs 5.8%) | **Only looking back.** The leading indicator is flat (4.4% vs 4.5%), November's calendar is unfavourable, and management flags a 2027 rise | Credit 8-K (2026-10-31 data) |
| Capital room ~$6.2B above the 7.0% floor | **Misleading.** It is about $2.0B above management's ~11% target, used up in about 5 quarters at Q3 pace | 10-Q (2026-09-30); Feb 2023 deck |
| No federal rate cap becomes law | **Assumption, not fact.** There is no law today, but the odds are unsourced, political support rose on 2026-11-21, and the break-even odds are 33% at 10% COE and 18% at 11% | PBS/AP (2026-11-21); Congress.gov API; GovInfo |
| Top-5 partner contracts run 2030–2035 | **Holds as dated terms; weak in the cap case.** Early termination is allowed on a change in law, changes to credit criteria or cardholder terms, or a capital shortfall | FY2025 10-K |
| Bear case 16% ROTCE as "credit stress" | **No.** FY2020 was 14.4% with *falling* NCOs, and the predecessor's NCOs were 11.3% in 2009 | 4Q20 tables; S-1/A (2014) |
| P/E 7.3x on trailing EPS of $9.58 | Holds (7.28x) | yFinance (2026-11-27) |
| Buybacks as a catalyst ($4.6B authorisation left) | The authorisation holds, but the pace must slow toward the 11% target | 3Q26 release; `dd-transcripts` F5 |
| Q3 EPS dip came from a reserve swing | **Half.** Other expense rose $123M (+10%) | 3Q26 release |

Deep-dive errors the thesis inherited:
1. `dd-edgar` F5 says no 10-K mentions a rate cap; the FY2025 10-K does.
2. `dd-credit` F7 says no CET1 target was found; the Feb 2023 deck states ~11.0%.
3. The thesis names S.381 and H.R.1944 as live vehicles; both lapse on 2027-01-03.

## Sources
- Thesis under attack: `runs/20261126-full_hunt/theses/SYF.md` (2026-11-28); deep-dive layers in `runs/20261126-full_hunt/deepdive/SYF/` (2026-11-27)
- FY2025 10-K (risk factors, program-agreement termination, loan yield 21.64%, RSA, partner terms): https://www.sec.gov/Archives/edgar/data/1601712/000160171226000006/syf-20251231.htm (as of 2025-12-31, filed 2026-02-06)
- Q3 2026 10-Q (preferred Series A/B/C coupons, capital, equity): https://www.sec.gov/Archives/edgar/data/1601712/000160171226000043/syf-20260930.htm (as of 2026-09-30, filed 2026-10-22)
- 3Q26 earnings release (ROTCE 25.2%, TBV $42.79, efficiency 35.9%, accounts flat, net earnings −17%, $4.6B authorisation): https://www.sec.gov/Archives/edgar/data/1601712/000160171226000040/earningsrelease3q26.htm (2026-10-20)
- 3Q26 deck (2026 outlook baseline assumptions): https://www.sec.gov/Archives/edgar/data/1601712/000160171226000040/a3q26earningspresentatio.htm (2026-10-20)
- 4Q25 deck (Fed funds 3.25% assumption for year-end 2026; ~28%+ ROTCE target): https://www.sec.gov/Archives/edgar/data/1601712/000160171226000003/a4q25earningspresentatio.htm (2026-01-27)
- Monthly credit 8-K, EX-99.1 (delinquency, NCO, cycle dates): https://www.sec.gov/Archives/edgar/data/1601712/000160171226000045/creditstatsfinancialtables.htm (data to 2026-10-31, filed 2026-11-10)
- 4Q20 financial tables (FY2020 ROTCE 14.4%, NCO 4.58%): https://www.sec.gov/Archives/edgar/data/1601712/000160171221000034/financialtables4q20.htm (as of 2020-12-31, filed 2021-01-29)
- IPO S-1/A (2009 NCO 11.3%, 2010 9.3%, 30+ day delinquency 8.2%, net earnings 2009–2013): https://www.sec.gov/Archives/edgar/data/1601712/000119312514272380/d680310ds1a.htm (filed 2014-07-18)
- XBRL company facts (equity, goodwill, intangibles, preferred, net income, pre-tax, interest and fees, share counts): https://data.sec.gov/api/xbrl/companyfacts/CIK0001601712.json (read 2026-11-28; latest period 2026-09-30)
- Feb 2023 investor deck ("~11.0% CET1", "~28+% ROTCE"): https://d1io3yog0oux5.cloudfront.net/_19037aad8568638f284b4dd8c495fb2f/synchrony/db/3583/33295/pdf/synchrony-investor-slides-final.pdf (2023-02-01, fetched 2026-11-28)
- Treasury daily par yield curve (10-year 4.94%): https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&page&_format=csv (2026-11-27)
- FRED DFEDTARU (fed funds upper bound 4.00% since 2026-09-17): https://fred.stlouisfed.org/series/DFEDTARU (2026-11-27)
- Congress.gov API, S.381 and H.R.1944 status: https://api.congress.gov/v3/bill/119/s/381 and https://api.congress.gov/v3/bill/119/hr/1944 (read 2026-11-28; latest actions 2025-02-04 and 2025-03-06)
- S.381 bill text (10% inclusive of finance charges; fee limit; sunset 2031-01-01): https://www.govinfo.gov/content/pkg/BILLS-119s381is/html/BILLS-119s381is.htm (introduced 2025-02-04)
- 20th Amendment (congressional terms end noon on 3 January): https://www.archives.gov/founding-docs/amendments-11-27 (read 2026-11-28)
- PBS NewsHour / AP, presidential statement and party control (used for the statement only): https://www.pbs.org/newshour/politics/trump-vows-to-work-with-democrats-to-cap-credit-card-interest-rates-at-10 (2026-11-21)
- yFinance prices and market data (SYF $69.77; record close $88.47 on 2026-01-06; beta 1.395; trailing P/E 7.28; short interest 11.75% of float; SYF-PA $16.69; SYF-PB $24.83): https://finance.yahoo.com/quote/SYF (2026-11-27, pulled 2026-11-28)
- My calculations (residual income, implied ROTCE and COE, break-even cap odds, historical P/TBV): `scripts/lib/valuation.py` formulas applied to the sources above (2026-11-28)

<!-- COMPLETE -->
