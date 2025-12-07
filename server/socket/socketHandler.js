// NOTE: This file assumes the secure middleware (from the previous step) 
// has successfully populated socket.request.session.user

const activeUsers = new Map();
const chatService = require('./chatService');
//const { getChatTargets, handlePrivateMessage } = require('../socket/chatService');

// The io object should be passed from the server setup
module.exports = (io) => { 
    io.on('connection', (socket) => {
        const userSession = socket.request.session.user; 
        
        if (!userSession) {
             return socket.disconnect(true); 
        }

        //MAPPING AND ROOM ASSIGNMENT
        activeUsers.set(userSession.id, {
            userId: userSession.id,
            username: userSession.username,
            role: userSession.role,
            connectedAt: new Date(),
            socketId: socket.id
        });

        if (userSession.role === 'admin') {
            socket.join('admins');
        }

        targetedBroadcastToAdminsOnly(io);

        pushAvailableTargetsToAll(io);

        // //Delegate Target Filtering
        // socket.on('get_available_targets', () => {
        //     const availableTargets = chatService.getChatTargets(activeUsers, userSession);
        //     socket.emit('available_targets_list', availableTargets);
        // });

        //Delegate Private Messaging
        socket.on('send_private_message', (payload) => {
            // Pass all required resources to the service
            const confirmation = chatService.handlePrivateMessage(
                io, 
                activeUsers, 
                userSession, 
                payload
            );
            console.log(`Private message processed for user: ${userSession.username}`, payload);
            //socket.emit('message_sent_confirm', confirmation);
            //console.log(`Sent message_sent_confirm to sender: ${userSession.username}`, confirmation);
        });

        //................................................................................................
        // User Disconnects (Tab closed or Network issue)
        socket.on('disconnect', () => {
            if (activeUsers.has(userSession.id)) {
                const user = activeUsers.get(userSession.id);
                console.log(`User disconnected: ${user.username}`);
                
                activeUsers.delete(userSession.id);
                targetedBroadcastToAdminsOnly(io);
                pushAvailableTargetsToAll(io);
            }
        });
        
        socket.on('user-logout', () => {
            if (activeUsers.has(userSession.id)) {
                activeUsers.delete(userSession.id);
                targetedBroadcastToAdminsOnly(io);
                pushAvailableTargetsToAll(io); // 🎯 NEW CALL
            }
        });
        
    });// end of io.on connection
//..................................................................................
    function targetedBroadcastToAdminsOnly(ioInstance) {
        const userList = Array.from(activeUsers.values());
        ioInstance.to('admins').emit('update-user-list', userList);
    }//end of targetedBroadcastToAdminsOnly
//...................................................................................



// Helper to broadcast personalized active targets to ALL connected users
function pushAvailableTargetsToAll(ioInstance) {
    // FIX: Use ioInstance.sockets.sockets for reliable iteration over ALL live sockets
    ioInstance.sockets.sockets.forEach(socket => {
        // 1. Check if the socket has a user ID associated (i.e., they are authenticated)
        // We use the activeUsers map to ensure the user is fully tracked and ready.
        const userId = socket.request.session?.user?.id; // Attempt to get the user ID from the session data attached by middleware
        
        if (userId && activeUsers.has(userId)) {
            const user = activeUsers.get(userId); // Get tracked data
            
            // 2. Generate a personalized target list for this specific user
            const availableTargets = chatService.getChatTargets(activeUsers, {
                id: user.userId, 
                role: user.role
            });
            
            // 3. Push the personalized list ONLY to this user's specific socket ID
            ioInstance.to(socket.id).emit('targets_updated', availableTargets);
            console.log(`Pushed personalized targets to user: ${user.username}`);
        }
        // Sockets without a valid user ID are skipped.
    });
}

};//end of module.exports