# Payments primer

Last updated: 2026-11-26 (run 20261126-full_hunt). Edit this file each run; add a dated entry to the history log at the bottom rather than rewriting.

## What the industry is
Payments moves money from a buyer to a seller and takes a small cut on the way. A card sale has five parties: the cardholder, the issuer (the cardholder's bank), the network (Visa or Mastercard), the acquirer/processor (the merchant's payment company) and the merchant. Around that core sit bank-technology vendors (the software that runs a bank), consumer wallets (PayPal, Cash App), business-payment firms (fuel cards, bill pay), buy-now-pay-later lenders (Affirm) and money-transfer firms (Western Union, Remitly).

## How money flows
- The merchant pays a fee of roughly 1.5-3% of the sale (the "merchant discount").
- Most of it is **interchange**, paid to the issuer. A small part is the network fee. The acquirer keeps what is left.
- Visa and Mastercard are **toll roads**: no credit risk, a few hundredths of a percent on every dollar, more on cross-border and on extra services. Mastercard's net revenue is about 0.33% of gross dollar volume (my calculation, Q3 2026).
- American Express is a **closed loop**: network, issuer and lender in one, so it earns card fees and interest and takes credit losses.
- Fintechs earn a **take rate** (their share of the volume they process) and sometimes float income (interest on customer balances).
- Lenders such as Affirm earn the **spread** between what borrowers pay and what funding costs.

## Where each layer is in its cycle (as of 2026-11-26)
- Networks: peak earnings. Visa Jul-Sep payments volume +9% constant dollar, cross-border +14%; Mastercard volume +7%, cross-border +11%; margins about 60%. Client incentives are growing faster than revenue.
- Merchant acquirers and bank-core processors: restructuring. Fiserv organic revenue flat (a $6.45B goodwill write-down); FIS reported +27% growth but only +3.7% pro forma and cut its guide; Global Payments +31% reported, about +4% normalized, with heavy debt after Worldpay.
- Software-led platforms (Toast, Block, Adyen, Remitly, Affirm): growing 14-35%.
- Money transfer: split. Digital (Remitly, Western Union Branded Digital) grows; retail and US immigration-policy exposure hurts (Euronet, Western Union).
- Regime fit: late Overheat in the hard data. Nominal volume is inflated by prices while real consumer spending was flat in October.

## Lingo
- **Interchange:** fee the merchant's bank pays the cardholder's bank on each sale.
- **Take rate / net revenue yield:** revenue as a percent of volume processed.
- **Payments volume / GDV / GPV / TPV:** dollars processed (Visa, Mastercard gross dollar volume, Block and Toast gross payment volume, PayPal total payment volume).
- **Cross-border volume:** card spend where buyer and seller are in different countries; highest fees.
- **Constant dollar / currency-neutral:** growth with exchange-rate effects removed.
- **Organic / pro forma growth:** growth excluding acquisitions and sales; the honest read on a processor.
- **Closed loop:** one company is both network and issuer (AmEx).
- **Acquirer / processor:** the merchant's payments company.
- **Bank core:** software that keeps a bank's accounts and balances.
- **BNPL:** buy now, pay later; short loans at checkout.
- **Float:** customer money held briefly and earning interest.
- **Reg II / Durbin:** the Fed rule that caps debit interchange for big banks.
- **CCCA:** Credit Card Competition Act, a bill to force a second routing choice on credit cards.
- **Standstill:** contract that stops a big holder from buying more shares for a period.

## The numbers to watch
1. Visa and Mastercard payments volume growth and cross-border volume growth (nominal, constant dollar). A slide toward 5-6% would signal real weakness.
2. Take rate or net yield (PayPal transaction margin dollars per dollar of volume, Corpay revenue per spend dollar, Mastercard incentives vs revenue).
3. Organic (pro forma) revenue growth at processors: Fiserv guide -1% to 0%; FIS 3.1-3.6%; Global Payments 4-5% normalized.
4. Operating margin: networks about 60%; Fiserv adjusted 31.2% (down from 37.0%); FIS adjusted EBITDA 42.9%.
5. Credit quality and funding cost: AmEx write-off rate (1.8%), Affirm funding cost (6.0%).

## What to watch next
- Dec 4 jobs report, Dec 8-9 FOMC, Dec 10 CPI: rates drive float income, BNPL funding cost and the multiples of levered processors.
- Dollar: DXY about +4-5% in 3 months turns a small FX tailwind at Visa (about 1 point of FY26 revenue growth) into a headwind in fiscal 2027.
- Global Payments: the GTCR 13D (16.35%); lock-up begins releasing about 2027-01-09; standstill bars additional share purchases while GTCR holds more than 5% unless an exception applies. No proposal exists.
- FIS deleveraging (gross leverage about 3.5x vs 2.8x target) and the Fiserv Q4 organic acceleration it promised.
- Debit regulation: Eighth Circuit vacated the Reg II cap on 2026-10-26; Sixth Circuit (Linney's Pizza) decision pending; Fed rewrite. Final approval of the Visa/Mastercard injunctive-relief settlement. Credit Card Competition Act (S.3623) in committee.
- Stablecoins: OCC GENIUS Act final rule effective 2027-01-18.
- BILL take-private ($63.25 cash, TPG with Corpay as minority investor) closing in 2Q 2027; Western Union's Intermex deal ended 2026-11-12.
- Fiserv ticker: it trades as FISV on Nasdaq (not FI).

## Triage list this run (see runs/20261126-full_hunt/industries/payments.json)
GPN, FIS, FISV, V, MA, PYPL, INTU, AXP, XYZ, TOST, FOUR, JKHY, CPAY, WEX, AFRM, WU, EEFT, RELY, ACIW. Not triaged: BILL (deal-pinned), MQ, FLYW, PAYO, PAY, CRCL, DLO, and foreign peers Adyen, Worldline, Nexi.

## History log
- 2026-11-26: first version. Sources: company 8-K earnings exhibits, 10-Qs and Visa 10-K on EDGAR, GTCR Schedule 13D, Federal Register (OCC GENIUS rule), BEA, yFinance prices.

<!-- COMPLETE -->
