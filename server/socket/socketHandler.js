// Key: socket.id, Value: { username, role, etc. }
const activeUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    //User Login / Connection
    // The frontend emits this event after successful login
    socket.on('user-connected', (userData) => {
      activeUsers.set(socket.id, {
        socketId: socket.id,
        username: userData.username,
        role: userData.role,
        connectedAt: new Date()
      });

      //debugging............................................
      console.log(`User mapped: ${userData.username} -> ${socket.id}`);

      // Broadcast the updated list to all Admins
      broadcastActiveUsers();
    });

    //User Disconnects (Tab closed or Logout)
    socket.on('disconnect', () => {
      if (activeUsers.has(socket.id)) {
        const user = activeUsers.get(socket.id);
        console.log(`User disconnected: ${user.username}`);
        
        activeUsers.delete(socket.id);
        
        broadcastActiveUsers();
      }
    });

    
    socket.on('user-logout', () => {
      if (activeUsers.has(socket.id)) {
        activeUsers.delete(socket.id);
        broadcastActiveUsers();
      }
    });

    
    function broadcastActiveUsers() {
      const userList = Array.from(activeUsers.values());
      io.emit('update-user-list', userList);
    }
  });
};