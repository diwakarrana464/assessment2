const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


const { login, logout, register, getMe } = authController;
const { isAuthenticated } = authMiddleware;

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected Routes
router.get('/me', isAuthenticated, getMe);

module.exports = router;