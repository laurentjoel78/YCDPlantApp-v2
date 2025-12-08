const express = require('express');
const router = express.Router();
const farmMappingController = require('../controllers/farmMappingController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse
const mapLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Farm management
router.post('/farms',
  authenticate(),
  mapLimiter,
  farmMappingController.createFarm
);

router.put('/farms/:id',
  authenticate(),
  farmMappingController.updateFarm
);

router.get('/farms/:id',
  authenticate(),
  farmMappingController.getFarm
);

// Plot management
router.post('/farms/:farmId/plots',
  authenticate(),
  farmMappingController.createPlot
);

router.put('/plots/:id',
  authenticate(),
  farmMappingController.updatePlot
);

// Geolocation services
router.get('/farms/nearby',
  authenticate(),
  farmMappingController.getNearbyFarms
);

// Farm statistics
router.get('/farms/:id/stats',
  authenticate(),
  farmMappingController.getFarmStats
);

// Offline sync
router.post('/sync',
  authenticate(),
  farmMappingController.syncOfflineChanges
);

module.exports = router;