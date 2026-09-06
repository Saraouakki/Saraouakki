---
name: frontend-state-review
description: Check that client state lives at the right level — server cache, URL, component state or global store — and that derived values are not duplicated.
category: frontend
tags: [frontend, state, architecture]
maturity: stable
tools: [Read, Grep]
---

## Place each piece of state

| Kind of state | Where it belongs |
|---|---|
| Data owned by the server | A query cache, not a global store copy |
| What the user is looking at (filters, tab, page) | The URL |
| Ephemeral UI (hover, open/closed, draft input) | Local component state |
| Cross-cutting session facts (auth, theme, locale) | A small global store |
| Anything computable from the above | Derived at render, never stored |

## Smells

- The same server record held in three places, kept in sync by hand
- `useEffect` whose only job is to copy props into state
- A global store that grows a slice per screen
- Loading and error flags maintained manually next to a cache that already has them

## Rule

Every duplicated piece of state is a future inconsistency bug. Derive it, or own
it in exactly one place.
