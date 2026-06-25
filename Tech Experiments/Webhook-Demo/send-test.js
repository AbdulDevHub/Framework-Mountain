const crypto = require("crypto");
const http = require("http");

const SECRET = "my_super_secret_key";

const payload = JSON.stringify({
  event: "payment.completed",
  data: { amount: 9900, currency: "usd", customer: "cust_abc123" },
});

// This is exactly what Stripe/GitHub do before sending
const signature =
  "sha256=" +
  crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

console.log("Sending payload:", payload);
console.log("With signature:", signature);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/webhook",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hub-signature-256": signature,      // GitHub's header name
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  console.log("\nServer responded:", res.statusCode);
  res.on("data", (d) => process.stdout.write(d));
});

req.on("error", (e) => console.error("Error:", e.message));
req.write(payload);
req.end();