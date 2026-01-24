// client/src/services/chatSocketService.js

import { socket } from "@/socket";
import { useChatStore } from "@/stores/chatStore";

export function initChatSocket() {
  // Note: This function runs once when the user successfully logs in.
  const chatStore = useChatStore();

  //Connection Success
  socket.on("connect", () => {
    console.log("Chat socket connected:", socket.id);
  });

  // first time fetching available chat targets
  socket.on("get_chat_targets", (targets) => {
    console.log("Received initial chat targets from server.", targets);
    chatStore.setAvailableTargets(targets);
  });

  //Connection Failure
  socket.on("disconnect", () => {
    console.log("Chat socket disconnected.");
  });

  //Listener for Incoming Private Messages
  socket.on("receive_private_message", (payload) => {
    console.log("Private message received from server:", payload);
    chatStore.handleIncomingMessage(payload);
    console.log("Received private message from server:", payload);
  });


  socket.on("I am Active", (data) => {
    console.log("User Active:", data);
    chatStore.addIntoTargets(data);
    //chatStore.fetchUnreadCount(data.id);
  });
  
  socket.on("I am Inactive", (data) => {
    console.log("User Inactive:", data);
    chatStore.removeFromTargets(data);
  });

  // --- Listener: Status 1 Confirmation (Double Gray Tick) ---
  // Event: private_message_confirmation
  socket.on("private_message_confirmation", (confirmedPayload) => {
    console.log("Server Confirmed Status 1:", confirmedPayload);
    chatStore.confirmMessageReceived(confirmedPayload);
  });

  // --- Listener: Status 2 Update (Double Blue Tick - Read Receipt) ---
  socket.on("status_update", (payload) => {
    if (payload.newStatus === 2) {
      console.log(
        `Server Confirmed Status 2 (Read): Message ${payload.messageId} ${payload.readerId}`
      );
      chatStore.updateMessageStatus(payload);
    }
  });
}

export function removeChatListeners() {
  socket.off("targets_updated");
  socket.off("receive_private_message");
  socket.off("connect");
  socket.off("disconnect");
  socket.off("I am Active");
  socket.off("I am Inactive");
  socket.off("message_received_confirm");
  socket.off("status_update");
}

export { socket };
