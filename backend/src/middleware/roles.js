// Safe logger helper that handles missing req.log
const getLogger = (req, method) => {
  if (req.log && typeof req.log.child === 'function') {
    return req.log.child({ middleware: 'roles', method });
  }
  // Fallback console logger
  return {
    debug: (...args) => console.log(`[roles.${method}]`, ...args),
    warn: (...args) => console.warn(`[roles.${method}]`, ...args),
    error: (...args) => console.error(`[roles.${method}]`, ...args)
  };
};

const isFarmer = (req, res, next) => {
  const logger = getLogger(req, 'isFarmer');

  logger.debug('Checking farmer role access', {
    userId: req.user?.id,
    userRole: req.user?.role,
    path: req.path
  });

  if (req.user && req.user.role === 'farmer') {
    logger.debug('Farmer role access granted');
    next();
  } else {
    logger.warn('Farmer role access denied');
    res.status(403).json({ error: 'Farmer access required' });
  }
};

const isExpert = (req, res, next) => {
  const logger = getLogger(req, 'isExpert');

  logger.debug('Checking expert role access', {
    userId: req.user?.id,
    userRole: req.user?.role,
    path: req.path
  });

  if (req.user && req.user.role === 'expert') {
    logger.debug('Expert role access granted');
    next();
  } else {
    logger.warn('Expert role access denied');
    res.status(403).json({ error: 'Expert access required' });
  }
};

const isAdmin = (req, res, next) => {
  const logger = getLogger(req, 'isAdmin');

  logger.debug('Checking admin role access', {
    userId: req.user?.id,
    userRole: req.user?.role,
    path: req.path
  });

  if (req.user && req.user.role === 'admin') {
    logger.debug('Admin role access granted');
    next();
  } else {
    logger.warn('Admin role access denied');
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = {
  isFarmer,
  isExpert,
  isAdmin
};
