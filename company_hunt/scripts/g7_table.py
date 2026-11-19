import json, os, sys, pandas as pd, warnings
warnings.filterwarnings('ignore')
m=pd.read_csv('/home/user/abcd/company_hunt/triage/metrics.csv').copy()
m['val_disc_avg']=m[['pe_vs_med','pfcf_vs_med','evebit_vs_med']].mean(axis=1)
D='/home/user/abcd/company_hunt/data/g7_evidence'
rows=[]
for fn in sorted(os.listdir(D)):
    if not fn.endswith('.json'): continue
    d=json.load(open(f'{D}/{fn}')); t=d['ticker']
    r={'ticker':t}
    rp=d.get('rpo')
    if rp and rp['latest'][1]>='2025-12-01':
        r['rpo_end']=rp['latest'][1]; r['rpoB']=rp['latest'][2]/1e9; r['rpo_g']=rp.get('growth')
    q=d.get('rev_q')
    if q and q['latest'][1]>='2026-03-01': r['revq_g']=q.get('growth'); r['revq_end']=q['latest'][1]
    o=d.get('oi_q')
    if o and q and o['latest'][1]==q['latest'][1] and q.get('prior') and o.get('prior') and q['latest'][2] and q['prior'][2]:
        r['omq']=o['latest'][2]/q['latest'][2]; r['omq_prior']=o['prior'][2]/q['prior'][2]
    rows.append(r)
e=pd.DataFrame(rows)
x=e.merge(m[['ticker','name','industry','mcap','ret_3y','pe_now','pe_med_10y','evebit_now','evebit_med_10y','val_disc_avg','om','om_med_10y','rev_cagr_3y','n_analysts']],on='ticker',how='left')
x['mcapB']=x.mcap/1e9; x['name']=x.name.str[:18]
x.to_csv('/home/user/abcd/company_hunt/data/g7_evidence/table.csv',index=False)
cols=['ticker','name','mcapB','ret_3y','pe_now','pe_med_10y','evebit_now','evebit_med_10y','val_disc_avg','om','om_med_10y','rev_cagr_3y','revq_g','rpoB','rpo_g','omq','omq_prior']
pd.set_option('display.width',250); pd.set_option('display.max_rows',300)
s=x[cols].sort_values('val_disc_avg')
print(s.round(2).to_string(index=False))
