---
name: doc-sync
description: Keep documentation truthful after a change by updating exactly the places the change invalidated, and deleting what is now wrong.
category: process
tags: [documentation, maintenance]
maturity: stable
tools: [Grep, Read, Edit]
---

## Find what the change invalidated

Grep the docs for the names you touched: the flag, the endpoint, the command, the
config key, the default value. Documentation goes stale one identifier at a time.

## Update

- Fix the statement, do not append a note next to the wrong one. Two contradictory
  sentences are worse than one outdated sentence.
- Update the example so it would actually run against the new code.
- Delete documentation for behaviour that no longer exists. Dead docs cost more
  than missing docs, because they are believed.

## Do not

- Write a doc for something you did not change to pad the diff
- Restate the code in prose; document the *why* and the contract
- Leave the README's quick-start broken — it is the most-read paragraph you own
