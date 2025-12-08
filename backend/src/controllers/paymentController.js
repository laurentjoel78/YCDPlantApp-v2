const PaymentService = require('../services/paymentService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateSchema } = require('../middleware/schemaValidator');
const auditService = require('../services/auditService');
const { Transaction, User } = require('../models');

const paymentSchema = {
  type: 'object',
  required: ['amount', 'paymentMethod'],
  properties: {
    amount: {
      type: 'number',
      minimum: 100 // Minimum 100 XAF
    },
    paymentMethod: {
      type: 'string',
      enum: ['mtn', 'orange', 'wallet']
    },
    receiverId: {
      type: 'string',
      format: 'uuid'
    },
    description: {
      type: 'string',
      maxLength: 255
    },
    metadata: {
      type: 'object'
    }
  }
};

const escrowSchema = {
  type: 'object',
  required: ['amount', 'paymentMethod', 'receiverId'],
  properties: {
    amount: {
      type: 'number',
      minimum: 100
    },
    paymentMethod: {
      type: 'string',
      enum: ['mtn', 'orange', 'wallet']
    },
    receiverId: {
      type: 'string',
      format: 'uuid'
    },
    releaseConditions: {
      type: 'object'
    },
    expiresAt: {
      type: 'string',
      format: 'date-time'
    },
    metadata: {
      type: 'object'
    }
  }
};

class PaymentController {
  async initiatePayment(req, res) {
    const paymentData = {
      ...req.body,
      senderId: req.user.id // From auth middleware
    };

    const transaction = await PaymentService.initiatePayment(paymentData);

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'PAYMENT_INITIATE',
      actionDescription: `Initiated payment of ${paymentData.amount} via ${paymentData.paymentMethod}`,
      req,
      tableName: 'transactions',
      recordId: transaction.id,
      metadata: { amount: paymentData.amount, paymentMethod: paymentData.paymentMethod }
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        paymentReference: transaction.paymentReference
      }
    });
  }

  async createEscrow(req, res) {
    const escrowData = {
      ...req.body,
      senderId: req.user.id
    };

    const result = await PaymentService.createEscrowPayment(escrowData);

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'ESCROW_CREATE',
      actionDescription: `Created escrow payment of ${escrowData.amount}`,
      req,
      tableName: 'escrow_accounts',
      recordId: result.escrowAccount.id,
      metadata: { amount: escrowData.amount, receiverId: escrowData.receiverId }
    });

    res.json({
      success: true,
      data: {
        escrowId: result.escrowAccount.id,
        transactionId: result.transaction.id,
        status: result.transaction.status,
        paymentReference: result.transaction.paymentReference
      }
    });
  }

  async releaseEscrow(req, res) {
    const { escrowId } = req.params;

    const result = await PaymentService.releaseEscrow(
      escrowId,
      req.user.id
    );

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'ESCROW_RELEASE',
      actionDescription: `Released escrow ${escrowId}`,
      req,
      tableName: 'escrow_accounts',
      recordId: escrowId,
      metadata: { escrowId }
    });

    res.json({
      success: true,
      data: {
        escrowId: result.escrowAccount.id,
        status: result.escrowAccount.status,
        transactionId: result.transaction.id
      }
    });
  }

  async handleMTNCallback(req, res) {
    const result = await PaymentService.processPaymentCallback(
      'mtn',
      req.body
    );

    res.json({
      success: true,
      data: {
        transactionId: result.id,
        status: result.status
      }
    });
  }

  async handleOrangeCallback(req, res) {
    const result = await PaymentService.processPaymentCallback(
      'orange',
      req.body
    );

    res.json({
      success: true,
      data: {
        transactionId: result.id,
        status: result.status
      }
    });
  }

  async getTransaction(req, res) {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name'] },
        { model: User, as: 'receiver', attributes: ['id', 'name'] }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check access permission
    if (transaction.senderId !== req.user.id &&
      transaction.receiverId !== req.user.id &&
      !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to transaction'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  }
}

const controller = new PaymentController();

module.exports = {
  initiatePayment: [
    validateSchema(paymentSchema),
    asyncHandler(controller.initiatePayment)
  ],
  createEscrow: [
    validateSchema(escrowSchema),
    asyncHandler(controller.createEscrow)
  ],
  releaseEscrow: asyncHandler(controller.releaseEscrow),
  handleMTNCallback: asyncHandler(controller.handleMTNCallback),
  handleOrangeCallback: asyncHandler(controller.handleOrangeCallback),
  getTransaction: asyncHandler(controller.getTransaction)
};