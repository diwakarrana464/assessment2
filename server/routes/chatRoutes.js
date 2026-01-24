const express = require('express');
const router = express.Router();

// Import the controller and middleware
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Destructure the methods and middleware
const { getPartnerUnreadCount, getChatHistory } = chatController;
const { isAuthenticated } = authMiddleware;

/**
 * Route: GET /api/chat/unread/:partnerId
 * Description: Fetches the number of unread messages from a specific partner
 */
router.get('/unread/:partnerId', isAuthenticated, getPartnerUnreadCount);

/**
 * Route: GET /api/chat/history/:partnerId
 * Description: Fetches message history between current user and partner
 */
// router.get('/history/:partnerId', isAuthenticated, getChatHistory);

module.exports = router;