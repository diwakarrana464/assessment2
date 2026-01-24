// server/socket/chatService.js

const Message = require("../models/Message"); // Mongoose model for messages

function getChatTargets(activeUsers, requestingUser) {
  const allActiveUsers = Array.from(activeUsers.values());

  if (requestingUser.role === "admin") {
    return allActiveUsers
      .filter((u) => u.userId.toString() !== requestingUser.id.toString())
      .map((u) => ({ id: u.userId, username: u.username, role: u.role }));
  } else {
    return allActiveUsers
      .filter((u) => u.role === "admin")
      .map((u) => ({ id: u.userId, username: u.username, role: u.role }));
  }
}// END OF getChatTargets FUNCTION

async function handlePrivateMessage(io, activeUsers, senderSession, payload) {
  const { recipientId, message, tempId } = payload;
  const senderUsername = senderSession.username;

  //Prepare the basic message structure
  let messagePayload = {
    senderId: senderSession.id,
    senderUsername: senderUsername,
    timestamp: new Date(),
    message: message,
    recipientId: recipientId,
  };

  try {
    // --- STEP 1: SAVE TO DATABASE (Initial Status: 1 - saved to DB) ---
    // We set status to 1 *before* delivering because we know it will be delivered receiver is online
    const newMessage = new Message({
      sender: senderSession.id,
      receiver: recipientId,
      content: message,
      status: 1, // Status 1: Delivered (or ready for immediate delivery)
    });

    const savedMessage = await newMessage.save();
    console.log("Message saved to DB:", savedMessage);

    // after saving check and prevent sending message to self
    if (recipientId === senderSession.id) return;

    //Find the recipient's active socket(s)
    const recipientSockets = Array.from(activeUsers.values()).filter(
      (u) => u.userId.toString() === recipientId.toString()
    );

    // Enhance payload with DB data (timestamp, unique message ID, and status)
    messagePayload = {
      ...messagePayload,
      _id: savedMessage._id.toString(), // The unique message ID from MongoDB
      timestamp: savedMessage.timestamp,
      status: savedMessage.status, // Status 1
      tempId: tempId, // Temporary ID from sender for optimistic UI update
    };

    // --- STEP 2: DELIVERY (Send to Recipient) ---
    if (recipientSockets.length > 0) {
      recipientSockets.forEach((recipient) => {
        // Send the message with status 1 (Delivered/Single Tick)
        io.to(recipient.socketId).emit(
          "receive_private_message",
          messagePayload
        );
        console.log(
          `Message delivered instantly to socket: ${recipient.socketId}`
        );
      });
    }

    console.log(
      `Message saved (ID: ${savedMessage._id}) and confirmed to sender.`
    );

    // This payload must be returned so the socketHandler can emit it back to the sender
    return messagePayload;
  } catch (error) {
    console.error("Error saving/delivering message:", error);
    // In a production app, you would emit an error event back to the sender here.
    return null;
  }
} // END OF handlePrivateMessage FUNCTION


function iamActive(io, userSession) {
  if (userSession.role === "admin") {
    console.log(`Admin connected: ${userSession.username}`);
    // send "I am Active" event to all users and in data send id username and role
    io.emit("I am Active", {
      id: userSession.id,
      username: userSession.username,
      role: userSession.role,
    });
  } else {
    console.log(`User connected: ${userSession.username}`);
    // send "I am Active" event to all admins only and in data send id username and role
    io.to("admins").emit("I am Active", {
      id: userSession.id,
      username: userSession.username,
      role: userSession.role,
    });
  }
} // IAM ACTIVE FUNCTION END

function iamInactive(io, userSession) {
  if (userSession.role === "admin") {
    console.log(`Admin disconnected: ${userSession.username}`);
    // send "I am Inactive" event to all users and in data send id username and role
    io.emit("I am Inactive", {
      id: userSession.id,
      username: userSession.username,
      role: userSession.role,
    });
  } else {
    console.log(`User disconnected: ${userSession.username}`);
    // send "I am Inactive" event to all admins only and in data send id username and role
    io.to("admins").emit("I am Inactive", {
      id: userSession.id,
      username: userSession.username,
      role: userSession.role,
    });
  }
} // IAM INACTIVE FUNCTION END

function targetedBroadcastToAdminsOnly(ioInstance, activeUsers) {
  const userList = Array.from(activeUsers.values());
  ioInstance.to("admins").emit("update-user-list", userList);
} //end of targetedBroadcastToAdminsOnly

// definition for hadleReadReceipt function
async function handleReadReceipt(messageId, readerId) {
  try {
    // --- STEP 1: Find the message and update its status to 'Read' (2) ---
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: { status: 2 } }, // Status 2: Read
      { new: true }
    )
      .populate("sender", "_id")
      .populate("receiver", "_id")
      .exec();

    if (!updatedMessage) {
      console.error("Message not found for ID:", messageId);
      return false;
    }

    // --- STEP 2: Prepare the specific nested structure the socket handler expects ---

    // The payload that will be emitted to the sender's client
    const statusUpdatePayload = {
      messageId: updatedMessage._id.toString(),
      newStatus: updatedMessage.status,
      readerId: readerId,
    };

    // The final return object for the socket handler
    const result = {
      senderId: updatedMessage.sender._id.toString(), // Used by socket handler to find socket
      statusUpdatePayload: statusUpdatePayload, // Used by socket handler to emit to client
    };

    return result;
  } catch (error) {
    console.error("Error in handleReadReceipt:", error);
    return false;
  }
}
// end of handleReadReceipt function

module.exports = {
  getChatTargets,
  handlePrivateMessage,
  iamActive,
  iamInactive,
  targetedBroadcastToAdminsOnly,
  handleReadReceipt,
};
