const express = require('express');
const router = express.Router();
const suggestionsController = require('../controllers/suggestionsController');
const { auth } = require('../middleware/auth');

// GET /api/suggestions?farm_id=123 (auth required)
router.get('/', auth, suggestionsController.getSuggestions);

// GET /api/suggestions/public?farm_id=123 (no auth) - development/testing only
router.get('/public', suggestionsController.getSuggestionsPublic);

// Development-only debug route
if (process.env.NODE_ENV !== 'production') {
	router.get('/debug/:farmId', suggestionsController.getDebugGuidelines);
}
if (process.env.NODE_ENV !== 'production') {
	router.get('/templates', suggestionsController.listGuidanceTemplates);
}

module.exports = router;
