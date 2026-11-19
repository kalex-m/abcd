"""grep the latest earnings-release exhibit (8-K item 2.02, EX-99.x) for a regex."""
import sys, re
sys.path.insert(0,'/home/user/abcd/company_hunt/scripts'); import edgar_tool as E
t=sys.argv[1]; rx=sys.argv[2]; ctx=int(sys.argv[3]) if len(sys.argv)>3 else 250; mx=int(sys.argv[4]) if len(sys.argv)>4 else 1600
cik=E.cik_of(t); j,rows=E.submissions(cik)
for f,d,acc,it,doc,rd in rows:
    if f not in ('8-K','6-K') or '2.02' not in (it or ''): continue
    base,names=E.filing_index(cik,acc)
    ex=[n for n in names if re.search(r'(ex|exhibit)[-_]?99|ex99|dex99',n,re.I) and n.endswith(('.htm','.html'))]
    if not ex: ex=[n for n in names if n.endswith('.htm') and n!=doc and 'index' not in n]
    for n in ex[:2]:
        url=base+n; txt=E.to_text(E.fetch(url)); out=[]; le=-1
        for m in re.finditer(rx,txt,re.I):
            s,e=max(0,m.start()-ctx),min(len(txt),m.end()+ctx)
            if s<le: continue
            out.append(txt[s:e].replace('\n',' ')); le=e
        print(f"=== {t} 8-K {d} {url} ({len(out)} hits)")
        print("\n...".join(out)[:mx])
    break
