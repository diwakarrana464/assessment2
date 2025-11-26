// server/index.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
// const configureSocket = require('./socket/socketHandler'); // Removed direct require here

const app = express();
connectDB();

// Create HTTP Server (Needed to combine Express + Socket.io)
const server = http.createServer(app);

// Middleware: Session Configuration (The Core Requirement)
// This saves the session ID in a cookie and the data in MongoDB
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Only save if data exists
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // Store sessions in 'sessions' collection
        ttl: 24 * 60 * 60 // Session expiration (1 day)
    }),
    cookie: {
        httpOnly: true,
        secure: false,  // (Production) for https use true
        maxAge: 1000 * 60 * 60 //one hour
    }
});

app.use(sessionMiddleware); // Apply session middleware to Express routes

// Configure Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true, // Allow cookies/headers
        methods: ["GET", "POST"]
    }
});

// ----------------------------------------------------------------------
// NEW CODE FOR SOCKET.IO AUTHENTICATION BRIDGE
// ----------------------------------------------------------------------

// 1. Attach Express Session Middleware to Socket.IO Handshake
// This allows Socket.IO to read the 'connect.sid' cookie, look up the session data 
// in MongoDB, and populate socket.request.session.user.
io.use((socket, next) => {
    // We execute the Express session middleware logic on the Socket.IO handshake request.
    // The 'socket.request.res || {}' is a required placeholder for the response object.
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// ----------------------------------------------------------------------
// REST OF THE CODE
// ----------------------------------------------------------------------

// Middleware: CORS
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

//Middleware: Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

// Socket.io Logic
const socketHandler = require('./socket/socketHandler');
socketHandler(io);


// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});