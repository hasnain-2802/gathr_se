const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl) or if in allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // permissive for local dev
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
