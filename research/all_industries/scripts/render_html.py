"""Inject report_data.json into report/template.html -> report/industry-champions.html"""
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = open(f"{R}/data/report_data.json").read().replace("</", "<\\/")
t = open(f"{R}/report/template.html").read()
open(f"{R}/report/industry-champions.html", "w").write(t.replace("/*DATA*/", data))
print("ok", os.path.getsize(f"{R}/report/industry-champions.html"))
