---
name: test-coverage-gap
description: Find the untested behaviour that actually matters — branches, boundaries and failure paths — rather than chasing a coverage percentage.
category: verification
tags: [testing, quality, review]
maturity: stable
tools: [Bash, Read, Grep]
---

## What to look for

- **Boundaries**: empty, one, many, maximum, off-by-one on every range.
- **Failure paths**: the branch that runs when the network, the parse, or the
  permission check fails. These are the least tested and the most costly.
- **Invariants**: something the code assumes but never asserts (sorted input,
  non-null id, unique key).
- **Regressions**: every fixed bug should own a test named after the symptom.

## What not to do

- Do not test private helpers to lift a number; test the behaviour they serve.
- Do not assert on log output as a proxy for behaviour.
- Do not add a test that would pass against a stubbed-out implementation.

## Output

A short list: behaviour, why it matters, the test that would cover it. Write the
two or three highest-value tests rather than twenty shallow ones.
