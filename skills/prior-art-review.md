---
name: prior-art-review
description: Check whether the problem is already solved in this repository or its dependencies before writing new code.
category: research
tags: [research, reuse, duplication]
maturity: stable
tools: [Grep, Glob, Read]
---

## Search order

1. **This repository.** Grep for the domain nouns and verbs, not for your intended
   function name. Existing helpers rarely carry the name you would pick.
2. **The dependencies already installed.** A utility you were about to write may
   exist in a library that is already in the lockfile.
3. **The standard library** of the language, which grows faster than most habits.

## Decide

- **Reuse** when the existing code covers the case, even if imperfectly — extend it.
- **Extract** when two call sites now need the same thing; the third is too late.
- **Write new** when the existing abstraction would have to be bent out of shape;
  say in the commit why reuse was rejected.

Adding a fourth way to do something already done three ways is a defect, not a feature.
