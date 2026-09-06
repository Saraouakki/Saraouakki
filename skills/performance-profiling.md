---
name: performance-profiling
description: Diagnose slowness with measurements — establish a baseline, profile the real workload, fix the dominant cost, and prove the improvement.
category: engineering
tags: [performance, profiling, measurement]
maturity: stable
tools: [Bash, Read, Edit]
---

## Order of operations

1. **Define the metric.** p95 latency, wall time for a benchmark, memory peak.
   "Feels slow" cannot be verified fixed.
2. **Baseline it.** Run the workload three times, record the numbers, note the
   machine and the input size.
3. **Profile, don't guess.** Use a sampling profiler, `--cpu-prof`, `EXPLAIN
   ANALYZE`, or timing around suspected regions. The hot spot is regularly not
   where the team assumed.
4. **Fix the dominant cost first.** A 60% cost halved beats a 5% cost eliminated.
5. **Re-measure with the same protocol** and report before/after with the delta.

## Common dominant costs

- N+1 queries and per-row round trips
- Work repeated inside a loop that is invariant to it
- Serialising data that is never read
- Missing index on a column used for filtering or joining
- Synchronous I/O on a request path

## Guardrail

Never trade correctness for speed silently. If an optimisation changes semantics
(caching, batching, approximation), say so explicitly and test the new boundary.
