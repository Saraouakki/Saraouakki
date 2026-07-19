/**
 * Varisia — Backend API (Node.js / Express)
 * Handles: OTP verification, order intake, Google Sheets logging,
 * 3PL fulfillment webhook, and order tracking status.
 *
 * Deployment target: Hostinger "Setup Node.js App" (hPanel).
 * See docs/DEPLOYMENT_GUIDE.md for full setup steps.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serves index.html, tracking.html, styles.css

const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const otpStore = new Map(); // phone -> { code, requestId, expiresAt, verified }

const STATUS_FLOW = ['Order Confirmed', 'Packaged', 'Handed to Courier', 'Out for Delivery', 'Delivered'];

/* ------------------------------------------------------------------ */
/* Local order store (flat JSON file — swap for a real DB when ready) */
/* ------------------------------------------------------------------ */

function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8') || '{}');
}

function writeOrders(orders) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `VAR-${date}-${rand}`;
}

/* ------------------------------------------------------------------ */
/* Automation Node 2 — Phone verification (Twilio Verify / WhatsApp)  */
/* ------------------------------------------------------------------ */

async function sendOtpViaTwilio(phone, code) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, TWILIO_WHATSAPP_FROM } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    // No Twilio credentials configured — mock mode for local/dev testing.
    console.log(`[MOCK OTP] Would send code ${code} to ${phone}`);
    return { mocked: true };
  }

  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  if (TWILIO_VERIFY_SERVICE_SID) {
    // Recommended: Twilio Verify API generates + sends + verifies the code for you.
    await twilio.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create({
      to: phone,
      channel: 'sms'
    });
    return { mocked: false, provider: 'twilio-verify' };
  }

  // Fallback: send our own code via WhatsApp Business API / SMS.
  await twilio.messages.create({
    from: TWILIO_WHATSAPP_FROM ? `whatsapp:${TWILIO_WHATSAPP_FROM}` : undefined,
    to: TWILIO_WHATSAPP_FROM ? `whatsapp:${phone}` : phone,
    body: `Your Varisia verification code is ${code}. It expires in 5 minutes.`
  });
  return { mocked: false, provider: 'twilio-sms-whatsapp' };
}

app.post('/api/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim().length < 8) {
      return res.status(400).json({ error: 'A valid phone number is required.' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const requestId = crypto.randomUUID();

    otpStore.set(phone, {
      code,
      requestId,
      expiresAt: Date.now() + OTP_TTL_MS,
      verified: false,
      attempts: 0
    });

    const result = await sendOtpViaTwilio(phone, code);

    res.json({
      requestId,
      message: 'Verification code sent.',
      // Only exposed outside production so you can test the flow without Twilio configured.
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
      mocked: result.mocked === true
    });
  } catch (err) {
    console.error('OTP send failed:', err);
    res.status(500).json({ error: 'Could not send verification code. Please try again.' });
  }
});

app.post('/api/otp/verify', (req, res) => {
  const { phone, code, requestId } = req.body;
  const entry = otpStore.get(phone);

  if (!entry || entry.requestId !== requestId) {
    return res.status(400).json({ error: 'No verification request found for this phone number.' });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(phone);
    return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
  }
  if (entry.code !== String(code)) {
    return res.status(400).json({ error: 'Incorrect code. Please try again.' });
  }

  entry.verified = true;
  res.json({ verified: true });
});

function isPhoneVerified(phone, requestId) {
  const entry = otpStore.get(phone);
  return Boolean(entry && entry.verified && entry.requestId === requestId && Date.now() <= entry.expiresAt);
}

/* ------------------------------------------------------------------ */
/* Automation Node 1 — Google Sheets order log                       */
/* ------------------------------------------------------------------ */

