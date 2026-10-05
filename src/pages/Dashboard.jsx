import React, { useState, useEffect } from 'react';
import { getSummary, getCustomers } from '../database/api';
import { formatCurrency } from '../utils/format';
import { TrendingUp, Users, AlertCircle, IndianRupee, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ todaySales: 0, todayCredit: 0, todayPayments: 0 });
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [topDebtors, setTopDebtors] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sumData = await getSummary();
        setTotalOutstanding(sumData.totalOutstanding || 0);
        setTotalCustomers(sumData.totalCustomers || 0);
        
        // Mock summary for today since we didn't build daily aggregates yet
        setSummary({ todaySales: 0, todayCredit: 0, todayPayments: 0 });

        const customers = await getCustomers();
        const debtors = customers.filter(c => c.balance > 0)
                                 .sort((a,b) => b.balance - a.balance)
                                 .slice(0, 5);
        setTopDebtors(debtors);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Overview of your branch transactions</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={() => navigate('/customers')}>
             Receive Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card stat-card">
          <div className="flex justify-between items-start">
            <div className="stat-card-title">Today's Sales</div>
            <TrendingUp size={20} className="text-muted" />
          </div>
          <div className="stat-card-value text-primary">{formatCurrency(summary.todaySales)}</div>
        </div>
        
        <div className="card stat-card">
          <div className="flex justify-between items-start">
            <div className="stat-card-title">Credit Sales</div>
            <IndianRupee size={20} className="text-muted" />
          </div>
          <div className="stat-card-value text-warning">{formatCurrency(summary.todayCredit)}</div>
        </div>

        <div className="card stat-card">
          <div className="flex justify-between items-start">
            <div className="stat-card-title">Payments Collected</div>
            <IndianRupee size={20} className="text-muted" />
          </div>
          <div className="stat-card-value text-success">{formatCurrency(summary.todayPayments)}</div>
        </div>

        <div className="card stat-card">
          <div className="flex justify-between items-start">
            <div className="stat-card-title">Total Outstanding</div>
            <AlertCircle size={20} className="text-muted" />
          </div>
          <div className="stat-card-value text-danger">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Top Debtors */}
        <div className="card" style={{gridColumn: 'span 2'}}>
          <div className="card-header">
            Top Customers by Outstanding
            <button className="btn btn-secondary text-sm" onClick={() => navigate('/customers')}>View All</button>
          </div>
          <div className="card-body" style={{padding: 0}}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>ID</th>
                    <th>Phone</th>
                    <th style={{textAlign: 'right'}}>Outstanding</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {topDebtors.map((c, i) => (
                    <tr key={c.customer_id}>
                      <td className="font-semibold">{c.name}</td>
                      <td className="text-muted text-sm">{c.customer_id}</td>
                      <td>{c.phone}</td>
                      <td style={{textAlign: 'right'}} className="font-bold text-danger">
                        {formatCurrency(c.balance)}
                      </td>
                      <td style={{textAlign: 'right'}}>
                        <button className="btn btn-secondary text-sm" onClick={() => navigate(`/customers/${c.customer_id}`)}>
                          View <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {topDebtors.length === 0 && (
                      <tr>
                          <td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)'}}>No outstanding balances</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="card">
          <div className="card-header">System Info</div>
          <div className="card-body">
            <div className="flex justify-between mb-4 pb-4" style={{borderBottom: '1px solid var(--color-border)'}}>
               <span className="text-muted">Total Customers</span>
               <span className="font-bold">{totalCustomers}</span>
            </div>
            <div className="flex justify-between mb-4 pb-4" style={{borderBottom: '1px solid var(--color-border)'}}>
               <span className="text-muted">Active Branches</span>
               <span className="font-bold">2</span>
            </div>
            <div className="mt-6">
               <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}} onClick={() => navigate('/customers')}>
                  Search Customer
               </button>
               <button className="btn btn-primary" style={{width: '100%'}} onClick={() => navigate('/customers')}>
                  Credit Transaction
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
