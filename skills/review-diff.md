---
name: review-diff
description: Review a change for defects that matter — correctness, security, and blast radius — ranked, with a concrete failure scenario for each finding.
category: process
tags: [review, quality, correctness]
maturity: stable
tools: [Read, Grep, Bash]
---

## Read in this order

1. **The contract**: what the change claims to do, from the description and tests.
2. **The risky code**: auth checks, money, data deletion, concurrency, migrations.
3. **The boundaries**: new inputs, new external calls, new persisted state.
4. **The rest**: naming, structure, duplication.

## A finding is worth reporting when

You can state the failure concretely: *given these inputs or this state, this
happens, and it is wrong.* If you cannot construct that scenario, it is a
preference — say so, or drop it.

## Rank

Correctness and security first, then maintainability, then style. Ten style nits
buried around one real bug means the bug ships.

## Say what is good

Cheap, honest, and it tells the author which patterns to repeat.
