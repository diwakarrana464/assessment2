<template>
  <div class="chat-window-container">

    <div class="chat-header">
      <h3 class="header-title">
        <!-- Display the active partner's name or a default message -->
        {{ chatStore.activeRecipient ? chatStore.activeRecipient.username : 'Select Chat Partner' }}
      </h3>
      <button @click="chatStore.toggleChat" class="close-btn">X</button>
    </div>

    <div class="chat-main-area">
      <!-- User/Target List (Left Side) -->
      <div class="target-list-panel">
        <div class="target-list-scroll">
          <div 
            v-for="target in chatStore.targetListForUI" 
            :key="target.id" 
            :class="['target-item', { 'active': chatStore.activeRecipient?.id === target.id }]"
            @click="chatStore.setActiveRecipient(target)"
          >
            <span class="target-name">{{ target.username }} ({{ target.role }})</span>
            <span v-if="target.unreadCount > 0" class="unread-badge">{{ target.unreadCount }}</span>
          </div>
          <div v-if="chatStore.targetListForUI.length === 0" class="empty-list">No active partners</div>
        </div>
      </div>

      <!-- Message Area (Right Side) -->
      <div class="message-panel">
        <div v-if="!chatStore.activeRecipient" class="chat-messages empty-state">
          Select a user from the left panel to start a new chat.
        </div>

        <div v-else class="chat-body">
          <!-- The container ref for scrolling -->
          <div ref="messagesContainer" class="chat-messages">
            <div 
              v-for="(msg, index) in chatStore.currentMessages" 
              :key="index" 
              :class="['message', msg.isSelf ? 'self' : 'other']"
            >
              <!-- <span class="sender-name">{{ msg.isSelf ? 'You' : msg.senderUsername }}:</span> -->
               <span class="sender-name">
                {{ msg.isSelf ? 'You' : msg.senderUsername }} 
                <span class="timestamp-label">
                    ({{ formatMessageTime(msg.timestamp) }})
                </span>
              :</span>
              <span class="message-text">{{ msg.message }}</span>

              <!-- MESSAGE STATUS ICONS (SINGLE/DOUBLE TICK) -->
              <span v-if="msg.isSelf" class="message-status-icon">
                <!-- Status 0: Sending/Pending (Red Clock) -->
                <svg
                  v-if="msg.status === 0"
                  class="status-clock"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 13H11V7h1.5v8z" />
                </svg>

                <!-- Status 1: Delivered (Grey Double Tick) -->
                <svg
                  v-else-if="msg.status === 1"
                  class="status-tick status-delivered"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.71 7.21a.996.996 0 0 0-1.41 0L12 12.59 7.71 8.3a.996.996 0 1 0-1.41 1.41l5 5a.996.996 0 0 0 1.41 0l6-6a.996.996 0 0 0 0-1.41zm-6-2.5a.996.996 0 1 0-1.41 0L7 9.09l-.7-.7a.996.996 0 1 0-1.41 1.41l2.71 2.71a.996.996 0 0 0 1.41 0l5-5a.996.996 0 1 0 0-1.41z" />
                </svg>

                <!-- Status 2: Read (Blue Double Tick) -->
                <svg
                  v-else-if="msg.status === 2"
                  class="status-tick status-read"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.71 7.21a.996.996 0 0 0-1.41 0L12 12.59 7.71 8.3a.996.996 0 1 0-1.41 1.41l5 5a.996.996 0 0 0 1.41 0l6-6a.996.996 0 0 0 0-1.41zm-6-2.5a.996.996 0 1 0-1.41 0L7 9.09l-.7-.7a.996.996 0 1 0-1.41 1.41l2.71 2.71a.996.996 0 0 0 1.41 0l5-5a.996.996 0 1 0 0-1.41z" />
                </svg>
              </span>
              <!-- END MESSAGE STATUS ICONS -->
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              v-model="messageText" 
              @keyup.enter="sendMessage" 
              placeholder="Type message..." 
              :disabled="!chatStore.activeRecipient"
            />
            <button @click="sendMessage" :disabled="!chatStore.activeRecipient || messageText.trim() === ''">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useChatStore } from '@/stores/chatStore';

