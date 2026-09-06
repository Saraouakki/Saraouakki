---
name: accessible-component
description: Build UI components that work with keyboard, screen reader and zoom by default — semantics first, ARIA only where semantics run out.
category: frontend
tags: [frontend, accessibility, ui]
maturity: stable
tools: [Read, Edit, Write]
---

## Order of preference

1. **Native element.** `<button>`, `<a href>`, `<label>`, `<dialog>`, `<input>`
   bring focus, keyboard and role for free. A `div` with a click handler brings none.
2. **Native + a small amount of ARIA** where the pattern needs state
   (`aria-expanded`, `aria-current`, `aria-describedby`).
3. **Full ARIA pattern** only for genuinely custom widgets, implemented against
   the APG keyboard contract.

## Checklist

- [ ] Reachable and operable with Tab / Shift+Tab / Enter / Space / Escape
- [ ] Visible focus indicator, not `outline: none`
- [ ] Accessible name on every control and icon-only button
- [ ] Colour is never the only carrier of meaning; contrast ≥ 4.5:1 for text
- [ ] Works at 200% zoom and at 320px width
- [ ] State changes announced (`aria-live`) when they are not focus-driven
- [ ] Respects `prefers-reduced-motion`

## Verify

Tab through the component with the mouse untouched, and read it once with a
screen reader. Automated checks catch roughly a third of real issues.
