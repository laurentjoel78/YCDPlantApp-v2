const isActive = (req, res, next) => {
  const logger = req.log.child({
    middleware: 'userStatus',
    method: 'isActive'
  });

  logger.debug('Checking user account status', {
    userId: req.user?.id,
    path: req.path
  });

  if (req.user && req.user.is_active) {
    logger.debug('Active account access granted', {
      userId: req.user.id,
      path: req.path
    });
    next();
  } else {
    logger.warn('Access denied - inactive account', {
      userId: req.user?.id,
      path: req.path,
      isActive: req.user?.is_active || false
    });
    res.status(403).json({ error: 'Account is not active' });
  }
};

module.exports = {
  isActive
};