import sys, json
sys.path.insert(0,'/home/user/abcd/company_hunt/scripts'); import edgar_tool as E
def ytd(t, tags=('PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets')):
    cik=E.cik_of(t); j=json.loads(E.fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json"))
    for tag in tags:
        n=j['facts'].get('us-gaap',{}).get(tag)
        if not n: continue
        seen={}
        for r in n['units'].get('USD',[]):
            if not r.get('start') or r.get('form') not in ('10-Q','10-K'): continue
            k=(r['start'],r['end'])
            if k not in seen or r['filed']>seen[k]['filed']: seen[k]=r
        rs=sorted(seen.values(), key=lambda r:(r['end'],r['start']))
        fy=[r for r in rs if r['start'][5:]=='01-01' and r['end'][5:]=='12-31']
        last=rs[-1]
        prior=[r for r in rs if r['start'][:4]==str(int(last['start'][:4])-1) and r['start'][4:]==last['start'][4:] and r['end'][4:]==last['end'][4:]]
        out=f"{t} {tag}: FY " + ", ".join(f"{r['end'][:4]}={r['val']/1e9:.1f}" for r in fy[-4:])
        out+=f" | latest {last['start']}..{last['end']} {last['val']/1e9:.1f}B ({last['accn']})"
        if prior: out+=f" vs prior {prior[-1]['val']/1e9:.1f}B => {last['val']/prior[-1]['val']-1:+.0%}"
        print(out, f"cik={cik}"); return
    print(t,'no capex tag')
for t in sys.argv[1:]:
    try: ytd(t)
    except Exception as e: print(t,'ERR',e)
