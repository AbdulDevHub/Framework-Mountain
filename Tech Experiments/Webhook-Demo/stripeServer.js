const express = require("express");
const stripe = require("stripe");
require("dotenv").config();

const app = express();

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signatureHeader = req.headers["stripe-signature"];

  let event;

  try {
    // Stripe's SDK handles HMAC + timestamp verification for us
    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
    event = stripeClient.webhooks.constructEvent(
      req.body,
      signatureHeader,
      process.env.WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ Verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Verified Stripe event received!");
  console.log("  Type:", event.type);
  console.log("  ID:", event.id);

  res.status(200).send("OK");
});

app.listen(3000, () => console.log("Server listening on port 3000"));