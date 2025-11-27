<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref(null);

// Ensure the user arrived here due to a conflict, not direct navigation
onMounted(() => {
  if (!authStore.tempCredentials) {
    router.push('/login');
  }
});

// User chose to terminate the old session and proceed
const handleForceLogin = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 1. Call the store action to re-send the login request with the flag
    await authStore.forceLogin();
    
    // 2. The store will handle the redirection to the dashboard on success
  } catch (err) {
    // Handle case where force login failed (e.g., credentials expired)
    error.value = 'Failed to proceed. Please re-enter your credentials.';
    router.push('/login');
  } finally {
    loading.value = false;
  }
};

// User chose to abandon the new login attempt
const handleCancel = () => {
  authStore.clearTempCredentials();
  router.push('/login');
};
</script>


<template>
  <div class="conflict-container">
    <h2>Active Session Detected!</h2>
    <p>We've detected that your account is currently logged in on another device or browser tab.</p>
    
    <div class="message-box">
      <p>⚠️ **Policy:** Only one active session is allowed at a time.</p>
      <p>Do you want to close the existing session and proceed with your login here?</p>
    </div>

    <div class="button-group">
      <button 
        @click="handleForceLogin" 
        :disabled="loading" 
        class="btn btn-primary"
      >
        <span v-if="loading">Proceeding...</span>
        <span v-else>✅ Yes, Proceed Here</span>
      </button>

      <button 
        @click="handleCancel" 
        :disabled="loading" 
        class="btn btn-secondary"
      >
        ❌ No, Keep Existing Session
      </button>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>



<style scoped>
/* Add some basic styling for the conflict view */
.conflict-container {
    max-width: 500px;
    margin: 80px auto;
    padding: 30px;
    border: 1px solid #ffcc00; /* Warning color */
    border-left: 5px solid #ffcc00;
    border-radius: 8px;
    background-color: #fffbe6; /* Light yellow background */
    text-align: center;
}
.message-box {
    background-color: #fff;
    padding: 15px;
    border-radius: 6px;
    margin: 20px 0;
    border: 1px solid #eee;
}
.button-group {
    display: flex;
    justify-content: space-around;
    margin-top: 30px;
}
.btn-primary { background-color: #dc3545; color: white; }
.btn-secondary { background-color: #6c757d; color: white; }
.error-message { color: red; margin-top: 20px; }
</style>