// NOTE: This file assumes the secure middleware (from the previous step)
// has successfully populated socket.request.session.user

const activeUsers = new Map();
const chatService = require("./chatService");

// The io object should be passed from the server setup
module.exports = (io) => {
  io.on("connection", (socket) => {
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
      socketId: socket.id,
    });

    if (userSession.role === "admin") {
      socket.join("admins");
    }
    //targetedBroadcastToAdminsOnly(io);
    chatService.targetedBroadcastToAdminsOnly(io, activeUsers);

    //.........................getChatTargets and push to connected user.........................
    socket.emit(
      "get_chat_targets",
      chatService.getChatTargets(activeUsers, {
        id: userSession.id,
        role: userSession.role,
      })
    );

    chatService.iamActive(io, userSession);

    //..................................private message event listener....................................
    socket.on("send_private_message", async (payload) => {
      const confirmation = await chatService.handlePrivateMessage(
        io,
        activeUsers,
        userSession,
        payload
      );
      // Emit confirmation back to sender only
      if (confirmation) {
        console.log(
          "message is saved and delivered to recipient, sending confirmation to sender",
          confirmation
        );
        io.to(socket.id).emit("private_message_confirmation", confirmation);
      }
    }); // end of send_private_message listener

    //..................................message read update status listener....................................
    socket.on("message_read_update_status", async (payload) => {
      const { messageId, readerId } = payload;
      try {
        const result = await chatService.handleReadReceipt(messageId, readerId);

        if (result && result.statusUpdatePayload) {
          const originalSenderId = result.senderId;
          const senderInfo = activeUsers.get(originalSenderId);

          if (senderInfo) {
            io.to(senderInfo.socketId).emit(
              "status_update",
              result.statusUpdatePayload
            );
            console.log(
              `Sent read receipt notification to sender ID: ${originalSenderId} for message ID: ${messageId}`
            );
          }
        }
      } catch (error) {
        console.error("Error updating message status to Read:", error);
      }
    }); // end of message_read_update_status listener

    //...............................disconnect listener....................................
    socket.on("disconnect", () => {
      if (activeUsers.has(userSession.id)) {
        const user = activeUsers.get(userSession.id);
        console.log(`User disconnected: ${user.username}`);
        activeUsers.delete(userSession.id);
        //targetedBroadcastToAdminsOnly(io);
        chatService.targetedBroadcastToAdminsOnly(io, activeUsers);
        chatService.iamInactive(io, userSession);
      }
    }); // end of disconnect listener

    //...............................logout listener....................................
    socket.on("user-logout", () => {
      if (activeUsers.has(userSession.id)) {
        activeUsers.delete(userSession.id);
        //targetedBroadcastToAdminsOnly(io);
        chatService.targetedBroadcastToAdminsOnly(io, activeUsers);
        console.log(`User logged out: ${userSession.username}`);
        chatService.iamInactive(io, userSession);
        console.log("iaminactive event sent on logout");
      }
    }); // end of logout listener
  }); // end of io.on connection
}; //end of module.exports
