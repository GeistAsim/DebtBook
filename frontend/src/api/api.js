// import dotenv from 'dotenv';


// dotenv.config();
const API_BASE_URL = import.meta.env.VITE_API
// const API_BASE_URL = process.env.VITE_API


export const api = {

  // --- Authentication ---

  async login(username, password) {
    const formData = {
      "username": username,
      "password": password
    }

    let res = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(formData)
    });

    return res;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/new/user`, {
      method: 'POST',
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    return res;
  },


  // -- Debtor --
  
  async debtor_register(debtorData) {
    const res = await fetch(`${API_BASE_URL}/new/debtor`, {
      method: 'POST',
      headers: {
        // 'Authorization': `Bearer ${access_token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(debtorData)
    });

    return res
  },


  async user_debtors() {
    const res = await fetch(`${API_BASE_URL}/user/debtors`)
  }


  // -- Transactions --
  
  async user_txn_fltr(debtor_id) {
    let endpoint = `${API_BASE_URL}/user/transactions`

    if (debtor_id) {
      const params = new URLSearchParams({
        "debtor_id": debtor_id
      })
      endpoint = endpoint +  `?${params}`
    }

    console.log(endpoint)
    const res = await fetch(`${endpoint}`, {
      method: 'GET',
      headers: {
        // 'Authorization': `Bearer ${access_token}`,
        "content-type": "application/json"
      },
    });

    return res
  } 


// Exported function close
}



