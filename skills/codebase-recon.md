---
name: codebase-recon
description: Build an accurate map of an unfamiliar codebase quickly — entry points, data flow, conventions and test strategy — before proposing any change.
category: research
tags: [research, onboarding, architecture]
maturity: stable
tools: [Grep, Glob, Read, Bash]
---

## Sequence

1. **Manifest first.** `package.json` / `pyproject.toml` / `go.mod` — scripts,
   entry points, and dependencies tell you the stack and how it is run and tested.
2. **Follow one real request end to end.** Route → handler → domain → storage.
   One complete trace is worth ten skimmed files.
3. **Read the tests** for the area you will touch — they encode the intended
   behaviour and the team's testing idiom.
4. **Note the conventions**: error handling, naming, module boundaries, where
   configuration comes from. Match them later instead of importing your own.
5. **Find the seams**: where would this change plug in with the least blast radius?

## Report back

- The 3–7 files that matter for this task, with one line each on their role
- The conventions you will follow
- The unknowns that would change the approach if answered differently
