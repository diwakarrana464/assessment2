<template>
  <div class="chat-window-container" v-if="chatStore.chatOpen">

    <div class="chat-header">
      <select 
        v-model="selectedRecipientId" 
        @change="handleRecipientChange"
        class="recipient-select"
      >
        <option :value="null" disabled>Select Chat Partner</option>
        <option 
          v-for="target in chatStore.availableTargets" 
          :key="target.id" 
          :value="target.id"
        >
          {{ target.username }} ({{ target.role }})
        </option>
      </select>
      
      <button @click="chatStore.toggleChat" class="close-btn">X</button>
    </div>
    
    <div v-if="!chatStore.activeRecipient" class="chat-messages empty-state">
      Please select a partner from the dropdown to start chatting.
    </div>

    <div v-else class="chat-body">
      <div class="chat-messages">
        <div 
          v-for="(msg, index) in chatStore.messages" 
          :key="index" 
          :class="['message', msg.isSelf ? 'self' : 'other']"
        >
          <span class="sender-name">{{ msg.isSelf ? 'You' : msg.senderUsername }}:</span>
          <span class="message-text">{{ msg.message }}</span>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          v-model="messageText" 
          @keyup.enter="sendMessage" 
          placeholder="Type message..." 
          :disabled="!chatStore.activeRecipient"
        />
        <button @click="sendMessage" :disabled="!chatStore.activeRecipient">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore';

const chatStore = useChatStore();
const messageText = ref('');
const selectedRecipientId = ref(null);

// Initialize selectedRecipientId when the store updates
watch(() => chatStore.activeRecipient, (newRecipient) => {
    if (newRecipient) {
        selectedRecipientId.value = newRecipient.id;
    }
}, { immediate: true });

const handleRecipientChange = () => {
    const selected = chatStore.availableTargets.find(t => t.id === selectedRecipientId.value);
    if (selected) {
        chatStore.setActiveRecipient(selected);
    }
};

const sendMessage = () => {
    if (messageText.value.trim() && chatStore.activeRecipient) {
        chatStore.sendMessage(messageText.value.trim());
        console.log(`Message sent to ${chatStore.activeRecipient.username}: ${messageText.value.trim()}`);
        messageText.value = ''; // Clear input field
    }
};
</script>

<style scoped>
.chat-window-container {
  position: fixed;
  bottom: 80px; /* Above the icon */
  right: 20px;
  width: 350px;
  height: 450px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f1f1f1;
  border-bottom: 1px solid #ddd;
}
.recipient-select {
  flex-grow: 1;
  padding: 5px;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
.chat-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.chat-messages {
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
}
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #888;
    padding: 20px;
}
.message {
  margin-bottom: 8px;
  max-width: 80%;
  padding: 6px 10px;
  border-radius: 15px;
  line-height: 1.4;
}
.self {
  align-self: flex-end;
  margin-left: auto;
  background-color: #42b883;
  color: white;
}
.other {
  align-self: flex-start;
  margin-right: auto;
  background-color: #e0e0e0;
  color: #333;
}
.chat-input {
  display: flex;
  border-top: 1px solid #ddd;
}
.chat-input input {
  flex-grow: 1;
  padding: 10px;
  border: none;
}
.chat-input button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
}
</style>