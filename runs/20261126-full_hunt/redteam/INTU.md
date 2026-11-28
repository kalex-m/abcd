# INTU (Intuit) · Red team · run 20261126-full_hunt · as of 2026-11-28

Inputs read: `runs/20261126-full_hunt/theses/INTU.md` and `runs/20261126-full_hunt/deepdive/INTU/` (8 layers plus `_FOCUS.md`). Every load-bearing number below was re-pulled from a primary source (keys R1-R13 under Sources). Where I lean on a deep-dive figure I did not re-fetch, it says "(deep dive)". Price: $271.94, the Nov 27 2026 close (yFinance, pulled 2026-11-28 [R13]); this matches the thesis.

## Verdict

**weakened**

The valuation arithmetic replicates, and the five facts the thesis leans on mostly hold. The owner-cash-flow starting point is, if anything, conservative.
But the case for the business segment (GBS, Global Business Solutions) is weaker than the thesis presents: its segment margin leaves out product development and customer support; growth comes from price on a 4% customer base; and Q1 money growth added almost no profit. Meanwhile the government free-filing threat was redirected to rivals rather than retired, and Intuit is now cutting its own consumer prices. So "the mistake" covers at most the GBS half of the company, and the next two catalysts lean negative.

## Strongest case against

**1. The "GBS margin far above peers" claim is an accounting artifact, and the Mailchimp sale shows it.**
- Fact: the 10-Q says product development and customer success for GBS and Consumer sit in unallocated corporate costs, while Mailchimp's segment costs include them [R1, period 2026-10-31]. When Mailchimp was split out, Intuit moved $313M of FY26 costs from GBS and $355M from corporate into it [R3, 2026-11-19]. Measured the GBS way, Mailchimp's FY26 profit was $959M, a 75% margin on $1,272M revenue. With its own product and support costs it was $604M, a 47.5% margin (my arithmetic from R3). Bending Spoons is paying $3.68B, which is 2.9x revenue, 3.8x the GBS-style profit and 6.1x the fuller-cost profit [R1, R3].
- Meaning: platform costs alone took 28 points off Mailchimp's margin. The thesis compares GBS's ~77% (before research, support, G&A and stock pay) with peers' full operating margins of 7-25%. That comparison is not evidence. If GBS carries a similar 28-point load, it sits near 49% before G&A, corporate marketing and stock pay. That is still good, but not "far above" anything. True GBS profit is not disclosed.
- Confidence: high on the facts; medium on applying Mailchimp's cost ratio to GBS.

**2. GBS growth is price-led on a slowing customer base, and the money growth the thesis cites added almost no profit in Q1.**
- Fact: GBS growth excluding Mailchimp ran 20%, 21%, 17% and 15% across the FY26 quarters, then 15% in Q1 FY27 [R3]. The FY27 guide of $13,068-13,158M implies only +12.0% to +13.0% for Q2-Q4: ($13,068M−$3,083M)/$8,918M and ($13,158M−$3,083M)/$8,918M, my arithmetic from R3. GBS segment profit grew 11.8% while its margin slipped from 78.7% to 76.3% [R1, R3].
- Fact: total online paid customers grew 4% to 7.9M. Customer growth slowed 2 points year over year and 6 points since FY23, and management said "new customer growth was not at the pace we expected". ARPC (revenue per customer) rose 18%, and US QuickBooks Online retention is 83% [R6 pp.73-74, 2026-09-17]. The 10-Q lists "higher effective prices" first among the causes of QuickBooks Online growth (+19%). Desktop grew 2% on price, with fewer customers [R1].
- Fact: in Q1 FY27, payments revenue rose $62M while online payments cost of revenue rose $55M. QuickBooks Capital (small-business lending) revenue rose $30M while its cost of revenue rose $25M [R1]. In FY26 the same lines were +$257M revenue vs +$80M cost (payments) and +$177M vs +$115M (Capital) [R4]. So the extra gross profit kept from each new money dollar fell from about 69% and 35% to about 11% and 17% (my arithmetic).
- Fact: Xero, the closest cloud-accounting rival, grew customers 12% to 5.146M. Its net adds of 226,000 were up 28%, and its US customers reached 455,000, with US revenue +51% pro forma [R11, half-year to 2026-09-30].
- Meaning: the profit pool the whole thesis rests on is growing by raising prices on a base that adds about 4% a year and loses 17% of US QuickBooks Online customers a year. That is the same model that just broke in TurboTax, where higher prices drove DIY filers away and forced price cuts. Demand for cloud accounting is not the limit; rivals are adding customers three times faster. The "+33% payment volume" is real volume but, so far, near-zero extra profit. The base case needs about 12% GBS growth for years, and the trend points to the middle or low end of the new 10-15% target.
- Confidence: high on the facts; medium on the money-margin read (one quarter).

