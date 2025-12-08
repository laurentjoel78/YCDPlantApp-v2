const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const {
    getCurrentWeather,
    getForecast,
    getWeatherAlerts,
    getLocationByCity,
    getCacheStats,
    clearCache
} = require('../controllers/weatherController');

// Public routes
router.get('/current', getCurrentWeather);
router.get('/forecast', getForecast);
router.get('/alerts', getWeatherAlerts);
router.get('/location', getLocationByCity);

// Protected admin routes
router.use(auth);
router.use(requireAdmin);

router.get('/cache/stats', getCacheStats);
router.delete('/cache', clearCache);

module.exports = router;