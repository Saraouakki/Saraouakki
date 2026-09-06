---
name: error-handling-design
description: Decide deliberately where errors are caught, what they carry, and what the caller can do about them, rather than wrapping everything in a generic catch.
category: engineering
tags: [reliability, api-design, errors]
maturity: stable
tools: [Read, Edit, Grep]
---

## Questions to answer per failure

- **Expected or exceptional?** Expected failures (validation, not-found, conflict)
  belong in the return type. Exceptional ones (bug, corruption) should throw.
- **Who can act on it?** Catch at the layer that can do something — retry, fall
  back, or report to the user. Everywhere else, let it propagate.
- **What context is needed?** Attach the identifiers a responder needs (id, path,
  operation). Never attach the secret, the token, or the whole request body.

## Rules

- Never swallow an error silently. An empty `catch` is a future outage with no logs.
- Do not convert every failure into `null` — the caller then cannot distinguish
  "absent" from "broken".
- Preserve the cause (`cause:`, exception chaining) when re-throwing.
- Log once, at the boundary. Logging at every level triples the noise per incident.

## Review checklist

- [ ] Each catch block either handles, enriches, or intentionally suppresses with a comment
- [ ] Error messages name the operation and the input, not just "failed"
- [ ] Timeouts and retries have bounds
