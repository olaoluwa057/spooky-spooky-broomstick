// Rebuilds ledger.db with fictional users and payment history.
// Two past events (evt_1003 and evt_1005) were retried by the provider
// and credited twice, which is the bug under investigation.
const fs = require('fs');
const { openDb, DEFAULT_DB_PATH } = require('../src/db');

for (const suffix of ['', '-wal', '-shm', '-journal']) {
  const file = DEFAULT_DB_PATH + suffix;
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

const db = openDb();

const users = [
  ['usr_001', 'Adaeze Okafor'],
  ['usr_002', 'Tunde Bakare'],
  ['usr_003', 'Ngozi Eze'],
  ['usr_004', 'Ibrahim Musa'],
  ['usr_005', 'Funmi Adeyemi'],
];

const history = [
  // event_id,  user_id,   amount_minor, created_at
  ['evt_1001', 'usr_001', 250000, '2026-10-26 09:14:02'],
  ['evt_1002', 'usr_002', 150000, '2026-10-26 11:40:37'],
  ['evt_1003', 'usr_003', 500000, '2026-10-27 08:05:11'],
  ['evt_1003', 'usr_003', 500000, '2026-10-27 08:05:41'], // provider retry, credited again
  ['evt_1004', 'usr_004',  75000, '2026-10-27 15:22:48'],
  ['evt_1005', 'usr_001', 120000, '2026-10-28 10:01:19'],
  ['evt_1005', 'usr_001', 120000, '2026-10-28 10:01:50'], // provider retry, credited again
  ['evt_1006', 'usr_005', 300000, '2026-10-29 13:47:05'],
];

const insertUser = db.prepare('INSERT INTO users (id, name, balance_minor) VALUES (?, ?, 0)');
const insertCredit = db.prepare(
  "INSERT INTO ledger (event_id, user_id, amount_minor, currency, type, created_at) VALUES (?, ?, ?, 'NGN', 'credit', ?)"
);
const addToBalance = db.prepare('UPDATE users SET balance_minor = balance_minor + ? WHERE id = ?');

db.transaction(() => {
  for (const [id, name] of users) insertUser.run(id, name);
  for (const [eventId, userId, amount, createdAt] of history) {
    insertCredit.run(eventId, userId, amount, createdAt);
    addToBalance.run(amount, userId);
  }
})();

db.close();
console.log(`Seeded ${users.length} users and ${history.length} ledger rows into ${DEFAULT_DB_PATH}`);
