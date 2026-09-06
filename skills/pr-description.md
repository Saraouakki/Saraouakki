---
name: pr-description
description: Write a pull request description that lets a reviewer decide correctly without reconstructing the context from the diff.
category: process
tags: [review, communication, git]
maturity: stable
tools: [Read, Bash]
---

## Structure

- **What** — one paragraph on the change, in behaviour terms.
- **Why** — the problem, with a link to the issue or incident.
- **How** — the approach, and the alternative you rejected with the reason.
- **Verification** — what you ran, what you saw. Screenshots for UI, numbers for
  performance.
- **Risk and rollback** — blast radius, and how to undo it.

## Reviewer courtesy

- Point at the two or three files that carry the real change; say which of the
  rest are mechanical.
- Call out anything you are unsure about — that is where review time is worth most.
- Keep the PR small enough to review in one sitting. If it is not, split it.

## Honesty

State what is *not* covered: known gaps, follow-ups, tests you chose not to write.
A description that oversells gets the review it deserves later.
