# Connecting DebtBook Frontend to FastAPI Backend

This guide details the exact steps to transition the frontend from the current **hardcoded mock data** to the live **FastAPI backend** running at `http://localhost:8000`.

---

## Overview of Current Mock vs Backend Architecture

| Feature | Current Frontend Mock (`src/Context/context.jsx`) | Live Backend API (`backend/app/`) |
|---|---|---|
| **Base URL** | None (in-memory & `localStorage`) | `http://localhost:8000` |
| **Auth Login** | Instant mock token `'mock-jwt-token-...'` | `POST /user/login` (`application/x-www-form-urlencoded`) |
| **Auth Register** | In-memory user object | `POST /new/user` (JSON `NewUser` schema) |
| **Session Verification** | Checks localStorage string | `GET /token/check?token=<token>` |
| **Debtors List** | Hardcoded array of 5 debtors | `GET /user/debtors` (Returns `400`/`404` when empty) |
| **Transactions List** | Hardcoded array of 6 transactions | `GET /user/transactions` (Returns `400`/`404` when empty) |
| **Create Debtor** | Local array prepend | `POST /new/debtor` (JSON `NewDebtor` schema) |
| **Create Transaction** | Local array prepend & manual balance math | `POST /new/transaction` (Backend updates balance atomically) |

---

## 4 Critical Backend Quirks to Handle

1. **Empty Lists Return HTTP 400 or 404**:
   - In `backend/app/get.py` and `backend/app/database/crud.py`, when a shop owner has no debtors or no transactions, the backend raises `HTTPException(status_code=400, detail="Bad Request!!!")` or `404`.
   - **Frontend Requirement**: The API client must catch `400` and `404` on list endpoints and return `[]` instead of throwing an error so `<EmptyState />` renders cleanly.
2. **Login Requires `application/x-www-form-urlencoded`**:
   - `POST /user/login` uses FastAPI's `OAuth2PasswordRequestForm`. It does **not** accept JSON.
   - **Frontend Requirement**: Pass body as `new URLSearchParams({ username, password })`.
3. **Token Verification is a Query Parameter**:
   - `GET /token/check` accepts `?token=<jwt_string>` instead of a Bearer header.
4. **Hardcoded `user_id = 1` in Backend**:
   - `post.py` and `get.py` currently hardcode `user_id = 1`. Until multi-tenant user extraction via JWT dependencies is added to those routes in FastAPI, all requests operate against user ID 1.

---

## Step 1: Create the API Helper (`src/api/api.js`)

Create a dedicated API client in `frontend/src/api/api.js`:

```javascript
// frontend/src/api/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('debtbook_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // ---- Authentication ----
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Incorrect username or password');
    }
    return res.json(); // { access_token, token_type }
  },

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/new/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async checkToken(token) {
    const res = await fetch(`${API_BASE_URL}/token/check?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      throw new Error('Token expired or invalid');
    }
    return res.json(); // { username, exp }
  },

  // ---- Debtors ----
  async getDebtors() {
    const res = await fetch(`${API_BASE_URL}/user/debtors`, {
      headers: getAuthHeaders(),
    });

    // Handle backend 400/404 quirk for empty tables
    if (res.status === 400 || res.status === 404) {
      return [];
    }
    if (!res.ok) {
      throw new Error("Couldn't load debtors");
    }
    return res.json();
  },

  async createDebtor({ name, mobile_no }) {
    const res = await fetch(`${API_BASE_URL}/new/debtor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        mobile_no: mobile_no || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Couldn't save debtor");
    }
    return res.json();
  },

  // ---- Transactions ----
  async getTransactions(debtorId = null) {
    let url = `${API_BASE_URL}/user/transactions`;
    if (debtorId) {
      url += `?debtor_id=${debtorId}`;
    }

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    // Handle backend 400/404 quirk for empty tables
    if (res.status === 400 || res.status === 404) {
      return [];
    }
    if (!res.ok) {
      throw new Error("Couldn't load transactions");
    }
    return res.json();
  },

  async createTransaction({ debtor_id, txn_type, amount }) {
    const res = await fetch(`${API_BASE_URL}/new/transaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        debtor_id: Number(debtor_id),
        txn_type,
        amount: parseFloat(amount),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Couldn't save transaction");
    }
    return res.json();
  },
};
```

---

## Step 2: Update `src/Context/context.jsx`

Replace hardcoded state initialization and local array mutations with API calls:

```javascript
// frontend/src/Context/context.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/api.js';

