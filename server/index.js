require('dotenv').config();
const express = require('express');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// 1. Initialize App & DB
const app = express();
connectDB();

// 2. Create HTTP Server (Needed to combine Express + Socket.io)
const server = http.createServer(app);

// 3. Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Your Vue Client URL
    credentials: true, // Allow cookies/headers
    methods: ["GET", "POST"]
  }
});

// 4. Middleware: CORS
// Crucial: 'credentials: true' allows the browser to send the Session Cookie
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// 5. Middleware: Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Middleware: Session Configuration (The Core Requirement)
// This saves the session ID in a cookie and the data in MongoDB
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Only save if data exists
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Store sessions in 'sessions' collection
    ttl: 14 * 24 * 60 * 60 // Session expiration (14 days)
  }),
  cookie: {
    httpOnly: true, // Security: JS cannot read this cookie [cite: 9]
    secure: false,  // Set to 'true' only if using HTTPS (Production)
    maxAge: 1000 * 60 * 60 * 24 // 1 Day
  }
});

app.use(sessionMiddleware);

// 7. Routes
app.use('/api/auth', authRoutes);

// 8. Socket.io Logic (We will create this handler next)
// We pass 'io' to a separate handler to keep this file clean
const socketHandler = require('./socket/socketHandler');
socketHandler(io); 

// 9. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});