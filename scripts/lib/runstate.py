"""Main-thread run-state commands (only the main thread writes RUN_STATE.json).

    python scripts/lib/runstate.py start <task_id> [...]     mark running
    python scripts/lib/runstate.py done <task_id> [...]      validate outputs -> done, or pending/failed with attempts+1
    python scripts/lib/runstate.py next [n] [wave]           list next pending tasks
    python scripts/lib/runstate.py triage-table              compact status table of finished triage files
"""
import json, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import validate as v  # noqa: E402

ROOT = v.ROOT


def _tasks(state, ids):
    by = {t["id"]: t for t in state["tasks"]}
    for i in ids:
        if i not in by:
            raise SystemExit(f"unknown task {i}")
        yield by[i]


def start(ids):
    s = v.load_state()
    for t in _tasks(s, ids):
        t["status"], t["updated"] = "running", v.now()
    v.save_state(s)
    v.log("task_start", " ".join(ids))


def _library_copy(run_id, out):
    o = json.loads((ROOT / out).read_text())
    lib = ROOT / "library" / "companies"
    lib.mkdir(parents=True, exist_ok=True)
    v.atomic_write(lib / f"{o['ticker']}.json", json.dumps(o, indent=1))
    with open(lib / f"{o['ticker']}.history.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({"run_id": run_id, "as_of": o.get("as_of"), "status": o["status"],
                            "business_quality": o["business_quality"], "attractiveness_now": o["attractiveness_now"],
                            "status_reason": o["status_reason"]}) + "\n")


def done(ids):
    s = v.load_state()
    try:
        max_attempts = json.loads((ROOT / "config.json").read_text()).get("max_attempts", 3)
    except Exception:
        max_attempts = 3
    for t in _tasks(s, ids):
        outs = [t["output"]] + t.get("extra_outputs", [])
        problems = [f"{o}: {e}" for o in outs for e in v.check(o)]
        if not problems:
            t["status"], t["last_error"] = "done", None
            if t["wave"] == 4:
                _library_copy(s["run_id"], t["output"])
            v.log("task_done", t["id"])
            print("DONE", t["id"])
        else:
            t["attempts"] = t.get("attempts", 0) + 1
            t["last_error"] = "; ".join(problems)[:400]
            t["status"] = "failed" if t["attempts"] >= max_attempts else "pending"
            v.log("task_invalid", f"{t['id']} attempts={t['attempts']} {t['last_error']}")
            print(t["status"].upper(), t["id"], t["last_error"])
        t["updated"] = v.now()
    v.save_state(s)


def nxt(n=5, wave=None):
    s = v.load_state()
    p = [t for t in s["tasks"] if t["status"] == "pending" and (wave is None or t["wave"] == int(wave))]
    running = sum(t["status"] == "running" for t in s["tasks"])
    print(f"running={running} pending={len(p)}")
    for t in p[:int(n)]:
        print(t["id"], json.dumps(t["input"]))


def triage_table():
    s = v.load_state()
    rows = []
    for t in s["tasks"]:
        if t["wave"] != 4 or t["status"] != "done":
            continue
        o = json.loads((ROOT / t["output"]).read_text())
        sc = [r["score"] for r in sorted(o["reads"], key=lambda r: r["n"])]
        rows.append((o["industry"], o["ticker"], o["status"], o["business_quality"], o["attractiveness_now"],
                     "".join(map(str, sc)), (o.get("the_mistake") or "-")[:70]))
    for r in sorted(rows):
        print("{:10} {:5} {:8} {} {:6} {} {}".format(*r))


if __name__ == "__main__":
    cmd, *a = sys.argv[1:] or ["help"]
    {"start": lambda: start(a), "done": lambda: done(a), "next": lambda: nxt(*(a or [5])),
     "triage-table": triage_table}.get(cmd, lambda: print(__doc__))()
