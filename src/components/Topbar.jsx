import React from 'react';
import { Search, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleSearch = (e) => {
      if(e.key === 'Enter' && e.target.value.trim() !== '') {
          navigate(`/customers?search=${e.target.value}`);
      }
  };

  return (
    <div className="topbar">
      <div className="search-box">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Search Customer (Phone / ID / Name) [Press Enter]" 
          className="form-control"
          style={{borderRadius: 'var(--radius-full)', backgroundColor: '#f1f5f9', border: 'none'}}
          onKeyDown={handleSearch}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center text-sm font-medium text-muted">
            <MapPin size={16} className="mr-2" />
            {user?.branch_id === 'BR001' ? 'SHOP 1 - Main' : user?.branch_id === 'BR002' ? 'SHOP 2 - Employee Branch' : 'All Branches (Owner)'}
        </div>
        <div className="flex items-center gap-2" style={{borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem'}}>
          <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>
            {user?.name?.[0] || 'U'}
          </div>
          <div className="text-sm">
            <div className="font-bold">{user?.name || 'User'}</div>
            <div className="text-muted" style={{fontSize: '0.75rem', textTransform: 'capitalize'}}>{user?.role || 'Staff'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
