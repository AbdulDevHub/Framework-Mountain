const express = require("express");
const crypto = require("crypto"); // built into Node — no install needed

const app = express();

// Your shared secret — in real life this comes from process.env.WEBHOOK_SECRET
const SECRET = "my_super_secret_key";

// IMPORTANT: use express.raw() not express.json()
// This gives us the original bytes so our HMAC matches
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signatureHeader = req.headers["x-hub-signature-256"];

  if (!signatureHeader) {
    console.log("❌ Rejected: no signature header");
    return res.status(401).send("Missing signature");
  }

  // Recompute the HMAC using the raw body + our secret
  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", SECRET).update(req.body).digest("hex");

  // Safe comparison — prevents timing attacks (more on this below)
  const trusted = Buffer.from(expectedSignature);
  const received = Buffer.from(signatureHeader);

  const isValid =
    trusted.length === received.length &&
    crypto.timingSafeEqual(trusted, received);

  if (!isValid) {
    console.log("❌ Rejected: signature mismatch");
    console.log("  Expected:", expectedSignature);
    console.log("  Received:", signatureHeader);
    return res.status(401).send("Invalid signature");
  }

  // Signature checks out — safe to trust the payload
  const payload = JSON.parse(req.body.toString());
  console.log("✅ Verified webhook received!");
  console.log("  Event:", payload.event);
  console.log("  Data:", payload.data);

  res.status(200).send("OK");
});

app.listen(3000, () => console.log("Server listening on port 3000"));