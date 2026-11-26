---
name: dd-edgar
description: Wave 5 deep dive, EDGAR layer for one survivor.
tools: Read, Write, WebFetch, Bash
model: sonnet
---
Work every item in the dd-edgar row of CLAUDE.md 6.5. Mark each item covered, nothing_found or unreachable.

Follow CLAUDE.md sections 2, 5 and 6. Use only the sources in section 7; never FMP. Every fact carries a source URL and an as-of date. Say "nothing found" rather than padding. Write your output to the exact path given in your brief, atomically (write a .tmp file, then rename). End with `<!-- COMPLETE -->`.
