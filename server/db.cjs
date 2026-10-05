const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'bmm_credit.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Roles
      db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )`);

      // 2. Branches
      db.run(`CREATE TABLE IF NOT EXISTS branches (
        branch_id TEXT PRIMARY KEY,
        branch_name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        status TEXT DEFAULT 'ACTIVE'
      )`);

      // 3. Employees / Users
      db.run(`CREATE TABLE IF NOT EXISTS employees (
        employee_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role_id INTEGER,
        branch_id TEXT,
        status TEXT DEFAULT 'ACTIVE',
        FOREIGN KEY (role_id) REFERENCES roles (id),
        FOREIGN KEY (branch_id) REFERENCES branches (branch_id)
      )`);

      // 4. Customers
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        customer_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        address TEXT,
        area TEXT,
        credit_limit DECIMAL(15,2) DEFAULT 0.00,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 5. Ledger Entries (The Core)
      db.run(`CREATE TABLE IF NOT EXISTS ledger_entries (
        ledger_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        debit_amount DECIMAL(15,2) DEFAULT 0.00,
        credit_amount DECIMAL(15,2) DEFAULT 0.00,
        remarks TEXT,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_reversed BOOLEAN DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
        FOREIGN KEY (branch_id) REFERENCES branches (branch_id),
        FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
      )`);

      // 6. Sales / Invoices
      db.run(`CREATE TABLE IF NOT EXISTS sales (
        invoice_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        amount_paid DECIMAL(15,2) DEFAULT 0.00,
        credit_amount DECIMAL(15,2) NOT NULL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
        FOREIGN KEY (branch_id) REFERENCES branches (branch_id)
      )`);

      // 7. Payments
      db.run(`CREATE TABLE IF NOT EXISTS payments (
        payment_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method TEXT NOT NULL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
        FOREIGN KEY (branch_id) REFERENCES branches (branch_id)
      )`);

      // 8. Audit Logs
      db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 9. Idempotency Records
      db.run(`CREATE TABLE IF NOT EXISTS idempotency_records (
        idempotency_key TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      resolve();
    });
  });
};

const bcrypt = require('bcryptjs');

const seedDb = () => {
  return new Promise((resolve) => {
    db.get("SELECT COUNT(*) as count FROM roles", async (err, row) => {
      if (row.count === 0) {
        const hash = await bcrypt.hash('password', 10);
        db.serialize(() => {
          db.run(`INSERT INTO roles (name) VALUES ('OWNER'), ('MANAGER'), ('STAFF')`);
          db.run(`INSERT INTO branches (branch_id, branch_name) VALUES ('BR001', 'Shop 1 (Main)')`);
          db.run(`INSERT INTO branches (branch_id, branch_name) VALUES ('BR002', 'Shop 2 (Employee)')`);
          db.run(`INSERT INTO employees (employee_id, name, username, password_hash, role_id, branch_id) VALUES 
            ('EMP-0001', 'Admin Owner', 'admin', ?, 1, NULL),
            ('EMP-0012', 'Ravi', 'ravi', ?, 3, 'BR002')
          `, [hash, hash]);
        });
      }
      resolve();
    });
  });
};

module.exports = { db, initDb, seedDb };
