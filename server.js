const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('trust proxy', true);
app.use(express.json());

// Whitelist settings
const validIPs = ['148.113.198.45', '24.118.34.198'];
const validTokens = ['867744-340702'];
const requiredVersion = '1.2.3';

// Webhook config
const webhookUrl = "https://discord.com/api/webhooks/1417704272145158215/uQS3squYA4lWm3b52zc0pkWvo9qbDMhCEK4vQeWZsLjUGtFtvCZJQAYUjHhjCqPFyazz";
const adminApiKey = "supersecretadminkey";

// Kill switch table
const killSwitch = {
  "0.0.0.0": "Violation of terms",
  "0-0": "Payment revoked"
};

// Send Discord embed
function sendDiscordEmbed(embed) {
  if (!webhookUrl) return;
  axios.post(webhookUrl, { embeds: [embed] })
    .then(() => console.log("[Webhook] ✅ Sent to Discord"))
    .catch(err => {
      console.error("[Webhook Error]", err.message);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
      }
    });
}

app.get('/license-check', (req, res) => {
  const ip = req.ip || "UNKNOWN";
  const token = req.query.token || "undefined";
  const version = req.query.version || "undefined";

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

  const embed = {
    title: "🔐 License Check",
    color: authorized ? 0x00cc66 : 0xcc0000,
    fields: [
      { name: "IP Address", value: ip, inline: true },
      { name: "Token", value: `\`${token}\``, inline: true },
      { name: "Version", value: version, inline: true },
      { name: "Status", value: authorized ? "✅ AUTHORIZED" : "❌ UNAUTHORIZED", inline: true }
    ],
    footer: {
      text: "DadBods License Server"
    },
    timestamp: new Date().toISOString()
  };

  if (!authorized) {
    embed.fields.push({ name: "Reason", value: reason });
  }

  sendDiscordEmbed(embed);

  res.json({
    authorized: authorized,
    ip: ip,
    reason: authorized ? undefined : reason,
    requiredVersion: requiredVersion
  });
});

// Admin webhook control
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

  const adminEmbed = {
    title: "⚙️ Admin Update",
    color: 0xffa500,
    fields: [
      { name: "Type", value: type, inline: true },
      { name: "Action", value: action, inline: true },
      { name: "Value", value: value, inline: true },
      { name: "Reason", value: reason || "N/A", inline: false }
    ],
    footer: {
      text: "DadBods License Server"
    },
    timestamp: new Date().toISOString()
  };

  sendDiscordEmbed(adminEmbed);

  res.json({
    message: "Update successful",
    current: { validIPs, validTokens, killSwitch }
  });
});

app.listen(PORT, () => {
  console.log(`✅ DadBods License Server running on port ${PORT}`);
});
