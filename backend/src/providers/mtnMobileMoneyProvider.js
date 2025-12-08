/**
 * Mock MTN Mobile Money Provider for Testing
 * Simulates MTN Mobile Money API responses
 */

class MTNMobileMoneyProvider {
  constructor() {
    this.pendingPayments = new Map();
  }

  async initiatePayment(paymentData) {
    const { amount, phoneNumber, description } = paymentData;

    // Generate mock reference
    const reference = `MTN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const transactionCode = Math.floor(100000 + Math.random() * 900000);

    // Store as pending
    this.pendingPayments.set(reference, {
      amount,
      phoneNumber,
      description,
      status: 'pending',
      createdAt: new Date()
    });

    // Auto-complete after 5 seconds (simulation)
    setTimeout(async () => {
      const payment = this.pendingPayments.get(reference);
      if (payment) {
        payment.status = 'completed';
        payment.completedAt = new Date();

        // Update database Transaction record
        try {
          const db = require('../models');
          const txToUpdate = await db.Transaction.findOne({
            where: { payment_reference: reference }
          });
          if (txToUpdate) {
            await txToUpdate.update({ payment_status: 'completed' });
          }
        } catch (error) {
          console.error('Mock payment DB update error:', error);
        }

        console.log(`[MockMTN] Payment ${reference} auto-completed`);
      }
    }, 5000);

    return {
      success: true,
      reference,
      status: 'pending',
      instructions: {
        title: 'Complete MTN Mobile Money Payment',
        steps: [
          `Dial *126# on your MTN phone`,
          `Select option 1 (Make Payment)`,
          `Enter merchant code: YCD2024`,
          `Enter code: ${transactionCode}`,
          `Enter amount: ${amount} XAF`,
          `Confirm your PIN`
        ],
        note: '🧪 TEST MODE: Payment will auto-complete in 5 seconds'
      }
    };
  }

  async verifyCallback(callbackData) {
    const { reference } = callbackData;
    const payment = this.pendingPayments.get(reference);

    if (!payment) {
      return { valid: false, status: 'not_found' };
    }

    return {
      valid: true,
      status: payment.status,
      amount: payment.amount,
      completedAt: payment.completedAt
    };
  }

  async checkStatus(reference) {
    const payment = this.pendingPayments.get(reference);

    if (!payment) {
      return { success: false, status: 'not_found' };
    }

    return {
      success: true,
      status: payment.status,
      reference,
      amount: payment.amount,
      completedAt: payment.completedAt
    };
  }
}

module.exports = MTNMobileMoneyProvider;