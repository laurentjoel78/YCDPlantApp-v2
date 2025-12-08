const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateWeatherRequest, validateDateRange } = require('../middleware/weatherValidation');
const weatherController = require('../controllers/weatherController');

// Get weather forecast for a farm
router.get('/farms/:farmId/forecast',
  auth,
  validateWeatherRequest,
  weatherController.getWeatherForecast
);

// Get weather alerts for a farm
router.get('/farms/:farmId/alerts',
  auth,
  validateWeatherRequest,
  weatherController.getWeatherAlerts
);

// Get weather impact analysis for crops
router.get('/farms/:farmId/crop-impact',
  auth,
  validateWeatherRequest,
  weatherController.getCropWeatherImpact
);

module.exports = router;