export { formatCurrency, getInitials } from '../utils/format.js';

export const DebtContext = createContext(null);

export const DebtProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('debtbook_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('debtbook_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [debtors, setDebtors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);

  const [modal, setModal] = useState({
    isOpen: false,
    type: 'debtor',
    debtorId: null,
    txnType: 'DEBT',
  });

  // ---- Data Fetching ----
  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [debtorsData, txnsData] = await Promise.all([
        api.getDebtors(),
        api.getTransactions(),
      ]);
      setDebtors(debtorsData);
      setTransactions(txnsData);
    } catch (err) {
      setAlert({
        title: "Couldn't load data",
        text: err.message || 'Check that the backend is running at http://localhost:8000',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load data on startup or when token changes
  useEffect(() => {
    if (token) {
      refreshData();
    } else {
      setDebtors([]);
      setTransactions([]);
    }
  }, [token, refreshData]);

  // Validate token on startup
  useEffect(() => {
    if (token) {
      api.checkToken(token).catch(() => {
        logout();
      });
    }
  }, []);

  // ---- Modal Controls ----
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

  // ---- Actions with Live Backend ----
  const addDebtor = async ({ name, mobile_no }) => {
    try {
      await api.createDebtor({ name, mobile_no });
      await refreshData();
      return { success: true };
    } catch (err) {
      setAlert({ title: "Couldn't save debtor", text: err.message });
      return { success: false, error: err.message };
    }
  };

  const addTransaction = async ({ debtor_id, txn_type, amount }) => {
    try {
      await api.createTransaction({ debtor_id, txn_type, amount });
      await refreshData(); // Backend automatically recomputes new balance
      return { success: true };
    } catch (err) {
      setAlert({ title: "Couldn't save transaction", text: err.message });
      return { success: false, error: err.message };
    }
  };

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem('debtbook_token', data.access_token);
      setToken(data.access_token);

      const profile = { username };
      localStorage.setItem('debtbook_user', JSON.stringify(profile));
      setUser(profile);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    try {
      await api.register(userData);
      // Automatically login after successful registration
      return await login(userData.username, userData.password);
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('debtbook_token');
    localStorage.removeItem('debtbook_user');
    setToken(null);
    setUser(null);
    setDebtors([]);
    setTransactions([]);
  };

  return (
    <DebtContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        debtors,
        transactions,
        loading,
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
        refreshData,
        showAlert: (title, text) => setAlert({ title, text }),
        dismissAlert: () => setAlert(null),
      }}
    >
      {children}
    </DebtContext.Provider>
  );
};

export const useDebt = () => {
  const context = useContext(DebtContext);
  if (!context) throw new Error('useDebt must be used within a DebtProvider');
  return context;
};
```

---

## Step 3: Configure Environment Variables

Create `frontend/.env`:

```ini
VITE_API_BASE_URL=http://localhost:8000
```

Verify that `backend/.env` allows the Vite dev server origin:
```ini
self_connect=http://localhost:5173
```

---

## Step 4: Verification & Testing Checklist

1. **Start the Backend**:
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```
   *FastAPI server should be live on `http://0.0.0.0:8000`.*

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Vite server will run on `http://localhost:5173`.*

3. **Test Full End-to-End Flow**:
   - Navigate to `/register` and create an account.
   - Verify `POST /new/user` inserts into DB and navigates to Dashboard.
   - Click **"Add debtor"** -> fill name and mobile -> click **"Save debtor"**. Verify `POST /new/debtor` executes and table updates.
   - Click **"New transaction"** -> select debtor, choose type ("Credit given" / "Payment received"), enter amount -> click **"Save transaction"**. Verify `POST /new/transaction` updates balance automatically.
   - Click a debtor row to verify `/debtor/:id` displays their single ledger from `GET /user/transactions?debtor_id=:id`.
