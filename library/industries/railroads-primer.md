# Railroads primer (North American freight rail and its supply chain)

Persistent learning file. Newest update first in the change log at the bottom; earlier text is extended, not replaced.
Last updated: 2026-11-26 (run 20261126-full_hunt). Sources are in `runs/20261126-full_hunt/industries/railroads.json`.

## What the industry is

Six big freight railroads (Class I) haul most North American rail freight: Union Pacific (UNP) and BNSF in the west, CSX and Norfolk Southern (NSC) in the east, Canadian National (CNI) and CPKC (CP) across Canada, with CPKC reaching Mexico. BNSF belongs to Berkshire Hathaway. Each owns its own track, so each runs a private toll road that no one can copy: the right-of-way, terminals and regulatory approvals are the barrier to entry.

## How money flows

- Shippers pay per carload or per container. Revenue = volume x revenue per unit.
- Revenue per unit moves with pricing, cargo mix (coal about $2,500 a car at UP, intermodal about $1,600) and the fuel surcharge.
- Costs are mostly fixed (track, yards, crews, depreciation), so extra volume on the same network is very profitable.
- Spend on track and equipment is paid from the railroad's own cash. That cash becomes orders for suppliers: railcar builders (Trinity TRN, Greenbrier GBX), lessors (GATX), locomotives and signalling (Wabtec WAB, Caterpillar's Progress Rail), track products (L.B. Foster FSTR).
- Intermodal marketers (J.B. Hunt JBHT, Hub Group HUBG) rent rail space and sell door-to-door service to retailers.

## Supply chain and signal tags

| Link | What moves it | Tag |
|---|---|---|
| Diesel | Oil price; surcharge catches up about two months later | oil -> fuel cost, surcharge lag |
| Labour | Union contracts: all national agreements run to 2029-12-31, +18.8% over five years | wages -> labour cost |
| Steel | Railcar and track cost; tariffs (Section 232) | steel -> railcar cost, tariffs |
| Volume mix | Coal, grain, chemicals, autos, intermodal | ISM, consumer, grain, coal |
| Capital | Lessor and railcar-buyer financing | rates -> lessor financing |
| Cross-border | Mexico and Canada volumes, trade rules | tariffs / Mexico trade |

## Where the cycle is (2026-11-26)

Late upswing in volume and unit pricing, with a fuel shock on top. AAR year to date (46 weeks): carloads +2.7%, intermodal +5.1%. Latest week (ending Nov 21): carloads +0.5%, intermodal +8.3%, so carload growth is fading. Q3 profits were records at UNP, CSX, CPKC, CN (EPS up). Operating ratios worsened in percent because fuel pass-through inflates revenue. Railcars in storage are the lowest since late 2022, trucking is tight, railcar lessors are full; railcar building is still low (industry deliveries guided below 25,000 in 2026).

## Lingo (short definitions)

- **Class I**: the largest US railroads by revenue.
- **Carload**: one railcar of freight. **Intermodal**: containers or trailers moved by rail and truck.
- **Operating ratio (OR)**: operating cost / revenue. Lower is better. UNP 59.1%, NSC 67.4% (Q3 2026).
- **Revenue per unit / ARC**: revenue per carload or per car.
- **Fuel surcharge**: extra charge that follows diesel price, usually with a lag.
- **RCAF**: Rail Cost Adjustment Factor, an STB-published index of railroad input costs, used to escalate contracts. Q4 2026 unadjusted 1.193, up 8.9% on Q3.
- **STB**: Surface Transportation Board, the federal rail regulator.
- **Reciprocal switching**: forcing one railroad to hand a customer's cars to a rival at a fee. The 2024 rule was vacated by a court; a repeal was proposed Jan 2026.
- **Captive shipper**: a customer with only one railroad.
- **Velocity / dwell**: train speed per day / hours a car sits in a yard. Service quality gauges.
- **Utilization, LPI**: share of leased railcars on rent; lease price index (rate change on renewal).
- **Trackage rights**: permission to run your trains on another railroad's track.

## The numbers to watch

1. AAR weekly carloads and intermodal (every Wednesday): trend of year-over-year growth.
2. Operating ratio each quarter, and the fuel effect inside it.
3. Revenue per unit versus the RCAF (is price beating cost inflation?).
4. Fuel: EIA weekly diesel (still $5.695, about +49% y/y on Nov 23) and the surcharge lag.
5. Railcar lessor utilization and lease price index (GATX 98.4% and +12.4%).

## What to watch next

- UP-NS merger docket FD 36873: responses due 2027-02-16, hearing date TBD, final briefs 2027-05-28 per the lead card, decision about 90 days after the record closes. Opposition so far: BNSF, CSX, CPKC, CN, Farm Bureau, J.B. Hunt.
- Q1 2027 RCAF (published December): whether fuel drops out of the index.
- Weekly carload trend after Thanksgiving; NRF forecast of imports turning down in January (-3%) and March (-11%).
- Hub Group: 10-Q and 10-K filing and Nasdaq status (exception to 2026-12-31).
- Canadian labour: CN and CPKC contract status was not confirmed in this run.
- Fed decision Dec 8-9 and effect on railcar financing.

## Change log

- 2026-11-26: first primer written. Fuel is still high despite the oil drop; volumes still confirm the hard-data overheat read; no slowdown signal in AAR data yet.

<!-- COMPLETE -->
