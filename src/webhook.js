// Handles payment.succeeded events from the payment provider.
// The provider retries an event if it does not get a 2xx response in time.
function handleWebhook(db) {
  const findUser = db.prepare('SELECT id FROM users WHERE id = ?');
  const insertCredit = db.prepare(
    'INSERT INTO ledger (event_id, user_id, amount_minor, currency, type) VALUES (?, ?, ?, ?, ?)'
  );
  const addToBalance = db.prepare(
    'UPDATE users SET balance_minor = balance_minor + ? WHERE id = ?'
  );

  return (req, res) => {
    const event = req.body;

    if (!event || event.type !== 'payment.succeeded' || !event.id || !event.data) {
      return res.status(400).json({ error: 'invalid event' });
    }

    const { user_id, amount_minor, currency } = event.data;

    if (!findUser.get(user_id)) {
      return res.status(404).json({ error: 'unknown user' });
    }

    insertCredit.run(event.id, user_id, amount_minor, currency, 'credit');
    addToBalance.run(amount_minor, user_id);

    return res.status(200).json({ status: 'credited', event_id: event.id });
  };
}

module.exports = { handleWebhook };
