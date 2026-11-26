# Investment Hunt: Agent Operating Manual

Owner: Alex · Written 2026-11-25 · For Claude Code (CLI, Windows)

This file is the single source of truth for the investment-hunt system. Read it at the start of every session, including every automatic resume. Never rely on conversation memory; the files on disk are the memory.

---

## 0. Quick start (first session only)

1. Put this file at `C:\Users\kalex\investment-hunt\CLAUDE.md` and open Claude Code in that folder.
2. Say: **"Bootstrap the system from CLAUDE.md."** Claude Code then:
   - creates the folder tree in section 9,
   - writes every agent file in section 12 into `.claude/agents/`,
   - writes `scripts/resume.ps1` and `scripts/register-task.ps1` from section 11,
   - writes `.claude/settings.json` from section 11.4,
   - creates `config.json` and an empty `RUN_STATE.json` from section 10,
   - runs a 1-call smoke test of each data source in section 7 and logs results.
3. Edit `config.json`: set your industries, your EDGAR contact email, and the run mode.
4. Run `scripts/register-task.ps1` once in PowerShell to turn on auto-resume.
5. Say: **"Start a full hunt."**

---

## 1. Purpose

Build a living map of companies, organized by industry and category, so Alex can:

- **Learn** industries, company types, business models, and how money flows through supply chains.
- **See every notable company** in each industry with a full triage fingerprint. Nobody is deleted.
- **Highlight survivors**: companies that pass the kill switch.
- **See how investment quality shifts** as macro and markets change.

The goal is **not** one best pick per industry. The goal is a complete, honest map with survivors lit up.

### 1.1 What Alex means by a good investment

These are lenses, not a rigid screen.

- A well-known, essential business, often an everyday brand. No obscure lottery tickets.
- It has a war chest and good management: asset-light where possible, cash-rich, with strong free cash flow and capital spent wisely.
- It's cheap because nobody cares, not because it's broken. A business that is losing relevance is broken. Zoom is the reference case.
- It's critical to how things run: rails, payment networks, the bank that finances whatever booms next.
- It has been battered by the cycle but is strong underneath. Think of Berkshire's view of Lennar: bet on an industry's turn, not a quick mispricing.
- **Stronghold idea:** several revenue streams that offset each other through different economies, so the whole compounds steadily. JPM is the model. The market doesn't need to see the company that way yet.
- Hidden perks in plain sight: scaling or earnings power that isn't priced in yet.

### 1.2 Standing question every agent serves

> What is strong, essential and cash-rich here that the market is ignoring or misreading for the wrong reason, and what would make the market notice?

### 1.3 Two ratings, never mixed

- **Business quality** is how good the business is. It changes slowly.
- **Investment attractiveness** is quality against today's price in today's regime. It changes with macro and markets.

A great business stays great in a recession. Its earnings and its multiple change. Mixing the two ratings makes a temporary dip look like a broken company.

---

## 2. Hard rules

1. **Never use FMP** (Financial Modeling Prep) for anything.
2. **Primary sources first.** Use SEC EDGAR filings, company IR sites and disclosures, and official government data. Use yFinance for market and price data, always last in any company read. Perplexity Finance is allowed only as a cross-check, never as the source of a number.
3. **Full disclosure coverage.** Every disclosure layer in section 6.4 is worked explicitly. A layer that turns up nothing is written as `nothing_found`; a layer that can't be reached is written as `unreachable` with the reason. Never present partial coverage as complete.
4. **Follow press-release links** to supplemental material. Don't stop at the filing.
5. **When a deal or regulatory review is pending,** the regulatory docket is mandatory (for example STB, FERC, FCC, FDA, DOJ/FTC filings and supplemental responses).
6. **Facts carry sources.** Every number has a source URL and an as-of date. No source means it doesn't go in.
7. **No opinion recaps.** Analyst views, news narratives and price targets are context at most, never evidence. Show the facts and what they mean.
8. **Plain language.** Write like a clear writer, not a jargon machine. Define any unavoidable term in a few words.
9. **Visual rules:** never use a tree metaphor for stock or business visuals, never use biblical terms in labels or writing, and keep visuals artistic rather than boring default charts.
10. **No trading, no orders, no account actions.** This is a research system only.

---

## 3. System at a glance

```
WAVE 1  Scan the world (6 agents, parallel)
        Lane A top-down:  macro · markets · policy-events
        Lane B bottom-up: price-action · divergence · behaviour-change
            │  each writes LEAD CARDS
            ▼
STEP 2  Main thread: regime read + rank and route leads
            ▼
WAVE 3  Industry mappers (1 per industry), incl. SUPPLY CHAIN layer
            │  output: full company list per industry + primer
            ▼
WAVE 4  Triage (1 agent per company, batches) → fingerprint + status
            │  Survived / Watch / Dropped (nobody is deleted)
            ▼
WAVE 5  Deep dive for Survived only (8 layer agents per company)
            ▼
STEP 6  Main thread: valuation + "the mistake" + kill switch recheck
            ▼
WAVE 7  Red team (1 per survivor) — sees only the finished thesis
            ▼
STEP 8  Main thread: kill switch, sizing notes, industry reports
            ↺   findings flow back into the regime read
```

### 3.1 Run modes

