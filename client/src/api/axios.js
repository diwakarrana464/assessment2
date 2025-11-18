import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/auth', // Points to your Express backend
  withCredentials: true // CRITICAL: This forces the browser to send the Session Cookie
});

export default api;