# Varisia

Luxury e-commerce brand for the GCC and Morocco — smart beauty electronics and minimalist lifestyle pieces, sold via Cash on Delivery with automated order handling.

- Official email: **varisia.shop@gmail.com**
- Theme: Nude/Beige (`#F5E6D3`) + Black (`#000000`), minimalist and premium.

## What's in this repo

| File | Purpose |
|---|---|
| `index.html` | Landing page, product collection, 1-page checkout, OTP verification, inline upsell widget |
| `tracking.html` | Customer-facing order tracking page |
| `privacy.html` | Privacy policy — **starter draft, pending legal review** |
| `terms.html` | Terms of service — **starter draft, pending legal review** |
| `styles.css` | Varisia luxury theme (colors, typography, components) |
| `server.js` | Express backend: OTP, order intake, Google Sheets sync, 3PL webhook, tracking API |
| `package.json` | Backend dependencies |
| `.env.example` | Environment variable template (Twilio, Google Sheets, 3PL) |
| `docs/PRODUCT_RESEARCH.md` | 3 curated high-ticket products with sourcing strategy and pricing matrix |
| `docs/LEGAL_REVIEW_CHECKLIST.md` | What to fill in and have reviewed before publishing the legal pages |
| `docs/DEPLOYMENT_GUIDE.md` | Step-by-step Hostinger deployment (Node.js App via hPanel) |

## Quick start (local)

```bash
npm install
cp .env.example .env   # fill in Twilio / Google Sheets / 3PL credentials, or leave blank for mock mode
npm start
```

Then open `http://localhost:3000`.

## Deploying

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for the full Hostinger walkthrough.

## Product research

See [`docs/PRODUCT_RESEARCH.md`](docs/PRODUCT_RESEARCH.md) for the 3 curated products, supplier sync strategy, and pricing/margin breakdown.