| Mode | What runs | Typical agent count | When |
|---|---|---|---|
| `full_hunt` | Waves 1–8 for all configured industries | ~48–70+ | Weekly or on demand |
| `daily_scan` | Wave 1 + regime read + alerts on watchlist and survivors | 6 | Weekdays |
| `industry_refresh` | Waves 3–8 for one industry, reusing the latest regime | ~20–40 | When a regime shift or lead hits one industry |
| `company_check` | Wave 4 + optional Wave 5 for named tickers | 1–9 per ticker | On demand |

---

## 4. Regime framework

### 4.1 Four economies (the regime grid)

| Regime | Growth | Inflation | Typical winners | Typical losers |
|---|---|---|---|---|
| Boom | rising | falling or stable | cyclicals, small caps, discretionary, industrials | defensives lag |
| Overheat | rising | rising | energy, materials, banks, pricing-power businesses | long-duration growth, bonds |
| Stagflation | falling | rising | businesses with real pricing power, energy, some staples | most cyclicals, high-debt firms |
| Slowdown | falling | falling | quality compounders, staples, utilities, long bonds | cyclicals, credit-sensitive firms |

Overlays to record alongside the regime: rate direction, dollar direction, credit conditions (spreads), and liquidity.

### 4.2 Markets as macro indicators

Markets are the early warning; hard data is the confirmation. The strongest signal is when they **disagree**, because one of them is wrong.

| Market signal | What it says about the economy |
|---|---|
| 2y vs 10y Treasury curve | recession risk (inverted); watch the re-steepening |
| 2-year yield | where the market expects the Fed to go |
| High-yield credit spreads | lender fear and stress building |
| Copper / gold ratio | growth vs fear |
| Oil | demand and inflation pressure |
| Dollar index | global tightening; emerging-market stress |
| Breakeven inflation (TIPS) | expected inflation |
| Cyclicals vs defensives | what investors bet on the economy |
| Small caps vs large caps | domestic growth and credit confidence |
| VIX | fear currently priced |

---

## 5. Lead cards (how agents hand off)

Agents never talk to each other directly. Every Wave 1 agent writes lead cards. The main thread ranks them and pastes the relevant ones into later agents' briefs. **A lead that isn't routed is wasted.**

```json
{
  "lead_id": "L-<run>-<agent>-<n>",
  "agent": "macro|markets|policy-events|price-action|divergence|behaviour-change",
  "signal": "what moved, in one plain sentence",
  "evidence": [{"fact": "...", "source": "url", "as_of": "YYYY-MM-DD"}],
  "travels_to": [{"industry": "...", "link": "input cost|customer demand|financing|regulation|competition", "direction": "helps|hurts"}],
  "so_what": "who gains, who gets squeezed",
  "ask_next": "the exact question the next agent must answer",
  "tickers_named": ["..."],
  "strength": "both_lanes|one_lane",
  "confidence": "high|medium|low"
}
```

Ranking rule: leads confirmed by **both lanes** rank first, then high confidence, then the number of configured industries touched.

**Feedback loop:** when industry, triage or deep-dive agents find supplier or customer commentary that confirms or contradicts the regime read, they add a `feedback` entry to their output. The main thread updates `regime.json` before Step 8.

---

## 6. Agent roster and briefs

Every brief sent to a subagent **must** contain these six parts:

1. **Question:** the exact question plus why it matters.
2. **Current view:** what we already believe, so the agent hunts for what confirms or breaks it.
3. **What counts as a finding:** a change, a contradiction or a surprise against expectations. A list of facts isn't a finding.
4. **Ignore:** analyst opinions, news recaps, price targets, anything already widely known.
5. **Return format:** the schema for that agent. Every finding is written as fact → source → what it means → confidence.
6. **Permission to say "nothing here."** Padding is a failure.

Every subagent output must end with the line `<!-- COMPLETE -->`. Output without it is treated as truncated and the task is retried (section 8).

### 6.1 Wave 1: Scan the world (6 agents, parallel)

| Agent | Lane | Job | Sources |
|---|---|---|---|
| `macro-scanner` | A | Hard data: jobs, CPI, PCE, GDP, retail sales, ISM, JOLTS, claims, Fed statements, minutes, speeches, Treasury refunding and auctions | BLS, BEA, Census, Fed, Treasury, FRED |
| `markets-scanner` | A | Cross-asset read using section 4.2; flags where markets and hard data disagree | yFinance, FRED, Treasury yields, CFTC COT, Cboe |
| `policy-events-scanner` | A | Rules, tariffs, sanctions, court rulings, elections; earnings, IPO (S-1), M&A, index and lockup calendar | Federal Register, USTR, OFAC, court dockets, EDGAR |
| `price-action-scanner` | B | Sector, industry and stock moves against the S&P 500; relative strength; unusual volume; breadth; new 52-week highs and lows in known names | yFinance |
| `divergence-scanner` | B | Price fighting its own story: falling while fundamentals improve, ignoring good news, breaking from peers, decoupling from its macro driver | yFinance + EDGAR XBRL facts + latest 8-K/10-Q |
| `behaviour-change-scanner` | B | Companies doing something different: new segments, capex pivots, pricing-model changes, buyback or dividend shifts, insider buying clusters, 13D filings, management wording shifts | EDGAR full-text search, Form 4, SC 13D, 8-K items |

