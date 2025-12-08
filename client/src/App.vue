<script setup>
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';
import ChatIcon from './views/ChatIcon.vue';
import ChatWindow from './views/ChatWindow.vue';

const authStore = useAuthStore();
const chatStore = useChatStore();
</script>

<template>
  <router-view />
  <template v-if="authStore.isAuthenticated">
    <ChatWindow v-if="chatStore.chatOpen" />
    <ChatIcon v-else />
  </template>
  </template>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f4f7f6;
}
</style>