const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  return secret || 'development-only-secret';
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Authorization header format must be: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const db = getDb();
    const user = db.get('users').find({ id: decoded.userId }).value();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.is_active === false) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Failed to authenticate token' });
  }
}

module.exports = authMiddleware;
module.exports.getJwtSecret = getJwtSecret;