Price action is a **pointer, not a signal**. Alex's own XLV study found direction isn't forecastable from daily OHLCV. A strange move only tells agents where to dig; the filings decide whether it's real.

Output: `runs/<run>/wave1/<agent>.md` plus `runs/<run>/leads/<agent>.json` (an array of lead cards).

### 6.2 Step 2: Regime read (main thread only)

- Name the current regime from section 4.1, with overlays and a confidence level.
- List every market/hard-data disagreement.
- Rank and route the leads; record routing in `runs/<run>/routing.json`.
- If `industries` in config is empty, propose 3 industries the regime favours plus any industry that both lanes point to, then **pause and ask Alex** (in interactive mode). In headless mode, use `default_industries`.
- Write `runs/<run>/regime.json`.

### 6.3 Wave 3: Industry mappers (1 per industry)

Agent: `industry-mapper`. Output: `runs/<run>/industries/<slug>.json` + `library/industries/<slug>-primer.md` (the primer persists between runs and gets updated, never rewritten from scratch).

Each industry read covers:

1. **What the industry does and how money flows through it,** in plain words.
2. **Value chain and supply chain layer (required):**
   - Inputs: energy, metals, chips, labour, freight, capital. For each, the supplier names and how concentrated they are.
   - The industry: who makes what, where the chokepoints sit, how much capacity there is, and where production is located.
   - Customers: households, businesses, government, and who the big buyers are.
   - **Signal tags:** each link carries the Lane A signals that move it (for example oil → fuel cost, copper → wiring cost, rates → customer financing, dollar → import cost, wages → labour cost, tariffs → input cost). When a tagged signal moves, the map shows which companies feel it first.
3. **Cycle position:** capacity, pricing, inventories, capex, and where the industry sits now.
4. **Structure:** concentration, pricing power, barriers to entry, and regulation.
5. **The 3–5 numbers that matter** for this industry (for example carloads and operating ratio for rail, payment volume and take rate for payments).
6. **Regime sensitivity:** how the industry behaves in each of the four economies.
7. **Full company list:** every notable US-listed company (and major foreign peers for context), each tagged with company type and business model (section 6.3.1). Well-known names and everyday brands are always included. Cap the triage list at `max_companies_per_industry` (default 20): first any name a routed lead points to, then well-known names and everyday brands, then the rest by market cap. Companies past the cap are still listed on the map, tagged `not_triaged`, so the map stays complete without blowing the usage budget.
8. Answers to the `ask_next` questions in routed leads.

#### 6.3.1 Taxonomy

- **Company type:** Stalwart · Fast grower · Slow grower · Cyclical · Turnaround · Asset play · Stronghold (all-weather, offsetting revenue streams)
- **Business model:** Toll road / network · Subscription / recurring · Transaction / take-rate platform · Spread / balance sheet · Razor-and-blade · Licensing / royalty · Branded consumer goods · Project / contract · Commodity producer · Regulated utility · Marketplace · Other (explain)

### 6.4 Wave 4: Triage (1 agent per company, batched)

Agent: `triage-analyst`. Output: `runs/<run>/triage/<TICKER>.json`.

Triage cuts nobody. It reads every company on the industry list and assigns a status. Sources: the latest 10-K, the last 4 10-Qs, the latest earnings release and presentation, the IR fact sheet, and yFinance for price only.

**The fingerprint: 17 reads, each scored 1–5, with one line of evidence and a source.**

| Group | Read | What it answers |
|---|---|---|
| Who they are | 1. What they do | The business in two plain sentences |
| | 2. What they sell | Products and services, with revenue mix by segment |
| | 3. Who buys | Customer types, concentration, top-customer exposure |
| | 4. Where they operate | Revenue and assets by geography; currency exposure |
| How the engine runs | 5. Money model | Business model type, recurring share, who pays and how often, unit economics |
| | 6. Operations | Fixed vs variable costs (operating leverage), capex intensity, working capital (paid before delivery?), guidance hit rate |
| | 7. Supply chain (required) | Critical inputs and their suppliers, concentration and location, chokepoints, single points of failure, and **whether it can pass cost increases on**. Linked to the industry's signal tags |
| Why they win | 8. Edge | Brand, network effects, switching costs, scale, distribution, licences, data, patents, plus what it's doing **differently** right now |
| | 9. Everyday brand | Usage frequency, whether people would notice if it vanished, repeat buying, ability to charge more than rivals, marketing spend per revenue dollar |
| | 10. Rivals and share | Main competitors and whether share is gaining or losing |
| | 11. Growth runway | Room left to grow, new markets, segments scaling but not yet priced in |
| How strong | 12. Cash and leaders | FCF conversion, return on invested capital vs cost of capital, net debt, capital allocation record (buybacks at sensible prices?), insider ownership, what management's pay rewards (DEF 14A) |
| | 13. Durability | What could kill it, whether it's gaining or losing relevance, disruption risk, key-person risk |
| | 14. Red flags | 8-K Items 4.01 and 4.02, material weakness, NT filings, heavy non-GAAP adjustments, SEC comment letters, related-party deals |
| What surrounds them | 15. Regime fit | Expected behaviour in each of the four economies, plus rate, dollar and input-cost sensitivity |
| | 16. Rules and politics | Regulatory, tariff and policy exposure; pending dockets |
| Verdict | 17. Price | What today's price assumes (simple reverse DCF), multiples against the company's own 5-year range and its peers |

