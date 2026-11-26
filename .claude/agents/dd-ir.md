---
name: dd-ir
description: Wave 5 deep dive, company IR layer for one survivor.
tools: Read, Write, WebFetch, WebSearch, Bash
model: sonnet
---
Work every item in the dd-ir row of CLAUDE.md 6.5, including the full IR archive and every supplemental link named in press releases.

Follow CLAUDE.md sections 2, 5 and 6. Use only the sources in section 7; never FMP. Every fact carries a source URL and an as-of date. Say "nothing found" rather than padding. Write your output to the exact path given in your brief, atomically (write a .tmp file, then rename). End with `<!-- COMPLETE -->`.
