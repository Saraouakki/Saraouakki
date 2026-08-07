# Legal pages — pre-publication checklist

`privacy.html` and `terms.html` are **starter drafts**. They accurately describe how Varisia
works today, but they have not been reviewed by a lawyer and are not tuned to the specific
laws of the seven countries we ship to.

Both pages currently carry a black **"Internal draft — not yet reviewed"** banner at the top.
That banner is deliberate: while it is there, a visitor knows the page is provisional.
**Delete both banners only once the steps below are done.**

---

## Step 1 — Fill in the placeholders (you can do this yourself)

27 blanks are marked `[LIKE THIS]`. Find them all with:

```bash
grep -n "\[[A-Z]" privacy.html terms.html
```

### `privacy.html` (10)

| Placeholder | What to put |
|---|---|
| `[DATE YOU PUBLISH THIS]` | The date you actually publish |
| `[YOUR REGISTERED BUSINESS OR TRADING NAME]` | The legal entity behind Varisia |
| `[YOUR REGISTERED BUSINESS ADDRESS]` | A real physical address |
| `[COMPANY / COMMERCIAL REGISTER NUMBER, IF YOU HAVE ONE]` | Registration number, or delete the clause |
| `[NAME YOUR COURIERS…]` | Your actual delivery partners |
| `[NAME THEM]` | Your actual fulfilment/supplier partners |
| `[YOUR HOSTING PROVIDER]` | e.g. Hostinger |
| `[NUMBER]` (retention) | How many months you keep order records |
| `[NUMBER]` (response time) | Days to answer a data request |
| `[LIST THE RELEVANT AUTHORITY…]` | The data-protection regulator per country |

### `terms.html` (17)

Business identity (3), VAT/tax treatment, delivery fee, who pays customs duty,
delivery window (2), failed-delivery attempts, return window (2), who pays return
shipping, refund method, refund deadline, support response window, and governing
law/jurisdiction (2).

---

## Step 2 — Get professional review (do not skip)

18 sections are marked with a gold **"Have this reviewed"** callout. Ranked by how much
trouble getting them wrong causes:

### Highest priority

1. **Cross-border data transfer** (privacy §6). Morocco, the UAE, and Saudi Arabia each have
   their own data-protection regime, and some require registration or notification with a
   national authority *before* you process customer data or send it abroad. This is the single
   item most worth paying for advice on.
2. **Returns and refunds** (terms §9). Minimum return and refund rights are set by law and
   cannot be shortened by our terms — a policy offering less than the statutory minimum is
   unenforceable. Also settle *how* a cash refund physically reaches a COD customer.
3. **Business identity** (privacy §1, terms §1). A brand name plus a Gmail address is generally
   not a sufficient seller identity, and in some places an incomplete identity affects whether
   the terms bind at all.
4. **Extended warranty add-on** (terms §10). We charge for it but never say what it covers.
   A paid promise to repair or replace over time can count as a regulated insurance or
   service-contract product. **Consider disabling this upsell until reviewed** — it is the one
   item on the site currently taking money for an undefined promise.
5. **Governing law** (terms §16). Consumer law usually gives buyers their home courts
   regardless of what we write, so one named jurisdiction across seven countries will not do
   what it appears to.

### Also review

6. Pricing, VAT, and customs duty (terms §5) — see the engineering fix below.
7. Liability limits and product-liability exposure for battery-powered electronics (terms §14).
8. Data retention period, and tax record-keeping minimums (privacy §7).
9. Data-processing agreements with Twilio, Google, the host, couriers, and any supplier who
   receives customer addresses (privacy §5).
10. The rights list and response deadline per country (privacy §9).
11. Refused-delivery fees — do not add one without advice (terms §8).
12. SMS/WhatsApp marketing consent, before sending any promotional message (privacy §4).
13. Cookie/consent banner requirements (privacy §10), and minimum age (privacy §11).
14. Breach-notification deadlines per country (privacy §8).
15. Realistic delivery windows, especially if stock ships from overseas (terms §7).

---

## Step 3 — Engineering work these pages imply

The drafts describe some things the system does not yet do. Where a page states a practice we
do not follow, that is worse than having no page — it is a written commitment we are visibly
breaking. Close these before or shortly after publishing:

- [ ] **Show prices in the currency the courier collects.** The storefront lists USD
      (`$95`, `$68`, `$122`) while we collect AED/SAR/MAD in cash. Customers must see the exact
      amount they will be asked to pay, before they order.
- [ ] **Implement the retention period.** Nothing currently deletes anything. Whatever number
      goes in privacy §7 needs a routine that enforces it in *both* `data/orders.json` and the
      Google Sheet.
- [ ] **Support deletion requests.** There is no way to remove one customer's record today.
- [ ] **Protect the tracking page.** `/api/orders/:orderId/tracking` returns an order's product
      and status to anyone with the ID and no second check. Consider also requiring the last
      digits of the phone number.
- [ ] **Order data is stored in plaintext** in `data/orders.json`. It is already git-ignored,
      but confirm on the live server that it sits outside the web root and is not world-readable —
      `server.js` currently serves the project directory statically.
- [ ] **Define the extended warranty** in terms §10, or remove the upsell.

---

## Step 4 — Keep them true

The pages are only an asset while they match reality. Re-check them whenever you:

- add analytics or an ad pixel (Meta, TikTok, Google) — privacy §3 and §10 both become false,
  and you will likely need a consent banner;
- change courier, supplier, or host — privacy §5 lists recipients;
- start sending marketing messages — privacy §4;
- add online card payment — privacy §3 and terms §6 both say we never take card details;
- ship to a new country — nearly every review flag is country-specific.

Update the "Last updated" date at the top of the page whenever you change either one.
