const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // CRITICAL: Message Status (0: Sending, 1: Delivered, 2: Read)
  status: {
    type: Number,
    default: 1, 
    enum: [1, 2] // Enforces valid status values, 1 means delivered but not read yet, 2 means delivered and read
  }
});

module.exports = mongoose.model('Message', MessageSchema);