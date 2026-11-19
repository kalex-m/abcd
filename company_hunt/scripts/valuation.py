#!/usr/bin/env python3
"""Standard valuation kit for dossiers (so every finalist is valued the same way and the verifier can re-run it).

Usage:
  python3 scripts/valuation.py TICKER [--cash X] [--r 0.09] [--tg 0.025] [--years 10]
        [--bear g1,m] [--base g1,m] [--bull g1,m] [--ebit X] [--tax 0.21] [--bv X --roe X] [--div X --dg X]
        [--netcash X] [--shares X] [--price X]
  --cash   starting owner cash flow in $ (default: latest FY FCF minus stock comp from metrics.csv)
  --bear/base/bull  "g,m": g = annual growth of owner cash for years 1-5 (fades linearly to terminal growth by year 10),
                    m = multiplier on starting cash (margin reset; 1.0 = no change)
  --ebit   normalized EBIT for earnings power value (default: 5-year average operating income from EDGAR series)
  --bv, --roe   book value of equity and sustainable ROE for residual income (banks/insurers)
  --div, --dg   current annual dividend per share and long-run dividend growth for the dividend discount model
Use the = form for negative numbers, e.g. --bear=-0.03,0.85 . All $ in USD. Output: reverse DCF implied growth, scenario values per share, EPV, RI, DDM, and an r x g sensitivity grid.
Sources: triage/metrics.csv (EDGAR XBRL frames + yfinance price, 2026-11-18); override any input explicitly in the dossier.
"""
import sys, json, math, argparse
import numpy as np, pandas as pd
ROOT = "/home/user/abcd/company_hunt"
ap = argparse.ArgumentParser()
ap.add_argument("ticker"); ap.add_argument("--cash", type=float); ap.add_argument("--r", type=float, default=0.09)
ap.add_argument("--tg", type=float, default=0.025); ap.add_argument("--years", type=int, default=10)
ap.add_argument("--bear"); ap.add_argument("--base"); ap.add_argument("--bull")
ap.add_argument("--ebit", type=float); ap.add_argument("--tax", type=float, default=0.21)
ap.add_argument("--bv", type=float); ap.add_argument("--roe", type=float)
ap.add_argument("--div", type=float); ap.add_argument("--dg", type=float)
ap.add_argument("--netcash", type=float); ap.add_argument("--shares", type=float); ap.add_argument("--price", type=float)
a = ap.parse_args()
M = pd.read_csv(f"{ROOT}/triage/metrics.csv").set_index("ticker")
m = M.loc[a.ticker]
S = json.load(open(f"{ROOT}/data/sec/series.json")).get(str(int(m["cik"])), {}).get("S", {})
price = a.price or float(m["price"]); mcap = float(m["mcap"])
shares = a.shares or mcap / price
netcash = a.netcash if a.netcash is not None else (float(m["net_cash"]) if pd.notna(m["net_cash"]) else 0.0)
cash0 = a.cash if a.cash is not None else float(m["fcf_sbc"])
r, tg, N = a.r, a.tg, a.years

def pv_path(c0, g1, r=r, tg=tg, N=N, mult=1.0):
    """g1 for years 1-5, linear fade to tg by year N; Gordon terminal value."""
    c = c0 * mult; pv = 0.0
    for t in range(1, N + 1):
        g = g1 if t <= 5 else g1 + (tg - g1) * (t - 5) / (N - 5)
        c *= (1 + g); pv += c / (1 + r) ** t
    tv = c * (1 + tg) / (r - tg)
    return pv + tv / (1 + r) ** N

def per_share(ev):
    return (ev + netcash) / shares

