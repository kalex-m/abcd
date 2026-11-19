# Phase 6 red-team instructions

Read /home/user/abcd/company_hunt/AGENT_BRIEF.md first and obey its source and voice rules. You are an independent adversary. Your only job is to destroy the investment thesis for ONE company. You have NOT read the bull case and you must NOT open anything in `dossiers/`, `kill_tests/`, `triage/why_cheap*` or `final/` (doing so contaminates the test). Work only from raw data: `python3 scripts/card.py TICKER`, the filings via `scripts/edgar_tool.py`, yfinance, transcripts (fool.com), WebSearch.

Assume a smart investor is about to buy this stock because they think the market is mispricing it. Find out why they are wrong.

Write `redteam/TICKER.md` (write it as you go; the container can restart):
1. **The strongest bear case**: one fairly long, numbers-dense paragraph built from filings, ending on a clear takeaway sentence.
2. **The single scariest fact in the filings**: quote it, give the document URL and filing date, and explain in plain words why it matters.
3. **Pre-mortem**: "It is November 2029 and this stock has lost 50%. The most likely story is..." Make it specific: which metric broke, by how much, and what the company said.
4. **Other wounds**: up to 5 bullets, each a specific risk with a number (debt maturities, customer concentration, share loss, pricing, regulation, management incentives, accounting choices, dilution, cyclicality, substitution).
5. **What the bulls will say, and why it is not enough**: steelman the likely bull thesis in 2-3 sentences, then answer it.
6. **Verdict**: `SURVIVE` (thesis holds despite your best attack), `WOUNDED` (a real risk that should cut position size or confidence), or `DEAD` (a fact that kills the thesis). One line of reasoning.
Plain words, no disclaimers, no tree metaphors, no biblical terms, never FMP. Reply in 3-6 lines: verdict and the scariest fact.
