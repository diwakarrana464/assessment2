// Middleware to check if the user is logged in (Session check)
const isAuthenticated = (req, res, next) => {
  // Check if session exists and has user data
  if (req.session && req.session.user) {
    return next(); // User is logged in, proceed to the route
  }
  
  // If not logged in, return 401 Unauthorized
  return res.status(401).json({ message: 'Not authorized. Please log in.' });
};

// Middleware to check if the user is an Admin
const isAdmin = (req, res, next) => {
  // First check if they are logged in
  if (req.session && req.session.user) {
    // Then check the role
    if (req.session.user.role === 'admin') {
      return next(); // User is Admin, proceed
    } else {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  }
  
  return res.status(401).json({ message: 'Not authorized. Please log in.' });
};

// EXPORT THE FUNCTIONS
module.exports = { isAuthenticated, isAdmin };