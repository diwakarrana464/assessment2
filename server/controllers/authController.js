const User = require('../models/User');
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
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    //Set Session
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    //Return info (Frontend needs role for redirection)
    res.json({
      message: 'Login successful',
      user: req.session.user
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//POST /api/auth/logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    //'connect.sid' (default name)
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