
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins for admin panel use
app.set('trust proxy', true);
app.use(express.json());

const validIPs = ['148.113.198.45','24.118.34.198];
const validTokens = ['867744-340702'];
const requiredVersion = '1.0.0';

const webhookUrl = "https://discord.com/api/webhooks/1417704272145158215/uQS3squYA4lWm3b52zc0pkWvo9qbDMhCEK4vQeWZsLjUGtFtvCZJQAYUjHhjCqPFyazz";
const adminApiKey = "supersecretadminkey";

function sendWebhook(message) {
  if (!webhookUrl) return;
  axios.post(webhookUrl, { content: message })
    .then(() => console.log("[Webhook] ✅ Sent to Discord."))
    .catch(err => {
      console.error("[Webhook Error] ❌", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
      }
    });
}

const killSwitch = {
  "0.0.0.0": "Violation of terms",
  "0-0": "Payment revoked"
};

app.get('/license-check', (req, res) => {
  const ip = req.ip;
  const token = req.query.token;
  const version = req.query.version;

  let authorized = true;
  let reason = "Authorized";

  if (killSwitch[ip] || killSwitch[token]) {
    authorized = false;
    reason = "KILL_SWITCH_ACTIVATED: " + (killSwitch[ip] || killSwitch[token]);
  } else if (!validIPs.includes(ip)) {
    authorized = false;
    reason = "IP_NOT_WHITELISTED";
  } else if (!validTokens.includes(token)) {
    authorized = false;
    reason = "INVALID_TOKEN";
  } else if (version !== requiredVersion) {
    authorized = false;
    reason = "VERSION_MISMATCH";
  }

  const logMessage = `[LICENSE CHECK] IP: ${ip}, Version: ${version}, Authorized: ${authorized}, Reason: ${reason}`;
  console.log(logMessage);
  sendWebhook(logMessage);

  res.json({
    authorized: authorized,
    ip: ip,
    reason: reason,
    requiredVersion: requiredVersion
  });
});

app.post('/admin/update', (req, res) => {
  const { apiKey, type, action, value, reason } = req.body;

  if (apiKey !== adminApiKey) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (type === 'ip') {
    if (action === 'add' && !validIPs.includes(value)) validIPs.push(value);
    if (action === 'remove') validIPs.splice(validIPs.indexOf(value), 1);
  } else if (type === 'token') {
    if (action === 'add' && !validTokens.includes(value)) validTokens.push(value);
    if (action === 'remove') validTokens.splice(validTokens.indexOf(value), 1);
  } else if (type === 'kill') {
    if (action === 'add') killSwitch[value] = reason || "No reason provided";
    if (action === 'remove') delete killSwitch[value];
  } else {
    return res.status(400).json({ message: "Invalid type" });
  }

  sendWebhook(`[ADMIN UPDATE] Type: ${type}, Action: ${action}, Value: ${value}, Reason: ${reason || 'N/A'}`);

  res.json({
    message: "Update successful",
    current: { validIPs, validTokens, killSwitch }
  });
});

app.listen(PORT, () => {
  console.log(`DadBods License Server running on port ${PORT}`);
});
