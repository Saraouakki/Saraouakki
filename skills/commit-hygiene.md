---
name: commit-hygiene
description: Produce commits that are small, self-contained and explained by their message, so history stays reviewable and bisectable.
category: process
tags: [git, review, workflow]
maturity: stable
tools: [Bash]
---

## One commit, one idea

- A refactor and a behaviour change never share a commit; the diff becomes
  unreadable and `git bisect` becomes useless.
- Every commit compiles and passes tests on its own.
- Generated files (lockfiles, build output) go in the commit that caused them,
  produced by the project's tooling.

## Message

```
<area>: <what changed, imperative, ~60 chars>

Why this change is needed, what the alternative was and why it lost.
Anything a reviewer would otherwise have to ask.
```

The subject says *what*; the body says *why*. "Fix bug" and "update code" say
neither.

## Before committing

- Read your own diff top to bottom. Stray debug output and commented-out code get
  caught here or never.
- Check nothing secret, generated-by-accident, or unrelated slipped into the stage.
