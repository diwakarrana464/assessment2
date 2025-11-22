const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Not authorized. Please log in.' });
};


const isAdmin = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  }
  
  return res.status(401).json({ message: 'Not authorized. Please log in.' });
};

module.exports = { isAuthenticated, isAdmin };