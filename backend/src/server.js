require('dns').setDefaultResultOrder('ipv4first');
require('net').setDefaultAutoSelectFamily(false);
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Gathr API running on http://localhost:${PORT}/api/v1`);
});
