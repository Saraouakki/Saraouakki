---
name: sql-review
description: Review queries for correctness and cost — join cardinality, null semantics, index usage and unbounded result sets.
category: data
tags: [data, sql, performance]
maturity: stable
tools: [Read, Bash]
---

## Correctness

- Does the join multiply rows? Check cardinality before trusting any aggregate
  computed after a join.
- `NULL` is not equal to anything, including `NULL` — check `IS NULL`, and
  remember `NOT IN` with a nullable subquery returns no rows.
- `LEFT JOIN` plus a `WHERE` on the right table silently becomes an inner join.
- Aggregates without `GROUP BY` on every non-aggregated column are engine-dependent.

## Cost

- Read the plan (`EXPLAIN ANALYZE`) rather than guessing; look for sequential
  scans on large tables and estimated-vs-actual row mismatches.
- A predicate wrapped in a function (`WHERE lower(email) = …`) cannot use a plain
  index — index the expression or store it normalised.
- Every user-facing query needs a `LIMIT` and a deterministic `ORDER BY` for paging.
- Watch for N+1: one query per row of a previous result.
