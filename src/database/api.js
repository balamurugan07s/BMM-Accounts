const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
  const token = localStorage.getItem('bmm_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const handleFetchError = (err) => {
  if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
    throw new Error('Unable to connect to the server. Please check your internet connection or backend URL and try again.');
  }
  throw err;
};

export const getCustomers = async () => {
  try {
    const response = await fetch(`${API_URL}/customers`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch customers');
    return response.json();
  } catch (err) { handleFetchError(err); }
};

export const getCustomer = async (id) => {
  try {
    const response = await fetch(`${API_URL}/customers/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch customer');
    return response.json();
  } catch (err) { handleFetchError(err); }
};

export const createCustomer = async (customerData) => {
  try {
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
  } catch (err) { handleFetchError(err); }
};

export const getLedger = async (customerId) => {
  try {
    const response = await fetch(`${API_URL}/customers/${customerId}/ledger`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch ledger');
    return response.json();
  } catch (err) { handleFetchError(err); }
};

export const recordSale = async (saleData) => {
  try {
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
  } catch (err) { handleFetchError(err); }
};

export const recordPayment = async (paymentData) => {
  try {
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
  } catch (err) { handleFetchError(err); }
};

export const getSummary = async () => {
  try {
    const response = await fetch(`${API_URL}/summary`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch summary');
    return response.json();
  } catch (err) { handleFetchError(err); }
};

