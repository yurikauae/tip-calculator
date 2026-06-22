const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.user ? req.user.userId : 'unauthenticated',
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Invalid reference to related resource' });
  }

  // Handle custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message || 'An error occurred'
    });
  }

  // Default to 500 internal server error
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = errorHandler;
module.exports.createError = createError;
