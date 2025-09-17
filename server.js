
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins for admin panel use
app.set('trust proxy', true);
app.use(express.json());

const validIPs = ['148.113.198.45'];
const validTokens = ['867744-340702'];
const requiredVersion = '1.0.0';

const webhookUrl = "https://discord.com/api/webhooks/1417704272145158215/uQS3squYA4lWm3b52zc0pkWvo9qbDMhCEK4vQeWZsLjUGtFtvCZJQAYUjHhjCqPFyazz";
const adminApiKey = "supersecretadminkey";

function sendWebhook(message) {
  axios.post(webhookUrl, { content: message })
    .then(() => console.log("[Webhook] Sent to Discord."))
    .catch(err => console.error("[Webhook Error]", err.message));
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

app.post('/admin/update', (req, res) => {
  const { apiKey, type, action, value, reason } = req.body;

  if (apiKey !== adminApiKey) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (type === 'ip') {
    if (action === 'add') {
      if (!validIPs.includes(value)) validIPs.push(value);
    } else if (action === 'remove') {
      const index = validIPs.indexOf(value);
      if (index > -1) validIPs.splice(index, 1);
    }
  } else if (type === 'token') {
    if (action === 'add') {
      if (!validTokens.includes(value)) validTokens.push(value);
    } else if (action === 'remove') {
      const index = validTokens.indexOf(value);
      if (index > -1) validTokens.splice(index, 1);
    }
  } else if (type === 'kill') {
    if (action === 'add') {
      killSwitch[value] = reason || "No reason provided";
    } else if (action === 'remove') {
      delete killSwitch[value];
    }
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
