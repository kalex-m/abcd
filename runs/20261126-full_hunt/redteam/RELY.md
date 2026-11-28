# RELY · Remitly Global · Red team (run 20261126-full_hunt)

Written 2026-11-28. Inputs read: `theses/RELY.md` and `deepdive/RELY/` (8 layers) only. Primary re-checks: EDGAR 10-Qs, 10-Ks, XBRL and EX-99 files; govinfo bill text and status; yFinance for price only. "My arithmetic" marks numbers I derived.

## Verdict

**weakened**

Every fact the thesis leans on checks out in primary sources. But the +20% cushion does not survive three fair fixes: diluted shares, 2027 growth at management's own low end, and a charge for the customer-funds capital that grows with volume. Those take base value to $20.2–$23.5, which is −7% to +8% against $21.84.
The "mistake" isn't shown. The stock more than doubled after the tax took effect, then fell 20% on the company's own slowdown signal, and primary customer data confirm that slowdown. That looks like the market pricing slower growth, not misreading the tax. Survived now hangs on a cushion close to zero, so Watch is a defensible call under the 6.4.1 rules.

## Strongest case against

**1. Growth is slowing faster than the base case allows, and part of 2026 was borrowed.**
- Active-customer growth by quarter: Q3'24 35%, Q1'25 29%, Q2'25 24%, Q3'25 21%, Q1'26 20%, Q2'26 20%, Q3'26 17%. Sources: Q3'24, Q1'25, Q2'25, Q3'25, Q1'26, Q2'26 and Q3'26 10-Qs (S7, S6, S5, S4, S3, S2, S1).
- Send-volume growth: Q3'24 42%, Q1'25 41%, Q2'25 40%, Q3'25 35%, Q1'26 37%, Q2'26 27%, Q3'26 25%. Sources: same 10-Qs. Q1'26 was the quarter right after the tax took effect (2026-01-01).
- Sequential net customer adds collapsed after the tax-driven first half. Q2'26 added +565k (Q2'25: +476k). Q3'26 added +144k (Q3'25: +345k), a 58% drop year over year. Counts: 8,035k / 8,511k / 8,856k (2025) and 9,634k / 10,199k / 10,343k (2026) (S3, S2, S1, S6, S5, S4; my arithmetic). This is the primary-data version of the CFO's pull-forward comment, which the deep dive only had from secondary call summaries.
- Send volume per active customer rose from $2,202 to $2,359 (+7%, Q3'25 to Q3'26; my arithmetic from S1). Growth is leaning more on bigger sends per customer and less on new customers.
- Revenue beats against the guide midpoint shrank from +7.3% (Q2'25) to +0.8% (Q3'26) (EX-99.1 releases, per `dd-diff.md`; Q3'26 release S11). The Q4'26 guide is revenue +20–21% and adjusted EBITDA margin 20%, below the 22% full-year figure (S12, 2026-11-04).
- No 2027 outlook appears in the primary Q3'26 release or deck (S11, S12; searched for "2027"). The "high teens, toward the lower end" framing comes only from secondary call summaries (`dd-transcripts.md`). Even so, the thesis base case starts owner-FCF growth at 18%, above that low end, while the same summaries say 2027 margin will be "broadly in line" with spending normalising. With a flat margin, FCF can't grow faster than revenue.
- What it means: the base path (18% fading to 6%) needs owner FCF to roughly triple in 10 years, from $180M to ~$556M, with 59% of value in the terminal value (my arithmetic, reproducing the thesis model). The corridors grow ~2%, so all of that has to come from share gains, and the rate at which new customers arrive has just halved.

**2. The cushion is thin once the valuation is made consistent.**
- The thesis subtracts the ~$397M net customer-funds position from cash because it is tied up in running the business. It then charges nothing for that position growing. It can't be both.
- Net customer funds (prefunding + customer funds receivable − customer liabilities) as a share of annual send volume: $397.8M, about 1.0% (12/31/23); $293.9M, 0.54% (12/31/24); $508.1M, 0.68% (12/31/25); $431.2M, 0.48% (9/30/26, against TTM volume of $90.7B). Sources: FY24 10-K (S9), FY25 10-K (S8), Q3'26 10-Q (S1); ratios are my arithmetic.
- At the 9/30/26 ratio of 0.48%, a year of 18% volume growth ties up ~$78M, about 43% of the $180M base. History has been kinder because the ratio halved after 2023, and it can't keep halving. I use 0.25–0.48% as the range.
- The model uses 214.0M basic shares. Q3'26 diluted weighted shares were 223.6M, including 10.8M incremental shares from awards already granted (S10, XBRL `WeightedAverageNumberOfDilutedSharesOutstanding`, `IncrementalCommonSharesAttributableToShareBasedPaymentArrangements`, filed 2026-11-04). Deducting future stock pay from FCF doesn't cover awards already outstanding.

| Case (thesis model: 10% discount, 3% terminal, $270M cash credit) | Value/share | vs $21.84 |
|---|---|---|
| Thesis base (18% fading to 6%, 214.0M shares) | $26.22 | +20.1% |
| A: diluted 223.6M shares | $25.10 | +14.9% |
| B: start at 16% (low end of high teens) | $24.34 | +11.5% |
| C: customer-funds charge at 0.48% of new volume | $22.58 | +3.4% |
| A+B+C (0.48%) | $20.21 | −7.5% |
| A+B+C (0.25%) | $21.69 | −0.7% |
| A+B+C (0.25%) on a $195M base instead of $180M | $23.53 | +7.7% |
| Bear (10% fading to 3%) with A+C (0.25%) | $16.07 | −26.4% |

All values are my arithmetic using `scripts/lib/valuation.py`. The thesis figures reproduce exactly ($26.22 base; 9.86% reverse-DCF growth, meaning the growth rate today's price implies). With the customer-funds charge and diluted shares, the implied growth rises to 11.2–11.9%.

To be fair: the $180M base is, if anything, conservative. It reproduces from XBRL (TTM FCF $381.1M, TTM stock pay $143.0M, ~$56M tax at 25% on TTM pre-tax $222.6M; S10). My rough FY2026 run-rate from the guide is ~$195–210M. That is why the last-but-one row keeps a small cushion.

**3. Remitly is giving up price per dollar sent, and so is every digital rival.**
- Revenue per dollar sent (take rate) fell from 2.32% to 2.09% over two years ($336.5M on $14.5B in Q3'24; $509.8M on $24.4B in Q3'26; S7, S1, my arithmetic). That is −23bp, not the "~6bp" in the thesis (which is one year only). Revenue less transaction expenses per dollar sent fell from 1.52% to 1.42% (S7, S1).
- Western Union's Branded Digital transactions grew 21% while revenue grew 8%. WU says it will "likely continue to implement price changes from time to time in response to competition" (S17, as of 2026-09-30).
- Euronet's cross-border revenue per transaction fell to $9.51 from $9.83, and its operating margin to 8.7% from 13.1% (S18, as of 2026-09-30).
- What it means: the share gain is mostly cash senders moving to digital, and every digital player is taking that flow at lower prices. It doesn't prove an edge only Remitly has, and it stops once the move from cash to digital matures.

**4. The tax exemption is a political compromise, not a moat.**
- The enacted text confirms the exemption: 1%, cash-funded only; account-funded and US-card-funded sends are exempt (Pub. L. 119-21 §70604, new 26 USC 4475(c)-(d); S14, enacted 2025-07-04).
- But the House passed a different version on 2025-05-22. It taxed "any remittance transfer" at 3.5% with no funding-method exemption, exempting only senders verified as US citizens or nationals (S13). That version would have hit Remitly's non-citizen senders directly. The Senate narrowed it.
- H.R. 8995 (25%, removes the exemptions) has one sponsor, no cosponsors and no action since referral on 2026-05-21 (S15, last updated 2026-06-11). The odds are low, as the thesis says.
- Remitly's own 10-K says policy-makers have discussed going "beyond 1%" and beyond cash (S8).
- From the Q2'26 10-Q, management added that US policy has "changed the legal status of certain population groups" (S2, S1). That wording is absent from the Q1'26 10-Q and FY25 10-K (S3, S8), which mentioned H-1B costs instead.
- What it means: the thesis's downside isn't the −19% bear case. If the exemption is ever widened, the relevant row is "tax widened / growth stalls" at $13.3 (−39%).

**5. The "mistake" and the catalysts point the wrong way.**
- The one-year low close was $12.37 on 2026-02-03 and the high was $27.08 on 2026-11-04, a gain of 119% while the tax was in force (S16). The "fragile trade" view was already largely priced out by November.
- The stock then fell 20.4% on 2026-11-05 ($27.08 to $21.55, 11.5M shares, about 3x normal volume) after the Q3 print, the Q4 margin guide and the 2027 framing (S16, S11). Price is a pointer, not proof of what investors think. But the timing ties the current discount to slowing growth, which the data in point 1 confirm, not to the tax.
- Catalysts:
  - February 2027 results are more likely to confirm the slowdown than reverse it, because management has already framed 2027 lower.
  - Buybacks shrank by quarter: $42.5M, $22.7M, $14.8M (S10).
  - The Prosus exit finished on 2026-06-02 and is already in the price.
  - The Q4'26 adjusted EBITDA guide of $104–106M is below Q3's $120.8M (S11).

**6. Smaller risks the thesis under-weights.**
- The new CEO's performance stock units vest on share-price hurdles ($20 met; $25, $32, $40 and $50 to come), not on financial results (8-K, per `dd-edgar.md`).
- The company now describes itself as evolving "beyond a remittance company into a diversified, cross-border financial services provider" (S1, Note 1).
- Remitly Flex advances to customers, a consumer lending product, run through investing cash flow, so they sit outside FCF. Net originations were $6.6M in 9M'26 and $19.2M in 9M'25 (S1).
- The AUSTRAC anti-money-laundering matter in Australia is open, with no loss estimate (S1, Note 15).
- Canada revenue fell 3.0% in Q3'26 ($40.5M vs $41.8M) while the US grew 24.6% (S1).

## What would prove it right

- **Q4'26 results (about February 2027):** revenue at or above $533M (top of guide), and a formal 2027 guide of at least 17% revenue growth with adjusted EBITDA margin of at least 22%.
- **Q1–Q2 2027, lapping the tax-driven first half of 2026:**
  - active-customer growth of at least 15%, with a Q2 sequential gain back above ~300k;
  - send-volume growth of at least 18%.
- **Unit economics:** revenue less transaction expenses per dollar sent holding at or above 1.40%.
- **Customer funds:** the net position at or below ~0.5% of annual send volume in the FY2026 10-K. Year-end 2026 falls on a Thursday before a holiday weekend, which the 10-Q says raises prefunding (S1), so read it against volume.
- **Share count:** diluted shares flat or down year over year, and buybacks of at least ~$35–40M a quarter (about the quarterly stock-pay expense).
- **Policy:** H.R. 8995 dies in committee, and no 2027 bill amends 26 USC 4475.
- **AUSTRAC:** the matter closes without a civil-penalty case.
- **Tax:** cash taxes rise toward a normal rate while owner FCF after tax still grows more than 12%.

If the first three hold, the base case's 16–18% start is earned and the cushion is real at about +10–20%.

## Facts the thesis leaned on most

| Fact | Does it hold? | Source |
|---|---|---|
| Tax exempts sends funded from bank accounts and US-issued cards | **Holds** on enacted text. Politically contingent: the House-passed version taxed all non-citizen sends at 3.5%, and H.R. 8995 would remove the exemptions (stalled) | S14 (2025-07-04); S13 (2025-05-22); S15 (2026-06-11) |
| Volume +25% vs corridors ~2% means share gain | **Holds** for Q3'26. But growth fell from 37% (Q1'26) to 25%, active customers from 20% to 17%, and Q3 net adds −58% YoY; partly a one-off tax-driven shift | S1, S2, S3 (2026-09-30); Banxico via `dd-peers.md` |
| Normalised owner FCF ~$180M | **Holds.** Reproduces from XBRL; arguably conservative against the FY26 run-rate | S10 (pulled 2026-11-28) |
| Free cash ~$270M after customer funds | **Holds** as arithmetic ($669.1M less ~$397M), but the DCF charges nothing for that capital growing, which is inconsistent and worth $1.9–3.6 a share | S1 (2026-09-30) |
| 2027 growth in the high teens | **Partly.** No 2027 guide in primary filings; secondary summaries say "toward the lower end"; the base case uses 18% | S11, S12 (2026-11-04); `dd-transcripts.md` |
| Adjusted EBITDA margin ~22% | **Holds** for the FY26 guide. Q4'26 is guided at 20%, and the figure adds back stock pay of ~7% of revenue | S11, S12 (2026-11-04) |
| Reverse DCF ~9.9% growth needed | **Holds** (9.86% reproduced). Rises to 11.2–11.9% with the customer-funds charge and diluted shares | my arithmetic on S10, S16 |
| Base value $26.2, +20% cushion | **Weakened.** $20.2–$23.5 (−7% to +8%) under the adjustments in point 2 | my arithmetic |
| 8 of 8 guided quarters beat | **Holds**, but the revenue beat shrank to +0.8% | S11; releases per `dd-diff.md` (2026-11-04) |
| ~$3M debt, safe balance sheet | **Holds** at 9/30/26. $155M was drawn at 12/31/25, and the revolver turned over $8.5B in 9M'26 | S1, S8 |
| Take rate slipping only ~6bp | **Understated.** −23bp over two years (2.32% to 2.09%); net of transaction costs −10bp (1.52% to 1.42%) | S7 (2024-09-30), S1 (2026-09-30) |
| The mistake: the market prices it as a fragile trade the tax will break | **Not shown.** +119% from the February low to the November high, then −20.4% on the slowdown print | S16 (2026-11-27) |
| Catalyst: buyback execution | **Weak.** Quarterly buybacks fell $42.5M, $22.7M, $14.8M | S10 (2026-09-30) |

## Sources

- S1 Remitly 10-Q Q3 2026: https://www.sec.gov/Archives/edgar/data/1782170/000162828026070142/rely-20260930.htm (as of 2026-09-30, filed 2026-11-04)
- S2 Remitly 10-Q Q2 2026: https://www.sec.gov/Archives/edgar/data/1782170/000162828026053424/rely-20260630.htm (as of 2026-06-30)
- S3 Remitly 10-Q Q1 2026: https://www.sec.gov/Archives/edgar/data/1782170/000162828026031371/rely-20260331.htm (as of 2026-03-31)
- S4 Remitly 10-Q Q3 2025: https://www.sec.gov/Archives/edgar/data/1782170/000178217025000237/rely-20250930.htm (as of 2025-09-30)
- S5 Remitly 10-Q Q2 2025: https://www.sec.gov/Archives/edgar/data/1782170/000178217025000183/rely-20250630.htm (as of 2025-06-30)
- S6 Remitly 10-Q Q1 2025: https://www.sec.gov/Archives/edgar/data/1782170/000178217025000093/rely-20250331.htm (as of 2025-03-31)
- S7 Remitly 10-Q Q3 2024: https://www.sec.gov/Archives/edgar/data/1782170/000178217024000223/rely-20240930.htm (as of 2024-09-30)
- S8 Remitly 10-K FY2025: https://www.sec.gov/Archives/edgar/data/1782170/000162828026009038/rely-20251231.htm (as of 2025-12-31, filed 2026-02-18)
- S9 Remitly 10-K FY2024: https://www.sec.gov/Archives/edgar/data/1782170/000178217025000018/rely-20241231.htm (as of 2024-12-31)
- S10 EDGAR XBRL company facts, CIK 1782170: https://data.sec.gov/api/xbrl/companyfacts/CIK0001782170.json (pulled 2026-11-28; latest period 2026-09-30)
- S11 Remitly Q3 2026 earnings release (EX-99.1): https://www.sec.gov/Archives/edgar/data/1782170/000162828026070130/rely3q26-earningspr.htm (2026-11-04)
- S12 Remitly Q3 2026 investor presentation (EX-99.2): https://www.sec.gov/Archives/edgar/data/1782170/000162828026070130/remitlyirpresentation3q2.htm (2026-11-04)
- S13 H.R. 1, engrossed in House, Sec. 112105 (3.5% remittance tax): https://www.govinfo.gov/content/pkg/BILLS-119hr1eh/xml/BILLS-119hr1eh.xml (passed House 2025-05-22)
- S14 H.R. 1, enrolled (Pub. L. 119-21), Sec. 70604, 26 USC 4475: https://www.govinfo.gov/content/pkg/BILLS-119hr1enr/xml/BILLS-119hr1enr.xml (enacted 2025-07-04)
- S15 H.R. 8995 bill status (CRS/GPO): https://www.govinfo.gov/bulkdata/BILLSTATUS/119/hr/BILLSTATUS-119hr8995.xml (last updated 2026-06-11; fetched 2026-11-28)
- S16 yFinance RELY quote and daily history: https://finance.yahoo.com/quote/RELY (last price $21.84 for the 2026-11-27 session; history pulled 2026-11-28)
- S17 Western Union 10-Q Q3 2026: https://www.sec.gov/Archives/edgar/data/1365135/000119312526447662/wu-20260930.htm (as of 2026-09-30)
- S18 Euronet 10-Q Q3 2026: https://www.sec.gov/Archives/edgar/data/1029199/000155485526002297/eeft-20260930.htm (as of 2026-09-30)
- Deep-dive files cited, not re-opened: `dd-diff.md` (guidance beats), `dd-transcripts.md` (2027 framing, secondary), `dd-edgar.md` (CEO award terms, 8-K 2026-02-18), `dd-peers.md` (Banxico inflows)

Coverage: thesis and all 8 deep-dive layers read. The primary re-check covered EDGAR, govinfo and yFinance. Company call transcripts: unreachable (none primary; the deep dive used secondary summaries). IBKR: not used.

<!-- COMPLETE -->
