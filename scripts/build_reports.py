"""Step 8 report builder (CLAUDE.md section 13).

Builds, for one run:
  reports/<industry>.html (self-contained, inline SVG) + reports/<industry>.md
  reports/MAP.html (cross-industry atlas with a regime toggle)
  COVERAGE.md
Inputs are only files on disk: triage, industries, regime, routing, theses, redteam, deepdive, status_overrides, step8.json.

Usage: python scripts/build_reports.py runs/20261126-full_hunt
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))
import charts, validate  # noqa: E402

RUN = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "runs" / "20261126-full_hunt"
RUN = RUN if RUN.is_absolute() else ROOT / RUN
OUT = RUN / "reports"
OUT.mkdir(parents=True, exist_ok=True)
E = html.escape

LAYERS = ["dd-edgar", "dd-ir", "dd-transcripts", "dd-regulatory", "dd-credit", "dd-ownership", "dd-peers", "dd-diff"]
MOVED = {  # Lane A signals that moved this run (regime.json, markets and macro scans)
    "oil": "Brent -18% in a month", "diesel": "diesel still ~49% above a year ago", "fuel": "fuel cost easing with lag",
    "rates": "Fed leaning to hike; 10y 4.85-4.94%", "dollar": "DXY +4.8% over 3m", "credit": "HY spreads 3.72%, widest of 2026",
    "spread": "HY spreads widest of 2026", "tariff": "USTR Section 301 proposal 2026-11-25", "consumer": "real spending flat in October",
    "inflation": "PCE 3.8% y/y", "ism": "ISM manufacturing 55.5", "fed": "Dec 8-9 FOMC", "cre": "CRE office stress", "hy": "HY spreads widest of 2026",
}


def lit(tag):
    t = tag.lower()
    for k, why in MOVED.items():
        if k in t:
            return why
    return None


def load(p):
    return json.loads(Path(p).read_text())


regime = load(RUN / "regime.json")
overrides = load(RUN / "status_overrides.json")["overrides"] if (RUN / "status_overrides.json").exists() else {}
step8 = load(RUN / "theses" / "step8.json")["survivors"] if (RUN / "theses" / "step8.json").exists() else {}
TODAY = regime.get("regime", "overheat")


def triage_all():
    out = {}
    for f in sorted((RUN / "triage").glob("*.json")):
        o = load(f)
        st = o["status"]
        ov = overrides.get(o["ticker"])
        if ov:
            st = ov["to"]
        s8 = step8.get(o["ticker"])
        if s8 and s8.get("final_status"):
            st = s8["final_status"]
        o["final_status"] = st
        o["final_reason"] = (s8 or {}).get("final_reason") or (ov or {}).get("reason") or o["status_reason"]
        out[o["ticker"]] = o
    return out


TRI = triage_all()


def redteam(tk):
    f = RUN / "redteam" / f"{tk}.md"
    if not f.exists():
        return None, None
    txt = f.read_text()
    m = re.search(r"## Verdict\s*\n+\s*\**`?(holds|weakened|broken)`?\**", txt, re.I)
    sec = re.search(r"## Verdict\s*\n(.*?)\n## ", txt, re.S)
    return (m.group(1).lower() if m else "unparsed"), (sec.group(1).strip() if sec else "")


def dd_impacts(tk):
    res = {}
    for L in LAYERS:
        f = RUN / "deepdive" / tk / f"{L}.md"
        if not f.exists():
            res[L] = "missing"
            continue
        m = re.search(r"Thesis impact:\s*\**\s*([a-z]+)", f.read_text(), re.I)
        res[L] = m.group(1).lower() if m else "covered"
    return res


def urls_in(text):
    return sorted(set(re.findall(r"https?://[^\s\)\]\"'<>|,]+", text)))


CSS = """
:root{--ink:#191919;--ink2:#666;--line:#e7e7e7;--plane:#f6f5f2;--card:#fff;--good:#0aac23;--warn:#fbb315;--bad:#dc3c3d;--blue:#257de0;--lit:#fff2cc;}
*{box-sizing:border-box}body{margin:0;background:var(--plane);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 64px}h1{font-size:28px;margin:0 0 4px}h2{font-size:19px;margin:36px 0 12px;border-bottom:2px solid var(--ink);padding-bottom:4px}
h3{font-size:16px;margin:18px 0 8px}.sub{color:var(--ink2)}.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:12px 0}
.regime{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.regime div{border-radius:10px;padding:10px;background:#f0f0f0;font-size:13px}
.regime .now{background:#191919;color:#fff}.flow{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:14px}.col h3{margin-top:0}
.node{background:#fafafa;border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}.tag{display:inline-block;border-radius:999px;padding:1px 8px;margin:2px 3px 0 0;font-size:11px;background:#eee;color:#444}
.tag.lit{background:var(--lit);color:#7a5200;border:1px solid #f2c94c}.arrow{color:var(--ink2);text-align:center;font-size:12px}
table{border-collapse:collapse;width:100%;font-size:13px;background:var(--card)}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}th{background:#fafafa;font-weight:600}
.chip{border-radius:999px;padding:2px 10px;font-weight:600;font-size:12px;white-space:nowrap}.chip-survived{background:var(--good);color:#fff}.chip-watch{background:var(--warn);color:#0b0b0b}.chip-dropped{background:var(--bad);color:#fff}
.svgwrap{overflow-x:auto;background:#fff;border-radius:12px;border:1px solid var(--line);padding:8px}.svgwrap svg{max-width:100%;height:auto}
.surv{border-left:6px solid var(--good)}.small{font-size:12px;color:var(--ink2)}code{background:#f2f2f2;padding:1px 4px;border-radius:4px}
.kv{display:grid;grid-template-columns:180px 1fr;gap:4px 12px;font-size:14px}.ok{color:#006c10}.no{color:#b3261e}
.tw{overflow-x:auto;max-width:100%}li,td{overflow-wrap:anywhere}pre{overflow-x:auto}
@media (max-width:760px){.flow,.regime{grid-template-columns:1fr}.kv{grid-template-columns:1fr}}
"""


def chip(st, reason=""):
    label = {"survived": "Survived", "watch": "Watch", "dropped": "Dropped"}.get(st, st)
    icon = {"survived": "●", "watch": "◐", "dropped": "✕"}.get(st, "")
    return f'<span class="chip chip-{st}" title="{E(reason)}">{icon} {label}</span>'


def regime_box(ind):
    names = {"boom": "Boom", "overheat": "Overheat", "stagflation": "Stagflation", "slowdown": "Slowdown"}
    cells = "".join(f'<div class="{"now" if k == TODAY else ""}"><b>{names[k]}</b>{" · now" if k == TODAY else ""}<br>{E(ind["regime_sensitivity"].get(k, "")[:220])}</div>' for k in names)
    return (f'<div class="card"><b>Regime:</b> {E(regime["label"])} · confidence {E(regime["confidence"])}. '
            f'Transition risk: {E(regime["transition_risk"]["to"])}.<div class="regime">{cells}</div>'
            f'<div class="small">Overlays: rates · {E(regime["overlays"]["rates"][:140])} | dollar · {E(regime["overlays"]["dollar"][:80])} | credit · {E(regime["overlays"]["credit"][:80])}</div></div>')


def flow(ind):
    vc = ind["value_chain"]

    def tags(ts):
        return "".join(f'<span class="tag{" lit" if lit(t) else ""}" title="{E(lit(t) or "")}">{E(t)}</span>' for t in ts)
    ins = "".join(f'<div class="node"><b>{E(i["input"])}</b><br><span class="small">{E(", ".join(i.get("suppliers", [])[:4]))}</span><br>{tags(i.get("signal_tags", []))}</div>' for i in vc["inputs"])
    lay = vc["industry_layer"]
    mid = (f'<div class="node"><b>Who makes what</b><br>{E(lay.get("who_makes_what", "")[:420])}</div>'
           f'<div class="node"><b>Chokepoints</b><br>{E("; ".join(lay.get("chokepoints", []))[:380])}</div>'
           f'<div class="node"><b>Capacity · location</b><br>{E((lay.get("capacity", "") + " · " + lay.get("locations", ""))[:300])}</div>')
    cus = "".join(f'<div class="node"><b>{E(c["segment"])}</b><br><span class="small">{E(", ".join(c.get("big_buyers", [])[:4]))}</span><br>{tags(c.get("signal_tags", []))}</div>' for c in vc["customers"])
    return (f'<div class="card"><p>{E(ind["how_money_flows"])}</p><div class="flow"><div class="col"><h3>Inputs →</h3>{ins}</div>'
            f'<div class="col"><h3>The industry</h3>{mid}</div><div class="col"><h3>→ Customers</h3>{cus}</div></div>'
            f'<p class="small">Highlighted tags are signals that moved this run (hover for what moved).</p></div>')


def company_rows(ind, tri):
    rows, md = [], []
    for c in ind["companies"]:
        t = tri.get(c["ticker"])
        if t:
            src = next((r["source"] for r in t["reads"] if r["n"] == 17), "")
            rows.append(f'<tr><td><b>{E(c["ticker"])}</b></td><td>{E(t["name"])}</td><td>{E(t["company_type"])}</td><td>{E(t["business_model"])}</td>'
                        f'<td>{E(t["business_quality"])}</td><td>{E(t["attractiveness_now"])}</td><td>{chip(t["final_status"], t["final_reason"])}<br><span class="small">{E(t["final_reason"][:200])}</span></td>'
                        f'<td><a href="{E(src)}">source</a></td></tr>')
            md.append(f'| {c["ticker"]} | {t["name"]} | {t["company_type"]} | {t["business_quality"]} | {t["attractiveness_now"]} | **{t["final_status"]}** | {t["final_reason"][:160]} |')
        else:
            note = "not_triaged" + ("" if c.get("us_listed", True) else " · foreign peer")
            rows.append(f'<tr><td>{E(c["ticker"])}</td><td>{E(c["name"])}</td><td>{E(c.get("company_type", ""))}</td><td>{E(c.get("business_model", ""))}</td><td>–</td><td>–</td><td><span class="small">{note}: {E(c.get("why_listed", ""))}</span></td><td>map</td></tr>')
            md.append(f'| {c["ticker"]} | {c["name"]} | {c.get("company_type", "")} | – | – | {note} | {c.get("why_listed", "")} |')
    head = "<tr><th>Ticker</th><th>Name</th><th>Type</th><th>Business model</th><th>Quality</th><th>Attract.</th><th>Status</th><th>Source</th></tr>"
    return f"<table>{head}{''.join(rows)}</table>", md


def survivor_page(tk, t):
    th = RUN / "theses" / f"{tk}.md"
    verdict, vtext = redteam(tk)
    s8 = step8.get(tk, {})
    imp = dd_impacts(tk)
    thesis_txt = th.read_text() if th.exists() else ""
    m = re.search(r"## 4\. The mistake.*?\n(.*?)\n## ", thesis_txt, re.S)
    mistake = m.group(1).strip() if m else (t.get("the_mistake") or "")
    vt = re.search(r"## 2\. What it is worth.*?\n(.*?)\n## ", thesis_txt, re.S)
    val_md = vt.group(1).strip() if vt else ""
    cov = "".join(f'<tr><td>{L}</td><td>{E(v)}</td></tr>' for L, v in imp.items())
    ks = "".join(f"<li>{E(x)}</li>" for x in s8.get("kill_switch", [])) or "<li>pending Step 8</li>"
    ws = "".join(f"<li>{E(x)}</li>" for x in s8.get("watch_signals", [])) or "<li>pending Step 8</li>"
    sizing = s8.get("sizing", {})
    return (f'<div class="card surv"><h3>{E(tk)} · {E(t["name"])} {chip(t["final_status"], t["final_reason"])}</h3>'
            f'<div class="kv"><b>Final status</b><span>{E(t["final_status"])} · {E(t["final_reason"][:300])}</span>'
            f'<b>Red-team verdict</b><span>{E(verdict or "pending")}: {E((vtext or "")[:400])}</span>'
            f'<b>Conviction</b><span>{E(sizing.get("conviction", "–"))} · main risk: {E(sizing.get("main_risk", "–"))} · add if: {E(sizing.get("add_if", "–"))}</span></div>'
            f'<h3>The mistake</h3><p>{E(mistake[:1500])}</p><h3>Valuation</h3><pre style="white-space:pre-wrap;font-size:12px">{E(val_md[:2200])}</pre>'
            f'<h3>Kill switch</h3><ul>{ks}</ul><h3>Watch signals</h3><ul>{ws}</ul>'
            f'<h3>Deep-dive coverage (thesis impact per layer)</h3><table><tr><th>Layer</th><th>Impact</th></tr>{cov}</table>'
            f'<p class="small">Thesis: <code>theses/{tk}.md</code> · red team: <code>redteam/{tk}.md</code> · deep dive: <code>deepdive/{tk}/</code></p></div>')


def coverage_table(tickers):
    keys = ["10-K", "10-Q", "earnings_release", "presentation", "ir_fact_sheet", "def14a", "red_flag_scan", "price"]
    head = "<tr><th>Ticker</th>" + "".join(f"<th>{k}</th>" for k in keys) + "</tr>"
    rows = []
    for tk in tickers:
        c = TRI[tk].get("coverage", {})
        rows.append(f"<tr><td>{tk}</td>" + "".join(f'<td class="{"ok" if c.get(k) == "covered" else "no"}">{E(c.get(k, "missing"))}</td>' for k in keys) + "</tr>")
    return f"<table>{head}{''.join(rows)}</table>"


def build_industry(slug):
    ind = load(RUN / "industries" / f"{slug}.json")
    tri = {k: v for k, v in TRI.items() if v["industry"] == slug}
    order = [c["ticker"] for c in ind["companies"] if c["ticker"] in tri]
    rows = [{"ticker": tk, "status": tri[tk]["final_status"], "scores": [r["score"] for r in sorted(tri[tk]["reads"], key=lambda r: r["n"])],
             "grid": tri[tk]["regime_grid"]} for tk in order]
    fp = charts.fingerprint_strips(rows, title=f"{slug.title()} · 17-read fingerprints (1 light → 5 dark)")
    rg = charts.regime_heat_grid(rows, today=TODAY, title=f"{slug.title()} · how each company fares by economy")
    b12 = charts.bars(order, [float(r["scores"][11]) for r in rows], "Read 12 · cash and leaders (score 1-5)", "", highlight=[tk for tk in order if tri[tk]["final_status"] == "survived"] or None)
    b17 = charts.bars(order, [float(r["scores"][16]) for r in rows], "Read 17 · price cushion (score 1-5)", "", highlight=[tk for tk in order if tri[tk]["final_status"] == "survived"] or None)
    table_html, table_md = company_rows(ind, tri)
    kn = "".join(f'<tr><td><b>{E(k["metric"])}</b><br><span class="small">{E(k.get("why_it_matters", ""))}</span></td><td>{E(str(k.get("latest", "")))}</td><td>{E(str(k.get("prior", "")))}</td><td><a href="{E(k.get("source", ""))}">source</a> {E(k.get("as_of", ""))}</td></tr>' for k in ind["key_numbers"])
    survivors = [tk for tk in order if tri[tk]["final_status"] == "survived" or (RUN / "theses" / f"{tk}.md").exists()]
    surv_html = "".join(survivor_page(tk, tri[tk]) for tk in survivors) or '<div class="card">No survivors in this industry this run. Every company keeps its fingerprint and reason above.</div>'
    primer = ROOT / "library" / "industries" / f"{slug}-primer.md"
    primer_txt = primer.read_text()[:3000] if primer.exists() else ""
    srcs = set()
    for tk in order:
        for r in tri[tk]["reads"]:
            if r.get("source", "").startswith("http"):
                srcs.add((r["source"], r.get("as_of", "")))
    for k in ind["key_numbers"]:
        if k.get("source", "").startswith("http"):
            srcs.add((k["source"], k.get("as_of", "")))
    for tk in survivors:
        for f in list((RUN / "deepdive" / tk).glob("dd-*.md")) + [RUN / "theses" / f"{tk}.md", RUN / "redteam" / f"{tk}.md"]:
            if f.exists():
                for u in urls_in(f.read_text()):
                    srcs.add((u, "see file"))
    src_html = "".join(f'<li><a href="{E(u)}">{E(u[:120])}</a> <span class="small">{E(a)}</span></li>' for u, a in sorted(srcs))
    n = {s: sum(1 for tk in order if tri[tk]["final_status"] == s) for s in ("survived", "watch", "dropped")}
    head = f"{slug.title()} · {len(order)} triaged · {n['survived']} survived · {n['watch']} watch · {n['dropped']} dropped"
    doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{slug.title()} Industry Report</title><style>{CSS}</style></head><body><main>
<h1>{E(slug.title())}</h1><div class="sub">Run {E(RUN.name)} · {E(head)} · built {E(validate.now()[:10])}</div>
<h2>1 · Headline and regime</h2>{regime_box(ind)}
<h2>2 · How money flows</h2>{flow(ind)}
<h2>3 · Every company</h2>{table_html}
<h2>4 · Fingerprints</h2><div class="svgwrap">{fp}</div>
<h2>5 · Regime heat grid</h2><div class="svgwrap">{rg}</div>
<h2>6 · Numbers that matter</h2><table><tr><th>Metric</th><th>Latest</th><th>Prior</th><th>Source</th></tr>{kn}</table>
<div class="svgwrap">{b12}</div><div class="svgwrap">{b17}</div>
<h2>7 · Survivor pages</h2>{surv_html}
<h2>8 · Primer</h2><div class="card"><pre style="white-space:pre-wrap;font-size:13px">{E(primer_txt)}</pre><p class="small">Full primer: <code>library/industries/{slug}-primer.md</code></p></div>
<h2>9 · Coverage</h2>{coverage_table(order)}
<h2>10 · Sources</h2><ul class="small">{src_html}</ul>
</main></body></html>"""
    doc = doc.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")
    (OUT / f"{slug}.html").write_text(doc)
    md = [f"# {slug.title()} industry report · {RUN.name}", "", f"{head}", "", f"**Regime:** {regime['label']} (confidence {regime['confidence']})", "",
          "## How money flows", ind["how_money_flows"], "", "## Every company", "| Ticker | Name | Type | Quality | Attract. | Status | Reason |", "|---|---|---|---|---|---|---|", *table_md, "",
          "## Key numbers", *[f"- **{k['metric']}**: {k.get('latest', '')} (prior {k.get('prior', '')}) · [source]({k.get('source', '')}) {k.get('as_of', '')}" for k in ind["key_numbers"]], "",
          "## Survivors", *([f"- **{tk}**: {tri[tk]['final_status']} · see `theses/{tk}.md`, red team `redteam/{tk}.md`" for tk in survivors] or ["- none this run"]), "",
          f"Charts and full coverage are in `{slug}.html`.", "", "<!-- COMPLETE -->"]
    (OUT / f"{slug}.md").write_text("\n".join(md))
    return {"slug": slug, "order": order, "n": n}


def build_map(results):
    data = []
    for r in results:
        for tk in r["order"]:
            t = TRI[tk]
            data.append({"t": tk, "n": t["name"], "ind": r["slug"], "s": t["final_status"], "q": t["business_quality"], "a": t["attractiveness_now"], "g": t["regime_grid"], "why": t["final_reason"][:160]})
    js = json.dumps(data)
    doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Investment Hunt Atlas</title>
<style>{CSS}
.district{{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;margin:14px 0}}.skyline{{display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px;min-height:150px;padding:8px;border-bottom:3px solid #191919}}
.bld{{width:58px;border-radius:6px 6px 0 0;position:relative;display:flex;align-items:flex-start;justify-content:center;font-size:11px;font-weight:700;color:#191919;padding-top:4px;cursor:default;transition:background .3s}}
.bld .win{{position:absolute;inset:22px 8px 6px 8px;background:repeating-linear-gradient(#ffffff66 0 6px,transparent 6px 12px)}}.bld.survived{{box-shadow:0 0 0 3px var(--good),0 0 18px #0aac2388}}
.bar{{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}}.bar button{{border:1px solid #191919;background:#fff;border-radius:999px;padding:6px 14px;cursor:pointer;font:inherit}}.bar button.on{{background:#191919;color:#fff}}
.legend span{{display:inline-block;margin-right:14px}}</style></head><body><main>
<h1>Investment Hunt Atlas</h1><div class="sub">Run {E(RUN.name)} · industries are districts, companies are buildings (height = business quality), survivors glow green. Toggle an economy to re-shade every building by how it fares there.</div>
<div class="card"><b>Today:</b> {E(regime["label"])} · confidence {E(regime["confidence"])}</div>
<div class="bar" id="bar"></div><div class="legend small" id="legend"></div><div id="atlas"></div>
<script>
const D={js};const H={{A:140,B:110,C:80,D:55}};let mode='status';
const STATUS={{survived:'#0aac23',watch:'#fbb315',dropped:'#dc3c3d'}};const GRID={{'+':'#338ced','0':'#d8d8d8','-':'#eb6263'}};
const modes=[['status','Status'],['boom','Boom'],['overheat','Overheat{" (now)" if TODAY == "overheat" else ""}'],['stagflation','Stagflation'],['slowdown','Slowdown']];
function draw(){{const bar=document.getElementById('bar');bar.innerHTML='';modes.forEach(([k,l])=>{{const b=document.createElement('button');b.textContent=l;b.className=k===mode?'on':'';b.onclick=()=>{{mode=k;draw()}};bar.appendChild(b)}});
document.getElementById('legend').innerHTML=mode==='status'?'<span>● green Survived</span><span>◐ amber Watch</span><span>✕ red Dropped</span>':'<span>blue = does well (+)</span><span>grey = neutral (0)</span><span>red = does badly (−)</span>';
const at=document.getElementById('atlas');at.innerHTML='';[...new Set(D.map(d=>d.ind))].forEach(ind=>{{const dv=document.createElement('div');dv.className='district';dv.innerHTML='<h3>'+ind[0].toUpperCase()+ind.slice(1)+' district</h3>';
const sk=document.createElement('div');sk.className='skyline';D.filter(d=>d.ind===ind).forEach(d=>{{const b=document.createElement('div');b.className='bld '+d.s;b.style.height=(H[d.q]||60)+'px';
b.style.background=mode==='status'?STATUS[d.s]:GRID[d.g[mode]||'0'];b.title=d.t+' · '+d.n+' · '+d.s+' · quality '+d.q+' · attract. '+d.a+(mode==='status'?'':' · '+mode+' '+(d.g[mode]||'0'))+'\\n'+d.why;b.innerHTML='<span>'+d.t+'</span><div class="win"></div>';sk.appendChild(b)}});dv.appendChild(sk);at.appendChild(dv)}})}}
draw();
</script></main></body></html>"""
    (OUT / "MAP.html").write_text(doc)


def build_coverage(results):
    lines = [f"# Coverage report · {RUN.name}", "", "Every layer for every company: covered / nothing_found / unreachable / failed. Nothing is silently missing.", ""]
    st = validate.load_state()
    failed = [t for t in st["tasks"] if t["status"] == "failed"]
    lines += ["## Tasks that did not complete", *([f"- `{t['id']}`: {t['last_error']}" for t in failed] or ["- none"]), ""]
    lines += ["## Triage coverage (Wave 4)", "| Ticker | 10-K | 10-Q | release | deck | fact sheet | DEF 14A | red flags | price |", "|---|---|---|---|---|---|---|---|---|"]
    for r in results:
        for tk in r["order"]:
            c = TRI[tk].get("coverage", {})
            lines.append(f"| {tk} | " + " | ".join(c.get(k, "missing") for k in ["10-K", "10-Q", "earnings_release", "presentation", "ir_fact_sheet", "def14a", "red_flag_scan", "price"]) + " |")
    lines += ["", "## Deep-dive coverage (Wave 5)", "| Ticker | " + " | ".join(LAYERS) + " |", "|---|" + "---|" * len(LAYERS)]
    for tk in sorted(p.name for p in (RUN / "deepdive").iterdir() if p.is_dir()):
        imp = dd_impacts(tk)
        lines.append(f"| {tk} | " + " | ".join(imp[L] if imp[L] != "missing" else "failed (cancelled)" for L in LAYERS) + " |")
    lines += ["", "Per-item coverage tables (covered / nothing_found / unreachable with reasons) are inside each deep-dive file under `## Coverage`, and per-company `coverage_notes` are in each triage JSON.", "",
              "## Known unreachable sources this run", "- FRED (connection closed), BLS API (keyless quota), FERC and FCC (403 to scripts), CourtListener (401), several IR sites (403/captcha), congress.gov (403), IBKR (no connector).", "", "<!-- COMPLETE -->"]
    validate.atomic_write(RUN / "COVERAGE.md", "\n".join(lines))


if __name__ == "__main__":
    inds = json.loads((ROOT / "config.json").read_text())["industries"]
    res = [build_industry(s) for s in inds]
    build_map(res)
    build_coverage(res)
    for r in res:
        print(r["slug"], r["n"])
    print("built:", sorted(p.name for p in OUT.glob("*")))
