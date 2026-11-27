# RELY dd-regulatory (run 20261126-full_hunt, written 2026-11-27)

## Summary for main thread
1. The 1% excise tax (26 USC 4475, effective for transfers after 2025-12-31) applies only to sends funded by cash, money order, cashier's check or a similar physical instrument. Transfers funded from a financial-institution account or a US-issued debit or credit card are expressly exempt. The triage claim holds on statute text.
2. New tail risk the triage missed: H.R. 8995 (REMITTANCE Act, introduced 2026-05-21) would raise the rate to 25% and strike the scope limit and the exemptions. It is a single-sponsor bill in committee, with no sign of movement found.
3. New disclosure: Remitly Australia is in an open AUSTRAC (Australian AML regulator) matter, per the Q3 2026 10-Q. Outcome and loss are not estimable. I could not confirm whether it appeared in the FY2025 10-K.

Thesis impact: supports (tax claim confirmed; AUSTRAC and the 25% bill are watch items, not breakers)

## Findings

**F1. Statute: rate, scope, exemptions, effective date**
- Fact: Sec. 4475(a) imposes "a tax equal to 1 percent of the amount of such transfer". The sender pays and the provider collects and remits quarterly. If not collected, the provider owes it. Scope subsection (c): applies only where the sender provides "cash, a money order, a cashier's check, or a similar physical instrument". Exemption subsection (d): not applicable to funds withdrawn from an account at a covered financial institution, or to transfers "funded with a debit card or a credit card which is issued in the United States". Effective: Pub. L. 119-21 s.70604(c), transfers made after 2025-12-31.
- Source: https://www.law.cornell.edu/uscode/text/26/4475 (fetched 2026-11-27). The public-law text at govinfo (https://www.govinfo.gov/content/pkg/PLAW-119publ21/html/PLAW-119publ21.htm) was too large to reach s.70604 in the fetch; the Cornell codification is a secondary rendering of the same text.
- Meaning: the tax design lines up with the thesis. A Remitly send funded by bank account or US card sits outside it. Confidence: high on text, medium on the subsection lettering (taken from Cornell).

**F2. Treasury/IRS guidance narrows nothing for digital, adds anti-avoidance**
- Fact: Proposed regs REG-114499-25 issued 2026-04-10 (IR-2026-48). They define the physical instruments that trigger the tax, import Regulation E exclusions (transfers of $15 or less, certain securities and commodities purchases), and include anti-avoidance examples: a provider or its agent issuing a general-use prepaid card to cash-paying customers to dodge the tax can be disregarded. Applies to quarters beginning on or after finalization; reliance allowed back to 2026-01-01. Comments closed 2026-06-12; final rule not found.
- Sources: https://www.irs.gov/newsroom/treasury-irs-issue-proposed-regulations-on-the-new-remittance-transfer-tax-established-under-the-one-big-beautiful-bill (2026-04-10); https://kpmg.com/us/en/taxnewsflash/news/2026/04/tnf-proposed-regulations-excise-tax-on-remittance-transfers.html (2026-04). The Federal Register PDF (https://public-inspection.federalregister.gov/2026-07085.pdf) and Notice 2026-52 (https://www.irs.gov/pub/irs-drop/n-26-52.pdf) returned unreadable binary, so only secondary summaries were used.
- Meaning: the anti-avoidance rule targets cash-to-prepaid-card workarounds, which matter for agent-network rivals, not an app funded by bank or card. Confidence: medium (secondary summaries).

**F3. Penalty relief shows compliance burden falls on providers**
- Fact: Notice 2025-55 gave penalty relief for late or incorrect deposits for Q1-Q3 2026. A later notice (n-26-52) extends relief until final regs; extension details unread.
- Source: https://www.irs.gov/RemittanceTaxPenaltyRelief (2025-10-07); https://www.irs.gov/pub/irs-drop/n-26-52.pdf (unreadable).
- Meaning: cost and friction land on cash-based competitors first. Confidence: medium.

**F4. Legislative tail risk: REMITTANCE Act**
- Fact: H.R. 8995 (Rep. Roy; referred to Ways and Means 2026-05-21) would replace "1 percent" with "25 percent" and strike subsections (c) through (e), which removes the physical-instrument limit and the exemptions, with effect as if in s.70604. It has no digital-specific text; it simply deletes the limits.
- Source: https://www.govinfo.gov/content/pkg/BILLS-119hr8995ih/xml/BILLS-119hr8995ih.xml (introduced text, 2026-05-21).
- Meaning: if enacted, it would tax Remitly's sends, which would break the "tax spares digital" leg. No cosponsors, hearings or markup were found, so I rate enactment probability low, but this is the one concrete path to the thesis failing on tax. Remitly's own 10-K says policymakers have discussed going "beyond 1%" and beyond cash. Confidence: high on bill text, low on odds.

