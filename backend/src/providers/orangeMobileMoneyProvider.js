/**
 * Mock Orange Money Provider for Testing
 * Simulates Orange Money API responses
 */

class OrangeMobileMoneyProvider {
  constructor() {
    this.pendingPayments = new Map();
  }

  async initiatePayment(paymentData) {
    const { amount, phoneNumber, description } = paymentData;

    // Generate mock reference
    const reference = `OM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
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
      try {
        const payment = this.pendingPayments.get(reference);
        if (payment) {
          payment.status = 'completed';
          payment.completedAt = new Date();

          // Update database Transaction record
          try {
            // Re-fetch to ensure we have fresh data
            const db = require('../models');
            const txToUpdate = await db.Transaction.findOne({
              where: { payment_reference: reference }
            });

            if (txToUpdate) {
              await txToUpdate.update({ payment_status: 'completed' });
              console.log(`[MockOrange] DB Updated for ${reference}`);
            } else {
              console.warn(`[MockOrange] Transaction not found in DB for ${reference}`);
            }
          } catch (dbError) {
            console.error('[MockOrange] Database update failed:', dbError);
          }

          console.log(`[MockOrange] Payment ${reference} auto-completed in memory`);
        }
      } catch (err) {
        console.error('[MockOrange] Callback error:', err);
      }
    }, 5000);

    return {
      success: true,
      reference,
      status: 'pending',
      instructions: {
        title: 'Complete Orange Money Payment',
        steps: [
          `Dial #150# on your Orange phone`,
          `Select option 1 (Transfer Money)`,
          `Enter merchant code: YCD001`,
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

module.exports = OrangeMobileMoneyProvider;