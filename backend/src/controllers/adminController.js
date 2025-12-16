const expertService = require('../services/expertService');
const { asyncHandler } = require('../utils/asyncHandler');
// ApiError removed - using standard error handling
const { calculateConsultationCost } = require('../utils/commissionCalculator');
const auditService = require('../services/auditService');

exports.createExpert = asyncHandler(async (req, res) => {
  // Logger removed - was causing undefined error

  if (!req.user.isAdmin) {
    const error = new Error('Only admins can create expert accounts'); error.statusCode = 403; throw error;
  }

  const expertData = {
    ...req.body,
    location: req.body.location ? {
      type: 'Point',
      coordinates: [req.body.location.longitude, req.body.location.latitude]
    } : null
  };

  const expert = await expertService.createExpert(expertData, req.user.id);

  // Log activity
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_EXPERT_CREATE',
    actionDescription: `Admin created expert account for ${expert.email}`,
    req,
    tableName: 'experts',
    recordId: expert.id,
    metadata: { email: expert.email }
  });

  res.status(201).json({
    success: true,
    data: expert
  });
});

exports.getExpertApplications = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view expert applications'); error.statusCode = 403; throw error;
  }

  const { limit = 10, offset = 0 } = req.query;

  const applications = await expertService.getExpertApplications({
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: applications
  });
});

exports.reviewExpertApplication = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can review expert applications'); error.statusCode = 403; throw error;
  }

  const { expertId } = req.params;
  const { decision, feedback } = req.body;

  const expert = await expertService.reviewExpertApplication(
    expertId,
    req.user.id,
    decision,
    feedback
  );

  // Log activity
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_EXPERT_REVIEW',
    actionDescription: `Admin reviewed expert application ${expertId}`,
    req,
    tableName: 'expert_applications', // Assuming table name or relevant entity
    recordId: expertId,
    metadata: { decision, feedback }
  });

  res.json({
    success: true,
    data: expert // Fixed variable name from applications to expert
  });
});

exports.handleConsultationRequest = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can handle consultation requests'); error.statusCode = 403; throw error;
  }

  const { requestId } = req.params;
  const { expertId, decision, feedback } = req.body;

  if (decision === 'assign' && !expertId) {
    const error = new Error('Expert ID is required for assignment'); error.statusCode = 400; throw error;
  }

  const consultation = await expertService.handleConsultationRequest(
    requestId,
    req.user.id,
    {
      decision,
      expertId,
      feedback
    }
  );

  // Log activity
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_CONSULTATION_HANDLE',
    actionDescription: `Admin handled consultation request ${requestId}`,
    req,
    tableName: 'consultations',
    recordId: requestId,
    metadata: { decision, expertId }
  });

  res.json({
    success: true,
    data: consultation
  });
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view dashboard stats'); error.statusCode = 403; throw error;
  }

  const stats = await expertService.getDashboardStats();

  res.json({
    success: true,
    data: stats
  });
});

exports.getRevenueReport = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view revenue reports'); error.statusCode = 403; throw error;
  }

  const { startDate, endDate } = req.query;
  const report = await expertService.generateRevenueReport(
    new Date(startDate),
    new Date(endDate)
  );

  res.json({
    success: true,
    data: report
  });
});

exports.getConsultationDetails = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view consultation details'); error.statusCode = 403; throw error;
  }

  const { consultationId } = req.params;
  const consultation = await expertService.getConsultationDetails(consultationId);

  if (!consultation) {
    const error = new Error('Consultation not found'); error.statusCode = 404; throw error;
  }

  res.json({
    success: true,
    data: consultation
  });
});

exports.estimateConsultationCost = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can estimate consultation costs'); error.statusCode = 403; throw error;
  }

  const { expertId, consultationType, duration } = req.body;
  const expert = await expertService.getExpertById(expertId);

  if (!expert) {
    const error = new Error('Expert not found'); error.statusCode = 404; throw error;
  }

  const costEstimate = calculateConsultationCost({
    consultationType,
    expertFee: expert.financial.hourlyRate,
    duration
  });

  res.json({
    success: true,
    data: costEstimate
  });
});

exports.handlePaymentDispute = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can handle payment disputes'); error.statusCode = 403; throw error;
  }

  const { consultationId } = req.params;
  const { resolution, refundAmount, reason } = req.body;

  const result = await expertService.resolvePaymentDispute(
    consultationId,
    {
      adminId: req.user.id,
      resolution,
      refundAmount,
      reason
    }
  );

  // Log activity
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_DISPUTE_RESOLVE',
    actionDescription: `Admin resolved payment dispute for consultation ${consultationId}`,
    req,
    tableName: 'payment_disputes', // Assuming table name
    recordId: consultationId, // Or dispute ID if available
    metadata: { resolution, refundAmount, reason }
  });

  res.json({
    success: true,
    data: result
  });
});

exports.moderateExpertProfile = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can moderate expert profiles'); error.statusCode = 403; throw error;
  }

  const { expertId } = req.params;
  const { action, reason } = req.body;

  const result = await expertService.moderateExpert(
    expertId,
    action,
    reason,
    req.user.id
  );

  // Log activity
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_EXPERT_MODERATE',
    actionDescription: `Admin moderated expert profile ${expertId}`,
    req,
    tableName: 'experts',
    recordId: expertId,
    metadata: { action, reason }
  });

  res.json({
    success: true,
    data: result
  });
});

