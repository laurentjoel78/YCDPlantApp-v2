const { User } = require('../models');
const emailService = require('../services/emailService');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');

// Get pending approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const logger = req.log || console;
    logger.info('Fetching pending user approvals');

    const pendingUsers = await User.findAll({
      where: {
        role: { [Op.in]: ['farmer', 'expert'] },
        approval_status: 'pending'
      },
      attributes: { exclude: ['password_hash'] }
    });

    res.json({ users: pendingUsers });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Error fetching pending approvals' });
  }
};

// Approve or reject user
exports.updateApprovalStatus = async (req, res) => {
  try {
    const logger = req.log || console;
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const user = await User.findOne({
      where: {
        id: userId,
        role: { [Op.in]: ['farmer', 'expert'] }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.approval_status !== 'pending') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    await user.update({
      approval_status: status,
      approved_at: status === 'approved' ? new Date() : null
    });

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'ADMIN_USER_APPROVAL_UPDATE',
      actionDescription: `Admin ${status} user ${user.email}`,
      req,
      tableName: 'users',
      recordId: userId,
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        status,
        reason
      }
    });

    // Send email notification
    try {
      await emailService.sendAccountApprovalEmail(user, status);
    } catch (emailError) {
      logger.error('Failed to send approval email', { userId, error: emailError.message });
    }

    res.json({
      message: `User ${status} successfully`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        approval_status: user.approval_status
      }
    });
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ error: 'Error updating approval status' });
  }
};