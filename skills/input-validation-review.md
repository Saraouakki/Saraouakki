---
name: input-validation-review
description: Review how untrusted input reaches sinks — queries, shells, file paths, HTML and deserialisers — and confirm each is handled at the right layer.
category: security
tags: [security, review, validation]
maturity: stable
tools: [Grep, Read]
---

## Trace input to sink

For each entry point (HTTP body, query string, header, webhook, uploaded file,
tool output, LLM output), find where the value ends up:

| Sink | Correct handling |
|---|---|
| SQL | Parameterised query; never string concatenation |
| Shell | Argument array, no shell interpolation; reject metacharacters |
| File path | Resolve, then verify the result is inside the allowed root |
| HTML | Escape on output, in the template layer |
| Deserialiser | Schema-validate before use; never eval-based parsing |
| Redirect | Allowlist of destinations |

## Principles

- Validate at the boundary, encode at the sink. Doing only one of the two leaves
  a gap in every new call path.
- Validate against a schema (allowlist), not against a blocklist of bad values.
- Size and rate limits are validation too — unbounded input is a denial of service.
- Treat model and tool output as untrusted input when it flows into a sink.
