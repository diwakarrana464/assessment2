// server/socket/socketHandler.js (Revised Core Logic)

// NOTE: This file assumes the secure middleware (from the previous step) 
// has successfully populated socket.request.session.user

const activeUsers = new Map();

// The io object should be passed from the server setup
module.exports = (io) => { 
    io.on('connection', (socket) => {
        // Retrieve the authenticated user data (THIS IS THE TRUSTED SOURCE)
        const userSession = socket.request.session.user; 
        
        // Security check: Only authenticated users should proceed
        if (!userSession) {
             // Middleware should have handled this, but a final check is safe
             return socket.disconnect(true); 
        }

        console.log(`Authenticated client connected: ${userSession.username} (${socket.id})`);
        
        // --- 1. MAPPING AND ROOM ASSIGNMENT ---
        
        // Map the secure user data to the active connections
        activeUsers.set(userSession.id, {
            userId: userSession.id, // Use the permanent ID
            username: userSession.username,
            role: userSession.role, // Use the trusted role
            connectedAt: new Date()
        });

        // Join the user to the appropriate role-based room (using trusted role)
        if (userSession.role === 'admin') {
            socket.join('admins');
        }

        // --- 2. INITIAL BROADCAST ---
        targetedBroadcastToAdminsOnly(io); // Pass io object to the helper

        // --- 3. EVENT LISTENERS ---
        
        // The 'user-connected' event is now obsolete and should be REMOVED.
        
        // User Disconnects (Tab closed or Network issue)
        socket.on('disconnect', () => {
            if (activeUsers.has(socket.id)) {
                const user = activeUsers.get(socket.id);
                console.log(`User disconnected: ${user.username}`);
                
                activeUsers.delete(socket.id);
                targetedBroadcastToAdminsOnly(io);
            }
        });

        // User Logout (Explicit action)
        socket.on('user-logout', () => {
             // The main logout REST route should destroy the HTTP session, 
             // but this socket event ensures the map is cleaned up instantly.
             if (activeUsers.has(socket.id)) {
                activeUsers.delete(socket.id);
                targetedBroadcastToAdminsOnly(io);
             }
             // Let the disconnect event handle the final socket closing
        });
        
    });
    
    // The io object needs to be passed in to broadcast globally
    function targetedBroadcastToAdminsOnly(ioInstance) {
        const userList = Array.from(activeUsers.values());
           
        // .filter(u => u.role !== 'admin'); // Correctly filters out admins
        ioInstance.to('admins').emit('update-user-list', userList);
    }
};