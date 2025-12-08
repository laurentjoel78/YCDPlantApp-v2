const express = require('express');
const router = express.Router();
const voiceCommandController = require('../controllers/voiceCommandController');
const { authenticate } = require('../middleware/auth');

// Register a new voice command (admin only)
router.post('/commands', 
  authenticate(['admin']), 
  voiceCommandController.registerCommand
);

// Process a voice command
router.post('/process', 
  authenticate(), 
  voiceCommandController.processCommand
);

// Get commands by category and language
router.get('/commands/:category/:language', 
  authenticate(), 
  voiceCommandController.getCommandsByCategory
);

// Update a voice command (admin only)
router.put('/commands/:id', 
  authenticate(['admin']), 
  voiceCommandController.updateCommand
);

// Delete a voice command (admin only)
router.delete('/commands/:id', 
  authenticate(['admin']), 
  voiceCommandController.deleteCommand
);

module.exports = router;