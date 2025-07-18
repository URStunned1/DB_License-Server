const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true); // Handle Render proxy correctly

const validIPs = ['24.118.34.198'];         // Whitelisted server IPs
const validTokens = ['867744-340702'];      // Valid license tokens
const requiredVersion = '1.0.0';            // Minimum allowed version

app.get('/license-check', (req, res) => {
  const ip = req.ip;
  const token = req.query.token;
  const version = req.query.version;

  let authorized = true;
  let reason = "Authorized";

  if (!validIPs.includes(ip)) {
    authorized = false;
    reason = "IP_NOT_WHITELISTED";
  } else if (!validTokens.includes(token)) {
    authorized = false;
    reason = "INVALID_TOKEN";
  } else if (version !== requiredVersion) {
    authorized = false;
    reason = "VERSION_MISMATCH";
  }

  console.log(`[LICENSE CHECK] IP: ${ip}, Token: ${token}, Version: ${version}, Authorized: ${authorized}, Reason: ${reason}`);

  res.json({
    authorized: authorized,
    ip: ip,
    reason: reason,
    requiredVersion: requiredVersion
  });
});

app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
});
