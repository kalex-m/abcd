import json, sys, os, re
D="/home/user/abcd/company_hunt/data/g7_evidence"
def fm(x): return f"{x/1e9:.2f}B" if x is not None else "-"
for t in sys.argv[1:]:
    fn=f"{D}/{t}.json"
    if not os.path.exists(fn): print(t,'(not yet)'); continue
    d=json.load(open(fn))
    s=f"### {t}"
    if d.get('err'): s+=f" ERR {d['err']}"
    r=d.get('rpo')
    if r: s+=f" | RPO {r['latest'][1]} {fm(r['latest'][2])}" + (f" vs {r['prior'][1]} {fm(r['prior'][2])} ({r['growth']:+.0%})" if r.get('prior') else "")
    q=d.get('rev_q')
    if q: s+=f" | revQ {q['latest'][1]} {fm(q['latest'][2])}" + (f" ({q['growth']:+.0%})" if q.get('growth') is not None else "")
    o=d.get('oi_q')
    if o and q and o['latest'][1]==q['latest'][1] and q.get('prior') and o.get('prior') and q['latest'][2]:
        s+=f" | OM q {o['latest'][2]/q['latest'][2]:.1%} vs {o['prior'][2]/q['prior'][2]:.1%}"
    lr=d.get('latest_report',{})
    s+=f" | {lr.get('form')} {lr.get('filed')} {lr.get('url')}"
    print(s)
    n=int(os.environ.get('NH','4')); L=int(os.environ.get('HL','420'))
    hits=[h for h in d.get('backlog_hits',[]) if re.search(os.environ.get('HRX','backlog|remaining performance'),h,re.I)]
    for h in hits[:n]: print("   -", h[:L])
