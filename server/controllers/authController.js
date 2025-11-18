const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Register a new user (Helper to create Admin/User)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'user' // Default to 'user' if not specified
    });

    res.status(201).json({ message: 'User created successfully', user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user & establish session
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Set Session
    // This saves data to the Mongo Store and sends a cookie to the browser
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    // 4. Return info (Frontend needs role for redirection)
    res.json({
      message: 'Login successful',
      user: req.session.user
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    // Clear the cookie named 'connect.sid' (default name)
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
};

// @desc    Get current logged in user (Session persistence)
// @route   GET /api/auth/me
exports.getMe = (req, res) => {
  if (req.session.user) {
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.status(401).json({ isAuthenticated: false, message: 'Not authorized' });
  }
};