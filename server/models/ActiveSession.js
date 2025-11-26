const mongoose = require('mongoose');

// This schema tracks the ONLY live session per user ID.
const ActiveSessionSchema = new mongoose.Schema({
  // The persistent user ID (primary key for this collection)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // CRITICAL: Enforces one active session per user ID
  },
  // The Express Session ID assigned to this active user
  sessionId: {
    type: String,
    required: true,
    unique: true // Ensures session IDs are not duplicated
  },
  // We can add a timestamp for diagnostics
  loginTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActiveSession', ActiveSessionSchema);