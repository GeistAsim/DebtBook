import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { worker } from '../utils/worker.js';
import { api } from '../api/api.js';

export { formatCurrency, getInitials } from '../utils/format.js';

export const DebtContext = createContext(null);


async function parseErrorDetail(res, fallback) {
  const body = await res.json().catch(() => null);
  if (!body || !body.detail) return fallback;
  if (Array.isArray(body.detail)) {
    return body.detail.map((item) => item.msg || String(item)).join(', ');
  }
  return String(body.detail);
}

// FastAPI returns HTTP 400 or 404 when lists are empty
async function parseListResponse(res, fallbackMsg) {
  if (res.status === 404) {
    return [];
  }
  if (res.status === 400) {
    const detail = await parseErrorDetail(res, '');
    if (detail === 'Token Expired!!!') {
      throw new Error(detail);
    }
    return [];
  }
  if (!res.ok) {
    const detail = await parseErrorDetail(res, fallbackMsg);
    throw new Error(detail);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

async function parseUserResponse(res) {
  if (!res.ok) {
    const detail = await parseErrorDetail(res, "Couldn't load profile");
    throw new Error(detail);
  }
  return res.json();
}

export const DebtProvider = ({ children }) => {
  const [token, setToken] = useState(() => worker.token_manager({ action: 'get' }));
  const [user, setUser] = useState();
  const [debtors, setDebtors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'debtor',
    debtorId: null,
    txnType: 'DEBT',
  });

  // Sync token with worker localStorage
  useEffect(() => {
    if (token) {
      worker.token_manager({ action: 'store', token });
    } else {
      worker.token_manager({ action: 'remove' });
    }
  }, [token]);

  const logout = useCallback(() => {
    setUser(null);
    setDebtors([]);
    setTransactions([]);
    setDashboardStats(null);
    setToken(null);
  }, []);

  const loadAllData = useCallback(async (isCancelled = () => false) => {
    const [userResult, debtorsResult, txnsResult, dashResult] = await Promise.allSettled([
      api.current_user(),
      api.user_debtors(),
      api.user_txn_fltr(),
      api.dashboard(),
    ]);

    const errors = [];

    if (userResult.status === 'fulfilled') {
      try {
        const userData = await parseUserResponse(userResult.value);
        if (!isCancelled()) setUser(userData);
      } catch (err) {
        errors.push(err.message);
      }
    } else {
      errors.push(userResult.reason?.message || "Couldn't load profile");
    }

    if (debtorsResult.status === 'fulfilled') {
      try {
        const debtorsData = await parseListResponse(debtorsResult.value, "Couldn't load debtors");
        if (!isCancelled()) setDebtors(debtorsData);
      } catch (err) {
        errors.push(err.message);
      }
    } else {
      errors.push(debtorsResult.reason?.message || "Couldn't load debtors");
    }

    if (txnsResult.status === 'fulfilled') {
      try {
        const txnsData = await parseListResponse(txnsResult.value, "Couldn't load transactions");
        if (!isCancelled()) setTransactions(txnsData);
      } catch (err) {
        errors.push(err.message);
      }
    } else {
      errors.push(txnsResult.reason?.message || "Couldn't load transactions");
    }

    if (dashResult.status === 'fulfilled' && dashResult.value.ok) {
      const dashData = await dashResult.value.json().catch(() => null);
      if (!isCancelled()) setDashboardStats(dashData);
    } else if (!isCancelled()) {
      setDashboardStats(null);
    }

    if (!isCancelled()) {
      if (errors.length > 0) {
        setAlert({
          title: "Couldn't load some data",
          text: errors[0],
        });
      } else {
        setAlert(null);
      }
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await loadAllData();
    } finally {
      setLoading(false);
    }
  }, [token, loadAllData]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) loadAllData(() => cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [token, loadAllData]);

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

  // Write actions via api.js
  const addDebtor = async (debtorData) => {
    try {
      const res = await api.debtor_register(debtorData);
      if (!res.ok) {
        const detail = await parseErrorDetail(res, "Couldn't save debtor");
        throw new Error(detail);
      }
      await fetchDashboardData();
      return true;
    } catch (err) {
      setAlert({
        title: "Couldn't save debtor",
        text: err.message || 'Database error while saving debtor.',
      });
      return false;
    }
  };

  const addTransaction = async (txnData) => {
    try {
      const res = await api.new_txn(txnData);
      if (!res.ok) {
        const detail = await parseErrorDetail(res, "Couldn't save transaction");
        throw new Error(detail);
      }
      await fetchDashboardData();
      return true;
    } catch (err) {
      setAlert({
        title: "Couldn't save transaction",
        text: err.message || 'Database error while saving transaction.',
      });
      return false;
    }
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
        setToken,
        user,
        setUser,
        isAuthenticated: Boolean(token),
        debtors,
        transactions,
        dashboardStats,
        loading,
        refreshData: fetchDashboardData,
        searchTerm,
        setSearchTerm,
        modal,
        openModal,
        closeModal,
        addDebtor,
        addTransaction,
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
