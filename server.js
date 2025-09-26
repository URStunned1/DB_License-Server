const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('trust proxy', true);
app.use(express.json());

const validIPs = ['148.113.198.45', '24.118.34.198'];
const validTokens = ['867744-340702'];
const requiredVersion = '1.2.3';
const webhookUrl = "https://discord.com/api/webhooks/1417704272145158215/uQS3squYA4lWm3b52zc0pkWvo9qbDMhCEK4vQeWZsLjUGtFtvCZJQAYUjHhjCqPFyazz";
const adminApiKey = "supersecretadminkey";

const killSwitch = {
  "0.0.0.0": "Violation of terms",
  "0-0": "Payment revoked"
};

// ✉️ Send a webhook embed to Discord
function sendWebhookEmbed(title, color, fields) {
  if (!webhookUrl) return;

  const embed = {
    embeds: [{
      title: title,
      color: color,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: "DadBods License Server"
      }
    }]
  };

  axios.post(webhookUrl, embed)
    .then(() => console.log("[Webhook] ✅ Sent to Discord."))
    .catch(err => {
      console.error("[Webhook Error] ❌", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
      }
    });
}

// 🛡️ License Check Endpoint
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

  const fields = [
    { name: "IP Address", value: ip, inline: true },
    { name: "Token", value: token || "None", inline: true },
    { name: "Version", value: version || "Unknown", inline: true },
    { name: "Status", value: authorized ? "✅ AUTHORIZED" : "❌ UNAUTHORIZED", inline: true },
    { name: "Reason", value: reason }
  ];

  sendWebhookEmbed("🔐 License Check", authorized ? 0x00cc66 : 0xff0000, fields);
  console.log(`[LICENSE CHECK] IP: ${ip}, Version: ${version}, Authorized: ${authorized}, Reason: ${reason}`);

  res.json({
    authorized: authorized,
    ip: ip,
    reason: reason,
    requiredVersion: requiredVersion
  });
});

// ⚙️ Admin Panel Endpoint
app.post('/admin/update', (req, res) => {
  const { apiKey, type, action, value, reason } = req.body;

  if (apiKey !== adminApiKey) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  let updateMsg = "";

  if (type === 'ip') {
    if (action === 'add' && !validIPs.includes(value)) {
      validIPs.push(value);
      updateMsg = `✅ IP Added: ${value}`;
    } else if (action === 'remove') {
      validIPs.splice(validIPs.indexOf(value), 1);
      updateMsg = `🗑️ IP Removed: ${value}`;
    }
  } else if (type === 'token') {
    if (action === 'add' && !validTokens.includes(value)) {
      validTokens.push(value);
      updateMsg = `✅ Token Added: ${value}`;
    } else if (action === 'remove') {
      validTokens.splice(validTokens.indexOf(value), 1);
      updateMsg = `🗑️ Token Removed: ${value}`;
    }
  } else if (type === 'kill') {
    if (action === 'add') {
      killSwitch[value] = reason || "No reason provided";
      updateMsg = `💀 Kill Switch Added: ${value} (${reason || 'No reason'})`;
    } else if (action === 'remove') {
      delete killSwitch[value];
      updateMsg = `🧼 Kill Switch Removed: ${value}`;
    }
  } else {
    return res.status(400).json({ message: "Invalid type" });
  }

  const fields = [
    { name: "Type", value: type, inline: true },
    { name: "Action", value: action, inline: true },
    { name: "Value", value: value || "N/A", inline: true },
    { name: "Reason", value: reason || "N/A" }
  ];

  sendWebhookEmbed("⚙️ Admin Update", 0x3399ff, fields);
  console.log(`[ADMIN] ${updateMsg}`);

  res.json({
    message: "Update successful",
    current: { validIPs, validTokens, killSwitch }
  });
});

// 🌐 Start Server
app.listen(PORT, () => {
  console.log(`🚀 DadBods License Server running on port ${PORT}`);
});
