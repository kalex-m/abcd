import json, sys, re
d = json.load(open(sys.argv[1]))
# merge amendments into base quarter
Q = {}
for k, v in sorted(d.items()):
    q = k.split()[0]
    base = Q.setdefault(q, {})
    for name, h in v["h"].items():
        b = base.setdefault(name, {"sh": 0, "val": 0}); b["sh"] += h["sh"]; b["val"] += h["val"]
qs = sorted(Q)
def find(pat):
    rx = re.compile(pat, re.I)
    return {q: (sum(h["sh"] for n, h in Q[q].items() if rx.search(n)), sum(h["val"] for n, h in Q[q].items() if rx.search(n))) for q in qs}
groups = {
 "BAC": r"^BANK (OF )?AMER", "C": r"^CITIGROUP", "USB": r"^U S BANCORP|^US BANCORP", "COF": r"^CAPITAL ONE", "NU": r"^NU HLDGS", "ALLY": r"^ALLY FINL", "JEF": r"^JEFFERIES",
 "AXP": r"^AMERICAN EXPRESS", "V": r"^VISA", "MA": r"^MASTERCARD", "MCO": r"^MOODYS", "CB": r"^CHUBB",
 "AAPL": r"^APPLE", "GOOGL": r"^ALPHABET", "KO": r"^COCA COLA", "CVX": r"^CHEVRON", "OXY": r"^OCCIDENTAL", "KHC": r"^KRAFT HEINZ",
 "UNH": r"^UNITEDHEALTH", "LEN": r"^LENNAR", "DHI": r"HORTON", "DAL": r"^DELTA AIR", "NUE": r"^NUCOR", "STZ": r"^CONSTELLATION BRANDS", "DPZ": r"^DOMINOS", "POOL": r"^POOL CORP",
 "BENDING": r"BENDING", "VRSN": r"^VERISIGN", "SIRI": r"SIRIUS", "AMZN": r"^AMAZON", "TMUS": r"^T-MOBILE", "DVA": r"^DAVITA", "KR": r"^KROGER", "CHTR": r"^CHARTER",
}
out = {"quarters": qs, "total": {q: sum(h["val"] for h in Q[q].values()) for q in qs}, "pos": {}}
for g, p in groups.items():
    out["pos"][g] = find(p)
fin_banks = ["BAC","C","USB","COF","NU","ALLY","JEF"]
out["bank_val"] = {q: sum(out["pos"][g][q][1] for g in fin_banks) for q in qs}
out["bank_share"] = {q: out["bank_val"][q] / out["total"][q] for q in qs}
json.dump(out, open(sys.argv[2], "w"))
print("quarter      total$B  banks$B  bank%   BAC sh(M)  C sh(M)  USB sh(M) COF sh(M)  GOOGL $B  LEN sh(M) DAL sh(M) AAPL sh(M) CB sh(M) OXY sh(M) UNH sh(M)")
for q in qs:
    P = out["pos"]
    print(f"{q}  {out['total'][q]/1e9:7.1f}  {out['bank_val'][q]/1e9:7.1f}  {out['bank_share'][q]*100:5.1f}%  {P['BAC'][q][0]/1e6:9.1f}  {P['C'][q][0]/1e6:7.1f}  {P['USB'][q][0]/1e6:8.1f}  {P['COF'][q][0]/1e6:8.2f}  {P['GOOGL'][q][1]/1e9:8.1f}  {P['LEN'][q][0]/1e6:8.1f}  {P['DAL'][q][0]/1e6:8.1f}  {P['AAPL'][q][0]/1e6:9.1f}  {P['CB'][q][0]/1e6:7.1f}  {P['OXY'][q][0]/1e6:8.1f}  {P['UNH'][q][0]/1e6:7.1f}")
last = qs[-1]
print("\nTop 15 holdings", last)
for n, h in sorted(Q[last].items(), key=lambda kv: -kv[1]["val"])[:15]:
    print(f"  {n[:45]:45} ${h['val']/1e9:6.1f}B  {h['sh']/1e6:8.1f}M sh  {h['val']/out['total'][last]*100:4.1f}%")
