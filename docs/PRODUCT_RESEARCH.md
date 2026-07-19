# Varisia — Premium Product Research (Task 1)

Brand fit criteria used to filter candidates: visually minimalist (photographs well on nude/beige + black), premium-feel materials (matte plastics, metal accents, no "cheap gadget" plastic sheen), price elastic enough to support a $70–160 retail price in GCC and 700–1600 MAD in Morocco, and low return/complexity risk for COD.

---

## Product 1 — Varisia Lumière (LED Photon Facial Therapy Mask)

**Category:** Smart beauty / personal care electronics

**Concept & high-converting description angle:**
> "5-Minute Facial Rituals, Powered by Light." A 7-colour LED photon therapy mask (red/blue/amber/green spectrum) marketed as an at-home dermatology-grade skincare ritual rather than a "gadget." Copy leans on skin confidence, self-care, and time saved vs. clinic visits — not tech specs. Hero shot: mask on a nude/beige vanity backdrop, black packaging with the Varisia "V" embossed.

**Hook angles for ads/landing page:**
- "Skip the $150 clinic session. Same light therapy, at home, in Arabic and French packaging."
- UGC-style before/after over 14 days.
- Ramadan/Eid gifting angle for GCC; wedding-season gifting angle for Morocco.

**Sourcing & Supplier Sync:**
- Primary: **CJ Dropshipping API** — allows automated inventory sync, real-time stock webhook, and CJ's own EU/GCC-adjacent warehouses (faster than direct China shipping into GCC).
- Secondary/backup supplier: **AliExpress** (via AliExpress Dropshipping Center + AE Open Platform API) for price benchmarking and backup stock if CJ supplier is out.
- Local COD fulfillment: once validated (>30 orders/week), move inventory to a **local 3PL** — GCC: Aramex or Naqel forward-stock program; Morocco: Amana / Speedaf / CTM COD-enabled couriers — to cut delivery time from ~10 days to 24–48h and raise COD acceptance rates.
- Sync method: CJ Dropshipping webhook → our `/api/fulfillment/webhook` (see Automation Node 3) auto-creates the CJ order on payment/COD confirmation; tracking number pushed back into our Google Sheet automatically.

**Pricing Matrix:**

| | GCC (AED) | Morocco (MAD) | USD equiv. |
|---|---|---|---|
| Cost price (CJ/AliExpress, incl. shipping) | 95 AED | 260 MAD | ~$26 |
| Suggested retail price | 349 AED | 990 MAD | ~$95 |
| COD/3PL + payment handling (~12%) | 42 AED | 119 MAD | ~$11 |
| **Net profit per unit** | **212 AED (~61%)** | **611 MAD (~62%)** | **~$58** |

---

## Product 2 — Varisia Vanity (Rotating Jewelry & Perfume Display Organizer with LED Mirror)

**Category:** Minimalist aesthetic organizer / lifestyle décor

**Concept & high-converting description angle:**
> "Your Vanity, Curated." A 360°-rotating acrylic/wood-finish organizer with a built-in halo LED mirror, sized for rings, perfume bottles, and small jewellery — styled as a piece of bedroom décor, not "storage." This is the strongest pure brand-image product: it photographs beautifully on the exact nude/beige palette Varisia uses, making it the natural "hero" product for the homepage.

**Hook angles:**
- "The vanity piece your dresser was missing" — aspirational lifestyle photography, no clinical claims needed (lowest complexity, easiest ad approval).
- Bundle with Product 1 as a "Varisia Vanity Ritual Set."
- Strong gifting SKU for Mother's Day / Eid / bridal showers in both markets.

**Sourcing & Supplier Sync:**
- Primary: **AliExpress** (home-décor category has the deepest catalog and most reliable AliExpress Standard Shipping lanes into Morocco/GCC).
- Sync via **AliExpress Dropshipping API (AE Open Platform)** for stock + auto price-sync so the storefront price never falls below the live supplier cost + margin floor.
- Because breakage risk exists (mirror/acrylic), pack a **local COD center** with padded-mailer SOP once volume justifies it — reduces damage-related returns which are the main margin killer for this SKU.

**Pricing Matrix:**

| | GCC (AED) | Morocco (MAD) | USD equiv. |
|---|---|---|---|
| Cost price | 60 AED | 165 MAD | ~$16 |
| Suggested retail price | 249 AED | 720 MAD | ~$68 |
| COD/3PL + payment handling (~12%) | 30 AED | 86 MAD | ~$8 |
| **Net profit per unit** | **159 AED (~64%)** | **469 MAD (~65%)** | **~$44** |

---

## Product 3 — Varisia Aura (Cordless Ionic Hot-Air Styling Brush)

**Category:** High-end lifestyle gadget / hair-care electronics

**Concept & high-converting description angle:**
> "Salon Blowout, Cordless." A rechargeable (USB-C) ionic hot-air styling brush — one-step dry + style, no cord, no clutter on the vanity. This is the highest-ticket item and the best fit for an "Extended 1-Year Warranty" upsell (battery/electronics anxiety = warranty conversion).

**Hook angles:**
- "No salon, no cord, no heat damage — 10-minute blowout at home."
- Travel angle: cordless = airport/hotel-friendly, strong for GCC's high-travel demographic.
- Pairs naturally with the Gift Packaging upsell for the premium-gifting positioning.

**Sourcing & Supplier Sync:**
- Primary: **CJ Dropshipping** (electronics QA is generally more consistent than raw AliExpress listings, important for a battery-containing item).
- Backup: **AliExpress** with a vetted supplier (4.8★+, 10k+ orders) kept synced as failover in the product-sync script.
- Because it's electronics with a battery, prioritize **local warehousing** early (GCC: Aramex forward stock; Morocco: bonded-warehouse import via a customs-cleared 3PL) to avoid customs delays/returns that are common with battery items shipped direct from China.

**Pricing Matrix:**

| | GCC (AED) | Morocco (MAD) | USD equiv. |
|---|---|---|---|
| Cost price | 130 AED | 350 MAD | ~$35 |
| Suggested retail price | 449 AED | 1290 MAD | ~$122 |
| COD/3PL + payment handling (~12%) | 54 AED | 155 MAD | ~$15 |
| **Net profit per unit** | **265 AED (~59%)** | **785 MAD (~61%)** | **~$72** |

---

## Cross-product automation note

All three products are wired into the same `/api/orders` pipeline (see `server.js`): the product/variant/price and any upsell selected on the landing page flow straight into the Google Sheet log and the 3PL webhook payload, so no manual re-entry is needed regardless of which of the three products (or bundle) the customer buys.
