---
name: ci-failure-triage
description: Diagnose a red pipeline by reading the first real failure, reproducing it locally, and fixing the cause rather than re-running the job.
category: ops
tags: [ci, debugging, delivery]
maturity: stable
tools: [Bash, Read, Grep]
---

## Read the log properly

- Scroll to the **first** failure, not the last. Later errors are usually fallout.
- Distinguish four shapes: setup failure (checkout, install, runner), compile or
  type error, test failure, and deploy failure. They have different owners.
- Note the exact command CI ran; reproduce that command locally, not your habit.

## Decide

- **Caused by this change** → fix it here, minimally.
- **Red on the base branch too** → it is not yours; port the existing fix if one
  exists and say so, rather than widening this change.
- **Genuinely nondeterministic** → treat it with `flake-triage`, and re-run at
  most once to confirm. "Flake" is a diagnosis you earn, not an assumption.

## Never

Skip the test, mark it allowed-to-fail, or push an empty commit to re-trigger CI.
Getting the checkmark without fixing the cause moves the failure to someone else.