**3. The Consumer side is not being misread. Intuit is cutting its own prices, and the free-filing push now favours its rivals.**
- Fact: US TurboTax units went 45.9M, 43.3M, 41.4M, 40.7M, 39.9M, 39.0M over FY21-FY26. TurboTax Online retention is 76% [R6 p.107]. TurboTax's share of IRS e-files fell 1.0 point and its DIY e-file share fell 3 points [R6 pp.137, 158]. Over the same period, IRS self-prepared e-files rose 1.7%, from 66.839M to 67.997M (season to 2026-10-16) [R10].
- Fact: Intuit's FY27 priorities say "Scale Credit Karma Tax at $0 federal / $15 state to win price-sensitive filers" and "Prioritize customer and e-file growth over maximizing ARPC" [R6 p.120]. Consumer ARPC growth (+11% in FY26 [R6 p.158]) was the Consumer growth engine, and management is now turning it down on purpose. The FY27 Consumer guide is +2-4%, with Credit Karma +3-7% and TurboTax +2-3% [R2, 2026-11-19]. Consumer was 39.8% of FY26 segment profit ($6,308M of $15,840M) [R3].
- Fact: Treasury's Oct 2, 2025 report suspends Direct File and refocuses the IRS on "strengthening existing free filing programs, particularly Free File". About 70% of taxpayers are eligible; "eight companies participate"; the agreement runs to Oct 31, 2029 [R9]. Intuit left Free File after the 2020 tax season [R8]. Intuit's FY26 10-K warns Free File adoption "could expand with increased awareness of and government support" [R4].
- Meaning: the thesis scores "Direct File suspended" as a threat that faded. In fact the government's free-filing effort was pointed at Intuit's free and low-cost competitors, the same price-sensitive DIY group Intuit says it is losing. Intuit's answer is a $0 product of its own, which competes with paid TurboTax. Its own Investor Day concedes the brand risk ("without diluting TurboTax's higher-value positioning", [R6 p.120]).
- Confidence: high.

**4. The catalysts lean negative in the next two quarters.**
- Q2 FY27 (late Feb 2027) is guided at GAAP EPS of $2.55-2.60 (+3% to +5%) and revenue +6% to +7% [R2]. Consumer revenue is guided down mid-single digits (deep dive, Q1 script).
- Mailchimp sale: Intuit "intend[s]" to use the cash on buybacks in FY27 and expects a pre-tax gain, so tax may cut the $3.31B (amount not disclosed) [R1]. Q1 buybacks were already $1,472M against $6.4B of authorisation left [R1, R5], so the $3.3B may replace rather than add to normal buybacks. Replicating the thesis DCF, removing Mailchimp's roughly $0.46B a year of after-tax profit and retiring $3.31B of stock at $271.94 moves the base value from $347 to $343. The sale is neutral to slightly negative per share, not a value catalyst.
- The CEO's 10b5-1 plan (up to 94,477 shares) starts selling on Dec 11, 2026. The CFO's (18,600 shares) and the strategy chief's (70,394 shares) start Dec 16, 2026 [R1]. Form 4 sale filings will appear within weeks of this thesis.
- Tax season (May 2027) is built on lower revenue per customer by design [R6 p.120]. Even if units stop falling, revenue is guided to only +2-3% [R2].
- Confidence: high on the facts; medium on how the market reads them.

