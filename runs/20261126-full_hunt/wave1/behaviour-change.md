# Behaviour-change scan (Lane B), run 20261126-full_hunt, as of 2026-11-26

Method: EDGAR full-text search (8-K, 10-Q, SCHEDULE 13D, 2026-09-01 to 2026-11-26) and direct Form 4 XML parsing for about 130 well-known tickers, counting only transaction code P (open-market buy). Limits: Form 4 coverage is the ticker list I chose, not the whole market; full-text search is keyword-based so it misses unusual wording. Capex-pivot and pricing-model searches turned up little. Form 4 prices are shown as filed; a few look odd and are flagged.

## 1. Insider buying (open-market, code P)
| Company | Date | What | Filing | Why it matters |
|---|---|---|---|---|
| Intel (INTC) | 2026-11-02 | CEO Lip-Bu Tan bought 150,000 sh, about $9.71M, no 10b5-1 | https://www.sec.gov/Archives/edgar/data/50863/000005086326000195/form4.xml | Largest clean CEO buy found; semis are crushed |
| Uber | 2026-09-10 | CEO Khosrowshahi 141,000 sh, about $10.0M; exec Macdonald about $5.3M on 09-04 | https://www.sec.gov/Archives/edgar/data/1543151/000118423726000008/primarydocument.xml | CEO plus another executive |
| Accenture (ACN) | 2026-10-26 | Chair/CEO Sweet about $3.0M; director Price about $200k | https://www.sec.gov/Archives/edgar/data/1467373/000148763026000022/wk-form4_1793184338.xml | AI-exposed IT services, CEO buying |
| Boeing (BA) | 2026-10-30 / 11-17 | Three directors, about $2.0M total | https://www.sec.gov/Archives/edgar/data/12927/000122520826008642/doc4.xml | Cluster of 3 |
| Huntington (HBAN) | 2026-10-26/27 | Directors Rollins and Torgow, about $450k (prices in filing inconsistent: verify) | https://www.sec.gov/Archives/edgar/data/49196/000122520826008542/doc4.xml | Bank cluster |
| Truist (TFC) | 2026-09-17, 10-28 | CEO Lyons about $1.0M then $1.2M (both at $48.36: verify) | https://www.sec.gov/Archives/edgar/data/92230/000153457426000018/f4_a1eus00000anuuzmad-live.xml | Repeat CEO buying |
| Oracle / Salesforce | 2026-09-29 / 09-18 | Directors about $3.5M / $1.0M | https://www.sec.gov/Archives/edgar/data/1341439/000134143926000099/form4.xml | Software, single director each |
| CVS | 2026-11-06 | EVP Shah about $2.0M | https://www.sec.gov/Archives/edgar/data/64803/000006480326000112/form4.xml | Single exec |
| GlobalFoundries, Enphase, FIS | Oct-Nov | Small buys by directors/CEO ($50k to $380k) | see lead cards | Small |
Discounted: Thiel at PLTR (about $122M, 11-20) and Cannon-Brookes at TEAM (11-11/12) are under 10b5-1 plans; PEP Pohlad "P" rows are a trust asset swap; HUBS Halligan buy was matched for short-swing rules (https://www.sec.gov/Archives/edgar/data/1404655/000119312526462154/ownership.xml). No P buys found at NVDA, AMD, MU, AVGO, QCOM, TXN, big banks (JPM, C, WFC, GS, MS), homebuilders (DHI, PHM, TOL), or airlines in the scanned names. Berkshire Form 4s at Lennar are buys but are a known 10% holder story (https://www.sec.gov/Archives/edgar/data/920760/000119312526397059/ownership.xml, 2026-09-17).
Confidence: medium (filing-verified facts; selection limited to my ticker list).

## 2. New SCHEDULE 13D (activists and holders)
| Company | Date | What | Filing | Why it matters |
|---|---|---|---|---|
| Global Payments (GPN) | 2026-11-20 | GTCR 16.35% (43.27M sh), moved from 13G to 13D, "may submit a Proposal to acquire ... all outstanding shares" | https://www.sec.gov/Archives/edgar/data/1123360/000119312526470458/primary_doc.xml | Possible take-private in beaten-down payments |
| Wix.com | 2026-11-23 | ValueAct 7.0% | https://www.sec.gov/Archives/edgar/data/1576789/000141881226000003/primary_doc.xml | Activist in software |
| Vail Resorts | 2026-09-16 | Oasis 6.2%, four board nominees | https://www.sec.gov/Archives/edgar/data/812011/000090266426003832/primary_doc.xml | Proxy fight |
| Mattel | 2026-10-22 | EdgePoint 17.68% | https://www.sec.gov/Archives/edgar/data/63276/000094787126000942/primary_doc.xml | Large holder |
| FMC | 2026-09-25 | Tessenderlo 20.0% | https://www.sec.gov/Archives/edgar/data/37785/000114036126037699/primary_doc.xml | Strategic holder |
Also seen but not opened: TripAdvisor (Pale Fire 7.4%, 2026-11-18), Elastic (Pictet 5.2%, engagement), Six Flags, RXO, BankUnited, Coursera, Brookdale.

## 3. Buyback / dividend shifts
| Company | Date | What | Filing |
|---|---|---|---|
| EPAM | 2026-11-05 | +$1.5B authorization (to $1.8B), $500M accelerated repurchase, 50% FCF return pledge 2027-29 | https://www.sec.gov/Archives/edgar/data/1352010/000135201026000048/exhibit99_q3x2026.htm |
| HPE | 2026-11-23 | +$5B repurchase capacity | https://www.sec.gov/Archives/edgar/data/1645590/000164559026000097/ex-991x11232026x8k.htm |
Search hit many other 8-Ks with repurchase or dividend language (GM, GE Vernova, Verisk, Gap, Kimberly-Clark, Stryker, Republic Services and others); I did not verify these, so nothing is claimed.

## 4. Segment, capex and pricing changes
| Company | Date | What | Filing |
|---|---|---|---|
| FIS | 2026-11-04 | Segments recast to Banking Solutions, Capital Market Solutions, Corporate and Other after Issuer Solutions deal; buyback only $93M of $3.0B in 9M | https://www.sec.gov/Archives/edgar/data/1136893/000113689326000063/fis-20260930.htm |
| HubSpot | 2026-11-04 | Revenue now includes credits-based usage tied to AI agents alongside seats (pricing-model shift is in progress; text confirms credits, not a quantified pivot) | https://www.sec.gov/Archives/edgar/data/1404655/000119312526447363/hubs-20260930.htm |
Other 10-Qs flagging segment changes (not opened): Constellation Energy, DuPont, Leidos, GE HealthCare, Zimmer Biomet, Prudential, Teleflex. Seat-to-usage language also appears at Asana, Figma, Cloudflare, Twilio (not opened). Capex pivots: nothing notable found with the searches run.

## Reading across the price-action view
Insiders and holders are leaning against the sell-off in semis (INTC, GFS), software (CRM, ORCL, Wix) and regional banks (TFC, HBAN). Payments has the clearest event: GTCR/GPN. Homebuilders and airlines (up on the month) show no insider buying in my scan.

<!-- COMPLETE -->
