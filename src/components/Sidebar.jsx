import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ReceiptText, FileText, Settings, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">BMM</div>
        <div className="sidebar-subtitle">Balamurugan Maligai</div>
      </div>
      <div className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/customers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          Customers
        </NavLink>
        <NavLink to="/payments" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <CreditCard size={20} />
          Payments
        </NavLink>
        <NavLink to="/ledger" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <ReceiptText size={20} />
          Credit Ledger
        </NavLink>
        {user?.role === 'OWNER' && (
          <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            Reports
          </NavLink>
        )}
        <NavLink to="/notifications" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bell size={20} />
          Notifications
        </NavLink>
        {user?.role === 'OWNER' && (
          <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            Settings
          </NavLink>
        )}
      </div>
      <div className="sidebar-header" style={{borderTop: '1px solid var(--color-border)', borderBottom: 'none'}}>
         <div className="nav-item cursor-pointer" style={{padding: '0'}} onClick={logout}>
            <LogOut size={20} />
            Logout
         </div>
      </div>
    </div>
  );
};
