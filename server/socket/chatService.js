// server/socket/chatService.js

function getChatTargets(activeUsers, requestingUser) {
    const allActiveUsers = Array.from(activeUsers.values());

    if (requestingUser.role === 'admin') {
        return allActiveUsers
            .filter(u => u.userId.toString() !== requestingUser.id.toString())
            .map(u => ({ id: u.userId, username: u.username, role: u.role }));
    } else {
        return allActiveUsers
            .filter(u => u.role === 'admin')
            .map(u => ({ id: u.userId, username: u.username, role: u.role }));
    }
}

function handlePrivateMessage(io, activeUsers, senderSession, payload) {
    const { recipientId, message } = payload;
    const senderUsername = senderSession.username;
    
    //Find the recipient's active socket(s)
    const recipientSockets = Array.from(activeUsers.values())
        .filter(u => u.userId.toString() === recipientId.toString());
        
        console.log('Recipient sockets found for message delivery:', recipientSockets);

    const messagePayload = {
        senderId: senderSession.id,
        senderUsername: senderUsername,
        message: message,
        timestamp: new Date(),
        //recipientId: recipientId
    };

    console.log('Prepared message payload for delivery:', messagePayload);

    //Delivery
    if (recipientSockets.length > 0) {
         recipientSockets.forEach(recipient => {
             io.to(recipient.socketId).emit('receive_private_message', messagePayload);
         });
    }
    console.log(`Message delivered to recipient ID: ${recipientId} from sender: ${senderUsername}`);
    // Return the payload for confirmation to the sender
    return messagePayload;    // stored for confirmation purposes
}


module.exports = {
    getChatTargets,
    handlePrivateMessage
};