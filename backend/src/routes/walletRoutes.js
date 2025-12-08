const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');
const { validateTransaction } = require('../middleware/walletValidation');

// Wallet routes
router.get('/balance', auth, walletController.getBalance);
router.post('/deposit', auth, validateTransaction, walletController.deposit);
router.post('/withdraw', auth, validateTransaction, walletController.withdraw);
router.post('/transfer', auth, validateTransaction, walletController.transfer);
router.get('/transactions', auth, walletController.getTransactions);

module.exports = router;