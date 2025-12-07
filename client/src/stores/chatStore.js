
import { defineStore } from 'pinia';
import { useAuthStore } from './authStore'; // Needed to get current user ID/Role    
import { socket } from '@/services/chatSocketService';



export const useChatStore = defineStore('chat', {

    state: () => ({
        // UI State
        chatOpen: false,
        unreadCount: 0,
        
        // Messaging State
        activeRecipient: null, // { id, username, role } of the person user is chatting with
        messages: [],         // Array of messages for the *current* active conversation
        availableTargets: [], // List for the dropdown (from the server)


    }),

    actions: {
        // --- UI ACTIONS ---
        toggleChat() {
            this.chatOpen = !this.chatOpen;
            // When chat opens, clear unread count
            if (this.chatOpen) {
                this.unreadCount = 0;
            }
        },

        // --- CORE CHAT LOGIC ---
        setActiveRecipient(recipient) {
            // Check if the recipient changed. If so, clear old messages.
            if (!this.activeRecipient || this.activeRecipient.id !== recipient.id) {
                this.messages = []; 
                this.unreadCount = 0;
                console.log(`Active recipient changed to ${recipient.username}. Cleared old messages.`);
                console.log('New active recipient details:', recipient);
            }
            this.activeRecipient = recipient;
        },

        // Action to send a message to the server
        sendMessage(messageText) {
            const authStore = useAuthStore();
            if (!this.activeRecipient || !authStore.isAuthenticated) {
                console.error("Cannot send message: Recipient not selected or user not authenticated.");
                return;
            }

            const messagePayload = {
                recipientId: this.activeRecipient.id,
                message: messageText
            };
            
            // Emit the private message event to the server
            socket.emit('send_private_message', messagePayload);

            console.log(`Emitted private message to server:`, messagePayload);

            // OPTIMISTIC UPDATE: Add the message to the local array immediately
            this.messages.push({
                senderId: authStore.user.id,
                senderUsername: authStore.user.username,
                message: messageText,
                timestamp: new Date(),
                isSelf: true
            });
            console.log('Message added to local store optimistically.', this.messages);
        },

        // Action triggered by the Socket Service upon receiving a message (Listener 2)
        handleIncomingMessage(payload) {
            //const authStore = useAuthStore();
            
            // Ensure the message is for the currently logged-in user (sanity check)
            // if (authStore.user.id.toString() !== payload.recipientId.toString()) {
            //     console.warn("Received message not intended for current user.");
            //     return;
            // }
            
            const senderId = payload.senderId;
            const messageData = { ...payload, isSelf: false };
            console.log('Handling incoming message in store:', messageData);
            

            // 1. Check if the message is from the *active* chat partner
            if (this.activeRecipient && this.activeRecipient.id.toString() === senderId.toString()) {
                this.messages.push(messageData);
                console.log('Incoming message added to active chat.', messageData);
                // If chat window is closed, open it gracefully (UX requirement)
                // if (!this.chatOpen) {
                //     this.toggleChat(); 
                // }
            } else {
                // 2. Message is from a new person or background chat
                
                // Set the sender as the active recipient (UX requirement)
                this.setActiveRecipient({ 
                    id: senderId, 
                    username: payload.senderUsername, 
                    role: payload.senderRole // assuming role is included in payload
                });

                this.messages.push(messageData);
                console.log('Incoming message added from new/background chat.', messageData);
                
                // Ensure chat window extends (UX requirement)
                // if (!this.chatOpen) {
                //      this.toggleChat();
                // }
                
                // Play notification sound (Conceptual requirement)
                // playNotificationSound();
                
                this.unreadCount++;
            }
        },
        
        // Action triggered by Socket Service to update the target dropdown (Listener 1)
        setAvailableTargets(targets) {
            this.availableTargets = targets;
            console.log('Available chat targets updated in store:', this.availableTargets);
        },
    }
});