function validateRegister(req, res, next) {
  const { email, username, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Invalid email format');
  }

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  } else if (username.trim().length < 3 || username.trim().length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateJournalEntry(req, res, next) {
  const { title, content } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.trim().length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('Content is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validatePaperTrade(req, res, next) {
  const { symbol, direction, quantity, entry_price } = req.body;
  const errors = [];

  if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
    errors.push('Symbol is required');
  }

  if (!direction || !['long', 'short'].includes(direction.toLowerCase())) {
    errors.push('Direction must be "long" or "short"');
  }

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    errors.push('Quantity must be a positive number');
  }

  if (!entry_price || isNaN(entry_price) || Number(entry_price) <= 0) {
    errors.push('Entry price must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateAlert(req, res, next) {
  const { symbol, alert_type, condition, target_value } = req.body;
  const errors = [];

  if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
    errors.push('Symbol is required');
  }

  if (!alert_type || typeof alert_type !== 'string') {
    errors.push('Alert type is required');
  }

  if (!condition || !['above', 'below', 'crosses_above', 'crosses_below'].includes(condition)) {
    errors.push('Condition must be one of: above, below, crosses_above, crosses_below');
  }

  if (target_value === undefined || isNaN(target_value) || Number(target_value) <= 0) {
    errors.push('Target value must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateJournalEntry,
  validatePaperTrade,
  validateAlert
};
