import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, getLedger, recordSale, recordPayment } from '../database/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import { IndianRupee, FileText, MessageCircle, ArrowLeft, History } from 'lucide-react';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Cash', remarks: '' });
  const [saleForm, setSaleForm] = useState({ total_amount: '', amount_paid: '', reference: '', remarks: '' });

  const loadData = async () => {
    try {
      const cust = await getCustomer(id);
      setCustomer(cust);
      setBalance(cust.balance);
      const ledg = await getLedger(id);
      setLedger(ledg);
    } catch (err) {
      console.error(err);
      navigate('/customers');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordPayment({
        customer_id: id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.method,
        remarks: paymentForm.remarks
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', method: 'Cash', remarks: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordSale({
        customer_id: id,
        total_amount: parseFloat(saleForm.total_amount),
        amount_paid: parseFloat(saleForm.amount_paid || 0),
        credit_amount: parseFloat(saleForm.total_amount) - parseFloat(saleForm.amount_paid || 0),
        reference: saleForm.reference,
        remarks: saleForm.remarks
      });
      setShowSaleModal(false);
      setSaleForm({ total_amount: '', amount_paid: '', reference: '', remarks: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!customer) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-secondary" onClick={() => navigate('/customers')} style={{padding: '0.5rem'}}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted text-sm mt-1">{customer.customer_id} | {customer.phone} | {customer.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Outstanding Card */}
        <div className="card" style={{gridColumn: 'span 1'}}>
            <div className="card-body text-center" style={{padding: '2.5rem 1.5rem'}}>
                <div className="text-muted font-bold mb-2 uppercase text-sm">Current Outstanding</div>
                <div className={`outstanding-display ${balance === 0 ? 'zero' : (balance < 0 ? 'positive' : '')}`}>
                    {formatCurrency(Math.abs(balance))}
                </div>
                {balance < 0 && <div className="text-success font-bold mt-2">Advance Balance</div>}
                
                <div className="flex flex-col gap-3 mt-8">
                    <button className="btn btn-success" style={{backgroundColor: 'var(--color-success)', color: 'white', padding: '0.75rem', fontSize: '1rem', width: '100%'}} onClick={() => setShowPaymentModal(true)}>
                        <IndianRupee size={18} /> Receive Payment
                    </button>
                    <button className="btn btn-warning" style={{backgroundColor: '#f59e0b', color: 'white', padding: '0.75rem', fontSize: '1rem', width: '100%'}} onClick={() => setShowSaleModal(true)}>
                        <History size={18} /> Add Credit Sale
                    </button>
                </div>
            </div>
        </div>

        {/* Info & Actions */}
        <div className="card" style={{gridColumn: 'span 2'}}>
            <div className="card-header border-b flex" style={{padding: 0, backgroundColor: '#f8fafc'}}>
                <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} style={{border: 'none', borderBottom: activeTab === 'overview' ? '3px solid var(--color-primary)' : '3px solid transparent', borderRadius: 0, padding: '1rem 1.5rem'}} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`} style={{border: 'none', borderBottom: activeTab === 'ledger' ? '3px solid var(--color-primary)' : '3px solid transparent', borderRadius: 0, padding: '1rem 1.5rem'}} onClick={() => setActiveTab('ledger')}>Central Ledger</button>
            </div>
            
            <div className="card-body">
                {activeTab === 'overview' && (
                    <div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button className="btn btn-secondary flex flex-col items-center justify-center gap-2" style={{height: '100px'}}>
                                <FileText size={24} className="text-primary" />
                                <span>View Statement</span>
                            </button>
                            <button className="btn btn-secondary flex flex-col items-center justify-center gap-2" style={{height: '100px'}}>
                                <MessageCircle size={24} style={{color: '#25D366'}} />
                                <span>Send WhatsApp Reminder</span>
                            </button>
                        </div>
                        
                        <h3 className="font-bold mb-4">Recent Transactions</h3>
                        <div className="table-responsive">
                            <table className="table">
                                <tbody>
                                    {ledger.slice(0,5).map(entry => (
                                        <tr key={entry.ledger_id}>
                                            <td>
                                                <div className="font-semibold">{entry.transaction_type}</div>
                                                <div className="text-xs text-muted">{formatDateTime(entry.transaction_date)}</div>
                                            </td>
                                            <td>{entry.branch_id === 'BR001' ? 'Shop 1' : 'Shop 2'}</td>
                                            <td style={{textAlign: 'right'}}>
                                                {entry.debit_amount > 0 ? (
                                                    <span className="text-danger font-bold">+{formatCurrency(entry.debit_amount)}</span>
                                                ) : (
                                                    <span className="text-success font-bold">-{formatCurrency(entry.credit_amount)}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {ledger.length === 0 && <tr><td colSpan="3" className="text-center text-muted">No recent transactions</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'ledger' && (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Branch</th>
                                    <th>Type</th>
                                    <th>Reference</th>
                                    <th style={{textAlign: 'right'}}>Debit (Sale)</th>
                                    <th style={{textAlign: 'right'}}>Credit (Paid)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.map(entry => (
                                    <tr key={entry.ledger_id}>
                                        <td className="text-sm">{formatDateTime(entry.transaction_date)}</td>
                                        <td className="text-sm">{entry.branch_id === 'BR001' ? 'Shop 1' : 'Shop 2'}</td>
                                        <td className="text-sm font-semibold">{entry.transaction_type}</td>
                                        <td className="text-sm text-muted">{entry.reference_id}</td>
                                        <td style={{textAlign: 'right'}} className={entry.debit_amount > 0 ? 'text-danger font-semibold' : ''}>
                                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                                        </td>
                                        <td style={{textAlign: 'right'}} className={entry.credit_amount > 0 ? 'text-success font-semibold' : ''}>
                                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {ledger.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No ledger entries found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
          <div className="modal-overlay">
              <div className="modal-content" style={{maxWidth: '500px'}}>
                  <div className="card-header bg-success text-white" style={{backgroundColor: 'var(--color-success)', color: 'white'}}>
                      Receive Payment
                  </div>
                  <div className="card-body">
                      <div className="mb-4 p-4 bg-slate-50 rounded text-center">
                          <div className="text-sm text-muted mb-1">Current Outstanding</div>
                          <div className="text-2xl font-bold text-danger">{formatCurrency(balance)}</div>
                      </div>
                      <form onSubmit={handlePaymentSubmit}>
                          <div className="form-group">
                              <label className="form-label">Payment Amount *</label>
                              <div className="search-box" style={{maxWidth: '100%'}}>
                                <IndianRupee className="search-icon" size={16} />
                                <input type="number" step="0.01" className="form-control" style={{paddingLeft: '2rem', fontSize: '1.25rem', fontWeight: 'bold'}} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required autoFocus />
                              </div>
                          </div>
                          <div className="form-group">
                              <label className="form-label">Payment Method</label>
                              <select className="form-control" value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                                  <option value="Cash">Cash</option>
                                  <option value="UPI">UPI / GPay</option>
                                  <option value="Card">Card</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                              </select>
                          </div>
                          <div className="form-group">
                              <label className="form-label">Remarks (Optional)</label>
                              <input type="text" className="form-control" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                              <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                              <button type="submit" className="btn btn-primary" style={{backgroundColor: 'var(--color-success)'}}>Confirm Payment</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
          <div className="modal-overlay">
              <div className="modal-content" style={{maxWidth: '500px'}}>
                  <div className="card-header" style={{backgroundColor: '#f59e0b', color: 'white'}}>
                      Add Credit Transaction
                  </div>
                  <div className="card-body">
                      <form onSubmit={handleSaleSubmit}>
                          <div className="form-group">
                              <label className="form-label">Total Bill Amount *</label>
                              <div className="search-box" style={{maxWidth: '100%'}}>
                                <IndianRupee className="search-icon" size={16} />
                                <input type="number" step="0.01" className="form-control" style={{paddingLeft: '2rem', fontSize: '1.25rem', fontWeight: 'bold'}} value={saleForm.total_amount} onChange={e => setSaleForm({...saleForm, total_amount: e.target.value})} required autoFocus />
                              </div>
                          </div>
                          <div className="form-group">
                              <label className="form-label">Amount Paid Now (Optional)</label>
                              <div className="search-box" style={{maxWidth: '100%'}}>
                                <IndianRupee className="search-icon" size={16} />
                                <input type="number" step="0.01" className="form-control text-success" style={{paddingLeft: '2rem', fontSize: '1.25rem', fontWeight: 'bold'}} value={saleForm.amount_paid} onChange={e => setSaleForm({...saleForm, amount_paid: e.target.value})} />
                              </div>
                          </div>
                          
                          <div className="mb-4 p-4 bg-slate-50 rounded flex justify-between items-center border">
                              <div className="font-semibold">New Credit Amount:</div>
                              <div className="text-xl font-bold text-danger">
                                  {formatCurrency((parseFloat(saleForm.total_amount || 0) - parseFloat(saleForm.amount_paid || 0)))}
                              </div>
                          </div>

                          <div className="form-group">
                              <label className="form-label">Reference / Invoice No (Optional)</label>
                              <input type="text" className="form-control" value={saleForm.reference} onChange={e => setSaleForm({...saleForm, reference: e.target.value})} />
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                              <button type="button" className="btn btn-secondary" onClick={() => setShowSaleModal(false)}>Cancel</button>
                              <button type="submit" className="btn btn-primary" style={{backgroundColor: '#f59e0b'}}>Save Transaction</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
