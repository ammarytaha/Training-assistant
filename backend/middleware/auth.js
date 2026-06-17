const User = require('../models/User');
const { COOKIE_NAME, verifyToken } = require('../utils/token');

// Require a valid JWT (from httpOnly cookie). Attaches req.user.
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Restrict a route to specific roles, e.g. requireRole('coach', 'admin').
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
