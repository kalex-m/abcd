# SYF dd-edgar: EDGAR filing layer (run 20261126-full_hunt, as of 2026-11-27)

## Summary for main thread
1. Credit is better than a year ago but barely on delinquency: 30+ delinquency is only 0.1pt below last year for Aug-Oct 2026 (4.4% vs 4.5% in Oct) and was level with 2025 Jan-Jul. The real gain is charge-offs (adjusted 12-month average about 5.2% vs 5.8%). Oct's 4.4% charge-off print is flattered by 25 charge-off cycle dates vs 28; Nov has 30 vs 28, so the Dec 10 8-K will look worse mechanically.
2. Partner concentration eased: top-5 contracts now expire 2030-2035 (was 2026-2034); 22 of the 25 largest run past 2027 (was 17). The ACL critical audit matter is unchanged in substance, with no material weakness.
3. Triage corrections: CET1 12.9% vs 13.7% a year ago at holding-company level (14.3% was the Bank's). Q3 net earnings fell 17%; EPS fell only 6% because of buybacks.

Thesis impact: neutral

## Findings

**F1. Monthly credit 8-Ks, 24+ months (Items 7.01/9.01).**
Fact: 30+ delinquency, Jan to Oct 2026: 4.6, 4.7, 4.5, 4.3, 4.2, 4.2, 4.2, 4.2, 4.3, 4.4. Same months 2025: 4.7, 4.7, 4.5, 4.3, 4.2, 4.2, 4.2, 4.3, 4.4, 4.5. The seasonal low-to-October rise is +0.2pt (2026), +0.3 (2025), +0.3 (2024); the Feb-to-May drop is 0.5pt in all three years. Oct 2024 was 4.9%.
Source: https://www.sec.gov/Archives/edgar/data/1601712/000160171226000045/creditstatsfinancialtables.htm (2026-10-31); .../000160171225000262/creditstatsfinancialtables.htm (2025-10-31); .../000160171224000340/creditstatsfinancialtables.htm (2024-10-31).
Means: no worse-than-seasonal trend, but the year-on-year improvement has shrunk from 0.4pt (Oct 2025 vs 2024) to 0.1pt. "Better than a year ago" is true but inside rounding. Confidence: high.

**F2. Charge-offs and the calendar effect.**
Fact: adjusted NCO rate averaged about 5.2% for Nov 2025-Oct 2026 vs about 5.8% for the prior 12 months (my arithmetic from the tables). Oct 2026 was 4.4% reported / 4.6% adjusted vs 5.0% / 5.3% a year ago. Oct 2026 had 25 charge-off cycle dates vs 28 in Oct 2025; Nov 2026 has 30 vs 28. The 8-K footnote says the count can move the monthly figure "with no corresponding change in the performance of the portfolio."
Source: creditstatsfinancialtables.htm above (2026-10-31).
Means: the improvement is real on a 12-month view (Q3 NCO 4.79% vs 5.16%, 10-Q 2026-09-30). But the Nov print (8-K due about Dec 10) is likely to show a mechanical rise, so the near-term catalyst can disappoint on headlines. Confidence: high on facts; the size of the Nov effect is my estimate.

**F3. Reserve release is over; coverage is shrinking.**
Fact: allowance $11.03B (Sep 2024), $10.44B (Dec 2025), $10.34B (Sep 2026). Quarterly change: -100, -101, -264, -191, +69, -14, -116, +29 ($M) over the eight quarters. Q3 2026 provision $1,266M vs $1,146M; NCO $1,236M vs $1,298M (write-offs $1,652M less recoveries $416M), so a $30M build vs a $152M release. Coverage fell to 10.01% from 10.35%. Net earnings $892M vs $1,077M (-17%); diluted EPS $2.68 vs $2.86 (-6%).
Source: XBRL facts https://data.sec.gov/api/xbrl/companyfacts/CIK0001601712.json (read 2026-11-27); 10-Q https://www.sec.gov/Archives/edgar/data/1601712/000160171226000043/syf-20260930.htm (2026-09-30).
Means: confirms that Q3 was a reserve swing, not worse credit. But "reserves about 10% of loans" is a falling cushion (about 10.8% two years ago), and the earlier EPS tailwind from releases is gone. Other expense rose $123M on higher operational losses, technology and marketing, a second drag the triage did not stress. Confidence: high.

**F4. Critical audit matter and controls.**
Fact: KPMG's FY2025 opinion has one CAM, the allowance ($10,442M), as in FY2024. The assumptions list was shortened (six named drivers in 2024; segmentation, macro forecast and qualitative adjustments in 2025). ICFR effective, no material weakness, auditor since 2013, no 4.01/4.02, no NT filing. Q3 10-Q: controls effective, no risk-factor changes.
Source: https://www.sec.gov/Archives/edgar/data/1601712/000160171226000006/syf-20251231.htm (2026-02-06); 2025 10-K .../000160171225000044/syf-20241231.htm.
Means: no accounting red flag. Confidence: high.

**F5. Risk-factor diff, 10-K FY2025 vs FY2024.**
Fact: dropped, the standalone CFPB late-fee rule risk (rule vacated 2025-04-15). Added or sharpened: agentic commerce (AI shopping agents) and platform competition (Shopify, Stripe, Versatile Credit, acquired Oct 2025); Visa/Mastercard interchange settlement (Nov 2025); the capital-rule and AI items; "tax rates" added to growth risks. Unchanged: the RSA risk. It says SYF "may not be able to pass on" higher actual expenses (funding, provision, operations) through lower RSA payments, because partner payments use agreed measures. There is no mention of a credit-card interest-rate cap or the Credit Card Competition Act in either 10-K.
Source: FY2025 and FY2024 10-Ks above. RSA payments rose 17.6% to $4,005M in 2025 "due to lower net charge-offs and pricing changes"; Q3 2026 RSA +$72M.
Means: RSAs share the downside only partly and give partners most of the upside when losses fall (they did in 2025). They cushion less than the triage implies. The rate-cap risk is not yet a filed risk factor (policy news is outside this layer). Confidence: medium-high.

**F6. Partner concentration.**
Fact: top five by interest and fees are Amazon, Lowe's, PayPal, Sam's Club, TJX (JCPenney left the top five), 54% of interest and fees and 52% of loans; Lowe's, PayPal and Sam's Club are each over 10%. Expiries for the top five: 2030-2035 (FY2025) vs 2026-2034 (FY2024). 22 of the 25 largest programs expire 2028 or later, 97% of interest and fees (FY2024: 17 of 25, 82%). OnePay (Walmart) launched Sep 2025 as exclusive issuer; Q3 2026 10-Q lists it. Lowe's commercial portfolio (about $0.8B) acquired Apr 2026. More than 40 partners added or renewed in 9M 2026.
Source: FY2025 10-K; FY2024 10-K; 10-Q 2026-09-30.
Means: the near-term loss-of-partner risk has dropped. Concentration (54%) has not. Confidence: high.

**F7. CET1 and capital, with a triage correction.**
Fact: holding-company CET1 12.9% at 2026-09-30 vs 13.5% at 2025-12-31 (recast) and 13.7% at 2025-09-30. The Bank's CET1 was 14.3% at 2026-09-30 and also 14.3% at 2025-09-30. Q3 buybacks 14.1M shares at $78.21 average; $4.55B authorisation left (new $6.5B programme, no expiry); dividend $0.34. March 2026 capital proposals would cut retail risk weights by 10% but bring AOCI into CET1.
Source: 10-Q 2026-09-30 and 2025-09-30 (.../000160171225000259/syf-20250930.htm).
Means: the triage's "14.3% to 12.9%" compares the Bank with the holding company; the true year-on-year fall is about 0.8pt. Capital is still ample but buybacks are using it faster than retention. Confidence: high.

**F8. 8-K Items 5.02, 1.01, 2.xx, 4.xx.**
Fact: 5.02 on 2026-06-29: the CTO/operations role is split among peers, Carol Juel moved to CEO of Digital (succeeding Bart Schaller, retiring), Florin Arghirescu is CTO, and DJ Casto took Operations (servicing, collections). Directors elected 2025-09-26 and 2024-09-12. No 1.01, 2.01, 2.03, 2.05, 2.06, 4.01 or 4.02 since 2024-06. Debt was issued under Item 8.01: $750M (Feb 2026), $1.1B (Jul 2026), $1.0B (Jul 2025), $800M (Mar 2025) at 4.9-6.3%, plus $500M Series C preferred at 7.25% (Jun 2026).
Source: https://www.sec.gov/Archives/edgar/data/1601712/000160171226000027/syf-20260629.htm (2026-06-29); .../000119312526328719/d112401d8k.htm; .../000119312526259868/d244139d8k.htm.
Means: collections moving under an HR/operations head while operational losses rose is worth a transcripts question. Confidence: medium.

**F9. DEF 14A (2026-04-29) and Forms 144.**
Fact: annual bonus is 60% PPNR minus charge-offs, 20% receivables growth and 20% qualitative. PSUs (55% of long-term pay) use EPS and ROE with a +/-20% relative-TSR modifier. Say-on-pay 90.6%. Management claims its PRISM credit platform cut 2025 NCOs by $756M (company claim, unaudited). Twenty-seven Form 144s since Nov 2025, all for plans adopted months earlier. Most are under $4M; the largest is 217,554 shares ($14.7M, 2026-03-02). One 144 shows a $25.2B value for 4,000 shares (2026-08-03), a filer typo.
Source: https://www.sec.gov/Archives/edgar/data/1601712/000160171226000017/synchronyfinancialproxy202.htm (2026-04-29); Form 144 primary_doc.xml files listed in the submissions feed (https://data.sec.gov/submissions/CIK0001601712.json).
Means: pay is tied to credit-adjusted earnings, which is good alignment. Insider selling is routine. Confidence: medium.

**F10. Legal note.** FY2025 vs FY2024 Note 18 and the Q3 2026 Note 15 use the same wording: reasonably possible losses "immaterial", no material pending matter. Confidence: high.

## Coverage
| Item | Status | Note |
|---|---|---|
| 10-K | covered | FY2025 and FY2024 read; risk factors, CAM, ICFR, partners, legal |
| 10-Q (8 quarters) | covered | Q3 2026 and Q3 2025 read in full; the other quarters via XBRL facts (provision, write-offs, recoveries, allowance, net income), not text |
| 8-K incl. EX-99 | covered | Monthly credit EX-99.1 for Oct 2024, 2025 and 2026 (thirteen months each, 37 months); 5.02, 8.01 and 3.03 8-Ks; earnings EX-99 left to dd-ir |
| Risk factors year on year | covered | Sentence and heading diff, FY2025 vs FY2024 |
| Auditor report and CAMs | covered | F4 |
| Internal controls | covered | F4 |
| DEF 14A | covered | 2026 proxy: pay metrics only; the remaining sections were not read |
| S-1/S-3/S-8/424B | covered | S-3ASR 2025-07-17; S-8 2024-06-28; 424B5s are notes and preferred (F8); no S-1 (nothing_found for S-1) |
| EX-4/EX-10/EX-21 | covered | Exhibit index diffed: new indentures and notes forms, LTIP amendment; no new program agreement; EX-21 listed, not opened |
| NT filings | nothing_found | None in the feed, 2022-03 to date |
| CORRESP/UPLOAD | nothing_found | None in the feed, 2022-03 to date; the older archive page was not searched |
| Form 144 | covered | F9 |
| Amendments (10-K/A, 8-K/A) | nothing_found | None in the feed |
| Items 4.01 / 4.02 | nothing_found | |
| Item 5.02 | covered | F8 |
| Items 1.01 / 2.01 / 2.03 / 2.05 / 2.06 | nothing_found | None since 2024-06; the last 1.01 was 2022-04-04 |

## Feedback
- Contradicts the Slowdown pricing: charge-offs and delinquency are below last year (credit 8-K 2026-11-10); weak on delinquency since the margin is 0.1pt.
- Confirms nominal-spend strength with a payment-rate lift: loans +3.2% y/y, partly from higher payment rates (10-Q 2026-09-30).

<!-- COMPLETE -->
