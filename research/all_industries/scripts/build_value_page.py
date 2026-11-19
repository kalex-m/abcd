"""Compact value_report.json -> embed into report/value_template.html -> report/bargain-or-trap.html"""
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f"{R}/data/value_report.json"))
def slim_band(b, spark=False):
    if not b: return None
    o = {k: b[k] for k in ("med", "p10", "p90", "now", "rel")}
    if spark: o["s0"] = b["spark"][0][0]; o["s"] = [v for _, v in b["spark"]]
    return o
for i in d["inds"]:
    for c in i["cos"]:
        c["key"] = slim_band(c["key"], True); c["oth"] = [[l, slim_band(b)] for l, b in c["oth"]]
        for k in ("ind", "dep", "sec", "hist_from"): c.pop(k, None)
d["others"] = [{k: c[k] for k in ("t", "n", "ind", "own", "up", "mc")} | {"rel": (c["key"] or {}).get("rel"), "keyl": c["keyl"]} for c in d["others"]]
be = d["meta"].pop("bt")
d["meta"]["bt"] = {"dep": {k: be["dep_gated"][k] for k in ("Cheap vs own history", "Cheap vs peers", "Survival + quality", "Own-cheap + survival + quality", "Reversion upside")},
                   "dep_raw": {k: be["dep"][k] for k in ("Cheap vs own history", "Cheap vs peers", "Survival + quality")},
                   "search": be["search"], "n_dep": be["n_dep_groups"], "n_norm": be["n_norm_groups"], "asof": be["asof"]}
js = json.dumps(d, separators=(",", ":")).replace("</", "<\\/")
t = open(f"{R}/report/value_template.html").read().replace("/*DATA*/", js)
open(f"{R}/report/bargain-or-trap.html", "w").write(t)
print("data", len(js), "page", len(t))
