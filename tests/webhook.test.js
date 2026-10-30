const request = require('supertest');
const { createApp } = require('../src/server');
const { openDb } = require('../src/db');

// Each test gets its own in-memory database, so ledger.db is never touched.
function setup() {
  const db = openDb(':memory:');
  db.prepare("INSERT INTO users (id, name, balance_minor) VALUES ('usr_test', 'Test User', 0)").run();
  return { db, app: createApp(db) };
}

function paymentEvent(id) {
  return {
    id,
    type: 'payment.succeeded',
    data: { user_id: 'usr_test', amount_minor: 500000, currency: 'NGN' },
  };
}

test('credits the user once for a new payment event', async () => {
  const { db, app } = setup();

  const res = await request(app).post('/webhooks/payments').send(paymentEvent('evt_test_1'));

  expect(res.status).toBe(200);
  expect(res.body.status).toBe('credited');
  const { balance_minor } = db.prepare("SELECT balance_minor FROM users WHERE id = 'usr_test'").get();
  expect(balance_minor).toBe(500000);
});