Then two ratings (section 1.3) and a status:

```json
{
  "ticker": "...", "name": "...", "industry": "...",
  "company_type": "...", "business_model": "...",
  "reads": [{"n": 1, "name": "What they do", "score": 1, "evidence": "...", "source": "url", "as_of": "YYYY-MM-DD"}],
  "business_quality": "A|B|C|D",
  "attractiveness_now": "high|medium|low",
  "regime_grid": {"boom": "+|0|-", "overheat": "+|0|-", "stagflation": "+|0|-", "slowdown": "+|0|-"},
  "status": "survived|watch|dropped",
  "status_reason": "one plain line",
  "the_mistake": "what the market misreads, or null",
  "what_makes_market_notice": "catalyst, or null",
  "feedback": [],
  "coverage": {"10-K": "covered", "10-Q": "covered", "earnings_release": "covered", "ir_fact_sheet": "nothing_found", "price": "covered"}
}
```

#### 6.4.1 Kill switch rules

**Dropped** if any of these hold:
- the business is losing relevance (the Zoom test),
- its money model can't be explained in two sentences,
- negative FCF with no credible path and a weak balance sheet,
- unresolved accounting red flags (4.02, auditor exit with disagreement, material weakness),
- a debt maturity wall it can't cover,
- the price assumes more than the business can plausibly deliver.

**Watch** if quality is B or better but the price leaves no cushion, if evidence is incomplete, or if there's no identifiable mistake yet.

**Survived** if quality is B or better, the price leaves a cushion, there's an identifiable mistake, and there's a plausible reason the market will notice.

Dropped companies keep their fingerprint and reason on the map. They're for learning too.

### 6.5 Wave 5: Deep dive (Survived only, 8 agents per company)

Each agent writes `runs/<run>/deepdive/<TICKER>/<layer>.md` with a coverage line.

| Agent | Layer |
|---|---|
| `dd-edgar` | 10-K, 10-Q (8 quarters), 8-K incl. EX-99, risk factors compared year over year, auditor report and critical audit matters, internal controls, DEF 14A, S-1/S-3/S-8/424B, EX-4/EX-10/EX-21, NT filings, CORRESP/UPLOAD comment letters, Form 144, amendments, Items 4.01/4.02/5.02/1.01/2.01/2.03/2.05/2.06 |
| `dd-ir` | Fact sheets and supplemental data, non-GAAP reconciliations, combined release PDFs, earnings decks and prepared remarks, investor-day decks and the targets set there, shareholder letters, broker-conference decks, webcasts, the full IR archive, guidance history |
| `dd-transcripts` | Last 8 calls: wording shifts, Q&A dodges, promises vs delivery, CEO/CFO interviews and conference talks, management track record |
| `dd-regulatory` | Industry regulator dockets, antitrust, supplemental answers to regulators, court dockets, the legal-proceedings note compared year over year (**mandatory** when a deal or review is pending) |
| `dd-credit` | Debt maturity ladder, covenants and headroom, off-balance-sheet items, pensions, ratings, buybacks and dividends vs FCF, share count and dilution |
| `dd-ownership` | Forms 3/4/5 (open-market only, separated from 10b5-1 plan sales), plan adoptions, SC 13D/13G, 13F changes, short interest |
| `dd-peers` | The 3 closest rivals' latest 10-K and call checked for the same trends; customers' and suppliers' filings that name the company; primary industry data |
| `dd-diff` | Restatement check (old IR fact sheets vs current), guidance given vs actual, risk-factor diff, wording diff across calls |

### 6.6 Step 6: Valuation and the mistake (main thread only)

- Use EDGAR for fundamentals and yFinance for price and market data, pulled **fresh at this step** (never reuse price data older than 1 trading day).
- Valuation: reverse DCF (what the price assumes), plus at least one of owner-earnings DCF, EPV, residual income (for banks), or DDM. Compare multiples with the company's own history and its peers.
- Write the thesis in plain language: what the business is worth, what the price assumes, **the mistake**, what makes the market notice, and the cushion.
- Recheck the kill switch. If the mistake or the cushion disappears, the status changes to Watch with the reason.

### 6.7 Wave 7: Red team (1 per survivor)

Agent: `red-team`. It receives **only** the finished thesis file and the deep-dive folder path. It never sees the main thread's reasoning. It returns: the strongest case against the thesis, what would prove it right, which facts the thesis leaned on most and whether they hold, and a verdict of `holds`, `weakened` or `broken`. A `broken` verdict moves the company to Watch.

### 6.8 Step 8: Kill switch, sizing notes, reports (main thread)

For each final survivor, write:
- **Kill switch:** the 3–5 specific, checkable events that would prove the thesis wrong.
- **Sizing notes:** conviction (high/medium/low), the main risk, and what would justify adding.
- **Watch signals:** the Lane A or Lane B signals to monitor for this name.

Then build the reports (section 13) and update `regime.json` with the feedback.

---

## 7. Data sources

