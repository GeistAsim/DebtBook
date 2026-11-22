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
  }
// Exported function close
}