// User Management Controllers
exports.blockUser = asyncHandler(async (req, res) => {
  const { User } = require('../models');

  if (!req.user.isAdmin) {
    const error = new Error('Only admins can block users'); error.statusCode = 403; throw error;
  }

  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    const error = new Error('Reason is required to block a user'); error.statusCode = 400; throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found'); error.statusCode = 404; throw error;
  }

  if (!user.is_active) {
    const error = new Error('User is already blocked'); error.statusCode = 400; throw error;
  }

  await user.update({
    is_active: false
  });

  // Log the action
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_USER_BLOCK',
    actionDescription: `Admin blocked user ${user.email}`,
    req,
    tableName: 'users',
    recordId: userId,
    metadata: {
      targetUserId: userId,
      targetEmail: user.email,
      reason
    }
  });

  res.json({
    success: true,
    message: 'User blocked successfully',
    data: {
      userId: user.id,
      email: user.email,
      blocked: true
    }
  });
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const { User } = require('../models');

  if (!req.user.isAdmin) {
    const error = new Error('Only admins can unblock users'); error.statusCode = 403; throw error;
  }

  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found'); error.statusCode = 404; throw error;
  }

  if (user.is_active) {
    const error = new Error('User is not blocked'); error.statusCode = 400; throw error;
  }

  await user.update({
    is_active: true
  });

  // Log the action
  await auditService.logUserAction({
    userId: req.user.id,
    userRole: req.user.role,
    actionType: 'ADMIN_USER_UNBLOCK',
    actionDescription: `Admin unblocked user ${user.email}`,
    req,
    tableName: 'users',
    recordId: userId,
    metadata: {
      targetUserId: userId,
      targetEmail: user.email
    }
  });

  res.json({
    success: true,
    message: 'User unblocked successfully',
    data: {
      userId: user.id,
      email: user.email,
      blocked: false
    }
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { User } = require('../models');
  const { Op } = require('sequelize');

  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view all users'); error.statusCode = 403; throw error;
  }

  const { limit = 20, offset = 0, search, role } = req.query;
  const where = {};

  if (role && role !== 'all') where.role = role;

  if (search) {
    where[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const users = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password_hash'] }
  });

  res.json({
    success: true,
    data: users
  });
});


exports.deleteExpert = async (req, res) => {
  const { Expert } = require('../models');

  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete experts' });
    }

    const { expertId } = req.params;

    // Validate if expertId is provided
    if (!expertId) {
      return res.status(400).json({ error: 'Expert ID is required' });
    }

    const expert = await Expert.findByPk(expertId);
    if (!expert) {
      console.log(`Expert with ID ${expertId} not found during deletion attempt.`);
      return res.status(404).json({ error: 'Expert not found' });
    }

    await expert.destroy();

    // Log activity
    try {
      await auditService.logUserAction({
        userId: req.user.id,
        userRole: req.user.role,
        actionType: 'ADMIN_EXPERT_DELETE',
        actionDescription: `Admin deleted expert profile ${expertId}`,
        req,
        tableName: 'experts',
        recordId: expertId
      });
    } catch (logError) {
      console.error('Failed to log expert deletion:', logError);
      // Continue execution, do not fail the request
    }

    return res.status(200).json({
      success: true,
      message: 'Expert profile deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteExpert:', error);
    // Ensure we don't send headers twice if we already sent 404
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to delete expert' });
    }
  }
};


exports.deleteUser = async (req, res) => {
  const { User } = require('../models');

  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const { userId } = req.params;
    const { permanent = false } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Log before deletion for audit trail
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: permanent ? 'ADMIN_USER_DELETE_PERMANENT' : 'ADMIN_USER_DELETE_SOFT',
      actionDescription: `Admin deleted user ${user.email}`,
      req,
      tableName: 'users',
      recordId: userId,
      metadata: {
        targetUserId: userId,
        userEmail: user.email,
        permanent,
        userData: {
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          createdAt: user.created_at
        } // Preserve basic info in log since record will be gone/anonymized
      }
    });

    if (permanent) {
      await user.destroy({ force: true });
    } else {
      await user.update({
        is_active: false,
        email: `deleted_${user.id}_${user.email}` // Prevent email conflicts
      });
    }

    res.json({
      success: true,
      message: permanent ? 'User permanently deleted' : 'User deleted successfully',
      data: {
        userId: user.id,
        email: user.email,
        deletedPermanently: permanent
      }
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Activity Monitoring Controllers
exports.getUserActivityLogs = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view activity logs'); error.statusCode = 403; throw error;
  }

  const { userId } = req.params;
  const { startDate, endDate, actionType, limit = 50, offset = 0 } = req.query;

  const logs = await auditService.getAuditLogs({
    userId,
    actionType,
    startDate,
    endDate,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: logs
  });
});

exports.getAllRecentActivities = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view activity logs'); error.statusCode = 403; throw error;
  }

  const { limit = 100, offset = 0, actionType } = req.query;

  const logs = await auditService.getAuditLogs({
    actionType,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: logs
  });
});

exports.getActivityStats = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    const error = new Error('Only admins can view activity stats'); error.statusCode = 403; throw error;
  }

  const { timeframe = '7d' } = req.query;

  const stats = await auditService.getSystemMetrics(timeframe);

  res.json({
    success: true,
    data: stats
  });
});
