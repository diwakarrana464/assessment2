import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";
import { socket } from "@/services/chatSocketService";
import axios from "../api/chatAxios";


export const useChatStore = defineStore("chat", {
  state: () => ({
    chatOpen: false,
    conversations: new Map(), //Key: userId (String), Value: Array<MessageObject>
    unreadCounts: new Map(), // Key: userId (String), Value: Count (Number)
    globalUnreadCount: 0, // Total unread messages across all conversations
    activeRecipient: null, // { id, username, role }
    availableTargets: [], // List of all currently available chat partners
  }),

  actions: {
    // --- UI ACTIONS ---
    toggleChat() {
      console.log("Toggling chat window. Current state:", this.chatOpen);
      this.chatOpen = !this.chatOpen;
      this.activeRecipient = null;
    },

    setActiveRecipient(recipient) {
      this.activeRecipient = recipient;
      if (recipient) {
        this.markAsRead(recipient.id);
      }
      //find out messages from this converstions map using recipient.id and start from last message using while loop till msg status is not 2 and check if isSelf is false emit the event message_read_update_status
      const msgs = this.conversations.get(recipient.id) || [];
      const authStore = useAuthStore();
      let i = msgs.length - 1;
      while (i >= 0) {
        const msg = msgs[i];
        console.log(
          "Checking message for read receipt:",
          msg.status,
          msg.isSelf
        );
        if (msg.status === 2) {
          break; // stop if message is already read
        }
        if (!msg.isSelf) {
          // emit read receipt for this message.
          socket.emit("message_read_update_status", {
            messageId: msg._id,
            readerId: authStore.user.id,
          });
        }
        i--;
      }
    }, // end of setActiveRecipient

    markAsRead(userId) {
      const currentCount = this.unreadCounts.get(userId) || 0;
      if (currentCount > 0) {
        this.globalUnreadCount -= currentCount;
        this.unreadCounts.set(userId, 0);
      }
    },

    // Action triggered by the Socket Service upon receiving a message
    handleIncomingMessage(serverMessagePayload) {
      const senderId = serverMessagePayload.senderId;
      const authStore = useAuthStore();
      const currentUserId = authStore.user.id;

      // 1. Determine the key for the conversation (The message is always from the senderId)
      const conversationPartnerId = senderId;

      // 2. Add the full server message object to the conversation array
      const chatArray = this.conversations.get(conversationPartnerId) || [];

      // CRITICAL: Determine isSelf for the receiver's UI object
      const finalMessageObject = {
        ...serverMessagePayload, // Includes _id, status: 1, timestamp
        isSelf: senderId.toString() === currentUserId.toString(), // Should be false for incoming
      };

      chatArray.push(finalMessageObject);
      this.conversations.set(conversationPartnerId, chatArray);

      // 3. Update UNREAD COUNTS and UI logic (This logic is fine)
      if (
        !this.activeRecipient ||
        this.activeRecipient.id.toString() !== senderId.toString()
      ) {
        // Message is from a background/new sender
        const currentCount = this.unreadCounts.get(senderId) || 0;
        this.unreadCounts.set(senderId, currentCount + 1);
        this.globalUnreadCount++;
      } else {
        // Message is for the currently active window; mark as read immediately.
        // NOTE: This logic should ideally be moved to the component with IntersectionObserver.
        this.markAsRead(senderId);
        socket.emit("message_read_update_status", {
          messageId: serverMessagePayload._id,
          readerId: currentUserId,
        });
      }
    }, // end of handleIncomingMessage

    //.............................SEND MESSAGE .............................
    sendMessage(messageText) {
      const authStore = useAuthStore();
      const recipientId = this.activeRecipient.id;

      //Generate unique temporary ID for later confirmation
      const tempId =
        Date.now().toString() + Math.random().toString(36).substring(2, 6);
      const currentUserId = authStore.user.id;

      if (!recipientId || !authStore.isAuthenticated) {
        console.error(
          "Cannot send message: Recipient not selected or user not authenticated."
        );
        return;
      }

      //Prepare the payload for the server (Minimal data needed for persistence)
      const serverPayload = {
        recipientId: recipientId,
        message: messageText,
        tempId: tempId, // Sent to be echoed back by the server
      };

      //Emit message to the server
      socket.emit("send_private_message", serverPayload);
      console.log(`Emitted private message to server:`, serverPayload);

      //OPTIMISTIC UPDATE: Create the temporary message object for the UI
      const tempMessageObject = {
        tempId: tempId, // CRITICAL for confirmation lookup
        senderId: currentUserId,
        senderUsername: authStore.user.username,
        message: messageText,
        timestamp: new Date(),
        isSelf: true,
        status: 0, // 0: Sending (Pending confirmation)
      };

      //Update the local Map directly
      const conversationPartnerId = recipientId;
      const chatArray = this.conversations.get(conversationPartnerId) || [];
      chatArray.push(tempMessageObject);
      this.conversations.set(conversationPartnerId, chatArray);
    }, // end of sendMessage

    // Action triggered by Socket Service to update the target list
    setAvailableTargets(targets) {
      this.availableTargets = targets;
      console.log(
        "Available chat targets updated in store:",
        this.availableTargets
      );
    },
    removeFromTargets(target) {
      // Remove a target from availableTargets based on id
      this.availableTargets = this.availableTargets.filter(
        (t) => t.id !== target.id
      );
      //decrease the globbal unread count accordingly
      const unreadForTarget = this.unreadCounts.get(target.id) || 0;
      this.globalUnreadCount -= unreadForTarget;
      this.unreadCounts.delete(target.id);
    },
    addIntoTargets(target) {
      this.availableTargets.push(target);
    },
    //..........................................................................................
    confirmMessageReceived(confirmedPayload) {
      const targetId = confirmedPayload.recipientId;
      const incomingTempId = confirmedPayload.tempId; // The key to success!

      if (this.conversations.has(targetId)) {
        let messages = this.conversations.get(targetId);

        //Find the temporary message using the guaranteed unique tempId
        const tempIndex = messages.findIndex(
          (msg) => msg.tempId === incomingTempId
        );

        if (tempIndex !== -1) {
          // Update the temporary message with the confirmed payload from server
          messages[tempIndex] = {
            ...confirmedPayload,
            isSelf: true,
          };

          // Ensure the Map is reactive
          this.conversations.set(targetId, messages);
          console.log(
            "Temporary message confirmed and updated:",
            messages[tempIndex]
          );
        } else {
          console.warn(
            `Confirmation received for tempId: ${incomingTempId}, but no matching temporary message found. State might be stale.`
          );
        }
      }
    }, // end of confirmMessageReceived

    // Update message status to 'read' (2) for a given messageId within the conversation
    updateMessageStatus({ messageId, readerId }) {
      try {
        if (!readerId || !messageId) {
          console.warn(
            "updateMessageStatus called without readerId or messageId",
            { readerId, messageId }
          );
          return;
        }

        // Get messages array for the reader (conversation partner)
        const msgs = this.conversations.get(readerId) || [];

        if (!msgs || msgs.length === 0) {
          console.warn(`No conversation found for readerId=${readerId}`);
          return;
        }

        // Create a shallow copy and update the matching message's status to 2
        const updated = msgs.map((m) => {
          const mId = m._id || m.id || m.messageId || m.tempId;
          if (mId && mId.toString() === messageId.toString()) {
            return { ...m, status: 2 };
          }
          return m;
        });

        // Set the updated array back into the Map to ensure reactivity
        this.conversations.set(readerId, updated);
        console.log(
          `updateMessageStatus: set status=2 for message ${messageId} in conversation ${readerId}`
        );
      } catch (err) {
        console.error("Error in updateMessageStatus:", err);
      }
    },

    async fetchUnreadCount(partnerId) {
      try {
        const response = await axios.get(`/api/chat/unread/${partnerId}`);
        const count = response.data.unreadCount;
        this.unreadCounts.set(partnerId, count);
        this.globalUnreadCount += count;

        console.log(`Updated unread count for ${partnerId}: ${count}`);
      } catch (error) {
        console.error(`Error fetching unread count for ${partnerId}:`, error);
      }
    },
  }, // end of actions

  getters: {
    // Getter to retrieve messages for the currently active conversation (used by UI)
    currentMessages: (state) => {
      if (!state.activeRecipient) return [];
      return state.conversations.get(state.activeRecipient.id) || [];
    },

    // Getter to create the list for the UI (username + badge)
    targetListForUI: (state) => {
      return state.availableTargets
        .map((target) => {
          const unread = state.unreadCounts.get(target.id) || 0;
          return {
            ...target,
            unreadCount: unread,
            isActive: state.activeRecipient?.id === target.id,
          };
        })
        .sort((a, b) => {
          return b.unreadCount - a.unreadCount;
        });
    },
  },
});
