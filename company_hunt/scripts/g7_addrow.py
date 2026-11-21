"""append one row to triage/ground_7.csv from a JSON dict on argv[1]; skip if ticker already present"""
import csv, json, sys
F="/home/user/abcd/company_hunt/triage/ground_7.csv"
cols=open(F).readline().strip().split(",")
have={r["ticker"] for r in csv.DictReader(open(F))}
for d in json.loads(sys.argv[1]):
    if d["ticker"] in have: print("skip",d["ticker"]); continue
    with open(F,"a",newline="") as fh: csv.writer(fh).writerow([d.get(c,"") for c in cols])
    print("added",d["ticker"])
