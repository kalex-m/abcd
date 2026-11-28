# Coverage report · 20261126-full_hunt

Every layer for every company: covered / nothing_found / unreachable / failed. Nothing is silently missing.

## Tasks that did not complete
- `w5-WEX-dd-credit`: cancelled: WEX demoted to watch after 3/8 layers (mistake disappeared); see status_overrides.json
- `w5-WEX-dd-ownership`: cancelled: WEX demoted to watch after 3/8 layers (mistake disappeared); see status_overrides.json
- `w5-WEX-dd-peers`: cancelled: WEX demoted to watch after 3/8 layers (mistake disappeared); see status_overrides.json
- `w5-WEX-dd-diff`: cancelled: WEX demoted to watch after 3/8 layers (mistake disappeared); see status_overrides.json

## Triage coverage (Wave 4)
| Ticker | 10-K | 10-Q | release | deck | fact sheet | DEF 14A | red flags | price |
|---|---|---|---|---|---|---|---|---|
| UNP | covered | covered | covered | unreachable | nothing_found | covered | covered | covered |
| CSX | covered | covered | covered | unreachable | nothing_found | covered | covered | covered |
| NSC | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| CP | covered | covered | covered | covered | unreachable | covered | covered | covered |
| CNI | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| WAB | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| GATX | covered | covered | covered | nothing_found | nothing_found | covered | covered | covered |
| TRN | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| GBX | covered | nothing_found | covered | nothing_found | nothing_found | covered | covered | covered |
| JBHT | covered | covered | covered | nothing_found | nothing_found | covered | covered | covered |
| HUBG | covered | covered | covered | nothing_found | unreachable | covered | covered | covered |
| FSTR | covered | covered | unreachable | unreachable | unreachable | covered | covered | covered |
| TFC | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| HBAN | covered | covered | covered | covered | covered | covered | covered | covered |
| GS | covered | covered | covered | covered | unreachable | covered | covered | covered |
| MS | covered | covered | covered | nothing_found | nothing_found | covered | covered | covered |
| BAC | covered | covered | covered | covered | unreachable | covered | covered | covered |
| COF | covered | covered | covered | nothing_found | covered | covered | covered | covered |
| SCHW | unreachable | covered | covered | nothing_found | unreachable | covered | covered | covered |
| WFC | covered | covered | covered | covered | covered | covered | covered | covered |
| USB | covered | covered | covered | covered | covered | covered | covered | covered |
| PNC | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| JPM | covered | covered | covered | covered | covered | covered | covered | covered |
| C | covered | covered | covered | covered | covered | covered | covered | covered |
| SYF | covered | covered | covered | covered | covered | covered | covered | covered |
| FITB | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| MTB | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| KEY | covered | covered | covered | unreachable | covered | covered | covered | covered |
| RF | covered | covered | covered | covered | covered | covered | covered | covered |
| CFG | covered | covered | covered | covered | covered | covered | covered | covered |
| BNY | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| STT | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| GPN | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| FIS | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| FISV | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| V | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| MA | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| PYPL | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| INTU | covered | covered | covered | nothing_found | covered | covered | covered | covered |
| AXP | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| XYZ | covered | covered | covered | nothing_found | nothing_found | covered | covered | covered |
| TOST | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| FOUR | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| JKHY | covered | covered | covered | nothing_found | nothing_found | nothing_found | covered | covered |
| CPAY | unreachable | covered | covered | unreachable | unreachable | covered | covered | covered |
| WEX | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| AFRM | covered | covered | covered | nothing_found | nothing_found | covered | covered | covered |
| WU | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| EEFT | covered | covered | covered | unreachable | unreachable | covered | covered | covered |
| RELY | covered | covered | covered | covered | nothing_found | covered | covered | covered |
| ACIW | covered | covered | covered | unreachable | unreachable | covered | covered | covered |

## Deep-dive coverage (Wave 5)
| Ticker | dd-edgar | dd-ir | dd-transcripts | dd-regulatory | dd-credit | dd-ownership | dd-peers | dd-diff |
|---|---|---|---|---|---|---|---|---|
| INTU | neutral | weakens | neutral | neutral | neutral | neutral | supports | weakens |
| RELY | weakens | supports | weakens | supports | weakens | neutral | supports | neutral |
| SYF | neutral | neutral | weakens | weakens | supports | neutral | supports | neutral |
| WEX | weakens | weakens | weakens | weakens | failed (cancelled) | failed (cancelled) | failed (cancelled) | failed (cancelled) |

Per-item coverage tables (covered / nothing_found / unreachable with reasons) are inside each deep-dive file under `## Coverage`, and per-company `coverage_notes` are in each triage JSON.

## Known unreachable sources this run
- FRED (connection closed), BLS API (keyless quota), FERC and FCC (403 to scripts), CourtListener (401), several IR sites (403/captcha), congress.gov (403), IBKR (no connector).

<!-- COMPLETE -->