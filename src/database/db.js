import { v4 as uuidv4 } from 'uuid';

// Key names for localStorage
const KEYS = {
  CUSTOMERS: 'bmm_customers',
  BRANCHES: 'bmm_branches',
  EMPLOYEES: 'bmm_employees',
  LEDGER: 'bmm_ledger',
  INVOICES: 'bmm_invoices',
  PAYMENTS: 'bmm_payments'
};

// Initial Data
const INITIAL_BRANCHES = [
  { branch_id: 'BR001', branch_code: 'SHOP1', branch_name: 'Main Shop', address: 'Market Road', phone: '0435-240001' },
  { branch_id: 'BR002', branch_code: 'SHOP2', branch_name: 'Employee Branch', address: 'South Street', phone: '0435-240002' }
];

const INITIAL_EMPLOYEES = [
  { employee_id: 'EMP-0012', name: 'Ravi', role: 'Staff', branch_id: 'BR002' },
  { employee_id: 'EMP-0001', name: 'Admin', role: 'Owner', branch_id: null }
];

// Initialize DB if empty
export const initDB = () => {
  if (!localStorage.getItem(KEYS.BRANCHES)) {
    localStorage.setItem(KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
  }
  if (!localStorage.getItem(KEYS.EMPLOYEES)) {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    // Add demo customer A from prompt
    const demoCustomer = {
      customer_id: 'CUS-002682',
      name: 'Customer A',
      phone: '9876543210',
      address: 'Kumbakonam',
      created_at: new Date().toISOString()
    };
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([demoCustomer]));
    localStorage.setItem(KEYS.LEDGER, JSON.stringify([]));
    localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify([]));

    // Add demo transactions for Customer A
    // 01 Oct Shop 1 Sale 1800, Paid 500, Credit 1300
    recordSale({
      customer_id: 'CUS-002682', branch_id: 'BR001', employee_id: 'EMP-0001',
      total_amount: 1800, amount_paid: 500, date: '2026-10-01T10:00:00Z', reference: 'INV-1001'
    });
    
    // 05 Oct Shop 2 Sale 1300, Paid 500, Credit 800
    recordSale({
      customer_id: 'CUS-002682', branch_id: 'BR002', employee_id: 'EMP-0012',
      total_amount: 1300, amount_paid: 500, date: '2026-10-05T11:00:00Z', reference: 'INV-1002'
    });
  }
};

// Generic get
const getTable = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setTable = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Customers
export const getCustomers = () => getTable(KEYS.CUSTOMERS);
export const getCustomer = (id) => getCustomers().find(c => c.customer_id === id);

export const createCustomer = (customerData) => {
  const customers = getCustomers();
  if (customers.find(c => c.phone === customerData.phone)) {
    throw new Error('Customer with this phone number already exists.');
  }
  const newCustomer = {
    ...customerData,
    customer_id: `CUS-${Math.floor(100000 + Math.random() * 900000)}`,
    created_at: new Date().toISOString()
  };
  customers.push(newCustomer);
  setTable(KEYS.CUSTOMERS, customers);
  return newCustomer;
};

// Branches
export const getBranches = () => getTable(KEYS.BRANCHES);
export const getBranch = (id) => getBranches().find(b => b.branch_id === id);

// Ledger & Balances
export const getLedger = (customerId) => {
  return getTable(KEYS.LEDGER).filter(l => l.customer_id === customerId).sort((a,b) => new Date(a.transaction_date) - new Date(b.transaction_date));
};

export const getCustomerBalance = (customerId) => {
  const ledger = getLedger(customerId);
  return ledger.reduce((balance, entry) => balance + (entry.debit_amount || 0) - (entry.credit_amount || 0), 0);
};

export const getAllOutstanding = () => {
  const customers = getCustomers();
  return customers.map(c => ({
    ...c,
    balance: getCustomerBalance(c.customer_id)
  })).sort((a,b) => b.balance - a.balance);
};

// Transactions
export const recordSale = ({ customer_id, branch_id, employee_id, total_amount, amount_paid, date, reference }) => {
  const credit_amount = total_amount - amount_paid;
  
  const invoices = getTable(KEYS.INVOICES);
  const invoice_id = reference || `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const invoice = {
    invoice_id, customer_id, branch_id, employee_id,
    total_amount, amount_paid, credit_amount,
    created_at: date || new Date().toISOString()
  };
  invoices.push(invoice);
  setTable(KEYS.INVOICES, invoices);

  const ledger = getTable(KEYS.LEDGER);
  
  // Debit entry for the total amount
  ledger.push({
    ledger_id: `LED-${uuidv4().substring(0,8)}`,
    customer_id, branch_id, employee_id,
    transaction_type: 'SALE', reference_id: invoice_id,
    debit_amount: total_amount, credit_amount: 0,
    transaction_date: date || new Date().toISOString()
  });

  // Credit entry for the paid amount
  if (amount_paid > 0) {
    ledger.push({
      ledger_id: `LED-${uuidv4().substring(0,8)}`,
      customer_id, branch_id, employee_id,
      transaction_type: 'PAYMENT', reference_id: invoice_id,
      debit_amount: 0, credit_amount: amount_paid,
      transaction_date: date || new Date().toISOString()
    });
  }

  setTable(KEYS.LEDGER, ledger);
  return invoice;
};

export const recordPayment = ({ customer_id, branch_id, employee_id, amount, payment_method, date, remarks }) => {
  const payments = getTable(KEYS.PAYMENTS);
  const payment_id = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const payment = {
    payment_id, customer_id, branch_id, employee_id,
    amount, payment_method, remarks,
    created_at: date || new Date().toISOString()
  };
  payments.push(payment);
  setTable(KEYS.PAYMENTS, payments);

  const ledger = getTable(KEYS.LEDGER);
  ledger.push({
    ledger_id: `LED-${uuidv4().substring(0,8)}`,
    customer_id, branch_id, employee_id,
    transaction_type: 'PAYMENT', reference_id: payment_id,
    debit_amount: 0, credit_amount: amount, remarks,
    transaction_date: date || new Date().toISOString()
  });
  
  setTable(KEYS.LEDGER, ledger);
  return payment;
};

export const getTransactionsSummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const invoices = getTable(KEYS.INVOICES).filter(i => i.created_at.startsWith(today));
    const payments = getTable(KEYS.PAYMENTS).filter(p => p.created_at.startsWith(today));
    
    return {
        todaySales: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        todayCredit: invoices.reduce((sum, inv) => sum + inv.credit_amount, 0),
        todayPayments: payments.reduce((sum, pay) => sum + pay.amount, 0)
    };
};
