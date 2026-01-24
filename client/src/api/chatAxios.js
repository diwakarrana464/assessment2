import axios from 'axios';

const chatAxios = axios.create({
  baseURL: 'http://localhost:5000/api/chat',
  withCredentials: true // This forces the browser to send the Session Cookie
});

export default chatAxios;