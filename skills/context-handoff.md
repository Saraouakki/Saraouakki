---
name: context-handoff
description: End a session by recording the durable facts, decisions and open threads that the next session would otherwise have to rediscover.
category: process
tags: [memory, workflow, continuity]
maturity: stable
tools: [Bash, Write]
---

## Record only what will still be true tomorrow

- **Decisions** with their reason ("we store money in minor units because…")
- **Conventions** discovered in the codebase, not invented in the session
- **Gotchas**: the trap that cost time and will cost it again
- **Open threads**: what was left unfinished and what the next step is

## Do not record

- The narrative of what you did — the diff and history already hold it
- Anything you inferred but did not verify
- Secrets, tokens, personal data, or paths outside the project
- Facts that are already in the README

## How

```sh
ecc memory add "money is stored in minor units end to end" --kind convention --scope lib/money
ecc memory add "the seed script must run before the API tests" --kind gotcha --tags tests
ecc memory pack --budget 2500   # what the next session gets
```

Reinforce rather than duplicate: recording the same fact again strengthens it
instead of adding a second copy.
