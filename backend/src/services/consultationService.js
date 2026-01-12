const logger = require('../config/logger');
const Consultation = require('../models/consultation');
const Expert = require('../models/expert');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper');
const auditService = require('./auditService');

class ConsultationService {
  async createConsultation(data, farmerId) {
    try {
      const {
        expertId,
        problemDescription,
        images,
        consultationType,
        urgency = 'medium',
        scheduledTime,
        duration = 60
      } = data;

      // Get expert details to calculate cost
      const expert = await Expert.findByPk(expertId);
      if (!expert) {
        throw new Error('Expert not found');
      }

      // Calculate cost and commission
      const costPerHour = expert.hourlyRate;
      const cost = (costPerHour * duration) / 60; // Convert duration to hours
      const commissionAmount = cost * expert.commissionRate;

      // Create consultation
      const consultation = await Consultation.create({
        farmerId,
        expertId,
        adminId: expert.createdByAdminId, // Initially assigned to expert's creator
        problemDescription,
        images,
        consultationType,
        urgency,
        scheduledTime,
        duration,
        cost,
        commissionAmount,
        status: 'pending_admin_review'
      });

      // Notify admin
      await sendNotification({
        userId: expert.createdByAdminId,
        type: 'consultation_request',
        title: `New Consultation Request (${urgency})`,
        message: `New ${consultationType} consultation request for ${expert.user.firstName} ${expert.user.lastName}`,
        data: {
          consultationId: consultation.id,
          expertId,
          farmerId
        }
      });

      return consultation;
    } catch (error) {
      logger.error('Error creating consultation:', error);
      throw error;
    }
  }

  async approveConsultation(consultationId, adminId) {
    try {
      const consultation = await Consultation.findByPk(consultationId);
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Update consultation status
      await consultation.update({
        status: 'pending_expert_acceptance',
        adminId // Update to approving admin
      });

      // Notify expert
      await sendNotification({
        userId: consultation.expert.userId,
        type: 'consultation_approved',
        title: 'New Consultation Request',
        message: 'You have a new consultation request awaiting your acceptance',
        data: {
          consultationId: consultation.id
        }
      });

      return consultation;
    } catch (error) {
      logger.error('Error approving consultation:', error);
      throw error;
    }
  }

  async acceptConsultation(consultationId, expertId) {
    try {
      const consultation = await Consultation.findOne({
        where: {
          id: consultationId,
          expertId,
          status: 'pending_expert_acceptance'
        }
      });

      if (!consultation) {
        throw new Error('Consultation not found or not pending acceptance');
      }

      // Update consultation status
      await consultation.update({
        status: 'pending_payment'
      });

      // Notify farmer
      await sendNotification({
        userId: consultation.farmerId,
        type: 'consultation_accepted',
        title: 'Consultation Accepted',
        message: 'Your consultation request has been accepted. Please proceed with payment.',
        data: {
          consultationId: consultation.id,
          amount: consultation.cost
        }
      });

      return consultation;
    } catch (error) {
      logger.error('Error accepting consultation:', error);
      throw error;
    }
  }

  async completeConsultation(consultationId, expertId, notes) {
    try {
      const consultation = await Consultation.findOne({
        where: {
          id: consultationId,
          expertId,
          status: 'in_progress'
        }
      });

      if (!consultation) {
        throw new Error('Consultation not found or not in progress');
      }

      // Update consultation
      await consultation.update({
        status: 'completed',
        expertNotes: notes,
        completionTime: new Date()
      });

      // Update expert statistics
      const expert = await Expert.findByPk(expertId);
      await expert.update({
        totalConsultations: expert.totalConsultations + 1,
        totalEarnings: expert.totalEarnings + (consultation.cost - consultation.commissionAmount)
      });

      // Notify farmer
      await sendNotification({
        userId: consultation.farmerId,
        type: 'consultation_completed',
        title: 'Consultation Completed',
        message: 'Your consultation has been completed. Please provide your feedback.',
        data: {
          consultationId: consultation.id
        }
      });

      return consultation;
    } catch (error) {
      logger.error('Error completing consultation:', error);
      throw error;
    }
  }

  async getFarmerConsultations(farmerId, status) {
    try {
      const where = { farmerId };
      if (status) where.status = status;

      const consultations = await Consultation.findAll({
        where,
        include: [{
          model: Expert,
          as: 'expert',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        }],
        order: [['createdAt', 'DESC']]
      });

      return consultations;
    } catch (error) {
      logger.error('Error getting farmer consultations:', error);
      throw error;
    }
  }

  async getExpertConsultations(expertId, status) {
    try {
      const where = { expertId };
      if (status) where.status = status;

      const consultations = await Consultation.findAll({
        where,
        include: [{
          model: User,
          as: 'farmer',
          attributes: ['firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']]
      });

      return consultations;
    } catch (error) {
      logger.error('Error getting expert consultations:', error);
      throw error;
    }
  }

  async getAdminConsultations(status) {
    try {
      const where = {};
      if (status) where.status = status;

      const consultations = await Consultation.findAll({
        where,
        include: [
          {
            model: Expert,
            as: 'expert',
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: User,
            as: 'farmer',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return consultations;
    } catch (error) {
      logger.error('Error getting admin consultations:', error);
      throw error;
    }
  }
}

module.exports = new ConsultationService();