**5. The capital-allocation record fails the "capital spent wisely" lens (CLAUDE.md 1.1).**
- Mailchimp was bought on Nov 1, 2021 for $12.0B ($5.7B cash plus 10.1M shares worth about $6.3B) [R7] and is being sold for $3.68B [R1]. That is a loss of about $8.3B, or 69%.
- FY26 buybacks were $5,412M [R5] for about 13.37M shares (deep dive), an average near $405, which is 33% above today's price (about $1.8B lost at market).
- Credit Karma cost $7.2B in Dec 2020 [R7]. Its FY27 growth guide was cut from +11-13% to +3-7%, with a shift to AI-led discovery named as a cause (deep dive, Q1 FY27 script).
- Meaning: quality "B" rests on the businesses, not on how management has deployed cash. The thesis's "war chest and good management" leg is unproven for 2020-2026.

**6. Guidance and disclosure are getting less reliable just as the thesis needs them.**
- The Credit Karma FY27 guide was reaffirmed on Sep 17 and cut on Nov 19, 63 days later. Operating income guidance was held up by lower stock pay rather than by revenue (deep dive, dd-ir F5-F6). The Q1 revenue beat over the top of guidance was $41M, against 3-4 points in FY25 (deep dive, dd-diff F6).
- Two securities class actions (filed Jul 10 and Aug 17, 2026) allege false statements in 2025-26, and two derivative suits followed [R1].
- The Investor Day says FY26 counts are "a one-time baseline; ongoing disclosures will be year-over-year growth rates" [R6 p.158]. TurboTax units were restated upward after the IRS data source changed, and TY25 IRS e-file figures are "estimated based on internal Consumer Group projections" [R6 p.107].
- Meaning: thesis fact 3 ("gradual" decline) rests on a measure the company has just redefined, and absolute counts stop being published. That makes the kill switch harder to check.

**7. Small-business lending is growing fast and sits outside the cash-flow measure.**
- Fact: loans bought for the book were $3,992M in FY25 and $6,755M in FY26 (+69%), then $1,798M in Q1 FY27 vs $1,297M a year earlier. Credit-loss provisions were $134M in FY25 and $237M in FY26 (+77%), then $64M vs $40M in Q1. Loans sold rose from $562M to $2,210M [R5]. The net cash put into the book was $724M in FY25 and $292M in FY26 (my arithmetic). It sits in investing cash flow, so it is not deducted from FCF. The loans are unsecured and bought from a partner bank [R1].
- Meaning: part of GBS's money growth is unsecured small-business credit, kept off the balance sheet by selling loans. Provisions run at about 3.4-3.6% of purchases, steady so far, so this is a late-cycle exposure rather than a current problem. The thesis does not mention it.
- Confidence: medium.

**8. The cushion is about one discount-rate point wide.**
- Replicating the thesis method, the base value is $347 at a 10% discount rate, $301 at 11% (cushion +11%) and $409 at 9%. The growth the price implies is 0.9%, 3.0% and 4.8% at those rates. The bear case ($264) sits about at the price, and terminal value is 54% of the base value (my arithmetic, scratch DCF on the thesis inputs).

**Where the attack fails (stated plainly):**
- The $5.0B owner-FCF base is conservative. FY26 cash taxes were $281M against $1,451M of GAAP tax [R5], and the thesis already deducts FY27's roughly $2B of cash taxes.
- FY27 guidance is non-GAAP EPS of $22.88-23.12, which now includes stock pay, or about $6.0B of net income at 262-268M shares. GAAP EPS is guided at $20.12-20.36 (+22% to +24%) [R2]. On a $5.6B base, the price implies only about 1.7% growth.
- The balance sheet is not a risk (deep dive, dd-credit). The FTC matter is closed: "The deadline for the FTC to appeal the Fifth Circuit's decision has passed" [R1].
- The 2021 DOJ judgment bars reacquiring the divested Credit Karma Tax assets and joint ventures with the buyer until about Aug 2031. I found no clause that blocks the new $0 Credit Karma Tax product [R12].

## What would prove it right

