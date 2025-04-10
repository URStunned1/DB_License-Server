const validIPs = ['10.0.0.36'];           // Your server IP(s)
const validTokens = ['ABC123-XYZ999'];          // Your license token(s)

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