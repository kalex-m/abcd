"""Validation, atomic writes and run-state reconciliation (CLAUDE.md section 8).

A task is done only if its output exists, validates, and carries the completion mark:
  - .md / .html / .txt : ends with <!-- COMPLETE -->
  - .json object       : "complete": true
  - .json array        : parses, and every element is an object (lead cards are checked for keys)
Triage JSON is also checked against the 6.4 schema (17 reads, status enum, coverage map).

CLI (main thread only writes RUN_STATE.json):
    python scripts/lib/validate.py check <path> [...]
    python scripts/lib/validate.py reconcile          # 8.3 step 2 + heartbeat + session_start log
    python scripts/lib/validate.py heartbeat
    python scripts/lib/validate.py log <event> [detail]
"""
import datetime as dt, json, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / "RUN_STATE.json"
BAK = ROOT / "RUN_STATE.bak.json"
EVENTS = ROOT / "logs" / "events.log"
SENTINEL = "<!-- COMPLETE -->"

LEAD_KEYS = {"lead_id", "agent", "signal", "evidence", "travels_to", "so_what", "ask_next",
             "tickers_named", "strength", "confidence"}
TRIAGE_KEYS = {"ticker", "name", "industry", "company_type", "business_model", "reads", "business_quality",
               "attractiveness_now", "regime_grid", "status", "status_reason", "the_mistake",
               "what_makes_market_notice", "feedback", "coverage"}
COVERAGE_OK = {"covered", "nothing_found", "unreachable", "failed"}


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def atomic_write(path, text):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def atomic_json(path, obj):
    atomic_write(path, json.dumps(obj, indent=2, default=str))


def log(event, detail=""):
    EVENTS.parent.mkdir(parents=True, exist_ok=True)
    with open(EVENTS, "a", encoding="utf-8") as f:
        f.write(f"{now()}\t{event}\t{detail}\n")


def _check_triage(o):
    errs = [f"missing key {k}" for k in TRIAGE_KEYS - o.keys()]
    reads = o.get("reads", [])
    if len(reads) != 17 or sorted(r.get("n") for r in reads) != list(range(1, 18)):
        errs.append("reads must be exactly n=1..17")
    for r in reads:
        if not isinstance(r.get("score"), int) or not 1 <= r["score"] <= 5:
            errs.append(f"read {r.get('n')}: score must be 1-5")
        if not r.get("source"):
            errs.append(f"read {r.get('n')}: no source")
    if o.get("status") not in ("survived", "watch", "dropped"):
        errs.append("status must be survived|watch|dropped")
    if o.get("business_quality") not in ("A", "B", "C", "D"):
        errs.append("business_quality must be A-D")
    for layer, v in (o.get("coverage") or {}).items():
        if v not in COVERAGE_OK:
            errs.append(f"coverage {layer}={v} not in {sorted(COVERAGE_OK)}")
    return errs


def check(path):
    """Return list of problems; empty list means valid and complete."""
    p = Path(path)
    if not p.is_absolute():
        p = ROOT / p
    if not p.exists():
        return ["missing"]
    text = p.read_text(encoding="utf-8", errors="replace")
    if p.suffix == ".json":
        try:
            o = json.loads(text)
        except Exception as e:
            return [f"json parse error: {e}"]
        if isinstance(o, list):
            errs = []
            for i, el in enumerate(o):
                if not isinstance(el, dict):
                    errs.append(f"element {i} not an object")
                elif "lead_id" in el and LEAD_KEYS - el.keys():
                    errs.append(f"lead {el.get('lead_id')}: missing {sorted(LEAD_KEYS - el.keys())}")
            return errs
        errs = [] if o.get("complete") is True else ['no "complete": true']
        if "/triage/" in p.as_posix():
            errs += _check_triage(o)
        return errs
    return [] if text.rstrip().endswith(SENTINEL) else [f"no {SENTINEL} sentinel (truncated?)"]


def load_state():
    for f in (STATE, BAK):
        try:
            return json.loads(f.read_text())
        except Exception:
            continue
    return None


def save_state(state):
    if STATE.exists():  # keep the previous good write as .bak
        try:
            prev = STATE.read_text()
            json.loads(prev)
            atomic_write(BAK, prev)
        except Exception:
            pass
    state["heartbeat"] = now()
    atomic_json(STATE, state)


def reconcile():
    state = load_state()
    if state is None:
        raise SystemExit("RUN_STATE.json and .bak unreadable: rebuild state from output files on disk")
    try:
        max_attempts = json.loads((ROOT / "config.json").read_text()).get("max_attempts", 3)
    except Exception:
        max_attempts = 3
    changed = []
    for t in state.get("tasks", []):
        if t.get("status") in ("running", "done"):
            out = t.get("output", "").replace("<run>", state.get("run_id") or "<run>")
            problems = check(out)
            if not problems:
                new = "done"
            elif problems == ["missing"]:
                new, t["last_error"] = "pending", "interrupted"  # a limit stop does not consume an attempt
            else:
                t["attempts"] = t.get("attempts", 0) + 1
                t["last_error"] = "; ".join(problems)[:300]
                new = "failed" if t["attempts"] >= max_attempts else "pending"
            if new != t["status"]:
                changed.append(f"{t['id']}:{t['status']}->{new}")
                t["status"] = new
                t["updated"] = now()
    save_state(state)
    log("session_start", f"reconciled {len(changed)} task(s) {' '.join(changed)}")
    counts = {}
    for t in state.get("tasks", []):
        counts[t["status"]] = counts.get(t["status"], 0) + 1
    print(json.dumps({"run_id": state.get("run_id"), "status": state.get("status"), "counts": counts,
                      "changed": changed}, indent=1))


if __name__ == "__main__":
    cmd, *a = sys.argv[1:] or ["help"]
    if cmd == "check":
        bad = 0
        for path in a:
            errs = check(path)
            bad += bool(errs)
            print(("OK   " if not errs else "FAIL ") + path + ("" if not errs else "  " + "; ".join(errs[:5])))
        sys.exit(1 if bad else 0)
    elif cmd == "reconcile":
        reconcile()
    elif cmd == "heartbeat":
        s = load_state() or {}
        save_state(s)
        print(s["heartbeat"])
    elif cmd == "log":
        log(a[0], " ".join(a[1:]))
    else:
        print(__doc__)
