# Webhook Demo

A learning project that demonstrates how to receive and verify webhooks using HMAC-SHA256 signature verification — the pattern used by Stripe, GitHub, and most production webhook systems.

---

## What is a Webhook?

Normally your code calls an external server to ask for data. A webhook flips this — the external server calls *you* when something happens (e.g. a payment completes, a PR is merged).

The problem: how do you know the request is actually from Stripe and not an attacker who found your endpoint URL?

**The solution: HMAC-SHA256 signature verification.**

---

## How Signature Verification Works

```
Stripe signs the request body with a shared secret key
    ↓
Stripe sends: the body + the signature in a header
    ↓
Your server recomputes the signature using the same secret
    ↓
Signatures match → request is legitimate
Signatures don't match → reject with 401
```

An attacker can POST fake data to your endpoint, but they cannot forge the signature without the secret key.

---

## Project Structure

```
webhook-demo/
├── server.js          # Vanilla HMAC implementation (GitHub-style)
├── stripeServer.js    # Stripe SDK implementation (production-style)
├── send-test.js       # Script to simulate a signed webhook POST
├── .env               # Secret keys (never commit this)
└── .gitignore         # Ensures .env is excluded from git
```

---

## Key Concepts

### Why Raw Body?
The server must read the **raw, unparsed** request body before verifying the signature. If Express parses the JSON first, it may alter whitespace or encoding — even slightly — which breaks the HMAC comparison. Always use `express.raw()` on webhook endpoints, not `express.json()`.

### Why `timingSafeEqual`?
Regular string comparison (`===`) short-circuits the moment it finds a mismatch. An attacker can measure these tiny timing differences to guess your signature one character at a time. `crypto.timingSafeEqual` always takes the same amount of time regardless of where the mismatch is.

### Why Environment Variables?
The secret key is what makes signatures trustworthy. If it leaks to GitHub, attackers can sign their own fake payloads and your server will accept them. Secrets live in `.env`, which is excluded from version control via `.gitignore`.

### Why Timestamps? (Stripe-specific)
A bare HMAC prevents forgery but not **replay attacks** — where an attacker captures a valid request and re-sends it later. Stripe includes a timestamp in the signature and rejects requests older than 5 minutes. The Stripe SDK handles this automatically in `webhooks.constructEvent()`.

---

## Setup

```bash
npm install
```

Create a `.env` file:

```
WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

---

## Running the Vanilla Version (server.js)

Simulates GitHub-style HMAC verification without any SDK.

**Terminal 1 — start the server:**
```bash
node server.js
```

**Terminal 2 — send a valid test webhook:**
```bash
node send-test.js
```

To test rejection, change the `SECRET` in `send-test.js` to a wrong value and run again. You'll see a 401 and a signature mismatch in the logs.

---

## Running the Stripe Version (stripeServer.js)

Uses the Stripe CLI to forward real Stripe events to your local server.

**Terminal 1 — start the server:**
```bash
node stripeServer.js
```

**Terminal 2 — start the Stripe CLI forwarder:**
```bash
stripe listen --forward-to localhost:3000/webhook
```

Copy the `whsec_...` secret printed by the CLI and add it to your `.env` as `WEBHOOK_SECRET`.

**Terminal 3 — trigger a test event:**
```bash
stripe trigger payment_intent.succeeded
```

You'll see the server receive and verify multiple cascading events (charge.succeeded, payment_intent.created, payment_intent.succeeded, charge.updated) — this mirrors real Stripe behaviour.

---

## What Good Verification Looks Like in Logs

**Terminal 2 (Stripe CLI):**
```
--> payment_intent.succeeded [evt_abc123]
<-- [200] POST http://localhost:3000/webhook [evt_abc123]
```

**Terminal 1 (your server):**
```
✅ Verified Stripe event received!
  Type: payment_intent.succeeded
  ID: evt_abc123
```

---

## Why This Pattern Appears in Take-Home Interviews

Webhook verification touches several concepts interviewers care about:

- Understanding of HMAC and shared-secret cryptography
- Knowing why raw body matters (and what breaks without it)
- Awareness of timing attacks and how to prevent them
- Replay attack prevention
- Secrets management via environment variables

---

## Dependencies

- [express](https://expressjs.com/) — HTTP server
- [stripe](https://www.npmjs.com/package/stripe) — Stripe SDK (used for `webhooks.constructEvent`)
- [dotenv](https://www.npmjs.com/package/dotenv) — loads `.env` into `process.env`
- Node built-in `crypto` — HMAC-SHA256 (no install needed)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) — local webhook forwarding