const chatStore = useChatStore();
const messageText = ref('');
const messagesContainer = ref(null); // Ref for automatic scrolling

// --- SCROLL LOGIC ---
const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

// Watch the array length of the current conversation and scroll to bottom on update
watch(() => chatStore.currentMessages.length, () => {
    nextTick(() => {
        scrollToBottom();
    });
}, { immediate: true });
// Add a second watch: Scroll when the conversation partner changes
watch(() => chatStore.activeRecipient, () => {
    nextTick(() => {
        scrollToBottom();
    });
});

const sendMessage = () => {
    if (messageText.value.trim() && chatStore.activeRecipient) {
        chatStore.sendMessage(messageText.value.trim());
        messageText.value = '';
    }
};

// Utility function to format the timestamp for display
const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp); 
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    });
};
</script>

<style scoped>
.message-text {
    word-wrap: break-word;
}
.chat-window-container {
  position: fixed;
  bottom: 20px; 
  right: 20px;
  width: 600px;
  height: 500px;
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
  padding: 10px 15px;
  background-color: #f1f1f1;
  border-bottom: 1px solid #ddd;
}
.header-title {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
  color: #555;
  padding: 5px;
}
.chat-main-area {
  flex-grow: 1;
  display: flex;
  overflow: hidden;
}

/* --- Left Panel: Target List --- */
.target-list-panel {
  width: 180px; /* Fixed width for the list */
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: #fafafa;
}
.target-list-scroll {
    flex-grow: 1;
}
.target-item {
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}
.target-item:hover {
  background-color: #e6e6e6;
}
.target-item.active {
  background-color: #d8f5e6; /* Light green highlight */
  font-weight: bold;
}
.unread-badge {
  background-color: #ff5722;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7em;
  font-weight: bold;
}

/* --- Right Panel: Messages --- */
.message-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - 180px);
}
.chat-messages {
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto; /* Allows scrolling for message history */
  background-color: #ffffff;
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
  padding: 8px 12px;
  border-radius: 18px;
  line-height: 1.4;
  /* position relative so the status icon can be absolutely positioned */
  position: relative;
  padding-right: 30px; /* space for the status icon on the right */
  padding-bottom: 18px; /* additional space at bottom for icon */
}
.self {
  margin-left: auto;
  background-color: #42b883;
  color: white;
  border-bottom-right-radius: 4px;
}
.other {
  margin-right: auto;
  background-color: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}
.sender-name {
    display: block;
    font-size: 0.7em;
    font-weight: 600;
    margin-bottom: 2px;
}
.chat-input {
  display: flex;
  border-top: 1px solid #ddd;
  padding: 5px;
}
.chat-input input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}
.chat-input button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0 15px;
  margin-left: 5px;
  cursor: pointer;
  border-radius: 4px;
}
.chat-body {
    /* CRITICAL FIX 3: Ensure this fills 100% of the message-panel's remaining space */
    flex-grow: 1; 
    display: flex;
    flex-direction: column; 
    overflow: hidden; /* Prevents body scrollbar from the input field */
}

.message-status-icon {
  position: absolute;
  bottom: 3px; /* Position relative to the bottom of the bubble */
  right: 5px; /* Position relative to the right edge */
  height: 14px; /* Slightly increased size for visibility */
  width: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10; /* Ensures the icon is rendered above the message text */
}

.status-tick,
.status-clock {
  height: 100%;
  width: 100%;
}

/* Status 0: Red Clock for Sending/Failed Delivery */
.status-clock {
  fill: #dc3545; /* Red color for warning/pending */
}

/* Status 1: Grey Double Tick for Delivered */
.status-delivered {
  fill: white
}

/* Status 2: Blue Double Tick for Read */
.status-read {
  fill: black; /* Bright blue color */
}
</style>