const { Expert, User, ExpertReview, Consultation, sequelize } = require('../models');
const { sendNotification } = require('../utils/notificationHelper');
const { Op } = require('sequelize');
const auditService = require('./auditService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class ExpertService {
  async createExpert(data, adminId) {
    const {
      email,
      firstName,
      lastName,
      phone,
      specializations,
      certifications,
      experience,
      bio,
      languages,
      hourlyRate,
      location
    } = data;

    const transaction = await sequelize.transaction();

    try {
      // Generate a temporary password for the expert
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const password_hash = await bcrypt.hash(tempPassword, 10);

      // Trim whitespace from string fields
      const trimmedEmail = email?.trim();
      const trimmedFirstName = firstName?.trim();
      const trimmedLastName = lastName?.trim();
      const trimmedPhone = phone?.trim();

      // Helper to ensure array fields are arrays
      const parseArray = (input) => {
        if (!input) return [];
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') {
          // Try parsing JSON first
          try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {
            // Not JSON, fall back to comma split
            return input.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        return [input]; // Single value fallback
      };

      const finalSpecializations = parseArray(specializations);
      const finalLanguages = languages ? parseArray(languages) : ['French', 'English']; // Default if missing

      // Create user account for expert
      const user = await User.create({
        email: trimmedEmail,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        phone_number: trimmedPhone,
        role: 'expert',
        password_hash,
        created_by_admin_id: adminId
      }, { transaction });


      // Create expert profile
      const expert = await Expert.create({
        userId: user.id,
        specializations: finalSpecializations,
        certifications,
        experience,
        bio,
        languages: finalLanguages,
        hourlyRate,
        location,
        createdByAdminId: adminId,
        approvalStatus: 'approved',
        profileVisible: true,
        approvedByAdminId: adminId,
        approvedAt: new Date()
      }, { transaction });

      // Log expert creation
      await auditService.logUserAction({
        userId: adminId,
        userRole: 'admin',
        actionType: 'EXPERT_CREATED',
        actionDescription: 'New expert profile created by admin',
        metadata: {
          expertId: expert.id,
          expertEmail: email
        }
      }); // Audit logs usually don't need to be in the same transaction for data integrity, but typically are safe to be outside or inside. keeping outside or independent is fine, but for strictness let's leave it as is (it might not support transaction arg).

      await transaction.commit();

      return expert;
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating expert:', error);

      // Handle duplicate email error
      if (error.name === 'SequelizeUniqueConstraintError' && error.fields?.email) {
        const duplicateError = new Error(`An account with email "${error.fields.email}" already exists`);
        duplicateError.statusCode = 409;
        throw duplicateError;
      }

      throw error;
    }
  }


  async getExpertApplications(filters = {}) {
    try {
      const { limit = 10, offset = 0 } = filters;

      const applications = await Expert.findAndCountAll({
        where: {
          approvalStatus: 'pending'
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'created_at']
        }],
        limit,
        offset,
        order: [['createdAt', 'ASC']]
      });

      return applications;
    } catch (error) {
      console.error('Error getting expert applications:', error);
      throw error;
    }
  }

  async approveExpert(expertId, adminId) {
    try {
      const expert = await Expert.findByPk(expertId);

      if (!expert) {
        throw new Error('Expert not found');
      }

      await expert.update({
        approvalStatus: 'approved',
        approvedByAdminId: adminId,
        approvedAt: new Date(),
        profileVisible: true
      });

      const user = await User.findByPk(expert.userId);

      await sendNotification({
        userId: expert.userId,
        type: 'expert_approval',
        title: 'Account Approved',
        message: 'Your expert account has been approved. You can now receive consultation requests.',
        data: {
          expertId: expert.id
        }
      });

      await auditService.logUserAction({
        userId: adminId,
        userRole: 'admin',
        actionType: 'EXPERT_APPROVED',
        actionDescription: 'Expert profile approved by admin',
        metadata: {
          expertId: expert.id,
          expertEmail: user.email
        }
      });

      return expert;
    } catch (error) {
      console.error('Error approving expert:', error);
      throw error;
    }
  }

  async getExpertProfile(expertId, includePrivate = false) {
    try {
      const expert = await Expert.findByPk(expertId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: includePrivate ?
              ['id', 'email', 'first_name', 'last_name', 'phone_number', 'created_at'] :
              ['first_name', 'last_name']
          },
          {
            model: ExpertReview,
            as: 'reviews',
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{
              model: User,
              as: 'farmer',
              attributes: ['first_name', 'last_name']
            }]
          }
        ]
      });

      if (!expert) {
        throw new Error('Expert not found');
      }

      if (!includePrivate) {
        delete expert.commissionRate;
        delete expert.totalEarnings;
        delete expert.createdByAdminId;
        delete expert.approvedByAdminId;
      }

      return expert;
    } catch (error) {
      console.error('Error getting expert profile:', error);
      throw error;
    }
  }

  async updateExpertProfile(expertId, data, adminId) {
    try {
      const expert = await Expert.findByPk(expertId);

      if (!expert) {
        throw new Error('Expert not found');
      }

      await expert.update(data);

      if (data.user) {
        await User.update(data.user, {
          where: { id: expert.userId }
        });
      }

      await auditService.logUserAction({
        userId: adminId,
        userRole: 'admin',
        actionType: 'EXPERT_UPDATED',
        actionDescription: 'Expert profile updated by admin',
        metadata: {
          expertId: expert.id,
          updatedFields: Object.keys(data)
        }
      });

      return expert;
    } catch (error) {
      console.error('Error updating expert profile:', error);
      throw error;
    }
  }

  async searchExperts(filters = {}) {
    try {
      const {
        specializations,
        languages,
        maxRate,
        availability,
        location,
        limit = 10,
        offset = 0
      } = filters;

      const where = {
        approvalStatus: 'approved',
        profileVisible: true
      };

      if (specializations) {
        where.specializations = {
          [Op.overlap]: Array.isArray(specializations) ? specializations : [specializations]
        };
      }

      if (languages) {
        where.languages = {
          [Op.overlap]: Array.isArray(languages) ? languages : [languages]
        };
      }

      if (maxRate) {
        where.hourlyRate = {
          [Op.lte]: maxRate
        };
      }

      if (availability) {
        where.availability = {
          available: true
        };
      }

      if (location) {
        where.location = {
          [Op.and]: [
            { 'lat': { [Op.between]: [location.lat - 1, location.lat + 1] } },
            { 'lng': { [Op.between]: [location.lng - 1, location.lng + 1] } }
          ]
        };
      }

      const experts = await Expert.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name']
        }],
        limit,
        offset,
        order: [
          [sequelize.fn('COALESCE', sequelize.col('rating'), 0), 'DESC'],
          ['totalConsultations', 'DESC']
        ]
      });

      return experts;
    } catch (error) {
      console.error('Error searching experts:', error);
      throw error;
    }
  }

  async rateExpert(expertId, farmerId, data) {
    const transaction = await sequelize.transaction();
    try {
      const { rating, comment, consultationId } = data;

      const consultation = await Consultation.findOne({
        where: {
          id: consultationId,
          expertId,
          farmerId,
          status: 'completed'
        }
      });

      if (!consultation) {
        throw new Error('Valid completed consultation required to rate expert');
      }

      const existingReview = await ExpertReview.findOne({
        where: { consultationId }
      });

      if (existingReview) {
        throw new Error('Consultation already reviewed');
      }

      const review = await ExpertReview.create({
        expertId,
        farmerId,
        consultationId,
        rating,
        comment,
        consultationType: consultation.type || 'remote',
        consultationDate: consultation.createdAt,
        verified: true
      }, { transaction });

      const stats = await ExpertReview.findOne({
        where: { expertId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        transaction
      });

      const newRating = parseFloat(stats.getDataValue('avgRating')).toFixed(1);

      await Expert.update({
        rating: newRating
      }, {
        where: { id: expertId },
        transaction
      });

      await transaction.commit();
      return review;
    } catch (error) {
      await transaction.rollback();
      console.error('Error rating expert:', error);
      throw error;
    }
  }

  async getExpertStats(expertId) {
    try {
      const expert = await Expert.findByPk(expertId);

      if (!expert) {
        throw new Error('Expert not found');
      }

      const consultations = await Consultation.findAll({
        where: {
          expertId,
          status: {
            [Op.in]: ['completed', 'in_progress']
          }
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('farmerRating')), 'avgRating']
        ],
        group: ['status']
      });

      const reviews = await ExpertReview.findAll({
        where: { expertId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
        ]
      });

      return {
        consultations,
        reviews,
        earnings: expert.totalEarnings,
        completionRate: expert.completionRate,
        avgResponseTime: expert.avgResponseTime
      };
    } catch (error) {
      console.error('Error getting expert stats:', error);
      throw error;
    }
  }
}

module.exports = new ExpertService();