const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const validIPs = [24.118.34.198]; // Update with your real IP
const validTokens = ['ABC123-XYZ999'];

app.get('/license-check', (req, res) => {
  const ipList = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',');
  const ip = ipList[0].trim();
  const token = req.query.token;

  const authorized = validIPs.includes(ip) && validTokens.includes(token);

  console.log(`[LICENSE CHECK] IP: ${ip}, Token: ${token}, Authorized: ${authorized}`);

  res.json({
    authorized: authorized,
    ip: ipList.join(', '),
    reason: authorized ? "Authorized" : "Unauthorized"
  });
});

app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
});
