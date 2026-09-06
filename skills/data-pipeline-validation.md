---
name: data-pipeline-validation
description: Add checks to a data pipeline so bad data fails loudly at the boundary instead of propagating into downstream tables and reports.
category: data
tags: [data, quality, pipelines]
maturity: stable
tools: [Read, Edit, Bash]
---

## Check at three points

1. **On ingest** — schema, types, required fields, plausible ranges, expected
   row-count magnitude compared to the last run.
2. **After transform** — no unexpected nulls introduced, keys still unique, joins
   did not drop or duplicate rows (compare counts before and after).
3. **Before publish** — freshness, totals reconcile against the source, no
   partition is empty.

## Behaviour on failure

- Fail the run and keep the last good output. A half-written table that looks
  fresh is worse than an obviously stale one.
- Make each check name the rule, the expected value and the observed value.
- Quarantine bad rows with the reason rather than dropping them silently.

## Idempotence

Re-running the pipeline for the same window must produce the same result. Prefer
partition overwrite over append, and make every write keyed and repeatable.
