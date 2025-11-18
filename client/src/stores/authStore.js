import { defineStore } from 'pinia';
import api from '../api/axios'; // Import our configured axios instance

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,          // Stores { username, role }
    isAuthenticated: false,
    loading: true        // Prevents page load until we check session
  }),

  actions: {
    // 1. Check Session (Run this when the app starts)
    async checkSession() {
      try {
        const res = await api.get('/me'); // Calls the /me endpoint we tested in Postman
        this.user = res.data.user;
        this.isAuthenticated = true;
      } catch (err) {
        this.user = null;
        this.isAuthenticated = false;
      } finally {
        this.loading = false;
      }
    },

    // 2. Login Action
    async login(username, password) {
      const res = await api.post('/login', { username, password });
      this.user = res.data.user;
      this.isAuthenticated = true;
      return this.user.role; // Return role so the component knows where to redirect
    },

    // 3. Logout Action
    async logout() {
      await api.post('/logout');
      this.user = null;
      this.isAuthenticated = false;
      // Note: We will handle socket disconnection in the component or router later
    }
  }
});