1. **Q2 FY27 10-Q (late Feb 2027):** GBS revenue ≥ +13%, GBS segment profit growing at least as fast as revenue, and payments plus Capital cost of revenue growing more slowly than their revenue in the MD&A.
2. **FY27 10-K / Sep 2027 Investor Day:** online paid customer growth back to ≥ 5% (the old 5-10% band) with US QuickBooks Online retention ≥ 83%.
3. **Q3 FY27 (May 2027) plus IRS season statistics:** TurboTax IRS e-file share ≥ 24.9% (stops falling) and TurboTax revenue inside the +2-3% guide despite lower revenue per customer; Credit Karma Tax adds filers without visible TurboTax DIY cannibalisation.
4. **Credit Karma:** no further guide cut, and Q2-Q3 growth ≥ +3%.
5. **Mailchimp:** closes by mid-2027, and total FY27 buybacks exceed about $9B (the Q1 run-rate × 4 plus $3.3B), which would show the proceeds are extra, bought below ~$300.
6. **FY27 owner FCF** (operating cash flow minus capex minus stock pay) ≥ $5.5B, which at $271.94 means the price needs under 2% a year growth.
7. **Insiders:** the CEO or CFO cancels the September 2026 sale plans or buys in the open market.

## Facts the thesis leaned on most

| Fact (thesis) | Does it hold? | Source |
|---|---|---|
| 1. Owner FCF ~$5.0B after stock pay and tax normalisation | **Holds, conservative.** OCF $8,838M, capex $175M + capitalised software $46M, stock pay $2,056M; FY26 cash taxes $281M vs GAAP $1,451M; FY27 non-GAAP net income guide (stock pay included) is about $6.0B. Two offsets the thesis omits: net loan-book investment ($724M FY25, $292M FY26) and Mailchimp's departing ~$0.46B. | R5 (FY26, 2026-07-31); R2 (2026-11-19) |
| 2. GBS like-for-like +15%, segment profit +12%, target 10-15% | **Holds as reported, trend weakening.** Q1 +15.3%, profit +11.8%, margin 78.7% → 76.3%; implied Q2-Q4 +12-13%; customers +4%, growth on price; Q1 money growth added about $12M of gross profit on $92M of revenue. | R1 (2026-10-31); R3 (2026-11-19); R6 pp.73-74 (2026-09-17) |
| 3. TurboTax unit decline is gradual (~3%/yr) | **Holds on the company's count** (45.9M → 39.0M, -3.2%/yr), but the count was redefined in 2026, TY25 IRS data are internal estimates, absolute counts stop being published, and the FY27 plan cuts revenue per customer. Revenue, not units, is the next risk. | R6 p.107, p.120, p.158 (2026-09-17); R10 (2026-10-16) |
| 4. EPS beat the top of guidance nine quarters running | **Holds, weak support.** Q1 FY27 non-GAAP EPS $2.91 vs $2.44-2.48 guided, with investment gains excluded. But the beats come from costs: the revenue beat shrank to $41M, and the Credit Karma revenue guide was cut 63 days after being reaffirmed. | R2 (2026-11-19); deep dive dd-diff F6, dd-ir F5 |
| 5. Direct File and FTC order no longer live threats | **FTC: holds** (appeal deadline passed; suit dismissed 2026-09-15). **Direct File: holds narrowly.** Treasury replaced it with a push to promote Free File (~70% of taxpayers eligible, 8 providers, runs to Oct 2029), which Intuit left in 2021. The free-filing threat moved to rivals. | R1 (2026-10-31); R9 (2025-10-02); R8 (2021-07-31); R4 (2026-07-31) |
| GBS segment margin ~77% far above peers' 7-25% | **Does not hold as a comparison.** It excludes product development and customer success; Mailchimp's margin fell from 75% to 47.5% once those were allocated, and it sold for 2.9x revenue. | R1; R3 (2026-11-19) |
| Business Money payment volume +33% shows GBS strength | **Volume holds; profit does not yet.** Payments revenue +$62M vs payments cost +$55M in Q1 FY27. | R1 (2026-10-31) |
| Reverse DCF ~3% growth; base $348, bear $264 | **Holds arithmetically** (replicated $347 / $264 / 3.0%). Sensitive: implied growth 4.8% and base $301 at an 11% discount rate. | thesis inputs; R13 price (2026-11-27 close) |
| Mailchimp sale plus $3.31B buyback as a catalyst | **Terms hold, catalyst weak.** "Intend", pre-tax gain (possible tax leakage), may replace run-rate buybacks; per-share value neutral to slightly negative ($347 → $343). | R1 (2026-10-31, filed 2026-11-19) |
| Price $271.94, shares 263.5M | **Holds.** EDGAR cover count is 264.0M at 2026-11-12 (immaterial). | R13 (2026-11-28); R5 |

