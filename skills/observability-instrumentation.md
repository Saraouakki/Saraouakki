---
name: observability-instrumentation
description: Instrument a code path so an on-call responder can answer what broke, for whom, and since when — without adding a log line per statement.
category: ops
tags: [observability, logging, operations]
maturity: stable
tools: [Read, Edit]
---

## What to emit

- **One structured log per meaningful outcome** — request completed, job failed —
  carrying correlation id, operation, duration, and result. Not one per step.
- **Metrics** for rate, errors and duration of each externally visible operation.
- **A trace span** around each network or database call, named after the operation.

## What not to emit

- Secrets, tokens, full request bodies, personal data
- `console.log("here")` and its descendants
- A log line inside a hot loop
- The same error logged at three layers of the stack

## Test it

Ask: if this fails at 3am, which query answers "how many users are affected and
when did it start"? If no field in your instrumentation answers it, add that field.
