const express = require('express');
const { openDb } = require('./db');
const { handleWebhook } = require('./webhook');

function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.post('/webhooks/payments', handleWebhook(db));

  return app;
}

if (require.main === module) {
  const db = openDb();
  const port = process.env.PORT || 3000;
  createApp(db).listen(port, () => {
    console.log(`Payment service listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
