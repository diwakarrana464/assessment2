import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';
import { socket } from '@/services/chatSocketService';

export const useChatStore = defineStore('chat', {

    state: () => ({
        chatOpen: false,
        conversations: new Map(), //Key: userId (String), Value: Array<MessageObject>
        unreadCounts: new Map(),  // Key: userId (String), Value: Count (Number)
        globalUnreadCount: 0, // Total unread messages across all conversations
        activeRecipient: null, // { id, username, role }
        availableTargets: [], // List of all currently available chat partners
    }),

    actions: {
        // --- UI ACTIONS ---
        toggleChat() {
            console.log('Toggling chat window. Current state:', this.chatOpen);
            this.chatOpen = !this.chatOpen;
            this.activeRecipient = null;
        },
        
        setActiveRecipient(recipient) {
            this.activeRecipient = recipient;
            if (recipient) {
                this.markAsRead(recipient.id);
            }
        },

        markAsRead(userId) {
            const currentCount = this.unreadCounts.get(userId) || 0;
            if (currentCount > 0) {
                this.globalUnreadCount -= currentCount;
                this.unreadCounts.set(userId, 0);
            }
        },

        sendMessage(messageText) {
            const authStore = useAuthStore();
            const recipientId = this.activeRecipient.id;
            
            if (!recipientId || !authStore.isAuthenticated) {
                console.error("Cannot send message: Recipient not selected or user not authenticated.");
                return;
            }

            const messagePayload = {
                recipientId: recipientId,
                message: messageText
            };
            
            socket.emit('send_private_message', messagePayload);
            console.log(`Emitted private message to server:`, messagePayload);

            // OPTIMISTIC UPDATE: Add the message to the local Map immediately
            this.addMessageToConversation(authStore.user.id, recipientId, messageText, true);
        },
        
        // Helper to add a message object to the correct Map entry
        addMessageToConversation(senderId, recipientId, content, isSelf) {
            const authStore = useAuthStore();
            const currentUserId = authStore.user.id;
            
            // Determine the key for the conversation (Sender or Recipient)
            const conversationPartnerId = (senderId.toString() === currentUserId.toString()) ? recipientId : senderId;
            
            const messageObject = {
                senderId: senderId,
                senderUsername: isSelf ? authStore.user.username : 'Friend',
                message: content,
                timestamp: new Date(),
                isSelf: isSelf
            };
            
            // Get or initialize the array for the conversation partner
            const chatArray = this.conversations.get(conversationPartnerId) || [];
            chatArray.push(messageObject);
            this.conversations.set(conversationPartnerId, chatArray);
        },

        // Action triggered by the Socket Service upon receiving a message
        handleIncomingMessage(payload) {
            const senderId = payload.senderId;
            // const authStore = useAuthStore();

            // Add the message to the persistent conversation Map
            this.addMessageToConversation(senderId, payload.recipientId, payload.message, false);

            //Update UNREAD COUNTS and UI
            if (!this.activeRecipient || this.activeRecipient.id.toString() !== senderId.toString()) {
                // Message is from a background/new sender
                const currentCount = this.unreadCounts.get(senderId) || 0;
                this.unreadCounts.set(senderId, currentCount + 1);
                this.globalUnreadCount++;
                
            } else {
                // Message is for the currently active window; mark as read immediately.
                this.markAsRead(senderId);
            }
        },
        
        // Action triggered by Socket Service to update the target list
        setAvailableTargets(targets) {
            this.availableTargets = targets;
            console.log('Available chat targets updated in store:', this.availableTargets);
        },
    },
    
    getters: {
        // Getter to retrieve messages for the currently active conversation (used by UI)
        currentMessages: (state) => {
            if (!state.activeRecipient) return [];
            return state.conversations.get(state.activeRecipient.id) || [];
        },
        
        // Getter to create the list for the UI (username + badge)
        targetListForUI: (state) => {
            return state.availableTargets.map(target => {
                const unread = state.unreadCounts.get(target.id) || 0;
                return {
                    ...target,
                    unreadCount: unread,
                    isActive: state.activeRecipient?.id === target.id, 
                };
            }).sort((a, b) => {
                return b.unreadCount - a.unreadCount;
            });
        }
    }
});