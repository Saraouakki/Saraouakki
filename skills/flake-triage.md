---
name: flake-triage
description: Investigate an intermittently failing test by finding the source of nondeterminism, instead of re-running until it passes or disabling it.
category: verification
tags: [testing, reliability, ci]
maturity: stable
tools: [Bash, Read, Edit]
---

## Never

Skip, `.only`, quarantine, or delete the test to get a green run. A flaky test is
a real defect report with an unreliable trigger — usually in the code, not the test.

## Sources of nondeterminism, in likelihood order

1. **Shared state** between tests — a module singleton, a database row, a temp file.
2. **Time** — `Date.now()`, timezone, a timeout racing real work.
3. **Ordering** — the suite passes in file order but not in parallel or random order.
4. **Concurrency** — an unawaited promise, a listener registered after the event.
5. **External services** — network, ports, rate limits.

## Procedure

- Run the single test 50 times in a loop. If it never fails alone, the cause is
  cross-test state or ordering.
- Run the suite with a fixed random seed and with the reverse order.
- Pin the clock and the seed in the test itself once you know which one it was.
- Fix the mechanism, then re-run the loop to show it holds.
