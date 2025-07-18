const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);

const validIPs = ['24.118.34.198'];
const validTokens = ['867744-340702'];
const requiredVersion = '1.0.0';

const webhookUrl = "https://discord.com/api/webhooks/1395621201837297664/37tnIEQ8NJR8kgSKcOwfe_qDYR_GAb8tSYLv88qZR6zV-09Wj96wPZiiGx2dRJmx3LGs";

function sendWebhook(message) {
  axios.post(webhookUrl, { content: message })
    .then(() => console.log("[Webhook] Sent to Discord."))
    .catch(err => console.error("[Webhook Error]", err.message));
}

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

  const logMessage = `[LICENSE CHECK] IP: ${ip}, Token: ${token}, Version: ${version}, Authorized: ${authorized}, Reason: ${reason}`;
  console.log(logMessage);
  sendWebhook(logMessage);

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