| Source | Use | Notes |
|---|---|---|
| SEC EDGAR | All filings, XBRL company facts, full-text search | `data.sec.gov/submissions/CIK##########.json`, `data.sec.gov/api/xbrl/companyfacts/CIK##########.json`, `efts.sec.gov/LATEST/search-index?q=...`. **Must** send a `User-Agent: AlexBungabong <email from config>` header. Stay under 10 requests per second, with a 0.15s sleep between calls |
| Company IR sites | Voluntary disclosures | Follow every press-release link to supplemental material |
| yFinance (Python) | Prices, volume, multiples, sector/industry data | Last in any company read. Retry 3× with backoff; cache to `cache/yf/` per day |
| FRED, BLS, BEA, Census | Macro hard data | Prefer official APIs or release pages |
| Fed, Treasury | Policy, statements, auctions, yields | |
| EIA, AAR, CFTC, Cboe, FERC, STB, FCC, FDA | Industry and market data, dockets | As relevant |
| Federal Register, USTR, OFAC, court dockets | Policy and legal | |
| IBKR connector (optional) | Precision check on survivors' prices at Step 6 | Remote MCP `https://api.ibkr.com/v1/api/mcp-public`, read-only tools only (price snapshot and history); never order tools. At session start, make one cheap call to test the login. If it isn't logged in, skip IBKR silently, use yFinance, and log `ibkr: unavailable`. **Never wait or stop for an IBKR login**; 2FA needs Alex in person. Log any price mismatch above 1% between IBKR and yFinance |
| Perplexity Finance | Cross-check only | Never the source of a number |
| **FMP** | **Never** | Forbidden |

Python deps: `pip install yfinance pandas requests matplotlib plotly jinja2`.

---

## 8. Limit-proofing (5-hour usage window)

Claude Code sessions can stop mid-run when the 5-hour usage limit hits. This system is built so a stop loses at most one small batch of work and resumes cleanly after the reset.

### 8.1 Principles

1. **Files are the memory.** A new session reads `CLAUDE.md` and `RUN_STATE.json` and continues. Resume with a **fresh** session; never use `--continue` (old contexts bloat and can carry half-finished tool calls).
2. **A task is done only if its output file exists, validates, and ends with `<!-- COMPLETE -->`** (or `"complete": true` in JSON). The state file's word is never trusted over the files on disk.
3. **Checkpoint after every task,** not after every wave.
4. **Small waves.** At most `max_parallel` subagents in flight (default 5). A limit hit mid-wave loses only that batch.
5. **Only the main thread writes `RUN_STATE.json`.** Subagents write only their own output file. This prevents clobbered state.
6. **Atomic writes:** write to `*.tmp`, then rename. Keep `RUN_STATE.bak.json` from the previous good write.
7. **One session at a time:** a lock file containing the runner's PID, plus a heartbeat timestamp in `RUN_STATE.json`.
8. **Cheaper models for diggers:** subagents use `model: sonnet` to stretch the usage window; red team and the main thread inherit the session model.
9. **Bounded context:** the main thread reads only the summaries and JSON of subagent outputs, never whole deep-dive folders at once.

### 8.2 Task lifecycle

```
pending ──start──▶ running ──valid output──▶ done
   ▲                  │
   │                  ├─ invalid/truncated output ─▶ pending (attempts+1)
   │                  └─ heartbeat stale > 45 min ─▶ pending (reason: interrupted, attempts unchanged)
   └────────── attempts reach 3 ─▶ failed (logged in coverage report, run continues)
```

An interruption by a limit is **not** a failure, so it doesn't consume an attempt.

### 8.3 Resume procedure (run at the start of every session)

1. Read `CLAUDE.md`, `config.json`, `RUN_STATE.json`. If the state JSON fails to parse, restore `RUN_STATE.bak.json`. If that also fails, rebuild state from the output files on disk.
2. **Reconcile:** for every task marked `running` or `done`, check its output file. Valid output → `done`. Missing or invalid output → `pending` (interrupted).
3. Write the heartbeat. Log `session_start` to `logs/events.log`.
4. If any price-sensitive step will run, mark price data older than 1 trading day as stale and re-pull it at Step 6.
5. Continue from the earliest wave that has pending tasks. Never skip ahead past an incomplete wave unless the remaining tasks are `failed`.
6. After every task: validate, update state atomically, refresh the heartbeat, append to the event log.
7. When all waves are done, set `status: "complete"` and write the run summary to `runs/<run>/SUMMARY.md`.

### 8.4 Other glitches prevented

| Glitch | Prevention |
|---|---|
| Two sessions running at once | PID lock + heartbeat check in `resume.ps1` |
| Subagent output cut off by the limit | `<!-- COMPLETE -->` sentinel + validation → retry |
| Corrupted state file | atomic rename + `.bak` + rebuild from disk |
| Endless retry loop | 3-attempt cap → `failed`, recorded in coverage |
| Stale prices after a long pause | re-pull price data at valuation time |
| Headless session blocked on a permission prompt | explicit allow list in `.claude/settings.json` (11.4) |
| Context overflow in the main thread | summaries only; compact JSON from subagents |
| EDGAR blocking requests | User-Agent header, rate limit, cache to `cache/edgar/` |
| Scheduler firing while the PC sleeps | task set to wake the computer and run as soon as possible after a missed start |
| A run that never finishes | `max_run_days` in config; after that, mark remaining tasks failed and publish what exists |

---

## 9. Folder layout

