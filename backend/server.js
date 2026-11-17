// Node 22+: prefer IPv4 so requests to Supabase do not time out
require('dns').setDefaultResultOrder('ipv4first');
require('net').setDefaultAutoSelectFamily(false);
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Gathr API running on http://localhost:${PORT}/api/v1`);
});
