import React, { createContext, useContext, useState, useEffect } from 'react';
import { getNowMoment } from '../utils/format.js';

export { formatCurrency, getInitials } from '../utils/format.js';

export const DebtContext = createContext(null);

const INITIAL_USER = {
  id: 1,
  username: 'asim_saifi',
  name: 'Asim Saifi',
  business_name: 'Saifi General Store',
  mobile_no: '9876501234',
  email: 'asim@saifistore.example',
  created_at: { date: '02-Oct-2026', time: '10:00 AM' },
};

const INITIAL_DEBTORS = [
  {
    id: 3,
    user_id: 1,
    name: 'Ramesh Kumar',
    mobile_no: '9876543210',
    net_balance: 12450.0,
    created_at: { date: '12-Oct-2026', time: '10:30 AM' },
    updated_at: { date: '21-Nov-2026', time: '02:41 PM' },
  },
  {
    id: 5,
    user_id: 1,
    name: 'Sunita Verma',
    mobile_no: '9812345670',
    net_balance: 8200.0,
    created_at: { date: '15-Oct-2026', time: '11:00 AM' },
    updated_at: { date: '21-Nov-2026', time: '11:05 AM' },
  },
  {
    id: 7,
    user_id: 1,
    name: 'Imran Qureshi',
    mobile_no: null,
    net_balance: 3675.5,
    created_at: { date: '22-Oct-2026', time: '04:15 PM' },
    updated_at: { date: '20-Nov-2026', time: '06:30 PM' },
  },
  {
    id: 9,
    user_id: 1,
    name: 'Pooja Agarwal',
    mobile_no: '9988776655',
    net_balance: 0.0,
    created_at: { date: '01-Nov-2026', time: '09:00 AM' },
    updated_at: { date: '20-Nov-2026', time: '01:12 PM' },
  },
  {
    id: 11,
    user_id: 1,
    name: 'Mohan Lal',
    mobile_no: null,
    net_balance: 21900.0,
    created_at: { date: '05-Nov-2026', time: '02:20 PM' },
    updated_at: { date: '19-Nov-2026', time: '09:48 AM' },
  },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 106,
    user_id: 1,
    debtor_id: 3,
    txn_type: 'DEBT',
    amount: 2000.0,
    new_balance: 12450.0,
    txn_date: { date: '21-Nov-2026', time: '02:41 PM' },
  },
  {
    id: 105,
    user_id: 1,
    debtor_id: 5,
    txn_type: 'PAYMENT',
    amount: 1500.0,
    new_balance: 8200.0,
    txn_date: { date: '21-Nov-2026', time: '11:05 AM' },
  },
  {
    id: 104,
    user_id: 1,
    debtor_id: 7,
    txn_type: 'DEBT',
    amount: 675.5,
    new_balance: 3675.5,
    txn_date: { date: '20-Nov-2026', time: '06:30 PM' },
  },
  {
    id: 103,
    user_id: 1,
    debtor_id: 9,
    txn_type: 'PAYMENT',
    amount: 4300.0,
    new_balance: 0.0,
    txn_date: { date: '20-Nov-2026', time: '01:12 PM' },
  },
  {
    id: 102,
    user_id: 1,
    debtor_id: 11,
    txn_type: 'DEBT',
    amount: 3100.0,
    new_balance: 21900.0,
    txn_date: { date: '19-Nov-2026', time: '09:48 AM' },
  },
  {
    id: 101,
    user_id: 1,
    debtor_id: 3,
    txn_type: 'PAYMENT',
    amount: 5000.0,
    new_balance: 10450.0,
    txn_date: { date: '14-Nov-2026', time: '04:20 PM' },
  },
];

export const DebtProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('debtbook_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('debtbook_token') || 'mock-jwt-token-asim';
  });

  const [debtors, setDebtors] = useState(() => {
    const saved = localStorage.getItem('debtbook_debtors');
    return saved ? JSON.parse(saved) : INITIAL_DEBTORS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('debtbook_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [modal, setModal] = useState({
    isOpen: false,
    type: 'debtor', // 'debtor' | 'transaction'
    debtorId: null,
    txnType: 'DEBT', // 'DEBT' | 'PAYMENT'
  });

  const [alert, setAlert] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('debtbook_debtors', JSON.stringify(debtors));
  }, [debtors]);

  useEffect(() => {
    localStorage.setItem('debtbook_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('debtbook_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('debtbook_user');
    }
  }, [user]);

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

  // Add debtor
  const addDebtor = ({ name, mobile_no }) => {
    const now = getNowMoment();
    const newId = debtors.length > 0 ? Math.max(...debtors.map((d) => d.id)) + 1 : 1;
    const newDebtor = {
      id: newId,
      user_id: user?.id || 1,
      name: name.trim(),
      mobile_no: mobile_no ? mobile_no.trim() : null,
      net_balance: 0.0,
      created_at: now,
      updated_at: now,
    };
    setDebtors((prev) => [newDebtor, ...prev]);
    return newDebtor;
  };

  // Add transaction
  const addTransaction = ({ debtor_id, txn_type, amount }) => {
    const debtorIdNum = Number(debtor_id);
    const numAmount = Number(amount);
    const debtor = debtors.find((d) => d.id === debtorIdNum);
    if (!debtor) return false;

    const currentBal = Number(debtor.net_balance) || 0;
    const newBal = txn_type === 'DEBT' ? currentBal + numAmount : currentBal - numAmount;
    const now = getNowMoment();

    const newTxnId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
    const newTxn = {
      id: newTxnId,
      user_id: user?.id || 1,
      debtor_id: debtorIdNum,
      txn_type,
      amount: numAmount,
      new_balance: newBal,
      txn_date: now,
    };

    // Update debtor balance & updated_at
    setDebtors((prev) =>
      prev.map((d) => {
        if (d.id === debtorIdNum) {
          return {
            ...d,
            net_balance: newBal,
            updated_at: now,
          };
        }
        return d;
      })
    );

    // Add to transaction list (newest first)
    setTransactions((prev) => [newTxn, ...prev]);
    return newTxn;
  };

  // Auth actions
  const login = (username, password) => {
    if (username && password) {
      setUser({
        ...INITIAL_USER,
        username,
      });
      setToken('mock-jwt-token-' + username);
      return { success: true };
    }
    return { success: false, error: 'Incorrect username or password.' };
  };

  const register = (userData) => {
    const now = getNowMoment();
    const newUser = {
      id: 2,
      username: userData.username,
      name: userData.name,
      business_name: userData.business_name,
      mobile_no: userData.mobile_no,
      email: userData.email,
      created_at: now,
    };
    setUser(newUser);
    setToken('mock-jwt-token-' + userData.username);
    return { success: true };
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
        user,
        token,
        isAuthenticated: Boolean(token),
        debtors,
        transactions,
        searchTerm,
        setSearchTerm,
        modal,
        openModal,
        closeModal,
        addDebtor,
        addTransaction,
        login,
        register,
        logout,
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