```
investment-hunt/
  CLAUDE.md                 ← this file
  config.json
  RUN_STATE.json
  RUN_STATE.bak.json
  .run.lock                 ← exists only while a session runs (holds runner PID)
  .claude/
    settings.json
    agents/*.md             ← created at bootstrap from section 12
  scripts/
    resume.ps1
    register-task.ps1
    lib/                    ← python helpers: edgar.py, prices.py, charts.py, validate.py
  cache/edgar/  cache/yf/
  library/
    industries/<slug>-primer.md      ← persistent learning material
    companies/<TICKER>.json          ← latest fingerprint per company (history kept)
  runs/<run-id>/
    wave1/  leads/  routing.json  regime.json
    industries/  triage/  deepdive/<TICKER>/  theses/  redteam/
    reports/<industry>.html  reports/<industry>.md  reports/charts/
    COVERAGE.md  SUMMARY.md
  logs/events.log  logs/session-*.log
```

Run IDs are formatted `YYYYMMDD-<mode>`, for example `20261125-full_hunt`.

---

## 10. Config and state files

### 10.1 `config.json`

```json
{
  "owner": "Alex",
  "edgar_contact_email": "SET-ME@example.com",
  "mode": "full_hunt",
  "industries": [],
  "default_industries": ["railroads", "payments", "homebuilders"],
  "watchlist": [],
  "max_parallel": 5,
  "max_companies_per_industry": 20,
  "ibkr_price_check": true,
  "max_attempts": 3,
  "heartbeat_stale_minutes": 45,
  "max_run_days": 4,
  "price_max_age_trading_days": 1,
  "report_formats": ["html", "md"]
}
```

### 10.2 `RUN_STATE.json`

```json
{
  "run_id": null,
  "mode": null,
  "status": "idle",
  "heartbeat": null,
  "current_wave": null,
  "tasks": [
    {"id": "w1-macro", "wave": 1, "agent": "macro-scanner", "input": {}, "output": "runs/<run>/wave1/macro.md",
     "status": "pending", "attempts": 0, "last_error": null, "updated": null}
  ],
  "notes": []
}
```

`status` is one of: `idle`, `running`, `complete`, `paused_by_user`. The scheduler does nothing unless status is `running`.

---

## 11. Auto-resume (Windows)

Claude Code can't wake itself up after a limit. Windows Task Scheduler runs `resume.ps1` every 20 minutes. If a run is in progress and no session is alive, it starts a fresh headless session. While the limit is still active, that session exits right away and the next tick tries again. Once the limit resets, the run continues on its own.

**Requirements:** the PC must be on (sleep is fine; the task wakes it), signed in to Claude Code under Alex's Windows account, and online.

### 11.1 `scripts/resume.ps1`

```powershell
$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $PSScriptRoot
$lock  = Join-Path $root ".run.lock"
$state = Join-Path $root "RUN_STATE.json"
$logs  = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null
function Log($m) { Add-Content (Join-Path $logs "scheduler.log") "$(Get-Date -Format o)  $m" }

if (-not (Test-Path $state)) { Log "no state file; exit"; exit 0 }
try { $s = Get-Content $state -Raw | ConvertFrom-Json } catch { Log "state unreadable; session will repair"; $s = @{ status = "running" } }
if ($s.status -ne "running") { exit 0 }

if (Test-Path $lock) {
  $lockPid = (Get-Content $lock -Raw).Trim()
  $alive = $false
  if ($lockPid -match '^\d+$') { $alive = [bool](Get-Process -Id ([int]$lockPid) -ErrorAction SilentlyContinue) }
  if ($alive) { Log "session alive (pid $lockPid); skip"; exit 0 }
  Log "stale lock (pid $lockPid); removing"
  Remove-Item $lock -Force
}

Set-Content -Path $lock -Value $PID
$sessionLog = Join-Path $logs ("session-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".log")
Log "starting session -> $sessionLog"
try {
  Push-Location $root
  $claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $claude) { $claude = Join-Path $env:APPDATA "npm\claude.cmd" }
  if (-not (Test-Path $claude)) { Log "claude CLI not found; set its full path in resume.ps1"; exit 1 }
  & $claude -p "Resume the investment hunt. Follow CLAUDE.md section 8.3 exactly: read CLAUDE.md, config.json and RUN_STATE.json, reconcile state against files on disk, then continue from the next pending task. Checkpoint after every task." --permission-mode acceptEdits *>> $sessionLog
  Log "session exited with code $LASTEXITCODE"
} catch {
  Log "session error: $($_.Exception.Message)"
} finally {
  Pop-Location
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}
```

### 11.2 `scripts/register-task.ps1`

```powershell
$root   = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root "scripts\resume.ps1"
$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 20)
$settings = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 6)
Register-ScheduledTask -TaskName "InvestmentHuntResume" -Action $action -Trigger $trigger -Settings $settings -Description "Resumes the investment hunt after usage-limit resets" -Force
```

To stop auto-resume, set `status` to `paused_by_user` in `RUN_STATE.json`, or run `Unregister-ScheduledTask -TaskName InvestmentHuntResume`.

### 11.3 Why a fresh session, not `--continue`

A resumed old conversation carries its full context. That burns usage faster and can replay a half-finished tool call. A fresh session plus the state file is smaller, cheaper and deterministic.

