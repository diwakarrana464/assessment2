// This Map stores active users in memory
// Key: socket.id, Value: { username, role, etc. }
const activeUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // EVENT 1: User Login / Connection
    // The frontend emits this event after successful login
    socket.on('user-connected', (userData) => {
      // Save user to the map
      activeUsers.set(socket.id, {
        socketId: socket.id,
        username: userData.username,
        role: userData.role,
        connectedAt: new Date()
      });

      // Log for debugging
      console.log(`User mapped: ${userData.username} -> ${socket.id}`);

      // Broadcast the updated list to all Admins
      broadcastActiveUsers();
    });

    // EVENT 2: User Disconnects (Tab closed or Logout)
    socket.on('disconnect', () => {
      if (activeUsers.has(socket.id)) {
        const user = activeUsers.get(socket.id);
        console.log(`User disconnected: ${user.username}`);
        
        // Remove from Map
        activeUsers.delete(socket.id);
        
        // Update Admins immediately
        broadcastActiveUsers();
      }
    });

    // EVENT 3: Explicit Logout
    socket.on('user-logout', () => {
      if (activeUsers.has(socket.id)) {
        activeUsers.delete(socket.id);
        broadcastActiveUsers();
      }
    });

    // Helper: Send the list of users ONLY to Admins
    function broadcastActiveUsers() {
      // Convert Map to Array
      const userList = Array.from(activeUsers.values());
      
      // Emit to everyone (Frontend filters visibility)
      // Or specifically emit to an 'admin-room' if we set up rooms
      io.emit('update-user-list', userList);
    }
  });
};