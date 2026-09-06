---
name: spec-extraction
description: Turn a vague request into a testable specification — inputs, outputs, edge cases and explicit non-goals — before writing code.
category: research
tags: [planning, requirements, clarity]
maturity: stable
tools: [Read, Grep]
---

## Produce

1. **One-sentence goal.** What is true after this change that is not true now?
2. **Inputs and outputs.** Types, ranges, and where each comes from.
3. **Acceptance checks.** Three to seven concrete cases, each phrased so it can
   become a test: "given X, the system does Y".
4. **Edge cases.** Empty, duplicate, concurrent, unauthorised, oversized.
5. **Non-goals.** What is explicitly out of scope for this change.
6. **Open questions.** Only the ones where two reasonable readings lead to
   materially different work — decide the rest yourself and record the assumption.

## Rule

Do not expand the scope while extracting the spec. If you find adjacent problems,
list them under non-goals rather than solving them.