## Sources

- R1 Intuit Q1 FY27 10-Q (period 2026-10-31, filed 2026-11-19): https://www.sec.gov/Archives/edgar/data/896878/000089687826000045/intu-20261031.htm (segment cost policy; GBS and money MD&A; Mailchimp gain and buyback intent; notes receivable; legal note; Item 5 trading plans)
- R2 Intuit Q1 FY27 earnings release, EX-99 (2026-11-19): https://www.sec.gov/Archives/edgar/data/896878/000089687826000043/fy27q1earningspressrelease.htm (FY27 and Q2 guidance; Table B1/B2 non-GAAP reconciliation)
- R3 Intuit Q1 FY27 fact sheet (2026-11-19): https://investors.intuit.com/_assets/_7a9f62942b3b9f5151594b96c12aa9df/intuit/db/1072/10431/pdf/Q1_FY27_Fact_Sheet_External_vShared.pdf (recast segment revenue and operating income; note [D] Mailchimp cost reclassification)
- R4 Intuit FY26 10-K (period 2026-07-31, filed 2026-09-09): https://www.sec.gov/Archives/edgar/data/896878/000089687826000037/intu-20260731.htm (FY26 money revenue and cost drivers; Free File risk factor)
- R5 SEC XBRL company facts, CIK 896878 (pulled 2026-11-28; latest period 2026-10-31): https://data.sec.gov/api/xbrl/companyfacts/CIK0000896878.json (OCF, capex, capitalised software, stock pay, cash taxes paid, tax expense, buybacks, loan purchases/repayments/sales, provisions, goodwill, shares)
- R6 Intuit Investor Day 2026 deck (2026-09-17): https://investors.intuit.com/_assets/_7a9f62942b3b9f5151594b96c12aa9df/intuit/db/923/10406/pdf/ID_FY27_PRINT_FINAL-rev2.pdf (PDF pp.73-74 customers and retention; p.99 and p.157 targets; p.107 TurboTax units and retention; p.120 Credit Karma Tax and ARPC priority; p.137 share changes; p.158 baseline metrics and disclosure note)
- R7 Intuit FY22 10-K (period 2022-07-31): https://www.sec.gov/Archives/edgar/data/896878/000089687822000028/intu-20220731.htm (Mailchimp $12.0B; Credit Karma $7.2B)
- R8 Intuit FY21 10-K (period 2021-07-31): https://www.sec.gov/Archives/edgar/data/896878/000089687821000233/intu-20210731.htm (exit from IRS Free File after the 2020 tax season)
- R9 U.S. Treasury, Report on the Replacement of Direct File (2025-10-02): https://home.treasury.gov/system/files/131/Report-Replacement-of-Direct-File-2025.pdf
- R10 IRS filing season statistics, week ending 2026-10-16 (page updated 2026-11-18): https://www.irs.gov/node/167596
- R11 Xero H1 FY27 results release, ASX (period to 2026-09-30, released 2026-11-12): https://announcements.asx.com.au/asxpdf/20261112/pdf/076hqdzy5xhp2z.pdf
- R12 U.S. v. Intuit Inc. and Credit Karma, Final Judgment, D.D.C. 20-cv-3441 (filed 2021-08-02): https://www.justice.gov/media/1158436/dl?inline (Section XII no reacquisition; Section XV 10-year term)
- R13 yFinance quote INTU (last price $271.94, Nov 27 2026 session; pulled 2026-11-28): https://finance.yahoo.com/quote/INTU
- Deep-dive figures used without re-fetch: FY26 repurchase share count and the Q1 FY27 Consumer guide (`dd-credit.md`, `dd-ir.md`, citing the Q1 FY27 script https://investors.intuit.com/_assets/_7a9f62942b3b9f5151594b96c12aa9df/intuit/db/946/10425/webcast_transcript/Q1_FY27_Earnings_Script.pdf, 2026-11-19); the guidance-beat history (`dd-diff.md` F6).

Coverage of this red team: thesis and all 8 layers read; primary re-checks covered (R1-R13). Mailchimp HSR status: nothing_found. Q1 FY27 call Q&A transcript: unreachable (the IR site posts prepared remarks only). Tax on the Mailchimp gain: not disclosed.

<!-- COMPLETE -->
