const db = require('../models');
const { Op } = require('sequelize');
const sequelize = db.sequelize;
const MTNMobileMoneyProvider = require('../providers/mtnMobileMoneyProvider');
const OrangeMobileMoneyProvider = require('../providers/orangeMobileMoneyProvider');

class PaymentService {
  constructor() {
    this.mtnProvider = new MTNMobileMoneyProvider();
    this.orangeProvider = new OrangeMobileMoneyProvider();
  }

  async initiatePayment(paymentData) {
    const {
      senderId,
      receiverId,
      amount,
      paymentMethod,
      description,
      metadata
    } = paymentData;

    const transaction = await sequelize.transaction();

    try {
      // Map payment method to Transaction model enum
      const paymentMethodMap = {
        'mtn': 'mobile_money_mtn',
        'orange': 'mobile_money_orange',
        'cash_on_delivery': 'cash_on_delivery',
        'bank_transfer': 'bank_transfer',
        'wallet': 'wallet'
      };

      // Create transaction record
      const paymentTx = await db.Transaction.create({
        payer_id: senderId,
        payee_id: receiverId,
        amount,
        net_amount: amount, // Same as amount for now (no fees)
        transaction_type: 'payment',
        payment_method: paymentMethodMap[paymentMethod] || 'cash_on_delivery',
        description,
        transaction_metadata: metadata,
        status: 'pending',
        payment_status: 'pending'
      }, { transaction });

      // Process payment based on method
      let paymentResult;
      switch (paymentMethod) {
        case 'mtn':
          paymentResult = await this.mtnProvider.initiatePayment({
            amount,
            phoneNumber: metadata.phoneNumber,
            description
          });
          break;
        case 'orange':
          paymentResult = await this.orangeProvider.initiatePayment({
            amount,
            phoneNumber: metadata.phoneNumber,
            description
          });
          break;
        case 'wallet':
          paymentResult = await this._processWalletPayment(
            senderId,
            receiverId,
            amount,
            transaction
          );
          break;
        case 'cash_on_delivery':
          // No payment processing needed for COD
          paymentResult = {
            reference: `COD-${Date.now()}`,
            status: 'pending'
          };
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Update transaction with payment reference
      await paymentTx.update({
        payment_reference: paymentResult.reference,
        payment_status: paymentResult.status
      }, { transaction });

      await transaction.commit();
      return paymentTx;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  async createEscrowPayment(escrowData) {
    const {
      senderId,
      receiverId,
      amount,
      paymentMethod,
      releaseConditions,
      expiresAt,
      metadata
    } = escrowData;

    const transaction = await sequelize.transaction();

    try {
      // Create and fund escrow account
      const escrowAccount = await EscrowAccount.create({
        status: 'pending',
        amount,
        releaseConditions,
        expiresAt,
        metadata
      }, { transaction });

      // Initiate funding transaction
      const paymentTx = await this.initiatePayment({
        senderId,
        receiverId: null, // Funds go to escrow
        amount,
        paymentMethod,
        description: `Escrow funding for ${escrowAccount.id}`,
        metadata: {
          ...metadata,
          escrowId: escrowAccount.id
        }
      });

      // Link funding transaction to escrow
      await escrowAccount.update({
        fundingTransactionId: paymentTx.id
      }, { transaction });

      await transaction.commit();
      return {
        escrowAccount,
        transaction: paymentTx
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Escrow creation failed: ${error.message}`);
    }
  }

  async releaseEscrow(escrowId, releasedBy) {
    const transaction = await sequelize.transaction();

    try {
      const escrowAccount = await EscrowAccount.findByPk(escrowId, {
        lock: true,
        transaction
      });

      if (!escrowAccount) {
        throw new Error('Escrow account not found');
      }

      if (escrowAccount.status !== 'funded') {
        throw new Error('Escrow account not in releasable state');
      }

      // Create release transaction
      const releaseTx = await Transaction.create({
        type: 'payment',
        senderId: null, // From escrow
        receiverId: escrowAccount.metadata.receiverId,
        amount: escrowAccount.amount,
        status: 'completed',
        paymentMethod: 'wallet',
        description: `Escrow release for ${escrowId}`,
        metadata: {
          escrowId,
          releasedBy
        }
      }, { transaction });

      // Update escrow status
      await escrowAccount.update({
        status: 'released',
        releaseTransactionId: releaseTx.id,
        releasedAt: new Date()
      }, { transaction });

      await transaction.commit();
      return {
        escrowAccount,
        transaction: releaseTx
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Escrow release failed: ${error.message}`);
    }
  }

  async processPaymentCallback(provider, callbackData) {
    const transaction = await sequelize.transaction();

    try {
      const tx = await Transaction.findOne({
        where: {
          paymentReference: callbackData.reference
        },
        lock: true,
        transaction
      });

      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Verify callback with provider
      let verificationResult;
      switch (provider) {
        case 'mtn':
          verificationResult = await this.mtnProvider.verifyCallback(callbackData);
          break;
        case 'orange':
          verificationResult = await this.orangeProvider.verifyCallback(callbackData);
          break;
        default:
          throw new Error('Invalid provider');
      }

      if (!verificationResult.valid) {
        throw new Error('Invalid callback verification');
      }

      // Update transaction status
      await tx.update({
        status: verificationResult.status,
        metadata: {
          ...tx.metadata,
          callbackData: callbackData
        }
      }, { transaction });

      // If successful payment to escrow, update escrow status
      if (tx.metadata.escrowId && verificationResult.status === 'completed') {
        await EscrowAccount.update({
          status: 'funded'
        }, {
          where: { id: tx.metadata.escrowId },
          transaction
        });
      }

      await transaction.commit();
      return tx;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Callback processing failed: ${error.message}`);
    }
  }

  async _processWalletPayment(senderId, receiverId, amount, transaction) {
    // Get sender's wallet
    const senderWallet = await Wallet.findOne({
      where: {
        userId: senderId,
        status: 'active'
      },
      lock: true,
      transaction
    });

    if (!senderWallet || senderWallet.balance < amount) {
      throw new Error('Insufficient funds');
    }

    // Get or create receiver's wallet
    const [receiverWallet] = await Wallet.findOrCreate({
      where: { userId: receiverId },
      defaults: {
        status: 'active',
        balance: 0
      },
      transaction
    });

    // Transfer funds
    await Promise.all([
      senderWallet.decrement('balance', { by: amount, transaction }),
      receiverWallet.increment('balance', { by: amount, transaction })
    ]);

    // Update last transaction time
    await Promise.all([
      senderWallet.update({ lastTransactionAt: new Date() }, { transaction }),
      receiverWallet.update({ lastTransactionAt: new Date() }, { transaction })
    ]);

    return {
      reference: `wallet-${Date.now()}`,
      status: 'completed'
    };
  }

  async calculateCommission(amount, type = 'standard') {
    const commissionRates = {
      standard: 0.025, // 2.5%
      expert: 0.15,    // 15%
      market: 0.05     // 5%
    };

    const rate = commissionRates[type] || commissionRates.standard;
    return parseFloat((amount * rate).toFixed(2));
  }
}

module.exports = new PaymentService();