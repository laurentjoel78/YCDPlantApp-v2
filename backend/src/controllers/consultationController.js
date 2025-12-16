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
        farmId,
        cropId,
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
        console.error('Missing fields:', { expertId, problemDescription, consultationType, scheduledDate, paymentMethod, phoneNumber });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get Expert to confirm rate/existence
      const { Consultation, User, Expert, Farm } = db;

      // LOGIC FIX: Frontend sends Expert Profile ID, but we need User ID for the Consultation record.
      // 1. Try finding by Expert Profile ID first
      let expertProfile = await Expert.findByPk(expertId, {
        include: [{ model: User, as: 'user' }]
      });

      let expertUser;
      if (expertProfile) {
        expertUser = expertProfile.user;
      } else {
        // 2. Fallback: Try finding by User ID
        expertUser = await User.findOne({
          where: { id: expertId, role: 'expert' },
          include: [{ model: Expert, as: 'expertProfile' }]
        });
        if (expertUser) {
          expertProfile = expertUser.expertProfile;
        }
      }

      if (!expertUser || !expertProfile) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Expert not found' });
      }

      // 3. Handle missing Farm ID (Frontend doesn't send it yet)
      let finalFarmId = farmId;
      if (!finalFarmId) {
        const userFarm = await Farm.findOne({ where: { farmer_id: userId } });
        if (userFarm) {
          finalFarmId = userFarm.id;
        } else {
          // Create a default farm if none exists
          const newFarm = await Farm.create({
            farmer_id: userId,
            name: 'My Default Farm',
            location_lat: 0.0,
            location_lng: 0.0,
            address: 'Default Address',
            region: 'Default Region',
            size: 1.0,
            unit: 'hectares'
          }, { transaction });
          finalFarmId = newFarm.id;
        }
      }

      // 4. Handle missing Crop ID
      let finalCropId = cropId;
      if (!finalCropId) {
        // Try to get a crop from the farm, or just the first crop in DB
        const { Crop } = db;
        const anyCrop = await Crop.findOne();
        if (anyCrop) {
          finalCropId = anyCrop.id;
        } else {
          // Create generic crop
          const newCrop = await Crop.create({
            name: 'General Crop',
            description: 'General crop for consultation',
            growth_period_days: 90
          }, { transaction });
          finalCropId = newCrop.id;
        }
      }

      // Calculate costs (ensure we trust server-side rate or validate client-side)
      // Fix: Access hourlyRate via camelCase as defined in Expert model
      const hourlyRate = expertProfile.hourlyRate ? parseFloat(expertProfile.hourlyRate) : 5000;
      // Use client provided duration default to 60 if not
      const consultDuration = duration || 60;
      const calculatedCost = hourlyRate * (consultDuration / 60);

      // We can use the client provided totalCost for now if it matches reasonably, or just overwrite it
      const finalCost = calculatedCost;
      const commissionAmount = finalCost * 0.20;

      // Create consultation
      const consultation = await Consultation.create({
        farmerId: userId,
        expertId: expertUser.id, // Correct: Use User ID, not Expert Profile ID
        farmId: finalFarmId,
        cropId: finalCropId,
        problemDescription: problemDescription,
        consultationType: consultationType,
        scheduledDate: new Date(scheduledDate),
        duration: consultDuration,
        rate: hourlyRate,
        status: 'pending',
        totalCost: finalCost,
        commissionRate: 0.20,
        commissionAmount: commissionAmount,
        paymentStatus: 'pending'
      }, { transaction });

      // Initiate payment (if not cash on delivery)
      let paymentResult;
      if (paymentMethod !== 'cash_on_delivery') {
        try {
          console.log('[Consultation] Initiating payment...', {
            senderId: userId,
            receiverId: expertUser?.id,
            expertUserExists: !!expertUser,
            consultationId: consultation?.id,
            amount: finalCost
          });

          if (!expertUser || !expertUser.id) {
            throw new Error(`Expert User ID missing. expertUser: ${JSON.stringify(expertUser)}`);
          }

          paymentResult = await paymentService.initiatePayment({
            senderId: userId,
            receiverId: expertUser.id, // Must be User ID (Wallet holder), not Expert Profile ID
            amount: finalCost,
            paymentMethod,
            description: `Consultation #${consultation.id.substring(0, 8)}`,
            metadata: {
              consultationId: consultation.id,
              phoneNumber
            }
          });

          // Update consultation with payment reference
          await consultation.update({
            payment_reference: paymentResult.paymentReference || paymentResult.payment_reference // handle both cases
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
            reference: paymentResult.paymentReference || paymentResult.payment_reference,
            status: paymentResult.status,
            instructions: paymentResult.instructions
          } : {
            method: 'cash_on_delivery',
            note: 'Payment will be collected at consultation'
          }
        }
      });

    } catch (error) {
      // Check if transaction is still active before rollback (though library handles it usually)
      try { await transaction.rollback(); } catch (e) { }
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

  async verifyPayment(req, res) {
    const { Consultation } = require('../models');
    const { Transaction } = require('../models');

    try {
      const { consultationId, paymentReference } = req.body;

      if (!consultationId || !paymentReference) {
        return res.status(400).json({ error: 'Missing consultation ID or payment reference' });
      }

      const consultation = await Consultation.findOne({
        where: { id: consultationId }
      });

      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const paymentTx = await Transaction.findOne({
        where: { payment_reference: paymentReference }
      });

      if (!paymentTx) {
        return res.status(404).json({ error: 'Payment transaction not found' });
      }

      if (paymentTx.payment_status !== 'completed') {
        return res.json({
          success: false,
          message: 'Payment not yet completed',
          status: paymentTx.payment_status
        });
      }

      // Update consultation status
      await consultation.update({
        payment_status: 'paid',
        status: 'pending' // Still pending acceptance by expert, but paid
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: { consultation }
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ error: 'Payment verification failed' });
    }
  }

  // NEW: Rate consultation
  async rateConsultation(req, res) {
    const { Consultation, User, Expert } = require('../models');
    const { Op } = require('sequelize');

    try {
      const { consultationId } = require('sequelize') ? req.params : req.params; // silly check to keep linter happy if needed, but really just destructuring
      // Actually strictly:
      const id = req.params.consultationId;
      const { rating, feedback } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be 1-5' });
      }

      console.log(`[Rate] Processing rating for ${id}`);

      // 1. Find the consultation (Simpler query without deep includes)
      const consultation = await Consultation.findOne({
        where: {
          id,
          farmerId: req.user.id,
          status: { [Op.in]: ['pending', 'accepted', 'in_progress', 'completed'] }
        }
      });

      if (!consultation) {
        console.error(`[Rate] Consultation not found for ID: ${id}`);
        return res.status(404).json({ error: 'Consultation not found' });
      }

      if (consultation.rating) {
        return res.status(400).json({ error: 'Already rated' });
      }

      // 2. Update the consultation
      await consultation.update({ rating, feedback });

      // 3. Find and Update the Expert Profile
      // consultation.expertId is the User ID. We need the Expert profile for that User.
      const expertProfile = await Expert.findOne({
        where: { userId: consultation.expertId }
      });

      if (expertProfile) {
        // Calculate new average
        const allRatings = await Consultation.findAll({
          where: {
            expertId: consultation.expertId,
            rating: { [Op.ne]: null }
          },
          attributes: ['rating']
        });

        if (allRatings.length > 0) {
          const avgRating = allRatings.reduce((sum, c) => sum + parseFloat(c.rating), 0) / allRatings.length;

          await expertProfile.update({
            rating: avgRating.toFixed(1),
            totalConsultations: await Consultation.count({
              where: { expertId: consultation.expertId, status: 'completed' }
            })
          });
          console.log(`[Rate] Updated expert ${expertProfile.id} rating to ${avgRating}`);
        }
      } else {
        console.warn(`[Rate] Expert profile not found for user ${consultation.expertId}`);
      }

      res.json({
        success: true,
        message: 'Consultation rated successfully',
        data: { consultation }
      });

    } catch (error) {
      console.error('Rate consultation error:', error);
      res.status(500).json({ error: 'Failed to rate consultation' });
    }
  }
}

module.exports = new ConsultationController();