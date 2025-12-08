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

exports.deleteUser = asyncHandler(async (req, res) => {
  const { User } = require('../models');

  if (!req.user.isAdmin) {
    const error = new Error('Only admins can delete users'); error.statusCode = 403; throw error;
  }

  const { userId } = req.params;
  const { permanent = false } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found'); error.statusCode = 404; throw error;
  }

  // Prevent self-deletion
  if (user.id === req.user.id) {
    const error = new Error('Cannot delete your own account'); error.statusCode = 400; throw error;
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
      }
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
});

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
