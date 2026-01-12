const { Advisory, AdvisoryResponse, User, Farm, Crop, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { sendNotification } = require('../utils/notificationHelper');

// Submit farmer query to admin (farmer to admin)
exports.submitFarmerQuery = async (req, res) => {
  try {
    req.log.info('Farmer submitting advisory query', {
      userId: req.user.id,
      farmId: req.body.farm_id,
      cropId: req.body.crop_id,
      priority: req.body.priority || 'medium'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.log.warn('Advisory query validation failed', {
        userId: req.user.id,
        errors: errors.array()
      });
      return res.status(400).json({ errors: errors.array() });
    }

    // Only farmers can submit queries
    if (req.user.role !== 'farmer') {
      req.log.warn('Non-farmer attempted to submit query', {
        userId: req.user.id,
        role: req.user.role
      });
      return res.status(403).json({ error: 'Only farmers can submit queries' });
    }

    const queryData = {
      farmer_id: req.user.id,
      farm_id: req.body.farm_id,
      crop_id: req.body.crop_id,
      subject: req.body.subject,
      description: req.body.description,
      priority: req.body.priority || 'medium',
      status: 'pending_admin' // Initial status
    };

    const advisory = await Advisory.create(queryData);

    req.log.info('Advisory query created successfully', {
      userId: req.user.id,
      advisoryId: advisory.id,
      farmId: advisory.farm_id,
      cropId: advisory.crop_id,
      status: advisory.status
    });

    // Notify all admins
    const admins = await User.findAll({
      where: { role: 'admin', is_active: true }
    });

    req.log.debug('Sending notifications to admins', {
      userId: req.user.id,
      advisoryId: advisory.id,
      adminCount: admins.length
    });

    for (const admin of admins) {
      await Notification.create({
        user_id: admin.id,
        type: 'new_query',
        title: 'New Farmer Query',
        message: `New query from farmer ${req.user.first_name} ${req.user.last_name}`,
        reference_id: advisory.id,
        reference_type: 'advisory'
      });

      await sendNotification(admin.id, 'new_query', {
        advisoryId: advisory.id,
        farmerName: `${req.user.first_name} ${req.user.last_name}`
      });

      req.log.debug('Admin notification sent', {
        userId: req.user.id,
        advisoryId: advisory.id,
        adminId: admin.id,
        notificationType: 'new_query'
      });
    }

    res.status(201).json({ advisory });
  } catch (error) {
    req.log.error('Failed to submit advisory query', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to submit query' });
  }
};

// Assign query to expert (admin only)
exports.assignToExpert = async (req, res) => {
  try {
    req.log.info('Admin attempting to assign advisory query', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId,
      expertId: req.body.expert_id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.log.warn('Advisory assignment validation failed', {
        userId: req.user.id,
        advisoryId: req.params.advisoryId,
        errors: errors.array()
      });
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admin can assign queries
    if (req.user.role !== 'admin') {
      req.log.warn('Non-admin attempted to assign query', {
        userId: req.user.id,
        role: req.user.role,
        advisoryId: req.params.advisoryId
      });
      return res.status(403).json({ error: 'Only administrators can assign queries' });
    }

    const advisory = await Advisory.findOne({
      where: { 
        id: req.params.advisoryId,
        is_active: true
      }
    });

    if (!advisory) {
      req.log.warn('Advisory query not found for assignment', {
        userId: req.user.id,
        advisoryId: req.params.advisoryId
      });
      return res.status(404).json({ error: 'Advisory query not found' });
    }

    req.log.debug('Updating advisory with expert assignment', {
      userId: req.user.id,
      advisoryId: advisory.id,
      expertId: req.body.expert_id,
      oldStatus: advisory.status,
      newStatus: 'pending_expert'
    });

    // Update advisory with expert assignment
    await advisory.update({
      expert_id: req.body.expert_id,
      status: 'pending_expert',
      updated_by: req.user.id
    });

    req.log.info('Advisory successfully assigned to expert', {
      userId: req.user.id,
      advisoryId: advisory.id,
      expertId: req.body.expert_id,
      status: 'pending_expert'
    });

    // Notify the expert
    await Notification.create({
      user_id: req.body.expert_id,
      type: 'expert_assignment',
      title: 'New Advisory Assignment',
      message: 'You have been assigned a new advisory query by admin',
      reference_id: advisory.id,
      reference_type: 'advisory'
    });

    req.log.debug('Creating expert notification', {
      userId: req.user.id,
      advisoryId: advisory.id,
      expertId: req.body.expert_id,
      notificationType: 'expert_assignment'
    });

    await sendNotification(req.body.expert_id, 'expert_assignment', {
      advisoryId: advisory.id,
      adminName: `${req.user.first_name} ${req.user.last_name}`
    });

    req.log.debug('Expert notification sent', {
      userId: req.user.id,
      advisoryId: advisory.id,
      expertId: req.body.expert_id
    });

    res.status(200).json({ advisory });
  } catch (error) {
    req.log.error('Failed to assign expert to advisory', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId,
      expertId: req.body.expert_id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to assign expert' });
  }
};

// Submit expert response (expert to admin)
exports.submitExpertResponse = async (req, res) => {
  try {
    req.log.info('Expert submitting response', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.log.warn('Expert response validation failed', {
        userId: req.user.id,
        advisoryId: req.params.advisoryId,
        errors: errors.array()
      });
      return res.status(400).json({ errors: errors.array() });
    }

    // Only experts can submit responses
    if (req.user.role !== 'expert') {
      req.log.warn('Non-expert attempted to submit response', {
        userId: req.user.id,
        role: req.user.role,
        advisoryId: req.params.advisoryId
      });
      return res.status(403).json({ error: 'Only experts can submit responses' });
    }

    req.log.debug('Fetching advisory for expert response', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId
    });

    const advisory = await Advisory.findOne({
      where: { 
        id: req.params.advisoryId,
        expert_id: req.user.id,
        is_active: true
      }
    });

    if (!advisory) {
      req.log.warn('Advisory not found for expert response', {
        userId: req.user.id,
        advisoryId: req.params.advisoryId
      });
      return res.status(404).json({ error: 'Advisory query not found' });
    }

    req.log.debug('Creating expert response', {
      userId: req.user.id,
      advisoryId: advisory.id,
      hasAttachments: (req.body.attachments || []).length > 0
    });

    // Create expert response
    const response = await AdvisoryResponse.create({
      advisory_id: advisory.id,
      user_id: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments || [],
      status: 'pending_admin_review'
    });

    req.log.info('Expert response created successfully', {
      userId: req.user.id,
      advisoryId: advisory.id,
      responseId: response.id
    });

    req.log.debug('Updating advisory status', {
      userId: req.user.id,
      advisoryId: advisory.id,
      oldStatus: advisory.status,
      newStatus: 'pending_admin_review'
    });

    // Update advisory status
    await advisory.update({
      status: 'pending_admin_review',
      updated_by: req.user.id
    });

    // Notify admins
    const admins = await User.findAll({
      where: { role: 'admin', is_active: true }
    });

    req.log.debug('Sending notifications to admins', {
      userId: req.user.id,
      advisoryId: advisory.id,
      adminCount: admins.length
    });

    for (const admin of admins) {
      await Notification.create({
        user_id: admin.id,
        type: 'expert_response',
        title: 'New Expert Response',
        message: `Expert has submitted a response for advisory #${advisory.id}`,
        reference_id: advisory.id,
        reference_type: 'advisory'
      });

      await sendNotification(admin.id, 'expert_response', {
        advisoryId: advisory.id,
        expertName: `${req.user.first_name} ${req.user.last_name}`
      });

      req.log.debug('Admin notification sent', {
        userId: req.user.id,
        advisoryId: advisory.id,
        adminId: admin.id,
        notificationType: 'expert_response'
      });
    }

    res.status(201).json({ response });
  } catch (error) {
    req.log.error('Failed to submit expert response', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to submit response' });
  }
};

// Approve and forward expert response to farmer (admin only)
exports.approveAndForwardResponse = async (req, res) => {
  try {
    req.log.info('Admin attempting to approve expert response', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId
    });

    // Only admin can approve responses
    if (req.user.role !== 'admin') {
      req.log.warn('Non-admin attempted to approve response', {
        userId: req.user.id,
        role: req.user.role,
        advisoryId: req.params.advisoryId
      });
      return res.status(403).json({ error: 'Only administrators can approve responses' });
    }

    req.log.debug('Fetching advisory for approval', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId
    });

    const advisory = await Advisory.findOne({
      where: { 
        id: req.params.advisoryId,
        is_active: true,
        status: 'pending_admin_review'
      }
    });

    if (!advisory) {
      req.log.warn('Advisory not found or not in correct state for approval', {
        userId: req.user.id,
        advisoryId: req.params.advisoryId
      });
      return res.status(404).json({ error: 'Advisory not found or not pending review' });
    }

    req.log.debug('Updating advisory status for approval', {
      userId: req.user.id,
      advisoryId: advisory.id,
      oldStatus: advisory.status,
      newStatus: 'response_sent'
    });

    // Update advisory status
    await advisory.update({
      status: 'response_sent',
      updated_by: req.user.id
    });

    req.log.debug('Updating response status to approved', {
      userId: req.user.id,
      advisoryId: advisory.id
    });

    // Update response status
    await AdvisoryResponse.update(
      { status: 'approved' },
      { 
        where: { 
          advisory_id: advisory.id,
          status: 'pending_admin_review'
        }
      }
    );

    req.log.info('Advisory response approved and status updated', {
      userId: req.user.id,
      advisoryId: advisory.id,
      farmerId: advisory.farmer_id
    });

    // Notify farmer
    await Notification.create({
      user_id: advisory.farmer_id,
      type: 'advisory_response',
      title: 'Advisory Response Available',
      message: 'A response to your query is now available',
      reference_id: advisory.id,
      reference_type: 'advisory'
    });

    req.log.debug('Creating farmer notification', {
      userId: req.user.id,
      advisoryId: advisory.id,
      farmerId: advisory.farmer_id,
      notificationType: 'advisory_response'
    });

    await sendNotification(advisory.farmer_id, 'advisory_response', {
      advisoryId: advisory.id
    });

    req.log.debug('Farmer notification sent', {
      userId: req.user.id,
      advisoryId: advisory.id,
      farmerId: advisory.farmer_id
    });

    res.status(200).json({ message: 'Response approved and forwarded to farmer' });
  } catch (error) {
    req.log.error('Failed to approve and forward response', {
      userId: req.user.id,
      advisoryId: req.params.advisoryId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to approve and forward response' });
  }
};

// Get queries assigned to admin
exports.getAdminQueries = async (req, res) => {
  try {
    req.log.info('Fetching admin queries', {
      userId: req.user.id
    });

    if (req.user.role !== 'admin') {
      req.log.warn('Non-admin attempted to access admin queries', {
        userId: req.user.id,
        role: req.user.role
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    req.log.debug('Retrieving pending queries for admin', {
      userId: req.user.id,
      statuses: ['pending_admin', 'pending_admin_review']
    });

    const queries = await Advisory.findAll({
      where: {
        status: ['pending_admin', 'pending_admin_review'],
        is_active: true
      },
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'expert',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Farm,
          attributes: ['id', 'name']
        },
        {
          model: Crop,
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    req.log.info('Admin queries retrieved successfully', {
      userId: req.user.id,
      queryCount: queries.length
    });

    res.status(200).json({ queries });
  } catch (error) {
    req.log.error('Failed to fetch admin queries', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
};

// Get farmer's queries
exports.getFarmerQueries = async (req, res) => {
  try {
    req.log.info('Fetching farmer queries', {
      userId: req.user.id
    });

    req.log.debug('Retrieving queries with approved responses', {
      userId: req.user.id,
      farmerId: req.user.id
    });

    const queries = await Advisory.findAll({
      where: {
        farmer_id: req.user.id,
        is_active: true
      },
      include: [
        {
          model: AdvisoryResponse,
          where: { status: 'approved' },
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    req.log.info('Farmer queries retrieved successfully', {
      userId: req.user.id,
      queryCount: queries.length,
      queriesWithResponses: queries.filter(q => q.AdvisoryResponses && q.AdvisoryResponses.length > 0).length
    });

    res.status(200).json({ queries });
  } catch (error) {
    req.log.error('Failed to fetch farmer queries', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
};

// Get expert's assigned queries
exports.getExpertQueries = async (req, res) => {
  try {
    const queries = await Advisory.findAll({
      where: {
        expert_id: req.user.id,
        status: 'pending_expert',
        is_active: true
      },
      include: [
        {
          model: Farm,
          attributes: ['id', 'name']
        },
        {
          model: Crop,
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ queries });
  } catch (error) {
    logger.error('Error in getExpertQueries:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
};