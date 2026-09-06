---
name: threat-model
description: Reason about who can attack a feature, through which entry point, and what they gain — before the design is settled, not after the incident.
category: security
tags: [security, design, risk]
maturity: stable
tools: [Read, Grep]
---

## Four questions

1. **What are we building?** One diagram or paragraph of the data flow, including
   every trust boundary the data crosses.
2. **What can go wrong?** Walk the boundaries with STRIDE: spoofing, tampering,
   repudiation, information disclosure, denial of service, elevation of privilege.
3. **What are we doing about it?** A control per plausible threat, or an explicit
   accepted risk with the reason.
4. **Did we do a good job?** A test or a check that would fail if the control
   regressed.

## Where the bugs actually are

- Authorisation checked at the UI but not at the API
- Object ids that are guessable and not scoped to the caller (IDOR)
- Trust in a client-supplied field: role, price, tenant id
- Secrets in logs, error messages, or analytics payloads
- Uploads served back with the caller's content type

## Output

A short table of threat → control → how it is verified. Rank by exploitability
first, not by how interesting the attack is.
