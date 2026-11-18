"""Compute current metrics for every company -> data/metrics_now.json"""
import json, sys
import load as L, compute as C
out = {}
for t, ind in L.TK2IND.items():
    r = L.sec(t)
    if not r: print("NO SEC", t); continue
    k = C.kind_of(ind); cur = r["unit"].get("rev") or r["unit"].get("ni") or "USD"
    m = C.metrics(r, k, mcap_usd=L.mcap(t), fx=L.fx(cur), ystm=L.FST.get(t), splits=L.splits(t), ind=ind)
    m["_cur"] = cur; m["_kind"] = k; m["_name"] = L.name(t, r); m["_ind"] = ind; m["_sector"] = L.IND2SEC[ind]
    out[t] = m
json.dump(out, open(f"{L.R}/metrics_now.json", "w"))
print(len(out))
