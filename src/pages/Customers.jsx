import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer } from '../database/api';
import { formatCurrency } from '../utils/format';
import { Search, UserPlus, ArrowRight } from 'lucide-react';

export const Customers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
      filterData(data, searchTerm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData(customers, searchTerm);
  }, [searchTerm, customers]);

  const filterData = (data, term) => {
    if (!term) {
      setFilteredCustomers(data);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = data.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.phone.includes(lower) || 
      c.customer_id.toLowerCase().includes(lower)
    );
    setFilteredCustomers(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSearchParams({ search: e.target.value });
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setError('');
    try {
        if(!newCustomer.name || !newCustomer.phone) {
            throw new Error("Name and Phone are required.");
        }
        const created = await createCustomer(newCustomer);
        await loadData();
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', address: '' });
        navigate(`/customers/${created.customer_id}`);
    } catch (err) {
        setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted text-sm mt-1">Search and manage customer accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div className="card mb-6">
        <div className="card-body">
            <div className="search-box" style={{maxWidth: '100%'}}>
                <Search className="search-icon" size={20} />
                <input 
                type="text" 
                placeholder="Search Customer by Phone Number, Name or ID..." 
                className="form-control"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{fontSize: '1.125rem', height: '56px'}}
                autoFocus
                />
            </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{padding: 0}}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Area/Address</th>
                  <th style={{textAlign: 'right'}}>Outstanding Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.customer_id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/customers/${c.customer_id}`)}>
                    <td>
                        <div className="font-bold text-lg">{c.name}</div>
                        <div className="text-sm text-muted">{c.customer_id}</div>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.address || '-'}</td>
                    <td style={{textAlign: 'right'}}>
                        <div className={`font-bold text-lg ${c.balance > 0 ? 'text-danger' : (c.balance < 0 ? 'text-success' : '')}`}>
                            {formatCurrency(Math.abs(c.balance))} {c.balance < 0 && '(Advance)'}
                        </div>
                    </td>
                    <td style={{textAlign: 'right'}}>
                        <button className="btn btn-secondary text-sm">
                            Open <ArrowRight size={14} />
                        </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                    <tr>
                        <td colSpan="5" style={{textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)'}}>
                            <div className="text-lg mb-2">No customers found matching "{searchTerm}"</div>
                            <button className="btn btn-primary mt-4" onClick={() => setShowAddModal(true)}>
                                Create New Customer
                            </button>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
          <div className="modal-overlay">
              <div className="modal-content" style={{maxWidth: '500px'}}>
                  <div className="card-header">
                      Add New Customer
                  </div>
                  <div className="card-body">
                      {error && <div className="text-danger mb-4 text-sm bg-red-50 p-3 rounded">{error}</div>}
                      <form onSubmit={handleAddCustomer}>
                          <div className="form-group">
                              <label className="form-label">Customer Name *</label>
                              <input type="text" className="form-control" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
                          </div>
                          <div className="form-group">
                              <label className="form-label">Phone Number *</label>
                              <input type="tel" className="form-control" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} required />
                          </div>
                          <div className="form-group">
                              <label className="form-label">Area / Address</label>
                              <input type="text" className="form-control" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                              <button type="submit" className="btn btn-primary">Create Customer</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
