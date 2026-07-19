# Varisia — Hostinger Deployment Guide

This guide gets the full stack (`index.html`, `tracking.html`, `styles.css`, `server.js`) live on Hostinger. Because `server.js` needs to run (it's not static), you'll use Hostinger's **"Setup Node.js App"** panel — which uses the same File Manager upload flow you're used to, just with one extra step to point Hostinger at `server.js` as the entry file. This sidesteps the Git-repository requirement entirely: no Git, no CLI, no SSH needed.

> If your Hostinger plan doesn't show "Setup Node.js App" (it's available on Premium/Business/Cloud shared hosting and above), skip to **Option B** at the bottom for a static-only fallback.

---

## Option A — Node.js App via hPanel (recommended, full automation stack)

### Step 1 — Log in and open the Node.js App manager
1. Log in to Hostinger → **hPanel**.
2. Go to **Advanced → Node.js** (sometimes listed as "Setup Node.js App").
3. Click **Create Application**.
4. Set:
   - **Node.js version:** 18.x or later
   - **Application root:** e.g. `varisia` (this becomes a folder under your account)
   - **Application URL:** your domain or subdomain (e.g. `varisia.com` or a subdomain)
   - **Application startup file:** `server.js`
5. Click **Create**. Hostinger provisions the app and shows you the **application root path** (e.g. `/home/USERNAME/varisia`) — note it down.

### Step 2 — Upload the files via File Manager
1. Go to **Files → File Manager**.
2. Navigate to the application root path from Step 1.
3. Upload these files/folders directly into that root (drag-and-drop or the Upload button):
   - `index.html`
   - `tracking.html`
   - `styles.css`
   - `server.js`
   - `package.json`
   - `.env.example` (optional — for reference only, don't rely on it in production)
4. Do **not** upload `node_modules` — you'll install dependencies from the Node.js panel in Step 3.

### Step 3 — Install dependencies
1. Back in **Advanced → Node.js**, open your application.
2. Click **Run NPM Install** (this reads `package.json` and installs `express`, `cors`, `dotenv`, `googleapis`, `twilio`).
3. Wait for it to finish (a few seconds to a minute).

### Step 4 — Set environment variables
1. In the same Node.js app screen, find **Environment Variables**.
2. Add each variable from `.env.example`, filled in with real values:
   - `PORT` → leave as the value Hostinger assigns (it usually manages this automatically; if it lets you set it, use `3000`)
   - `NODE_ENV` → `production`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (see Twilio setup below)
   - `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (see Google Sheets setup below)
   - `THREEPL_WEBHOOK_URL`, `THREEPL_API_KEY` (from your 3PL/COD partner)
3. Click **Save**.

### Step 5 — Start the application
1. Click **Restart** (or **Start**) on the Node.js app.
2. Visit your domain — the Varisia landing page should load, served directly by `server.js` (it serves the static HTML/CSS itself via `express.static`).

**Total time: under 5 minutes** once you have the files ready.

---

## Option B — Static-only fallback (no Node.js panel available)

If your Hostinger plan is static-only:
1. Upload `index.html`, `tracking.html`, and `styles.css` to `public_html/` via File Manager. Your landing page and checkout **UI** will work immediately.
2. Host `server.js` separately on a Node-capable platform (Render, Railway, Fly.io — all have free tiers) and point the frontend's `fetch()` calls in `index.html`/`tracking.html` at that backend's URL instead of relative `/api/...` paths.
3. Everything else in this guide (Twilio, Google Sheets, 3PL) applies identically to that separately hosted backend.

---

## Setting up the automation integrations

### Twilio (OTP verification via SMS/WhatsApp)
1. Create a free Twilio account at twilio.com.
2. Under **Verify → Services**, create a new Verify Service — copy its **Service SID** into `TWILIO_VERIFY_SERVICE_SID`.
3. Copy your **Account SID** and **Auth Token** from the Twilio Console dashboard into `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
4. (Optional, for WhatsApp instead of SMS) Join the Twilio WhatsApp Sandbox or apply for a WhatsApp Business sender, then set `TWILIO_WHATSAPP_FROM`.
5. Without any of this configured, `/api/otp/send` runs in **mock mode**: it logs the 6-digit code to the server console and returns it in the API response (only when `NODE_ENV` isn't `production`) so you can test the full checkout flow before wiring up Twilio.

### Google Sheets (order log)
1. In Google Cloud Console, create a project → enable the **Google Sheets API**.
2. Create a **Service Account**, then generate a JSON key for it.
3. From the JSON: copy `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `private_key` → `GOOGLE_PRIVATE_KEY` (keep the `\n` characters as literal text — the code un-escapes them at runtime).
4. Create your master Google Sheet, name a tab **Orders**, and add this header row in `A1:I1`:
   `Order ID | Date | Client Name | Verified Phone | Product | Variant | Price | Upsell Item | Order Status`
5. Share the sheet with the service account's email (from step 3) with **Editor** access.
6. Copy the Sheet ID from its URL (`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`) into `GOOGLE_SHEETS_ID`.

### 3PL / Fulfillment webhook
1. Get the webhook URL and API key from your chosen 3PL/COD partner (e.g. their order-intake API endpoint).
2. Set `THREEPL_WEBHOOK_URL` and `THREEPL_API_KEY`.
3. `server.js` POSTs a JSON payload (customer, address, SKU, COD amount) to that URL the moment an order is confirmed — see the `forwardToFulfillment()` function if your 3PL expects a different payload shape; adjust the field names there to match their API docs.
4. If your 3PL sends status updates back (e.g. "Handed to Courier"), point their outbound webhook at `POST /api/orders/:orderId/status` with `{ "status": "Handed to Courier" }` to keep the tracking page live.

---

## Testing checklist before going live
- [ ] Load the domain — landing page renders with the nude/beige + black theme.
- [ ] Select a product → checkout section auto-fills name, price, variants.
- [ ] Toggle both upsells → total updates correctly.
- [ ] Enter a real phone number → click **Verify** → receive the code (or read it from server logs in mock mode) → enter it → status turns "Verified".
- [ ] Submit the order → confirmation screen shows an Order ID.
- [ ] Open `tracking.html?order=<that ID>` → see the "Order Confirmed" step highlighted.
- [ ] Check the Google Sheet — a new row appears (once credentials are configured).
- [ ] Check your 3PL dashboard/logs — the order was received (once webhook is configured).
