<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

// Reactive variables for the form
const username = ref('');
const password = ref('');
const errorMessage = ref('');

const handleLogin = async () => {
  try {
    // Reset error
    errorMessage.value = '';
    
    // Call the store action defined in authStore.js
    // This sends the POST request to /api/auth/login
    const role = await authStore.login(username.value, password.value);

    // Redirect based on Role [cite: 13]
    if (role === 'admin') {
      router.push('/admin-dashboard');
    } else {
      router.push('/dashboard');
    }
  } catch (err) {
    // If backend returns 401, show error
    console.error(err);
    errorMessage.value = err.response?.data?.message || 'Login failed';
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Enter username" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Enter password" 
            required 
          />
        </div>

        <div v-if="errorMessage" class="error-msg">
          {{ errorMessage }}
        </div>

        <button type="submit">Sign In</button>
      </form>
      
      <p class="hint">
        Try: <strong>admin_dave</strong> or <strong>user_alice</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #eef2f5;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Ensures padding doesn't break width */
}

button {
  width: 100%;
  padding: 10px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

button:hover {
  background-color: #3aa876;
}

.error-msg {
  color: red;
  margin-top: 10px;
  font-size: 0.9rem;
}

.hint {
  margin-top: 20px;
  font-size: 0.8rem;
  color: #888;
}
</style>