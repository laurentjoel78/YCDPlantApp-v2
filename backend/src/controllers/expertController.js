const expertService = require('../services/expertService');
const { isValidUUID } = require('../utils/validators');
const auditService = require('../services/auditService');

class ExpertController {
  async createExpert(req, res) {
    try {
      const adminId = req.user.id; // From auth middleware

      // Validate required fields
      const requiredFields = [
        'email', 'firstName', 'lastName', 'phone',
        'specializations', 'certifications', 'experience',
        'languages', 'hourlyRate', 'location'
      ];

      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            error: `Missing required field: ${field}`
          });
        }
      }

      const expert = await expertService.createExpert(req.body, adminId);

      // Log activity
      await auditService.logUserAction({
        userId: req.user.id,
        userRole: req.user.role,
        actionType: 'EXPERT_CREATE',
        actionDescription: `Created expert profile for ${expert.firstName} ${expert.lastName}`,
        req,
        tableName: 'experts',
        recordId: expert.id,
        metadata: { email: expert.email, specializations: expert.specializations }
      });

      res.status(201).json(expert);
    } catch (error) {
      console.error('Error in createExpert:', error);
      res.status(500).json({ error: 'Failed to create expert' });
    }
  }

  async getAllExperts(req, res) {
    try {
      const experts = await expertService.searchExperts({ limit: 100, offset: 0 });
      res.json(experts.rows || experts);
    } catch (error) {
      console.error('Error in getAllExperts:', error);
      res.status(500).json({ error: 'Failed to retrieve experts' });
    }
  }

  async approveExpert(req, res) {
    try {
      const { expertId } = req.params;
      const adminId = req.user.id;

      if (!isValidUUID(expertId)) {
        return res.status(400).json({ error: 'Invalid expert ID' });
      }

      const expert = await expertService.approveExpert(expertId, adminId);

      // Log activity
      await auditService.logUserAction({
        userId: req.user.id,
        userRole: req.user.role,
        actionType: 'EXPERT_APPROVE',
        actionDescription: `Approved expert ${expertId}`,
        req,
        tableName: 'experts',
        recordId: expertId
      });

      res.json(expert);
    } catch (error) {
      console.error('Error in approveExpert:', error);
      res.status(500).json({ error: 'Failed to approve expert' });
    }
  }

  async getExpertProfile(req, res) {
    try {
      const { expertId } = req.params;

      if (!isValidUUID(expertId)) {
        return res.status(400).json({ error: 'Invalid expert ID' });
      }

      // Check if requester is admin for private data access
      const includePrivate = req.user.role === 'admin';

      const expert = await expertService.getExpertProfile(expertId, includePrivate);

      res.json(expert);
    } catch (error) {
      console.error('Error in getExpertProfile:', error);
      res.status(500).json({ error: 'Failed to retrieve expert profile' });
    }
  }

  async updateExpertProfile(req, res) {
    try {
      const { expertId } = req.params;
      const adminId = req.user.id;

      if (!isValidUUID(expertId)) {
        return res.status(400).json({ error: 'Invalid expert ID' });
      }

      // Prevent updating sensitive fields
      const protectedFields = ['userId', 'createdByAdminId', 'approvedByAdminId'];
      protectedFields.forEach(field => delete req.body[field]);

      const expert = await expertService.updateExpertProfile(expertId, req.body, adminId);

      // Log activity
      await auditService.logUserAction({
        userId: req.user.id,
        userRole: req.user.role,
        actionType: 'EXPERT_UPDATE',
        actionDescription: `Updated expert profile ${expertId}`,
        req,
        tableName: 'experts',
        recordId: expertId,
        newValues: req.body
      });

      res.json(expert);
    } catch (error) {
      console.error('Error in updateExpertProfile:', error);
      res.status(500).json({ error: 'Failed to update expert profile' });
    }
  }

  async searchExperts(req, res) {
    try {
      const filters = {
        specializations: req.query.specializations?.split(','),
        languages: req.query.languages?.split(','),
        maxRate: req.query.maxRate ? parseFloat(req.query.maxRate) : undefined,
        availability: req.query.availability === 'true',
        location: req.query.lat && req.query.lng ? {
          lat: parseFloat(req.query.lat),
          lng: parseFloat(req.query.lng)
        } : undefined,
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await expertService.searchExperts(filters);

      res.json(result.rows || result);
    } catch (error) {
      console.error('Error in searchExperts:', error);
      res.status(500).json({ error: 'Failed to search experts' });
    }
  }

  async getExpertStats(req, res) {
    try {
      const { expertId } = req.params;

      if (!isValidUUID(expertId)) {
        return res.status(400).json({ error: 'Invalid expert ID' });
      }

      // Only allow access to stats for admins or the expert themselves
      if (req.user.role !== 'admin' && req.user.id !== expertId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const stats = await expertService.getExpertStats(expertId);

      res.json(stats);
    } catch (error) {
      console.error('Error in getExpertStats:', error);
      res.status(500).json({ error: 'Failed to retrieve expert statistics' });
    }
  }

  async getExpertReviews(req, res) {
    try {
      const { expertId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      if (!isValidUUID(expertId)) {
        return res.status(400).json({ error: 'Invalid expert ID' });
      }

      const { ExpertReview, User } = require('../models');

      const reviews = await ExpertReview.findAndCountAll({
        where: { expertId },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'farmer',
          attributes: ['first_name', 'last_name']
        }]
      });

      res.json(reviews);
    } catch (error) {
      console.error('Error in getExpertReviews:', error);
      res.status(500).json({ error: 'Failed to retrieve expert reviews' });
    }
  }

  async rateExpert(req, res) {
    try {
      const { expertId } = req.params;
      const farmerId = req.user.id;
      const { rating, comment, consultationId } = req.body;

      if (!isValidUUID(expertId)) {
        return res.status(400).json({ error: 'Invalid expert ID' });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      if (!consultationId) {
        return res.status(400).json({ error: 'Consultation ID is required' });
      }

      const review = await expertService.rateExpert(expertId, farmerId, {
        rating,
        comment,
        consultationId
      });

      // Log activity
      await auditService.logUserAction({
        userId: req.user.id,
        userRole: req.user.role,
        actionType: 'EXPERT_RATE',
        actionDescription: `Rated expert ${expertId}`,
        req,
        tableName: 'expert_reviews',
        recordId: review.id,
        metadata: { rating, expertId, consultationId }
      });

      res.status(201).json(review);
    } catch (error) {
      console.error('Error in rateExpert:', error);
      if (error.message.includes('already reviewed')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to submit rating' });
    }
  }
}

module.exports = new ExpertController();