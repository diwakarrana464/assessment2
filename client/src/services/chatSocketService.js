// client/src/services/chatSocketService.js

import { socket } from '@/socket';
import { useChatStore } from '@/stores/chatStore'; 

export function initChatSocket() {
    // Note: This function runs once when the user successfully logs in.
    const chatStore = useChatStore();

    // 1. Connection Success
    socket.on('connect', () => {
        console.log('Chat socket connected:', socket.id);
        // socket.emit('get_available_targets');
    });

    // 2. Connection Failure
    socket.on('disconnect', () => {
        console.log('Chat socket disconnected.');
        // Update global state if needed
    });
    
    // // 3. Listener for Server's Available Target List
    // socket.on('available_targets_list', (targets) => {
    //     console.log('Received available chat targets from server on connecting to server first time.');
    //     chatStore.setAvailableTargets(targets);
    // });

    // 🎯 NEW LISTENER: Continuous push updates for the target list
    socket.on('targets_updated', (targets) => {
        console.log('Received updated chat targets from server.', targets);
        chatStore.setAvailableTargets(targets);
    });

    // 4. Listener for Incoming Private Messages
    socket.on('receive_private_message', (payload) => {
        console.log('Private message received from server:', payload);
        chatStore.handleIncomingMessage(payload);
        console.log('Received private message from server:', payload);
    });
    
    // 5. Confirmation Listener (For sender to confirm message was routed)
    // socket.on('message_sent_confirm', (payload) => {
    //     console.log(`Message confirmed sent to recipient ID: ${payload.recipientId}`);
    // });
}

export function removeChatListeners() {
    socket.off('targets_updated');
    socket.off('receive_private_message');
    socket.off('connect');
    socket.off('disconnect');
}

export { socket };