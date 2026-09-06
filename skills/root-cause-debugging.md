---
name: root-cause-debugging
description: Find the actual cause of a failure by narrowing from symptom to mechanism with evidence, instead of guessing at fixes and re-running.
category: engineering
tags: [debugging, diagnosis, correctness]
maturity: stable
tools: [Bash, Read, Grep]
---

## Method

1. **Reproduce deterministically.** Get one command that fails every time. If it
   only fails sometimes, find the varying input (order, clock, network, seed)
   before anything else — that variable is usually the bug.
2. **Read the actual error.** The first stack frame in your own code beats the
   last frame in a dependency. Note the exact values, not the shape.
3. **Bisect the surface.** Halve the input, the commit range, or the code path
   until the failing region is small enough to hold in your head.
4. **State the mechanism.** Write one sentence: "X happens because Y, when Z."
   If you cannot, you have a correlation, not a cause.
5. **Fix the mechanism**, then confirm the reproducer flips from fail to pass.

## Anti-patterns

- Adding `try/catch` around the symptom — that hides the failure, it does not fix it.
- Changing three things at once, then declaring the one that "worked".
- Blaming flakiness before ruling out ordering and shared state.

## Output

The reproducer, the mechanism in one sentence, the fix, and the test that locks it.
