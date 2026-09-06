---
name: incremental-refactor
description: Restructure code in small, behaviour-preserving steps that keep the test suite green after every commit, instead of one large rewrite.
category: engineering
tags: [refactoring, design, maintenance]
maturity: stable
tools: [Read, Edit, Bash]
---

## Preconditions

Characterisation tests exist for the behaviour you are about to move. If they do
not, write them first — a refactor without tests is a rewrite with optimism.

## Steps

1. Name the target shape in one sentence before touching anything.
2. Make the change easy: add the new seam (a function, a parameter, an interface)
   *next to* the old code without removing anything.
3. Move callers over one at a time, running tests after each.
4. Delete the old path once nothing references it.
5. Only then rename for clarity — renames in the same commit as moves make the
   diff unreviewable.

## Constraints

- Behaviour must not change. If you find a bug mid-refactor, note it and fix it
  in a separate commit.
- Keep each commit independently green and revertible.
- Stop when the original goal is met; unrelated cleanups belong to their own change.
