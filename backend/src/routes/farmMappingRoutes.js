const express = require('express');
const router = express.Router();
const farmMappingController = require('../controllers/farmMappingController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Farm management
router.post('/farms',
  authenticate(),
  apiLimiter,
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