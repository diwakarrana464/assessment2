const express = require('express');
const router = express.Router();
// Import Controller
const authController = require('../controllers/authController');
// Import Middleware
const authMiddleware = require('../middleware/authMiddleware');

// --- DEBUGGING LOGS (Delete these later) ---
console.log("Checking Imports:");
console.log("1. Register Function:", authController.register);
console.log("2. Login Function:", authController.login);
console.log("3. Logout Function:", authController.logout);
console.log("4. GetMe Function:", authController.getMe);
console.log("5. IsAuthenticated Middleware:", authMiddleware.isAuthenticated);
// --------------------------------------------

const { login, logout, register, getMe } = authController;
const { isAuthenticated } = authMiddleware;

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected Routes
// This is the line causing the error (Line 14 originally)
router.get('/me', isAuthenticated, getMe);

module.exports = router;