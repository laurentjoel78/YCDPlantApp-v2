const logger = require('../config/logger');
const transactionService = require('../services/transactionService');
const { Order } = require('../models');
const { validationResult } = require('express-validator');
const auditService = require('../services/auditService');

exports.initiatePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, paymentMethod } = req.body;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: {
        id: orderId,
        buyer_id: req.user.id,
        status: 'pending',
        is_active: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not eligible for payment' });
    }

    const transaction = await transactionService.initiateTransaction(order, paymentMethod);

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'TRANSACTION_INITIATE',
      actionDescription: `Initiated payment for order ${orderId}`,
      req,
      tableName: 'transactions',
      recordId: transaction.id,
      metadata: { orderId, paymentMethod, amount: transaction.amount }
    });

    res.status(201).json({ transaction });
  } catch (error) {
    logger.error('Error in initiatePayment:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId, paymentReference } = req.body;

    const transaction = await transactionService.processPayment(transactionId, paymentReference);

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'TRANSACTION_CONFIRM',
      actionDescription: `Confirmed payment for transaction ${transactionId}`,
      req,
      tableName: 'transactions',
      recordId: transactionId,
      metadata: { paymentReference, status: transaction.status }
    });

    res.status(200).json({ transaction });
  } catch (error) {
    logger.error('Error in confirmPayment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

exports.processSettlement = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Only admin can process settlements
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const transaction = await transactionService.processSettlement(transactionId);

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'TRANSACTION_SETTLEMENT',
      actionDescription: `Processed settlement for transaction ${transactionId}`,
      req,
      tableName: 'transactions',
      recordId: transactionId,
      metadata: { status: transaction.status }
    });

    res.status(200).json({ transaction });
  } catch (error) {
    logger.error('Error in processSettlement:', error);
    res.status(500).json({ error: 'Failed to process settlement' });
  }
};

exports.getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await transactionService.getTransactionDetails(transactionId, req.user.id);
    res.status(200).json({ transaction });
  } catch (error) {
    logger.error('Error in getTransactionDetails:', error);
    res.status(500).json({ error: 'Failed to get transaction details' });
  }
};

exports.requestRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId } = req.params;
    const { reason } = req.body;

    // Verify the user is the buyer
    const transaction = await transactionService.getTransactionDetails(transactionId, req.user.id);
    if (transaction.Order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const refundedTransaction = await transactionService.refundTransaction(transactionId, reason);

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'TRANSACTION_REFUND_REQUEST',
      actionDescription: `Requested refund for transaction ${transactionId}`,
      req,
      tableName: 'transactions',
      recordId: transactionId,
      metadata: { reason }
    });

    res.status(200).json({ transaction: refundedTransaction });
  } catch (error) {
    logger.error('Error in requestRefund:', error);
    res.status(500).json({ error: 'Failed to process refund request' });
  }
};