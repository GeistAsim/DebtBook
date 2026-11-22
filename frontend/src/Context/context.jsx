import React, { createContext, useContext, useState, useEffect } from 'react';
import { getNowMoment } from '../utils/format.js';

export { formatCurrency, getInitials } from '../utils/format.js';

export const DebtContext = createContext();

export const DebtProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('debtbook_token') || 'mock-jwt-token-asim';
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('debtbook_token', token);
    } else {
      localStorage.removeItem('debtbook_token');
    }
  }, [token]);

  // Modal actions
  const openModal = (type, options = {}) => {
    setModal({
      isOpen: true,
      type,
      debtorId: options.debtorId || null,
      txnType: options.txnType || 'DEBT',
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const showAlert = (title, text) => {
    setAlert({ title, text });
  };

  const dismissAlert = () => {
    setAlert(null);
  };

  return (
    <DebtContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        searchTerm,
        setSearchTerm,
        alert,
        showAlert,
        dismissAlert,
      }}
    >
      {children}
    </DebtContext.Provider>
  );
};

export const useDebt = () => {
  const context = useContext(DebtContext);
  if (!context) {
    throw new Error('useDebt must be used within a DebtProvider');
  }
  return context;
};
