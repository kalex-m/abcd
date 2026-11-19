# Phase 4 instructions: the Kill Test (10 hard gates; any FAIL removes the company)

Read /home/user/abcd/company_hunt/AGENT_BRIEF.md first and obey it. Default is rejection. Be harsh. A gate is PASS only when the evidence supports it; "probably fine" is not a pass. If a gate cannot be verified, mark it `UNVERIFIED` and say exactly what is missing; two or more UNVERIFIED gates count as a FAIL.

Write one file per company: `kill_tests/TICKER.md`. Write it as soon as that company is done (the container can restart; on start, skip companies whose file already exists and ends with a `VERDICT:` line).

## Inputs per company
- `python3 scripts/card.py TICKER` (metrics, 10-year EDGAR series, 8-K item counts, Item 4.01/4.02 hits)
- Phase 3 reasoning: `triage/why_cheap.csv` and the matching `triage/why_cheap_part_N.md` paragraph
- Filings via `python3 scripts/edgar_tool.py` (filings, text --grep, fts, facts, insiders, holders, exhibits, segments)

## The ten gates (evidence required for each)
1. **Relevance**: will customers need this business more, the same, or less in 10 years? Evidence: volumes, users, units, seats, retention or churn, organic growth trend over 5+ years, substitutes and switching behaviour. A business losing relevance is down for a reason (Zoom is the standing FAIL example).
2. **Moat**: name the specific advantage (scale, network, licence, cost position, switching cost, data). Check it is not eroding: price cuts, share loss, gross-margin trend, rising churn, well-funded new entrants.
3. **Balance sheet (war chest is real)**: net cash or net debt from the latest 10-Q, then subtract debt maturing within 3 years, operating and finance leases, pension/OPEB deficit, litigation or settlement liabilities (e.g. opioid, asbestos, product liability), purchase obligations and guarantees (10-K "contractual obligations" / commitments note). Show the netting as a small table. If the "war chest" disappears after netting, FAIL. (For banks/insurers: CET1 or RBC ratio, unrealized losses on held-to-maturity securities, reserve adequacy instead.)
4. **Cash quality**: operating cash flow vs net income over 5 years (card: OCF/NI 5y), FCF after stock-based comp, working-capital swings, capitalized costs (software, contract costs), one-time inflows (asset sales, tax refunds, factoring of receivables: grep "factoring|securitization|supplier finance").
5. **Management**: CEO/CFO tenure; capital allocation record (buybacks at what prices vs today, acquisitions and later write-offs: card shows 3y impairments and 5y acquisitions); guidance vs delivery over the past 3-5 years (grep earnings releases); pay design from the latest DEF 14A (`edgar_tool.py filings TICKER "DEF 14A" 1`, grep "performance share|PSU|metric|TSR|EPS|ROIC|free cash flow" — does pay reward per-share value or size?); insider ownership; insider buying/selling (`edgar_tool.py insiders TICKER 3`).
6. **Accounting**: any 8-K Item 4.01 (auditor change) or 4.02 (non-reliance/restatement) in 5 years (card), material weakness (`edgar_tool.py fts "material weakness" --ticker T --from 2021-01-01`), aggressive non-GAAP (gap between adjusted and GAAP EPS; what is excluded every year), revenue-recognition changes. Any hit is FAIL until explained.
7. **Concentration**: customer, supplier or regulator concentration (grep the 10-K for "10% of|largest customer|single customer|sole source|single supplier"). Above reasonable levels with no mitigation = FAIL.
8. **Regulatory and legal**: pending rules, lawsuits, investigations, antitrust, pricing regulation that could cap the economics or force a break-up against shareholders (10-K Legal Proceedings and risk factors; latest 10-Q Item 1).
9. **Dilution**: diluted share count over 5 years (card); persistent net dilution without a clear value-creating reason = FAIL. Note SBC as % of revenue and of FCF.
10. **"Nobody cares"**: if it is cheap because everyone has noticed and still refuses to buy, find out why. The thesis must be that the market is not looking at the right thing, not that the market is wrong about something it has studied thoroughly. Evidence of attention: analyst count, short interest, how widely the bear case is discussed (WebSearch), 13D activists (`edgar_tool.py holders`).

## File format (kill_tests/TICKER.md)
```
# TICKER: Company name (grounds: G1,G3) | kill test 2026-11-19
Phase 3 class: HURT/BORING/UNSEEN | price $x | mcap $xB

| # | Gate | Result | Evidence (numbers, dates, source) |
|---|------|--------|-----------------------------------|
| 1 | Relevance | PASS/FAIL/UNVERIFIED | ... |
... (all 10, none blank)

## War chest netting (latest 10-Q, date)
| item | $B | source |

## Reading
One fairly long plain-language paragraph: what this business is, why it is cheap, what the gates show, ending on a clear takeaway sentence.

VERDICT: SURVIVE | FAIL (gate numbers) | quality score 1-10 | mispricing clarity 1-10
```
Sources: EDGAR document URLs with filing dates. Never FMP. No disclaimers. No tree metaphors, no biblical terms.
When your batch is finished, reply in 3-6 lines: survivors, failures with the failing gate, and any surprising finding.
