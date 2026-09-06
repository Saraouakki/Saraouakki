---
name: responsive-layout
description: Lay out interfaces that hold up from 320px to ultrawide using intrinsic sizing and container queries rather than device-specific breakpoints.
category: frontend
tags: [frontend, css, layout]
maturity: stable
tools: [Read, Edit, Write]
---

## Approach

- Start at the **narrowest** width and let the layout grow. Retrofitting mobile
  onto a desktop layout costs more than the reverse.
- Prefer intrinsic sizing: `flex-wrap`, `grid-template-columns:
  repeat(auto-fit, minmax(16rem, 1fr))`, `min()/max()/clamp()`.
- Break on **content**, not on device names. The breakpoint belongs where the
  layout stops working, whatever width that is.
- Use container queries for components reused in sidebars and main columns alike.

## Non-negotiables

- No horizontal page scroll at any width; wide tables, code blocks and diagrams
  scroll inside their own `overflow-x: auto` container.
- Images: `max-width: 100%`, explicit aspect ratio to prevent layout shift.
- Tap targets at least 44×44px.
- Test both themes and both text directions if the product ships RTL.
