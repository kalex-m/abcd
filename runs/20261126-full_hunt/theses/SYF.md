# SYF · Synchrony Financial · Step 6 thesis (run 20261126-full_hunt)

**Status after Step 6: SURVIVED · conviction LOW** · quality B · attractiveness medium · as of 2026-11-28
Price used: **$69.77** (yFinance last price, Nov 27 2026 half-day session; https://finance.yahoo.com/quote/SYF). IBKR cross-check: unavailable (no connector).

## 1. The business in two sentences
Synchrony issues store and co-brand credit cards and health-care financing (CareCredit) for retail partners such as Lowe's, Amazon, PayPal and Walmart, and earns the interest and fees, sharing part of the profit with partners through retailer share arrangements (RSAs). It funds itself mostly with online deposits (83% of funding).

## 2. What it is worth (residual income, cost of equity 10%, growth 3%)
Tangible book value per share **$42.79** (Q3 2026, current definition; source: `runs/20261126-full_hunt/triage/SYF.json` read 17, from the Q3 2026 10-Q). Value = TBV × (ROTCE − g) / (COE − g).

| Case | Sustained ROTCE | Value / share | vs price |
|---|---|---|---|
| Bull | 24% (≈ 9M 2026 actual 24.3%) | $128 | +84% |
| **Base** | **20%** (2027 charge-offs higher per management; RSA absorbs only part) | **$104** | **+49%** |
| Bear (credit stress) | 16% | $80 | +14% |
| Partial rate cap | 11% | $49 | −30% |
| 10% APR cap law | 6% | $18 | −74% |

Second lens: P/E **7.3x** on trailing EPS $9.58 (triage read 17).

## 3. What the price assumes
P/TBV **1.63x** implies a sustained ROTCE of **~14.4%**. On the pre-recast definition (deepdive `dd-diff.md`: P/TBV ~1.77x, ROTCE restated down 1.5–1.9 points) it implies ~15.4% against ~26% earned. Either way the price assumes returns roughly 10 points below what Synchrony earns today.

## 4. The mistake (revised after the deep dive)
Original triage mistake: "priced as a late-cycle card casualty while credit is better than a year ago and partners absorb losses."
After the deep dive it **holds only in part**:
- Credit is better than a year ago, but it is a **sector** tailwind (COF, AXP, Bread all better; SYF's delinquency gain is the smallest) and management itself says 2027 charge-offs may rise as Walmart/OnePay accounts age (`dd-peers.md`, `dd-transcripts.md`).
- RSA loss-sharing is **partial**: partners absorbed ~32–49% of the swing in net interest income minus charge-offs over 2024–26 (`dd-ir.md`).
- Part of the discount is **not a mistake**: a federal 10% card-rate cap became more likely on 2026-11-21 (the President said he would work with the incoming Congress on it; bills S.381 / H.R.1944 in committee) (`dd-regulatory.md`). RSAs cushion credit losses, not a cut in loan yields.
What remains a mistake: the price capitalises Synchrony as if a ~14% return were permanent, even though a stressed-but-normal credit year (ROTCE ~16–20%) is still worth $80–104.

## 5. What would make the market notice
- Monthly credit 8-K around 2026-12-10 (note: November has 30 charge-off cycle dates vs 28 a year ago, so it will look mechanically worse; `dd-edgar.md`).
- Q4 2026 results and 2027 outlook, late January 2027 (date inferred from past pattern).
- Continued buybacks ($4.6B authorisation left; capital room ~$6.2B; `dd-credit.md`).
- The rate-cap bills stalling once the new Congress sets its agenda (the reverse would break the thesis).

## 6. The cushion
Base value $104 vs $69.77 (**+49%**). Probability-weighted for the rate cap: with a 20% chance of a cap law (value ~$25) and 80% of the base-to-bear range (~$92), value ≈ **$78 (+12%)**; at 30% ≈ **$72 (+3%)**. The cushion is real only if the cap does not pass, which is why conviction is low.

## 7. Kill-switch recheck (CLAUDE.md 6.4.1)
| Rule | Result |
|---|---|
| Losing relevance (Zoom test) | No: record spend, partner contracts now run 2030–2035 for the top 5 (`dd-edgar.md`) |
| Money model explainable in two sentences | Yes |
| Negative FCF with weak balance sheet | No: CET1 12.9% vs 7.0% floor (`dd-credit.md`) |
| Unresolved accounting red flags | None found: no 4.02, no 10-K/A; CET1 recast is presentation only (`dd-diff.md`) |
| Debt wall it can't cover | No, but $31.5B of CDs reprice in 2027 (`dd-credit.md`) |
| Price assumes more than it can deliver | No: price assumes ~14% ROTCE vs 24% earned |
Status stays **Survived**; the mistake narrowed and the cushion depends on the rate-cap outcome.

## 8. Facts the thesis leans on most
1. ROTCE 24.3% in 9M 2026 and the P/TBV of 1.63x (triage read 17; `dd-diff.md` recast note).
2. Charge-offs improving year over year (`dd-edgar.md`: 12-month average ~5.2% vs 5.8%).
3. Capital room ~$6.2B above the 7.0% CET1 floor (`dd-credit.md`).
4. No federal rate cap becomes law (`dd-regulatory.md`).
5. Top partner contracts extended to 2030–2035 (`dd-edgar.md`).

## 9. What weakened in the deep dive (honest list)
Buybacks ran at ~125% of earnings in 9M 2026; insiders made zero open-market purchases from 2022 to 2026; short interest rose 65% in a month to 11.8% of float; 2023 investor targets for ROTCE and efficiency were missed; Q3 net earnings fell 17% (expenses +10%).

Deep-dive folder: `runs/20261126-full_hunt/deepdive/SYF/` (8 of 8 layers).

<!-- COMPLETE -->
