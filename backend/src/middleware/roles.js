const isFarmer = (req, res, next) => {
  const logger = req.log.child({
    middleware: 'roles',
    method: 'isFarmer'
  });

  logger.debug('Checking farmer role access', {
    userId: req.user?.id,
    userRole: req.user?.role,
    path: req.path
  });

  if (req.user && req.user.role === 'farmer') {
    logger.debug('Farmer role access granted', {
      userId: req.user.id,
      path: req.path
    });
    next();
  } else {
    logger.warn('Farmer role access denied', {
      userId: req.user?.id,
      userRole: req.user?.role,
      path: req.path
    });
    res.status(403).json({ error: 'Farmer access required' });
  }
};

const isExpert = (req, res, next) => {
  const logger = req.log.child({
    middleware: 'roles',
    method: 'isExpert'
  });

  logger.debug('Checking expert role access', {
    userId: req.user?.id,
    userRole: req.user?.role,
    path: req.path
  });

  if (req.user && req.user.role === 'expert') {
    logger.debug('Expert role access granted', {
      userId: req.user.id,
      path: req.path
    });
    next();
  } else {
    logger.warn('Expert role access denied', {
      userId: req.user?.id,
      userRole: req.user?.role,
      path: req.path
    });
    res.status(403).json({ error: 'Expert access required' });
  }
};

const isAdmin = (req, res, next) => {
  const logger = req.log.child({
    middleware: 'roles',
    method: 'isAdmin'
  });

  logger.debug('Checking admin role access', {
    userId: req.user?.id,
    userRole: req.user?.role,
    path: req.path
  });

  if (req.user && req.user.role === 'admin') {
    logger.debug('Admin role access granted', {
      userId: req.user.id,
      path: req.path
    });
    next();
  } else {
    logger.warn('Admin role access denied', {
      userId: req.user?.id,
      userRole: req.user?.role,
      path: req.path
    });
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = {
  isFarmer,
  isExpert,
  isAdmin
};