const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/events', require('./routes/events'));

// Malformed JSON and other errors -> the API's standard { code, message } shape
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 400, message: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ code: 500, message: 'Server error' });
});

module.exports = app;
