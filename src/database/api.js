const API_URL = 'http://localhost:3001/api';

const getHeaders = () => {
  const token = localStorage.getItem('bmm_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getCustomers = async () => {
  const response = await fetch(`${API_URL}/customers`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
};

export const getCustomer = async (id) => {
  const response = await fetch(`${API_URL}/customers/${id}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch customer');
  return response.json();
};

export const createCustomer = async (customerData) => {
  const response = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(customerData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create customer');
  }
  return response.json();
};

export const getLedger = async (customerId) => {
  const response = await fetch(`${API_URL}/customers/${customerId}/ledger`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch ledger');
  return response.json();
};

export const recordSale = async (saleData) => {
  const response = await fetch(`${API_URL}/transactions/sale`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(saleData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to record sale');
  }
  return response.json();
};

export const recordPayment = async (paymentData) => {
  const response = await fetch(`${API_URL}/transactions/payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(paymentData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to record payment');
  }
  return response.json();
};

export const getSummary = async () => {
  const response = await fetch(`${API_URL}/summary`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch summary');
  return response.json();
};
