const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Replace these with your authorized server IPs and tokens
const validIPs = ['123.123.123.123'];
const validTokens = ['ABC123-XYZ999'];

app.get('/license-check', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const token = req.query.token;

  const authorized = validIPs.includes(ip) && validTokens.includes(token);

  res.json({
    authorized: authorized,
    ip: ip,
    reason: authorized ? "Authorized" : "Unauthorized"
  });
});

app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
});