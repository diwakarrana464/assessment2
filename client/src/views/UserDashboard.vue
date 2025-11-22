<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';
import { socket } from '../socket';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (authStore.user) {

    socket.connect();
    socket.emit('user-connected', {
      username: authStore.user.username,
      role: authStore.user.role
    });
  }
});

onUnmounted(() => {
  socket.disconnect();
});

//Logout Logic
const handleLogout = async () => {
  await authStore.logout();
  socket.disconnect();
  router.push('/login');
};
</script>

<template>
  <div class="dashboard-container">
    <header>
      <h1>User Dashboard</h1>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </header>
    
    <main class="card">
      <div class="welcome-section">
        <h2>Welcome, <span class="highlight">{{ authStore.user?.username }}</span>!</h2>
        <p>You are currently logged in as a <strong>Standard User</strong>.</p>
        
        <div class="status-indicator">
          <span class="dot"></span> Live Connection Active
        </div>
        
        <p class="info">
          The Admin is currently monitoring your session status in real-time.
          If you close this tab or log out, the admin dashboard will update immediately.
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  text-align: center;
}

.highlight {
  color: #42b883;
  font-weight: bold;
}

.logout-btn {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.logout-btn:hover {
  background-color: #d9363e;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  background: #e6fffa;
  color: #00aa90;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  margin: 20px 0;
}

.dot {
  height: 10px;
  width: 10px;
  background-color: #00aa90;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 170, 144, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 170, 144, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 170, 144, 0); }
}

.info {
  color: #666;
  margin-top: 20px;
  font-size: 0.9rem;
}
</style>