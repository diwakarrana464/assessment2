<template>
  <div 
    class="chat-icon"
    @click="chatStore.toggleChat"
    :class="{ 'pulse': chatStore.unreadCount > 0 }"
  >
    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm6 2a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"></path></svg>
    <span v-if="chatStore.unreadCount > 0" class="badge">{{ chatStore.unreadCount }}</span>
  </div>
</template>

<script setup>
import { useChatStore } from '@/stores/chatStore';
const chatStore = useChatStore();
</script>

<style scoped>
.chat-icon {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background-color: #42b883; /* Vue Green */
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
  z-index: 1000;
}
.chat-icon:hover {
  transform: scale(1.1);
}
.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff5722;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7em;
  font-weight: bold;
}
.pulse {
  animation: pulse-animation 1s infinite;
}
@keyframes pulse-animation {
  0% { box-shadow: 0 0 0 0 rgba(66, 184, 131, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(66, 184, 131, 0); }
  100% { box-shadow: 0 0 0 0 rgba(66, 184, 131, 0); }
}
</style>