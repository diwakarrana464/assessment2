<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';
import { socket } from '../socket';

const authStore = useAuthStore();
const router = useRouter();
const connectedUsers = ref([]);

// Format date helper
const formatTime = (dateString) => {
  if (!dateString) return 'Just now';
  return new Date(dateString).toLocaleTimeString();
};

onMounted(() => {
  // 1. Connect to the socket server
  socket.connect();

  // 2. Identify ourselves as Admin so we are part of the network
  socket.emit('user-connected', {
    username: authStore.user?.username,
    role: 'admin'
  });

  // 3. LISTEN: When the server sends the updated list (Login/Logout/Disconnect)
  socket.on('update-user-list', (users) => {
    console.log('Received live update:', users);
    connectedUsers.value = users;
  });
});

onUnmounted(() => {
  // Cleanup listeners to prevent memory leaks
  socket.off('update-user-list');
  socket.disconnect();
});

const handleLogout = async () => {
  await authStore.logout();
  socket.disconnect();
  router.push('/login');
};
</script>

<template>
  <div class="admin-container">
    <header>
      <div class="title-group">
        <h1>Admin Dashboard</h1>
        <span class="live-badge">● Live Monitoring</span>
      </div>
      <div class="user-info">
        <span>Hello, {{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </header>

    <main>
      <div class="stats-cards">
        <div class="card">
          <h3>Active Sessions</h3>
          <div class="number">{{ connectedUsers.length }}</div>
        </div>
      </div>

      <div class="table-container">
        <h2>Currently Connected Users</h2>
        <table v-if="connectedUsers.length > 0">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Socket ID (Session)</th>
              <th>Time Connected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in connectedUsers" :key="user.socketId">
              <td class="fw-bold">{{ user.username }}</td>
              <td>
                <span :class="['badge', user.role === 'admin' ? 'badge-admin' : 'badge-user']">
                  {{ user.role.toUpperCase() }}
                </span>
              </td>
              <td class="mono">{{ user.socketId }}</td>
              <td>{{ formatTime(user.connectedAt) }}</td>
              <td><span class="status-active">Active</span></td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <p>Waiting for connections...</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.live-badge {
  color: #ff4d4f;
  background: #fff1f0;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  animation: blink 2s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  text-align: center;
}

.card .number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  color: #666;
  font-weight: 600;
}

.mono {
  font-family: monospace;
  color: #666;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge-admin { background-color: #e6f7ff; color: #1890ff; }
.badge-user { background-color: #f6ffed; color: #52c41a; }

.logout-btn {
  background-color: #333;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 15px;
}

.status-active {
  color: #52c41a;
  font-weight: bold;
}
</style>