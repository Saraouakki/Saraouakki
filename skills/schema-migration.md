---
name: schema-migration
description: Change a production schema without downtime or data loss by expanding, backfilling, switching, then contracting in separate deploys.
category: data
tags: [data, database, migration]
maturity: stable
tools: [Read, Edit, Bash]
---

## Expand → migrate → contract

1. **Expand.** Add the new column/table as nullable with a default. Deploy. Old
   code keeps working.
2. **Backfill.** Populate in batches with a bounded query, not one statement over
   the whole table. Make it resumable and idempotent.
3. **Dual-write / dual-read.** New code writes both, reads the new with a fallback.
   Deploy and watch.
4. **Switch.** Read only the new path once the backfill is verified complete.
5. **Contract.** Drop the old column in a *later* deploy, after a rollback window.

## Rules

- Every migration needs a tested down path, or an explicit statement that it is
  irreversible and why that is acceptable.
- Never rename in place — add, copy, switch, drop.
- Long transactions and full-table `ALTER`s take locks; check the behaviour of your
  specific engine and version before running one against production.
- Verify row counts and a sample of values before the contract step.
