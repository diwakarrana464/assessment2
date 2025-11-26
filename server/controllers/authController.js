const User = require('../models/User');
const ActiveSession = require('../models/ActiveSession'); // <-- NEW
const bcrypt = require('bcryptjs');


exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            password: hashedPassword,
            role: role || 'user'
        });

        res.status(201).json({ message: 'User created successfully', user: { username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { username, password, force_logout } = req.body; // <-- Get force_logout flag

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- 1. SINGLE SESSION ENFORCEMENT CHECK ---
        const existingActiveSession = await ActiveSession.findOne({ userId: user._id });

        // If an active session exists AND the client has NOT sent the force_logout flag
        if (existingActiveSession && !force_logout) {
            // Signal to the client that a conflict exists and decision is needed
            return res.status(409).json({
                message: 'A session is already active. Want forced Login?.',
                code: 'SESSION_CONFLICT'
            });
        }

        // --- 2. DESTRUCTION OF OLD SESSION (If conflict was resolved) ---
        if (existingActiveSession) {
            // Destroy old session in the persistent store (connect-mongo)
            // req.sessionStore is available because express-session is initialized in server.js
            await req.sessionStore.destroy(existingActiveSession.sessionId);
            // Delete the tracking record from our custom collection
            await ActiveSession.deleteOne({ _id: existingActiveSession._id });
        }
        
        // --- 3. CREATE NEW SESSION AND TRACKING RECORD ---

        // Set new session data
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };

        // Ensure session is saved so we can get its ID (required for single-session tracking)
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Create the new active session tracking record
        await ActiveSession.create({
            userId: user._id,
            sessionId: req.session.id, // Store the newly generated session ID
            loginTime: new Date()
        });
        
        // --- 4. SUCCESS RESPONSE ---
        res.json({
            message: 'Login successful',
            user: req.session.user
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
    // Check if the user is even logged in (session exists)
    if (!req.session.user) {
        res.clearCookie('connect.sid');
        return res.json({ message: 'Already logged out.' });
    }

    const currentSessionId = req.session.id;

    // 1. Destroy session in the persistent store
    await new Promise(resolve => req.session.destroy(resolve));

    try {
        // 2. Clear the tracking record from the ActiveSession collection
        await ActiveSession.deleteOne({ sessionId: currentSessionId });
    } catch (error) {
        // Log the error but continue to send success to client
        console.error("ActiveSession cleanup error:", error.message);
    }

    // 3. Clear the cookie from the client's browser
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
};


// @desc    Get current logged in user (Session persistence)
// @route   GET /api/auth/me
exports.getMe = (req, res) => {
    if (req.session.user) {
        res.json({ isAuthenticated: true, user: req.session.user });
    } else {
        res.status(401).json({ isAuthenticated: false, message: 'Not authorized' });
    }
};