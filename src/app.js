const express = require('express');
const cors = require('cors');

const { getEnv } = require('./config/env');

function createApp() {
  const app = express();
  const env = getEnv();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (env.FRONTEND_URL) {
    app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  } else {
    app.use(cors());
  }

  app.get('/v1/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  return app;
}

module.exports = { createApp };

