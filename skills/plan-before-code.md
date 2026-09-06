---
name: plan-before-code
description: Produce a short, concrete plan — files, steps, verification — before editing, for any change touching more than a couple of files.
category: process
tags: [planning, workflow]
maturity: stable
tools: [Read, Grep, Glob]
---

## The plan is short

Four parts, no more than a page:

1. **Goal** — one sentence, in terms of observable behaviour.
2. **Steps** — ordered, each one independently verifiable, each naming the files
   it touches.
3. **Verification** — the command that proves each step worked.
4. **Risks** — what could break elsewhere, and how you would notice.

## When to skip it

A one-file, one-behaviour change with an obvious test. Planning is overhead there.

## When it pays for itself

- The change spans layers (UI, API, storage)
- The approach has two plausible shapes and they diverge in cost
- Someone else will review or continue the work

Write the plan, then follow it — and when reality contradicts it, update the plan
rather than quietly improvising past it.
