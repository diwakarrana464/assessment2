import { defineStore } from 'pinia';
import api from '../api/axios';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,          // Stores { username, role }
    isAuthenticated: false,
    loading: true,        // Prevents page load until we check session
    tempCredentials: null,
  }),

  actions: {
    //Check Session (Run this when the app starts)
    async checkSession() {
      try {
        const res = await api.get('/me'); 
        console.log('Session valid. User authenticated.', JSON.stringify(res.data));
        this.user = res.data.user;
        this.isAuthenticated = true;
      } catch (err) {
        this.user = null;
        this.isAuthenticated = false;
      } finally {
        this.loading = false;
      }
    },

    //Login Action................................................................................
    async login(username, password) {
      try {
        this.tempCredentials = null;
        const response = await api.post('/login', { username, password });
        // Success: Complete login (200 OK)
        this.setAuthStatus(response.data.user);        
        
        if (response.data.user.role === 'admin') {
          router.push('/admin-dashboard');
        } else {
          router.push('/user-dashboard');
        }
        
      } catch (error) {
        if (error.response && error.response.status === 409 && error.response.data.code === 'SESSION_CONFLICT') {
          
          // CONFLICT DETECTED: Store credentials and redirect
          this.tempCredentials = { username, password };
          router.push('/session-conflict');
          
        } else {
          // Normal error (401, 500, etc.)
          throw error;
        }
      }
    },
    
    // --FORCE LOGIN ACTION ---..........................................................
    async forceLogin() {
      if (!this.tempCredentials) {
        throw new Error("No pending login credentials found.");
      }
      
      const { username, password } = this.tempCredentials;
      
      // Send the request again with the force_logout flag set to true
      const response = await api.post('/login', { 
        username, 
        password, 
        force_logout: true //Triggers server-side destruction
      });

      // Clear temp credentials regardless of success
      this.tempCredentials = null;
      
      // Success: Complete login
      this.setAuthStatus(response.data.user);

      // Redirect based on role
      if (response.data.user.role === 'admin') {
          router.push('/admin-dashboard');
        } else {
          router.push('/user-dashboard');
        }
    },
    
    //HELPER ACTIONS ---
    setAuthStatus(user) {
      this.user = user;
      this.isAuthenticated = true;
    },
    clearTempCredentials() {
      this.tempCredentials = null;
    },

    //Logout Action...............................................................................................
    async logout() {
      await api.post('/logout');
      this.user = null;
      this.isAuthenticated = false;
    },
  }
});