async function appendOrderToSheet(order) {
  const { GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

  if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.log('[MOCK SHEETS] Google Sheets credentials not configured — skipping sync for order', order.orderId);
    return { synced: false };
  }

  const { google } = require('googleapis');
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range: 'Orders!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        order.orderId,
        order.createdAt,
        order.fullName,
        order.phone,
        order.productName,
        order.variant,
        order.total,
        order.upsells.join(', '),
        order.status
      ]]
    }
  });

  return { synced: true };
}

/* ------------------------------------------------------------------ */
/* Automation Node 3 — 3PL fulfillment webhook                       */
/* ------------------------------------------------------------------ */

async function forwardToFulfillment(order) {
  const { THREEPL_WEBHOOK_URL, THREEPL_API_KEY } = process.env;

  if (!THREEPL_WEBHOOK_URL) {
    console.log('[MOCK 3PL] No fulfillment webhook configured — skipping push for order', order.orderId);
    return { forwarded: false };
  }

  const res = await fetch(THREEPL_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(THREEPL_API_KEY ? { Authorization: `Bearer ${THREEPL_API_KEY}` } : {})
    },
    body: JSON.stringify({
      order_id: order.orderId,
      customer_name: order.fullName,
      phone: order.phone,
      address: order.address,
      country: order.country,
      sku: order.productId,
      variant: order.variant,
      cod_amount: order.total,
      upsells: order.upsells
    })
  });

  return { forwarded: res.ok };
}

/* ------------------------------------------------------------------ */
/* Order intake                                                       */
/* ------------------------------------------------------------------ */

app.post('/api/orders', async (req, res) => {
  try {
    const {
      fullName, phone, country, address,
      productId, productName, variant,
      price, upsells, total, otpRequestId
    } = req.body;

    if (!fullName || !phone || !address || !productId) {
      return res.status(400).json({ error: 'Missing required order fields.' });
    }
    if (!isPhoneVerified(phone, otpRequestId)) {
      return res.status(403).json({ error: 'Phone number is not verified. Please complete OTP verification first.' });
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const order = {
      orderId,
      createdAt: now,
      fullName,
      phone,
      country: country || '',
      address,
      productId,
      productName: productName || productId,
      variant: variant || 'Standard',
      price: Number(price) || 0,
      upsells: Array.isArray(upsells) ? upsells : [],
      total: Number(total) || Number(price) || 0,
      status: STATUS_FLOW[0],
      history: { [STATUS_FLOW[0]]: now }
    };

    const orders = readOrders();
    orders[orderId] = order;
    writeOrders(orders);

    // Fire automations — logged but non-blocking for the customer response.
    const [sheetResult, fulfillmentResult] = await Promise.allSettled([
      appendOrderToSheet(order),
      forwardToFulfillment(order)
    ]);

    if (sheetResult.status === 'rejected') console.error('Google Sheets sync failed:', sheetResult.reason);
    if (fulfillmentResult.status === 'rejected') console.error('3PL forwarding failed:', fulfillmentResult.reason);

    otpStore.delete(phone);

    res.status(201).json({ orderId, status: order.status });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Could not place your order. Please try again.' });
  }
});

/* ------------------------------------------------------------------ */
/* Automation Node 4 — Real-time tracking                              */
/* ------------------------------------------------------------------ */

app.get('/api/orders/:orderId/tracking', (req, res) => {
  const orders = readOrders();
  const order = orders[req.params.orderId];
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  res.json({
    orderId: order.orderId,
    productName: order.productName,
    variant: order.variant,
    currentStatus: order.status,
    statusFlow: STATUS_FLOW,
    history: order.history
  });
});

// Advances an order's status — call this from your 3PL's status webhook, or manually for testing.
app.post('/api/orders/:orderId/status', (req, res) => {
  const { status } = req.body;
  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUS_FLOW.join(', ')}` });
  }

  const orders = readOrders();
  const order = orders[req.params.orderId];
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.status = status;
  order.history[status] = new Date().toISOString();
  writeOrders(orders);

  res.json({ orderId: order.orderId, status: order.status });
});

app.listen(PORT, () => {
  console.log(`Varisia backend running on port ${PORT}`);
});
