import { worker } from '../utils/worker.js';

const API_BASE_URL = import.meta.env.VITE_API;

const getAuthHeaders = () => {
  const token = worker.token_manager({ action: 'get' });
  const headers = {
    'content-type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // --- Authentication ---

  async login({ username, password }) {
    const formData = {
      username,
      password,
    };

    const res = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(formData),
    });

    return res;
  },


  async verify_token () {
    const res = await fetch(`${API_BASE_URL}/token/validation`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    return res
  },

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/new/user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return res;
  },

  async current_user() {
    const res = await fetch(`${API_BASE_URL}/current/user`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return res;
  },

  // --- Dashboard ---

  async dashboard() {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return res;
  },

  // --- Debtor ---

  async debtor_register(debtorData) {
    const res = await fetch(`${API_BASE_URL}/new/debtor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: debtorData.name,
        mobile_no: debtorData.mobile_no ? debtorData.mobile_no : null,
      }),
    });

    return res;
  },

  async user_debtors(debtor_id) {
    let endpoint = `${API_BASE_URL}/user/debtors`;

    if (debtor_id) {
      const params = new URLSearchParams({
        debtor_id,
      });
      endpoint = `${endpoint}?${params}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return res;
  },

  // --- Transactions ---

  async new_txn(txnData) {
    const res = await fetch(`${API_BASE_URL}/new/transaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(txnData),
    });

    return res;
  },

  async user_txn_fltr(debtor_id) {
    let endpoint = `${API_BASE_URL}/user/transactions`;

    if (debtor_id) {
      const params = new URLSearchParams({
        debtor_id,
      });
      endpoint = `${endpoint}?${params}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return res;
  },
};