target_ev = price * shares - netcash
print(f"# {a.ticker} valuation kit | price ${price:,.2f} | shares {shares/1e6:,.1f}M | mcap ${mcap/1e9:,.2f}B | net cash ${netcash/1e9:,.2f}B | EV ${target_ev/1e9:,.2f}B")
print(f"# owner cash (start) ${cash0/1e9:,.2f}B ({'override' if a.cash is not None else 'latest FY FCF - SBC, EDGAR'}) | discount rate {r:.1%} | terminal growth {tg:.1%} | horizon {N}y")
# reverse DCF
lo, hi = -0.5, 1.0
if cash0 > 0:
    for _ in range(200):
        mid = (lo + hi) / 2
        if pv_path(cash0, mid) > target_ev: hi = mid
        else: lo = mid
    print(f"\nREVERSE DCF: price implies owner cash growing {mid:.1%}/yr for 5 years, fading to {tg:.1%} by year {N}")
    for rr in (0.08, 0.10, 0.11):
        lo2, hi2 = -0.5, 1.0
        for _ in range(200):
            mm = (lo2 + hi2) / 2
            if pv_path(cash0, mm, r=rr) > target_ev: hi2 = mm
            else: lo2 = mm
        print(f"   at {rr:.0%} discount rate: implied growth {mm:.1%}/yr")
    print(f"   zero-growth value (cash flat forever at r): ${per_share(cash0 / r)/1:,.2f}/sh vs price ${price:,.2f}")
else:
    print("\nREVERSE DCF: starting owner cash <= 0; pass --cash with a normalized figure")
# scenarios
print("\nSCENARIO DCF (g for yrs 1-5 fading to terminal; m = reset of starting cash)")
for name in ("bear", "base", "bull"):
    v = getattr(a, name)
    if not v: continue
    g, mult = [float(x) for x in v.split(",")]
    ps = per_share(pv_path(cash0, g, mult=mult))
    print(f"   {name:4s}: g={g:.1%}, m={mult:.2f} -> ${ps:,.2f}/sh ({ps/price-1:+.0%} vs price)")
# EPV
ebit = a.ebit
if ebit is None:
    oi = S.get("oi", {}); ys = sorted(oi)[-5:]
    ebit = float(np.mean([oi[y] for y in ys])) if ys else None
if ebit:
    epv = ebit * (1 - a.tax) / r
    print(f"\nEARNINGS POWER VALUE: normalized EBIT ${ebit/1e9:,.2f}B x (1-{a.tax:.0%}) / {r:.0%} = ${epv/1e9:,.2f}B + net cash -> ${per_share(epv):,.2f}/sh ({per_share(epv)/price-1:+.0%})")
# residual income
if a.bv and a.roe:
    bv = a.bv; ri_pv = 0.0; b = bv
    for t in range(1, N + 1):
        ri = (a.roe - r) * b; ri_pv += ri / (1 + r) ** t; b *= (1 + a.roe * 0.5)
    ri_tv = (a.roe - r) * b * (1 + tg) / (r - tg) / (1 + r) ** N
    val = (bv + ri_pv + ri_tv) / shares
    print(f"\nRESIDUAL INCOME: BV ${bv/1e9:,.2f}B, ROE {a.roe:.1%}, 50% retention -> ${val:,.2f}/sh ({val/price-1:+.0%})")
# DDM
if a.div and a.dg is not None:
    v = a.div * (1 + a.dg) / (r - a.dg)
    print(f"\nDIVIDEND DISCOUNT: D ${a.div:.2f} growing {a.dg:.1%} at {r:.0%} -> ${v:,.2f}/sh ({v/price-1:+.0%})")
# sensitivity
print("\nSENSITIVITY: value/sh, rows = discount rate, cols = growth yrs 1-5 (base m=1.0)")
gs = [-0.02, 0.0, 0.03, 0.06, 0.09, 0.12]
print("   r\\g  " + " ".join(f"{g:>8.0%}" for g in gs))
for rr in (0.08, 0.09, 0.10, 0.11):
    print(f"   {rr:.0%}  " + " ".join(f"{per_share(pv_path(cash0, g, r=rr)):>8,.0f}" for g in gs))
