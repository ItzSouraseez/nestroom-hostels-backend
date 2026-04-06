const express = require('express');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/v1/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  return app;
}

module.exports = { createApp };

