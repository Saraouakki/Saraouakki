---
name: secrets-hygiene
description: Keep credentials out of the repository, the logs and the agent context, and respond correctly when one has already leaked.
category: security
tags: [security, secrets, operations]
maturity: stable
tools: [Grep, Bash, Read]
---

## Rules

- Secrets come from the environment or a secret manager. Never a literal in code,
  a committed `.env`, a test fixture, or a prompt file.
- Commit `.env.example` with the *names* and empty values, never the values.
- Redact before printing. Log the key name and the last four characters at most.
- An agent that reads a credential file into its context has leaked it into a
  transcript — do not do it, and do not ask an agent to.

## If a secret was committed

1. **Rotate first.** Revoke the credential before touching git history — the value
   is public from the moment it was pushed.
2. Remove it from the working tree and add the path to `.gitignore`.
3. Purge history only after rotation, and tell everyone who has a clone.
4. Add a scanner to CI (`ecc scan --fail-on high`) so the next one is caught before merge.

## Detection

Run `ecc scan` over the repository and over agent configuration: settings files,
hooks and MCP definitions carry credentials as often as source code does.