### 11.4 `.claude/settings.json` (so headless runs never stall on a permission prompt)

```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "Glob", "Grep", "WebSearch",
      "WebFetch(domain:sec.gov)", "WebFetch(domain:data.sec.gov)", "WebFetch(domain:efts.sec.gov)",
      "WebFetch(domain:federalreserve.gov)", "WebFetch(domain:treasury.gov)", "WebFetch(domain:fred.stlouisfed.org)",
      "WebFetch(domain:bls.gov)", "WebFetch(domain:bea.gov)", "WebFetch(domain:census.gov)", "WebFetch(domain:eia.gov)",
      "WebFetch(domain:cftc.gov)", "WebFetch(domain:federalregister.gov)", "WebFetch(domain:stb.gov)",
      "Bash(python:*)", "Bash(py:*)", "Bash(pip install:*)"
    ],
    "deny": ["WebFetch(domain:financialmodelingprep.com)"]
  }
}
```

Company IR sites vary, so add their domains as they come up during interactive runs. In headless mode, a blocked fetch is logged as `unreachable` and the run continues. It never stalls.

---

## 12. Agent definitions (bootstrap writes each to `.claude/agents/<name>.md`)

Common footer for every agent below. Append it to each file's body:

> Follow CLAUDE.md sections 2, 5 and 6. Use only the sources in section 7; never FMP. Every fact carries a source URL and an as-of date. Say "nothing found" rather than padding. Write your output to the exact path given in your brief, atomically (write a .tmp file, then rename). End with `<!-- COMPLETE -->`.

```markdown
---
name: macro-scanner
description: Wave 1 Lane A. Reads official macro hard data and central-bank communication; writes lead cards.
tools: Read, Write, WebFetch, WebSearch, Bash
model: sonnet
---
Read the latest releases (jobs, CPI, PCE, GDP, retail sales, ISM, JOLTS, claims), Fed statements, minutes and speeches, and Treasury refunding and auctions. Report what changed against the prior release and against expectations stated in official sources. Map each change to the four regimes in CLAUDE.md 4.1. Produce lead cards (CLAUDE.md 5) for anything that travels to an industry.
```

```markdown
---
name: markets-scanner
description: Wave 1 Lane A. Reads cross-asset market signals as macro indicators; flags disagreements with hard data.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Pull the signals in CLAUDE.md 4.2 via yFinance, FRED and Treasury. For each, give level, 1-month and 3-month change, and what it implies. List explicitly where markets disagree with hard data. Produce lead cards.
```

```markdown
---
name: policy-events-scanner
description: Wave 1 Lane A. Rules, tariffs, sanctions, court rulings, and the event calendar.
tools: Read, Write, WebFetch, WebSearch, Bash
model: sonnet
---
Scan the Federal Register, USTR, OFAC, major court dockets, and EDGAR for new S-1s, merger filings and index changes. Build the next-30-days event calendar. Produce lead cards naming the industries each event helps or hurts.
```

```markdown
---
name: price-action-scanner
description: Wave 1 Lane B. Sector, industry and stock moves versus the index; relative strength and unusual volume.
tools: Read, Write, Bash
model: sonnet
---
Using yFinance, rank sectors and industries by 1-month and 3-month relative strength against the S&P 500. Flag known names with unusual volume, new 52-week highs or lows, or breaks from their sector. Price action is a pointer, not a verdict: each flag becomes a lead card whose ask_next tells the next agent what to verify in filings.
```

```markdown
---
name: divergence-scanner
description: Wave 1 Lane B. Finds companies whose price fights their own fundamentals, peers or macro driver.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Compare recent price moves with EDGAR XBRL fundamentals (revenue, operating income, FCF trend) and the latest 8-K or 10-Q. Flag: price down while fundamentals improve; price flat after strong results; breaks from peers; decoupling from the macro driver. Produce lead cards.
```

```markdown
---
name: behaviour-change-scanner
description: Wave 1 Lane B. Finds companies doing something different in their filings and actions.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Use EDGAR full-text search and recent filings to find new segments, capex pivots, pricing-model changes, buyback or dividend shifts, clusters of open-market insider buying (Form 4), new SC 13D filings, and management wording shifts. Produce lead cards.
```

```markdown
---
name: industry-mapper
description: Wave 3. Maps one industry end to end, including the supply chain layer tied to macro and market signals, and lists every notable company.
tools: Read, Write, WebFetch, WebSearch, Bash
model: sonnet
---
Produce the industry read in CLAUDE.md 6.3, all 8 parts. The supply chain layer is mandatory and every link carries signal tags. Answer every ask_next from the routed leads in your brief. Update the persistent primer at library/industries/<slug>-primer.md (edit, don't overwrite history). Return the company list as JSON with type and business-model tags.
```

```markdown
---
name: triage-analyst
description: Wave 4. Reads one company and produces its 17-read fingerprint, two ratings and kill-switch status. Cuts nobody.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Follow CLAUDE.md 6.4 exactly: all 17 reads scored 1-5 with evidence and source, the supply chain read linked to the industry's signal tags, business quality and attractiveness kept separate, the regime grid, and the status by the rules in 6.4.1. Price comes last. Fill in the coverage map honestly.
```

