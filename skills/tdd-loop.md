---
name: tdd-loop
description: Drive a change test-first — write a failing test that encodes the requirement, make it pass with the smallest change, then refactor under green.
category: engineering
tags: [testing, tdd, workflow]
maturity: stable
tools: [Bash, Read, Edit, Write]
---

## When to use

A behaviour change with an observable outcome: a bug with a reproducer, a new
endpoint, a parser rule, a calculation. Skip it for pure renames and formatting.

## Loop

1. **Red.** Write one test that fails for the *right* reason. Run it and read the
   failure message — if it fails on a typo or a missing import, that is not red yet.
2. **Green.** Write the least code that makes it pass. Resist generalising: the
   second and third test tell you what the abstraction should be.
3. **Refactor.** With the suite green, clean up names, duplication and dead
   branches. Re-run after every step, not at the end.

## Rules

- One failing test at a time. A wall of red hides which change broke what.
- Assert on behaviour, not on internals — a test that mirrors the implementation
  line for line will fail on every refactor and catch no bugs.
- Never make a test pass by weakening it. Deleting, skipping or `expect(true)` is
  a regression with a green checkmark on it.
- Keep the reproducer as a permanent test when you fix a bug.

## Done when

The new test fails on the old code, passes on the new code, and the rest of the
suite is untouched and green.
