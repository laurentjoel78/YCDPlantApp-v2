const { Transaction, Order, User } = require('../models');
const { sendNotification } = require('../utils/notificationHelper');

class TransactionService {
  async initiateTransaction(order, paymentMethod) {
    try {
      const transaction = await Transaction.create({
        order_id: order.id,
        amount: order.total_price,
        currency: order.currency,
        type: 'payment',
        transaction_type: 'payment',
        payment_method: paymentMethod,
        payment_status: 'pending',
        payment_details: this.getPaymentDetails(paymentMethod)
      });

      // Send notification to buyer
      await sendNotification({
        user_id: order.buyer_id,
        type: 'payment_initiated',
        title: 'Payment Initiated',
        message: `Payment initiated for order #${order.id}. Amount: ${order.currency} ${order.total_price}`,
        data: {
          order_id: order.id,
          transaction_id: transaction.id
        }
      });

      return transaction;
    } catch (error) {
      console.error('Error initiating transaction:', error);
      throw error;
    }
  }

  getPaymentDetails(paymentMethod) {
    switch (paymentMethod) {
      case 'mobile_money':
        return {
          provider: 'Orange Money', // Default provider, can be made dynamic
          instructions: 'Transfer the amount to XXXX-XXXX-XXXX'
        };
      case 'bank_transfer':
        return {
          bank_name: 'Example Bank',
          account_number: 'XXXXXXXXXXXX',
          account_name: 'YCD Agricultural Services'
        };
      case 'cash_on_delivery':
        return {
          instructions: 'Have the exact amount ready upon delivery'
        };
      default:
        return {};
    }
  }

  async processPayment(transactionId, paymentReference) {
    try {
      const transaction = await Transaction.findOne({
        where: { id: transactionId, is_active: true },
        include: [
          {
            model: Order,
            include: [
              {
                model: User,
                as: 'buyer',
                attributes: ['id', 'first_name', 'last_name']
              },
              {
                model: User,
                as: 'seller',
                attributes: ['id', 'first_name', 'last_name']
              }
            ]
          }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.payment_status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      // Update transaction status
      await transaction.update({
        payment_status: 'completed',
        payment_reference: paymentReference,
        transaction_date: new Date()
      });

      // Update order status
      await transaction.Order.update({
        status: 'paid'
      });

      // Notify buyer and seller
      await Promise.all([
        sendNotification({
          user_id: transaction.Order.buyer_id,
          type: 'payment_completed',
          title: 'Payment Completed',
          message: `Your payment for order #${transaction.Order.id} has been completed.`,
          data: {
            order_id: transaction.Order.id,
            transaction_id: transaction.id
          }
        }),
        sendNotification({
          user_id: transaction.Order.seller_id,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment received for order #${transaction.Order.id}`,
          data: {
            order_id: transaction.Order.id,
            transaction_id: transaction.id
          }
        })
      ]);

      return transaction;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  async processSettlement(transactionId) {
    try {
      const transaction = await Transaction.findOne({
        where: { 
          id: transactionId, 
          payment_status: 'completed',
          settlement_status: 'pending',
          is_active: true
        },
        include: [
          {
            model: Order,
            include: [
              {
                model: User,
                as: 'seller',
                attributes: ['id', 'first_name', 'last_name', 'email']
              }
            ]
          }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found or not eligible for settlement');
      }

      // Calculate settlement amount (considering platform fees if any)
      const platformFeePercentage = 5; // 5% platform fee
      const settlementAmount = transaction.amount * (1 - platformFeePercentage / 100);

      // Update settlement status
      await transaction.update({
        settlement_status: 'completed',
        settlement_date: new Date(),
        payment_details: {
          ...transaction.payment_details,
          settlement_amount: settlementAmount,
          platform_fee: transaction.amount - settlementAmount
        }
      });

      // Notify seller
      await sendNotification({
        user_id: transaction.Order.seller_id,
        type: 'settlement_completed',
        title: 'Payment Settlement Completed',
        message: `Settlement completed for order #${transaction.Order.id}. Amount: ${transaction.currency} ${settlementAmount}`,
        data: {
          order_id: transaction.Order.id,
          transaction_id: transaction.id,
          settlement_amount: settlementAmount
        }
      });

      return transaction;
    } catch (error) {
      console.error('Error processing settlement:', error);
      throw error;
    }
  }

  async getTransactionDetails(transactionId, userId) {
    try {
      const transaction = await Transaction.findOne({
        where: { id: transactionId, is_active: true },
        include: [
          {
            model: Order,
            where: {
              [Op.or]: [
                { buyer_id: userId },
                { seller_id: userId }
              ]
            },
            include: [
              {
                model: User,
                as: 'buyer',
                attributes: ['id', 'first_name', 'last_name']
              },
              {
                model: User,
                as: 'seller',
                attributes: ['id', 'first_name', 'last_name']
              }
            ]
          }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found or unauthorized');
      }

      return transaction;
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw error;
    }
  }

  async refundTransaction(transactionId, reason) {
    try {
      const transaction = await Transaction.findOne({
        where: { 
          id: transactionId, 
          payment_status: 'completed',
          is_active: true
        },
        include: [{ model: Order }]
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.payment_status === 'refunded') {
        throw new Error('Transaction already refunded');
      }

      // Process refund
      await transaction.update({
        payment_status: 'refunded',
        notes: reason
      });

      // Update order status
      await transaction.Order.update({
        status: 'refunded'
      });

      // Notify buyer and seller
      await Promise.all([
        sendNotification({
          user_id: transaction.Order.buyer_id,
          type: 'refund_processed',
          title: 'Refund Processed',
          message: `Your refund for order #${transaction.Order.id} has been processed.`,
          data: {
            order_id: transaction.Order.id,
            transaction_id: transaction.id,
            reason
          }
        }),
        sendNotification({
          user_id: transaction.Order.seller_id,
          type: 'order_refunded',
          title: 'Order Refunded',
          message: `Order #${transaction.Order.id} has been refunded.`,
          data: {
            order_id: transaction.Order.id,
            transaction_id: transaction.id,
            reason
          }
        })
      ]);

      return transaction;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
}

module.exports = new TransactionService();