```markdown
---
name: dd-edgar
description: Wave 5 deep dive, EDGAR layer for one survivor.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Work every item in the dd-edgar row of CLAUDE.md 6.5. Mark each item covered, nothing_found or unreachable.
```

```markdown
---
name: dd-ir
description: Wave 5 deep dive, company IR layer for one survivor.
tools: Read, Write, WebFetch, WebSearch, Bash
model: sonnet
---
Work every item in the dd-ir row of CLAUDE.md 6.5, including the full IR archive and every supplemental link named in press releases.
```

```markdown
---
name: dd-transcripts
description: Wave 5 deep dive, earnings calls and management voice.
tools: Read, Write, WebFetch, WebSearch
model: sonnet
---
Work the dd-transcripts row of CLAUDE.md 6.5. Quote no more than short phrases; describe wording shifts in your own words.
```

```markdown
---
name: dd-regulatory
description: Wave 5 deep dive, regulatory dockets and legal.
tools: Read, Write, WebFetch, WebSearch
model: sonnet
---
Work the dd-regulatory row of CLAUDE.md 6.5. If a deal or review is pending, the docket is the centre of the read.
```

```markdown
---
name: dd-credit
description: Wave 5 deep dive, capital structure and credit.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Work the dd-credit row of CLAUDE.md 6.5. Build the maturity ladder and covenant headroom from the indentures and credit agreements (EX-4, EX-10).
```

```markdown
---
name: dd-ownership
description: Wave 5 deep dive, ownership and insider flow.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Work the dd-ownership row of CLAUDE.md 6.5. Separate open-market trades from 10b5-1 plan trades.
```

```markdown
---
name: dd-peers
description: Wave 5 deep dive, industry and peer cross-checks.
tools: Read, Write, WebFetch, WebSearch, Bash
model: sonnet
---
Work the dd-peers row of CLAUDE.md 6.5. Confirm or contradict the company's story using rivals, customers and suppliers.
```

```markdown
---
name: dd-diff
description: Wave 5 deep dive, what changed between versions.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Work the dd-diff row of CLAUDE.md 6.5. Log every restated number with the old value, the new value and the source of each.
```

```markdown
---
name: red-team
description: Wave 7. Attacks one finished thesis without seeing how it was built.
tools: Read, Write, WebFetch, Bash
---
Read only the thesis file and the deep-dive folder named in your brief. Build the strongest case against the thesis from primary sources. Return: case against, what would prove it right, the facts the thesis leaned on most and whether they hold, and a verdict of holds, weakened or broken. No politeness padding.
```

---

## 13. Reports (what Alex reads)

One report per industry per run, in `runs/<run>/reports/` as a **self-contained HTML file** (charts embedded as inline SVG) plus a Markdown twin. These are visual reports, not walls of words. Charts are drawn with Python, with an artistic but clean style: no tree metaphors, no default-template look.

Each industry report contains, in order:

1. **Headline and regime box:** today's regime, its confidence, and what it means for this industry, in a few lines.
2. **How money flows:** the value chain and supply chain diagram with signal tags lit up where Lane A signals moved this run.
3. **Every company table:** ticker, name, type, business model, quality, attractiveness, and a status chip (green Survived / amber Watch / red Dropped) with its one-line reason.
4. **Fingerprints:** each company's 17 reads as a coloured strip, all stacked so companies compare at a glance.
5. **Regime heat grid:** companies down the side, the four economies across the top, today's column highlighted.
6. **Numbers that matter:** charts of the industry's 3–5 key metrics, plus margins, returns on capital and FCF across companies.
7. **Survivor pages:** thesis, the mistake, valuation summary, red-team verdict, kill switch, watch signals, and a checklist of deep-dive coverage.
8. **Primer:** what the industry is, its cycle, its lingo, and what to watch, linked to `library/industries/<slug>-primer.md`.
9. **Coverage report:** every layer for every company marked covered / nothing_found / unreachable / failed.
10. **Sources:** every URL used, with as-of dates.

Also produce:
- `runs/<run>/reports/MAP.html`, the cross-industry atlas: industries as districts, companies as buildings, survivors lit, and a regime toggle that re-shades everything by the regime grid.
- `runs/<run>/SUMMARY.md`: survivors across all industries, what changed since the last run, and the top leads not yet followed.

Validate each HTML report by opening it with a headless check: it must parse, every chart must render, and every table row must have a source.

---

## 14. Daily mode

`daily_scan` runs Wave 1 only, then:
- the regime read, plus what changed since yesterday,
- alerts for the watchlist and every current Survived or Watch company: price breaks, divergence flags, new filings (8-K, Form 4, 13D), and any kill-switch event,
- a short `runs/<run>/DAILY.md` with leads worth a full `industry_refresh`.

---

## 15. Definition of done (per run)

- [ ] Every task is `done` or `failed` with its reason
- [ ] `regime.json` written and updated with feedback
- [ ] Every routed lead answered or marked unanswerable
- [ ] Every company on every industry list has a triage file
- [ ] Every survivor has 8 deep-dive layers, a thesis, a red-team verdict and a kill switch
- [ ] Industry reports and `MAP.html` built and validated
- [ ] `COVERAGE.md` complete, with no layer silently missing
- [ ] `SUMMARY.md` written; `RUN_STATE.json` status set to `complete`