**F5. Company's own statement on the tax**
- Fact: Q3 2026 10-Q MD&A says the law "imposes a tax on outbound, non-digital remittances" and the company does not expect a material impact. The FY2025 10-K risk factors say one state and one US territory have enacted fees on certain money transfers and others proposed similar ones; the state and territory are not named in the text I read.
- Source: https://www.sec.gov/Archives/edgar/data/1782170/000162828026070142/rely-20260930.htm (2026-09-30); https://www.sec.gov/Archives/edgar/data/1782170/000162828026009038/rely-20251231.htm (2025-12-31).
- Meaning: management view matches statute; state-level fees are a separate, unquantified exposure. Confidence: medium.

**F6. AUSTRAC matter (new year over year)**
- Fact: 10-Q Note 15 (as of 2026-09-30): Remitly Australia Pty Ltd is engaging with AUSTRAC about AML/CTF compliance, has received and answered notices and information requests, the matter is "ongoing", outcome unpredictable, loss not estimable. In the FY2025 10-K, Item 3 said no material proceeding and the sections I read (risk factors; Note 16 not reached) did not mention AUSTRAC.
- Sources: https://www.sec.gov/Archives/edgar/data/1782170/000162828026070142/rely-20260930.htm (2026-09-30); https://www.sec.gov/Archives/edgar/data/1782170/000162828026009038/rely-20251231.htm (2025-12-31).
- Meaning: AUSTRAC has been active on payment platforms (external-audit orders on WorldRemit and Airwallex; Western Union investigation), so this is a sector pattern. Australia is inside "rest of world" revenue ($120.7M in Q3, not split out). Escalation to a civil penalty or a licence condition is possible; size unknown. Confidence: medium (year-over-year first appearance not pinned to a quarter).

**F7. CFPB**
- Fact: 10-K says Remitly has been examined by the CFPB as a larger participant and that federal examination activity "has largely paused"; states may fill the gap. The CFPB's 2026 agenda (released 2026-07-06) targets a final remittance-disclosure rule in November 2026 (a 2024 proposal adding which inquiries go to CFPB versus state licensing agencies); no enforcement action against Remitly found; Bulletin 2012-08 withdrawn 2025-05-12.
- Sources: https://www.sec.gov/Archives/edgar/data/1782170/000162828026009038/rely-20251231.htm (2025-12-31); https://www.consumerfinancialserviceslawmonitor.com/2026/07/cfpb-releases-2026-regulatory-agenda-detailing-planned-rulemakings/ (2026-07). Agenda read through search snippet only.
- Meaning: a disclosure wording change with a 60-day implementation window is cost-light and does not touch fees. Confidence: medium.

**F8. State licences, FinCEN, OFAC**
- Fact: no consent order, FinCEN or OFAC action naming Remitly found in search (multistate orders located were for Wise US 2025-07-09, Sigue 2025-03-20 and Block). CSBS/NMLS databases and FinCEN/OFAC enforcement lists were not queried directly.
- Sources: https://www.mass.gov/consent-order/wise-us-inc-multistate-consent-order (2025-07-09). The Wise order concerns a digital rival and shows multistate AML exam risk applies to the model.
- Meaning: absence is not proof; treat as nothing_found by search only. Confidence: low-medium.

**F9. Immigration enforcement and sender volumes**
- Fact: Mexico remittances fell about 4% in 2025 (first drop in over a decade), then +2.6% through April 2026 per the IDB; Guatemala +8.0% early 2026; Inter-American Dialogue links lower migration and deportations (about 160,000 in 2025) to fewer person-to-person transfers and projects Central America to slow.
- Sources: https://thedialogue.org/blogs/2026/05/understanding-the-decline-in-remittances-to-mexico-in-2025 ; https://www.iadb.org/en/blog/migration/remittances-latin-america-and-caribbean-ease-after-2025-surge (read via search summaries, 2026).
- Meaning: the market fear is real in Mexico and Central America flows, yet Remitly's top corridors are India, Mexico and the Philippines and volume is +25%, so share gain outweighs the market drag so far. Confidence: medium.

## Coverage
| Item | Status |
|---|---|
| Statute text, rate, effective date, exemptions | covered (Cornell; govinfo public law not reached) |
| IRS/Treasury guidance (proposed regs, Notices) | covered via secondary/IRS press pages; Federal Register PDF and Notice 2026-52 unreachable (binary) |
| Industry regulator dockets (CFPB, state, FinCEN, OFAC) | CFPB covered; state/FinCEN/OFAC nothing_found by search only |
| Antitrust / pending deal review | nothing_found (no deal pending for Remitly) |
| Supplemental answers to regulators | nothing_found |
| Court dockets | unreachable (CourtListener blocks scripts); 10-Q says only IP/trademark disputes, immaterial |
| Legal-proceedings note year over year | partly covered: Q3 2026 Note 15 read; FY2025 Note 16 not reached, Item 3 per excerpt says none material |
| Foreign regulators (AUSTRAC) | covered via 10-Q; AUSTRAC site shows no Remitly-specific release |
| Immigration measures | covered (secondary data) |

## Feedback
- Remitly 10-Q (2026-09-30): immigration and legal-status changes "may" affect parts of the business but it has been resilient across policy cycles. Consistent with the regime read that remittance volumes have not yet shown the Slowdown. https://www.sec.gov/Archives/edgar/data/1782170/000162828026070142/rely-20260930.htm

<!-- COMPLETE -->
