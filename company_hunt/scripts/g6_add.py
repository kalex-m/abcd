"""Ground 6 helper: append one examined company to triage/ground_6_all.csv and a section to triage/ground_6_sotp.md.
Usage: from g6_add import add; add(dict(...)).  Idempotent: skips a ticker already present in ground_6_all.csv."""
import csv, os
ROOT = "/home/user/abcd/company_hunt/triage"
ALL = f"{ROOT}/ground_6_all.csv"; MD = f"{ROOT}/ground_6_sotp.md"
COLS = "ticker,name,hidden_asset,hidden_asset_type,hidden_value_usd_bn,rest_value_usd_bn,net_debt_usd_bn,sotp_usd_bn,mcap_usd_bn,sotp_gap_pct,key_assumptions,unlock_signal,trap_risk,one_line_note,sources,verdict,quality,unlock_score".split(",")

def done():
    if not os.path.exists(ALL): return set()
    return {r["ticker"] for r in csv.DictReader(open(ALL))}

def add(c):
    if c["ticker"] in done():
        print("skip (already written)", c["ticker"]); return
    hid = sum(v for (_, _, v, h) in c["parts"] if h)
    rest = sum(v for (_, _, v, h) in c["parts"] if not h)
    nd = c["net_debt"]; sotp = hid + rest - nd; mc = c["mcap"]
    gap = sotp / mc - 1
    row = dict(ticker=c["ticker"], name=c["name"], hidden_asset=c["hidden_asset"], hidden_asset_type=c["htype"],
               hidden_value_usd_bn=round(hid, 2), rest_value_usd_bn=round(rest, 2), net_debt_usd_bn=round(nd, 2),
               sotp_usd_bn=round(sotp, 2), mcap_usd_bn=round(mc, 2), sotp_gap_pct=round(100 * gap, 1),
               key_assumptions=c["assumptions"], unlock_signal=c["unlock"], trap_risk=c["trap"], one_line_note=c["note"],
               sources=";".join(c["sources"]), verdict=c["verdict"], quality=c.get("quality", ""), unlock_score=c.get("unlock_score", ""))
    new = not os.path.exists(ALL)
    with open(ALL, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        if new: w.writeheader()
        w.writerow(row)
    lines = [f"\n## {c['ticker']}: {c['name']} ({c['verdict']})\n",
             f"Hidden asset: {c['hidden_asset']} ({c['htype']}). Market cap ${mc:.1f}bn.\n",
             "| part | basis | value $bn |", "|---|---|---:|"]
    for (lab, basis, v, h) in c["parts"]:
        lines.append(f"| {'**' + lab + '**' if h else lab} | {basis} | {v:.1f} |")
    lines.append(f"| less net debt | {c.get('nd_basis', 'parent level')} | {-nd:.1f} |")
    lines.append(f"| **conservative SOTP** | | **{sotp:.1f}** |")
    lines.append(f"| market cap | yfinance 2026-11-18 | {mc:.1f} |")
    lines.append(f"| **gap** | SOTP / mcap - 1 | **{100 * gap:+.0f}%** |\n")
    lines.append(c["reading"].strip() + "\n")
    lines.append("Sources: " + "; ".join(c["sources"]) + "\n")
    with open(MD, "a") as f: f.write("\n".join(lines))
    print(f"{c['ticker']}: hidden {hid:.1f} rest {rest:.1f} nd {nd:.1f} sotp {sotp:.1f} mcap {mc:.1f} gap {100*gap:+.1f}%")
