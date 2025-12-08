const consultationService = require('../services/consultationService');
const { isValidUUID } = require('../utils/validators');
const auditService = require('../services/auditService');

class ConsultationController {
  async createConsultation(req, res) {
    try {
      const farmerId = req.user.id; // From auth middleware

      // Validate required fields
      const requiredFields = [
        'expertId',
        'problemDescription',
        'consultationType'
      ];

      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            error: `Missing required field: ${field}`
          });
        }
      }

      // Handle image uploads if any
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.filename);
      }

      const consultation = await consultationService.createConsultation({
        ...req.body,
        images
      }, farmerId);

      // Log consultation creation
      await auditService.logUserAction({
        userId: farmerId,
        userRole: req.user.role,
        actionType: 'CONSULTATION_REQUESTED',
        actionDescription: 'Farmer requested consultation',
        req,
        tableName: 'consultations',
        recordId: consultation.id,
        metadata: {
          consultationId: consultation.id,
          expertId: req.body.expertId
        }
      });

      res.status(201).json(consultation);
    } catch (error) {
      console.error('Error in createConsultation:', error);
      res.status(500).json({ error: 'Failed to create consultation' });
    }
  }

  async bookConsultationWithPayment(req, res) {
    const db = require('../models');
    const sequelize = db.sequelize;
    const paymentService = require('../services/paymentService');

    const transaction = await sequelize.transaction();

    try {
      const userId = req.user.id;
      const {
        expertId,
        problemDescription,
        consultationType,
        scheduledDate,
        duration,
        paymentMethod,
        phoneNumber,
        totalCost
      } = req.body;

      // Validate required fields
      if (!expertId || !problemDescription || !consultationType || !scheduledDate || !paymentMethod || !phoneNumber) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create consultation
      const { Consultation } = db;
      const consultation = await Consultation.create({
        farmer_id: userId,
        expert_id: expertId,
        problem_description: problemDescription,
        consultation_type: consultationType,
        scheduled_date: new Date(scheduledDate),
        estimated_duration: duration || 60,
        status: 'pending',
        total_cost: totalCost,
        payment_status: 'pending'
      }, { transaction });

      // Initiate payment (if not cash on delivery)
      let paymentResult;
      if (paymentMethod !== 'cash_on_delivery') {
        try {
          paymentResult = await paymentService.initiatePayment({
            senderId: userId,
            receiverId: expertId,
            amount: totalCost,
            paymentMethod,
            description: `Consultation #${consultation.id.substring(0, 8)}`,
            metadata: {
              consultationId: consultation.id,
              phoneNumber
            }
          });

          // Update consultation with payment reference
          await consultation.update({
            payment_reference: paymentResult.payment_reference
          }, { transaction });

        } catch (paymentError) {
          await transaction.rollback();
          console.error('[Consultation] Payment initiation failed:', paymentError);
          return res.status(500).json({
            error: 'Payment initiation failed',
            details: paymentError.message
          });
        }
      }

      // Commit transaction
      await transaction.commit();

      // Return response with payment_reference
      res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: {
          consultation: {
            id: consultation.id,
            expertId: consultation.expert_id,
            status: consultation.status,
            scheduledDate: consultation.scheduled_date,
            totalCost: consultation.total_cost,
            paymentStatus: consultation.payment_status,
            paymentReference: consultation.payment_reference
          },
          payment: paymentResult ? {
            reference: paymentResult.payment_reference,
            status: paymentResult.status
          } : {
            method: 'cash_on_delivery',
            note: 'Payment will be collected at consultation'
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Consultation booking error:', error);
      res.status(500).json({
        error: 'Failed to book consultation',
        details: error.message
      });
    }
  }

  async approveConsultation(req, res) {
    try {
      const { consultationId } = req.params;
      const adminId = req.user.id;

      if (!isValidUUID(consultationId)) {
        return res.status(400).json({ error: 'Invalid consultation ID' });
      }

      const consultation = await consultationService.approveConsultation(
        consultationId,
        adminId
      );

      // Log approval
      await auditService.logUserAction({
        userId: adminId,
        userRole: req.user.role,
        actionType: 'CONSULTATION_APPROVED',
        actionDescription: 'Admin approved consultation request',
        req,
        tableName: 'consultations',
        recordId: consultationId,
        metadata: { consultationId }
      });

      res.json(consultation);
    } catch (error) {
      console.error('Error in approveConsultation:', error);
      res.status(500).json({ error: 'Failed to approve consultation' });
    }
  }

  async acceptConsultation(req, res) {
    try {
      const { consultationId } = req.params;
      const expertId = req.user.id;

      if (!isValidUUID(consultationId)) {
        return res.status(400).json({ error: 'Invalid consultation ID' });
      }

      const consultation = await consultationService.acceptConsultation(
        consultationId,
        expertId
      );

      // Log acceptance
      await auditService.logUserAction({
        userId: expertId,
        userRole: req.user.role,
        actionType: 'CONSULTATION_ACCEPTED',
        actionDescription: 'Expert accepted consultation request',
        req,
        tableName: 'consultations',
        recordId: consultationId,
        metadata: { consultationId }
      });

      res.json(consultation);
    } catch (error) {
      console.error('Error in acceptConsultation:', error);
      res.status(500).json({ error: 'Failed to accept consultation' });
    }
  }

  async completeConsultation(req, res) {
    try {
      const { consultationId } = req.params;
      const expertId = req.user.id;
      const { notes } = req.body;

      if (!isValidUUID(consultationId)) {
        return res.status(400).json({ error: 'Invalid consultation ID' });
      }

      if (!notes) {
        return res.status(400).json({
          error: 'Notes are required for consultation completion'
        });
      }

      const consultation = await consultationService.completeConsultation(
        consultationId,
        expertId,
        notes
      );

      // Log completion
      await auditService.logUserAction({
        userId: expertId,
        userRole: req.user.role,
        actionType: 'CONSULTATION_COMPLETED',
        actionDescription: 'Expert completed consultation',
        req,
        tableName: 'consultations',
        recordId: consultationId,
        metadata: { consultationId }
      });

      res.json(consultation);
    } catch (error) {
      console.error('Error in completeConsultation:', error);
      res.status(500).json({ error: 'Failed to complete consultation' });
    }
  }

  async getFarmerConsultations(req, res) {
    try {
      const farmerId = req.user.id;
      const { status } = req.query;

      const consultations = await consultationService.getFarmerConsultations(
        farmerId,
        status
      );

      res.json(consultations);
    } catch (error) {
      console.error('Error in getFarmerConsultations:', error);
      res.status(500).json({ error: 'Failed to retrieve consultations' });
    }
  }

  async getExpertConsultations(req, res) {
    try {
      const expertId = req.user.id;
      const { status } = req.query;

      const consultations = await consultationService.getExpertConsultations(
        expertId,
        status
      );

      res.json(consultations);
    } catch (error) {
      console.error('Error in getExpertConsultations:', error);
      res.status(500).json({ error: 'Failed to retrieve consultations' });
    }
  }

  async getAdminConsultations(req, res) {
    try {
      const { status } = req.query;

      const consultations = await consultationService.getAdminConsultations(status);

      res.json(consultations);
    } catch (error) {
      console.error('Error in getAdminConsultations:', error);
      res.status(500).json({ error: 'Failed to retrieve consultations' });
    }
  }

  // NEW: Book consultation with payment
  async bookConsultationWithPayment(req, res) {
    const paymentService = require('../services/paymentService');
    const { Consultation, User, Farm, Expert } = require('../models');
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      const farmerId = req.user.id;
      const {
        expertId, farmId, cropId, scheduledDate, duration,
        problemDescription, consultationType, paymentMethod, phoneNumber
      } = req.body;

      const expert = await User.findOne({
        where: { id: expertId, role: 'expert' },
        include: [{ model: Expert, as: 'expertProfile' }]
      });

      if (!expert || !expert.expertProfile) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Expert not found' });
      }

      const farm = await Farm.findOne({ where: { id: farmId, farmer_id: farmerId } });
      if (!farm) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Farm not found' });
      }

      const hourlyRate = parseFloat(expert.expertProfile.hourly_rate || 5000);
      const totalCost = hourlyRate * (duration / 60);
      const commissionAmount = totalCost * 0.20;

      const consultation = await Consultation.create({
        farmerId, expertId, farmId, cropId, scheduledDate, duration,
        problemDescription, consultationType, rate: hourlyRate, totalCost,
        commissionRate: 0.20, commissionAmount, status: 'pending', paymentStatus: 'pending'
      }, { transaction });

      const paymentResult = await paymentService.initiatePayment({
        senderId: farmerId, receiverId: expertId, amount: totalCost,
        paymentMethod, description: `Consultation with ${expert.first_name} ${expert.last_name}`,
        metadata: { consultationId: consultation.id, phoneNumber: phoneNumber || req.user.phone_number }
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: {
          consultation: { id: consultation.id, totalCost, status: consultation.status },
          payment: { reference: paymentResult.paymentReference, instructions: paymentResult.instructions }
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Book consultation error:', error);
      res.status(500).json({ error: 'Failed to book consultation' });
    }
  }

  // NEW: Rate consultation
  async rateConsultation(req, res) {
    const { Consultation, User, Expert } = require('../models');
    const sequelize = require('../config/database');
    try {
      const { consultationId } = req.params;
      const { rating, feedback } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be 1-5' });
      }

      const consultation = await Consultation.findOne({
        where: { id: consultationId, farmerId: req.user.id, status: 'completed' },
        include: [{ model: User, as: 'expert', include: [{ model: Expert, as: 'expertProfile' }] }]
      });

      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found or not completed' });
      }

      if (consultation.rating) {
        return res.status(400).json({ error: 'Already rated' });
      }

      await consultation.update({ rating, feedback });

      // Update expert average rating
      const allRatings = await Consultation.findAll({
        where: { expertId: consultation.expertId, rating: { [sequelize.Op.ne]: null } },
        attributes: ['rating']
      });

      const avgRating = allRatings.reduce((sum, c) => sum + parseFloat(c.rating), 0) / allRatings.length;
      await consultation.expert.expertProfile.update({
        rating: avgRating.toFixed(2),
        total_consultations: allRatings.length
      });

      res.json({ success: true, message: 'Thank you for your rating!' });
    } catch (error) {
      console.error('Rate consultation error:', error);
      res.status(500).json({ error: 'Failed to submit rating' });
    }
  }
}

module.exports = new ConsultationController();