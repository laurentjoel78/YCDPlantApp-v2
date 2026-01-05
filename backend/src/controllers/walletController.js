const { Wallet, Transaction, User } = require('../models');
const { ValidationError, Op } = require('sequelize');
const auditService = require('../services/auditService');

// Get wallet balance
const getBalance = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({
            where: { user_id: req.user.id },
            attributes: ['balance', 'currency', 'wallet_type', 'verification_level']
        });

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.json(wallet);
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Error retrieving wallet balance' });
    }
};

// Deposit funds
const deposit = async (req, res) => {
    try {
        const { amount, payment_method } = req.body;

        const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Create transaction record
        const transaction = await Transaction.create({
            payer_id: req.user.id,
            payee_id: req.user.id,
            wallet_id: wallet.id,
            amount,
            type: 'deposit',
            transaction_type: 'deposit',
            payment_method,
            payment_status: 'completed',
            net_amount: amount
        });

        // Update wallet balance
        await wallet.increment('balance', { by: amount });
        await wallet.update({ last_transaction_date: new Date() });

        // Log activity
        await auditService.logUserAction({
            userId: req.user.id,
            userRole: req.user.role,
            actionType: 'WALLET_DEPOSIT',
            actionDescription: `Deposited ${amount} ${wallet.currency}`,
            req,
            tableName: 'transactions',
            recordId: transaction.id,
            metadata: { amount, currency: wallet.currency, paymentMethod: payment_method }
        });

        res.json({
            message: 'Deposit successful',
            transaction: {
                id: transaction.id,
                amount,
                type: 'deposit',
                status: 'completed'
            }
        });
    } catch (error) {
        console.error('Error processing deposit:', error);
        res.status(500).json({ error: 'Error processing deposit' });
    }
};

// Withdraw funds
const withdraw = async (req, res) => {
    try {
        const { amount, payment_method } = req.body;

        const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create transaction record
        const transaction = await Transaction.create({
            payer_id: req.user.id,
            payee_id: req.user.id,
            wallet_id: wallet.id,
            amount: -amount,
            type: 'withdrawal',
            transaction_type: 'withdrawal',
            payment_method,
            payment_status: 'completed',
            net_amount: -amount
        });

        // Update wallet balance
        await wallet.decrement('balance', { by: amount });
        await wallet.update({ last_transaction_date: new Date() });

        // Log activity
        await auditService.logUserAction({
            userId: req.user.id,
            userRole: req.user.role,
            actionType: 'WALLET_WITHDRAW',
            actionDescription: `Withdrew ${amount} ${wallet.currency}`,
            req,
            tableName: 'transactions',
            recordId: transaction.id,
            metadata: { amount, currency: wallet.currency, paymentMethod: payment_method }
        });

        res.json({
            message: 'Withdrawal successful',
            transaction: {
                id: transaction.id,
                amount,
                type: 'withdrawal',
                status: 'completed'
            }
        });
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ error: 'Error processing withdrawal' });
    }
};

// Transfer funds
const transfer = async (req, res) => {
    try {
        const { amount, recipient_id, payment_method } = req.body;

        const [senderWallet, recipientWallet] = await Promise.all([
            Wallet.findOne({ where: { user_id: req.user.id } }),
            Wallet.findOne({ where: { user_id: recipient_id } })
        ]);

        if (!senderWallet) {
            return res.status(404).json({ error: 'Sender wallet not found' });
        }

        if (!recipientWallet) {
            return res.status(404).json({ error: 'Recipient wallet not found' });
        }

        if (senderWallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create transaction record
        const transaction = await Transaction.create({
            payer_id: req.user.id,
            payee_id: recipient_id,
            wallet_id: senderWallet.id,
            amount,
            type: 'transfer',
            transaction_type: 'transfer',
            payment_method,
            payment_status: 'completed',
            net_amount: amount
        });

        // Update wallet balances
        await Promise.all([
            senderWallet.decrement('balance', { by: amount }),
            recipientWallet.increment('balance', { by: amount }),
            senderWallet.update({ last_transaction_date: new Date() }),
            recipientWallet.update({ last_transaction_date: new Date() })
        ]);

        // Log activity
        await auditService.logUserAction({
            userId: req.user.id,
            userRole: req.user.role,
            actionType: 'WALLET_TRANSFER',
            actionDescription: `Transferred ${amount} ${senderWallet.currency} to user ${recipient_id}`,
            req,
            tableName: 'transactions',
            recordId: transaction.id,
            metadata: { amount, currency: senderWallet.currency, recipientId: recipient_id }
        });

        res.json({
            message: 'Transfer successful',
            transaction: {
                id: transaction.id,
                amount,
                type: 'transfer',
                status: 'completed'
            }
        });
    } catch (error) {
        console.error('Error processing transfer:', error);
        res.status(500).json({ error: 'Error processing transfer' });
    }
};

// Get transaction history
const getTransactions = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ where: { user_id: req.user.id } });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { payer_id: req.user.id },
                    { payee_id: req.user.id }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'payer',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: User,
                    as: 'payee',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ error: 'Error retrieving transaction history' });
    }
};

module.exports = {
    getBalance,
    deposit,
    withdraw,
    transfer,
    getTransactions
};