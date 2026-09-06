---
name: release-checklist
description: Ship a change with a rollback path, a verification step and an honest changelog, instead of merging and hoping.
category: ops
tags: [release, delivery, risk]
maturity: stable
tools: [Bash, Read]
---

## Before

- [ ] CI green on the exact commit being shipped
- [ ] Migrations are expand-only and separately deployable
- [ ] Feature is behind a flag if it is user-visible and non-trivial
- [ ] Rollback is a revert, not a fix-forward hope
- [ ] Changelog says what changed for users, in their words

## During

- [ ] Deploy to one environment or one slice first
- [ ] Watch error rate and the specific metric this change touches, for a stated window

## After

- [ ] Verify the new behaviour in the real environment, not only in tests
- [ ] Remove the flag and the dead branch once it is fully rolled out
- [ ] Note anything surprising for the next release

## Rule

If you cannot describe how to undo the change in one sentence, it is not ready.
