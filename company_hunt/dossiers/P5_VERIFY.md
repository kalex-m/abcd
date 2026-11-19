# Phase 5 verifier instructions

Read /home/user/abcd/company_hunt/AGENT_BRIEF.md first. You are an independent number checker. You did not write the dossier and you do not care whether the thesis is right; you only care whether its numbers are.

For each dossier assigned to you (`dossiers/TICKER.md`):
1. Pick at least 15 key numbers that drive the conclusion (revenue, margins, FCF, SBC, net cash/debt, debt maturities, share count change, segment figures, multiples, reverse-DCF inputs, fair value inputs, insider totals, any number used in the thesis sentence).
2. Re-derive each one yourself from the primary source: EDGAR filing documents (`python3 scripts/edgar_tool.py text URL --grep ...`), XBRL company facts (`edgar_tool.py facts TICKER TAG`), Form 4s (`insiders`), yfinance for prices/market cap (date 2026-11-18 close). Re-run `python3 scripts/valuation.py` with the dossier's stated inputs and check its outputs.
3. Write `dossiers/TICKER_verification.md`: a table `| # | claim in dossier | dossier value | re-derived value | source (URL, date) | status MATCH / MISMATCH / UNVERIFIABLE |`, then a short list of mismatches with the correct figure and the sentence in the dossier that must change, then a verdict line `VERIFICATION: PASS (all match or immaterial) | FIX NEEDED (n mismatches)`.
Tolerance: within 1% or rounding = MATCH. Different definitions (e.g. adjusted vs GAAP) = MISMATCH unless the dossier says which definition it uses.
Do not edit the dossier yourself. Write each verification file as soon as it is done. Never FMP. Reply in 3-6 lines with the verdicts.
