const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { db, initDb, seedDb } = require('./db.cjs');
const { authenticate, loginRoute } = require('./auth.cjs');

const app = express();
app.use(cors());
app.use(express.json());

// Auth
app.post('/api/auth/login', loginRoute);

// API Endpoints
app.get('/api/customers', authenticate, (req, res) => {
  const query = `
    SELECT c.*, 
           (SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0) 
            FROM ledger_entries 
            WHERE customer_id = c.customer_id AND is_reversed = 0) as balance
    FROM customers c
    ORDER BY balance DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', authenticate, (req, res) => {
  const { name, phone, address, area } = req.body;
  const customer_id = `CUS-${Math.floor(100000 + Math.random() * 900000)}`;
  
  const query = `INSERT INTO customers (customer_id, name, phone, address, area) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [customer_id, name, phone, address, area], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Customer with this phone already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ customer_id, name, phone, address, area, balance: 0 });
  });
});

app.get('/api/customers/:id', authenticate, (req, res) => {
  const query = `
    SELECT c.*, 
           (SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0) 
            FROM ledger_entries 
            WHERE customer_id = c.customer_id AND is_reversed = 0) as balance
    FROM customers c
    WHERE c.customer_id = ?
  `;
  db.get(query, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  });
});

app.get('/api/customers/:id/ledger', authenticate, (req, res) => {
  const query = `
    SELECT * FROM ledger_entries 
    WHERE customer_id = ? AND is_reversed = 0
    ORDER BY transaction_date DESC
  `;
  db.all(query, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions/sale', authenticate, (req, res) => {
  const { customer_id, total_amount, amount_paid, credit_amount, remarks } = req.body;
  const invoice_id = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  const ledger_id = `LEDG-${Math.floor(100000 + Math.random() * 900000)}`;
  const { employee_id, branch_id } = req.user;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    db.run(
      `INSERT INTO sales (invoice_id, customer_id, branch_id, employee_id, total_amount, amount_paid, credit_amount, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_id, customer_id, branch_id, employee_id, total_amount, amount_paid, credit_amount, remarks]
    );

    if (credit_amount > 0) {
      db.run(
        `INSERT INTO ledger_entries (ledger_id, customer_id, branch_id, employee_id, transaction_type, reference_id, debit_amount, remarks) VALUES (?, ?, ?, ?, 'SALE', ?, ?, ?)`,
        [ledger_id, customer_id, branch_id, employee_id, invoice_id, credit_amount, remarks]
      );
    }
    
    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, invoice_id });
    });
  });
});

app.post('/api/transactions/payment', authenticate, (req, res) => {
  const { customer_id, amount, payment_method, remarks } = req.body;
  const payment_id = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  const ledger_id = `LEDG-${Math.floor(100000 + Math.random() * 900000)}`;
  const { employee_id, branch_id } = req.user;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    db.run(
      `INSERT INTO payments (payment_id, customer_id, branch_id, employee_id, amount, payment_method, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payment_id, customer_id, branch_id, employee_id, amount, payment_method, remarks]
    );

    db.run(
      `INSERT INTO ledger_entries (ledger_id, customer_id, branch_id, employee_id, transaction_type, reference_id, credit_amount, remarks) VALUES (?, ?, ?, ?, 'PAYMENT', ?, ?, ?)`,
      [ledger_id, customer_id, branch_id, employee_id, payment_id, amount, remarks]
    );
    
    db.run("COMMIT", (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, payment_id });
    });
  });
});

app.get('/api/summary', authenticate, (req, res) => {
  // Simple summary endpoint
  const query = `
    SELECT 
      (SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0) FROM ledger_entries WHERE is_reversed = 0) as totalOutstanding,
      (SELECT COUNT(*) FROM customers) as totalCustomers
  `;
  db.get(query, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

const PORT = process.env.PORT || 3001;
initDb().then(seedDb).then(() => {
  app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
  });
});
