const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Wallet, Farm, Crop, FarmCrop, sequelize } = require('../models');
const emailService = require('../services/emailService');
const { uploadImage } = require('../services/uploadService');
const auditService = require('../services/auditService');
const logger = require('../config/logger');
const bruteForceProtection = require('../services/bruteForceProtection');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await auditService.logUserAction({
        userId: req.user.id,
        userRole: req.user.role,
        actionType: 'USER_LOGOUT',
        actionDescription: 'User logged out',
        req
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    });
  }
};

const register = async (req, res) => {
  try {
    const requestLogger = (req && req.log) ? req.log : logger;
    requestLogger.info('Registration request received:', JSON.stringify(req.body, null, 2));

    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      role,
      location_lat,
      location_lng,
      address,
      region,
      preferred_language,
      // Farm-specific fields
      farm_name,
      farm_size_hectares,
      crops_grown,
      farming_experience_years,
      farm_location_lat,
      farm_location_lng
    } = req.body;

    // Validate required fields
    const requiredFields = ['email', 'password', 'first_name', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      requestLogger.info('Registration failed - Missing required fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Additional validation for farmer role
    if (role === 'farmer') {
      const requiredFarmerFields = ['farm_size_hectares', 'crops_grown', 'farming_experience_years'];
      const missingFarmerFields = requiredFarmerFields.filter(field => !req.body[field]);
      if (missingFarmerFields.length > 0) {
        requestLogger.info('Registration failed - Missing farmer fields:', missingFarmerFields);
        return res.status(400).json({
          error: 'Missing required farmer information',
          missingFields: missingFarmerFields
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      requestLogger.info('Registration failed - Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Wrap all DB operations in a transaction so if anything fails, everything rolls back
    const t = await sequelize.transaction();

    try {
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Auto-verify emails if:
    // 1. AUTO_VERIFY_EMAILS is true (development), OR
    // 2. USE_MOCK_EMAIL is true (no external email provider configured)
    const autoVerify = process.env.AUTO_VERIFY_EMAILS === 'true' || process.env.USE_MOCK_EMAIL === 'true';

    const password_hash = password;

    const user = await User.create({
      email,
      is_active: true,
      email_verified: autoVerify,
      email_verification_token: autoVerify ? null : verificationToken,
      email_verification_expires: autoVerify ? null : tokenExpires,
      password_hash,
      first_name,
      last_name,
      phone_number,
      role,
      location_lat,
      location_lng,
      address,
      region,
      preferred_language,
      approval_status: role === 'farmer' ? 'pending' : 'approved'
    }, { transaction: t });

    // Create wallet
    const roleToWalletType = {
      farmer: 'seller',
      buyer: 'buyer',
      expert: 'expert',
      admin: 'admin'
    };
    const walletType = roleToWalletType[role] || 'buyer';

    await Wallet.create({
      user_id: user.id,
      balance: 0,
      currency: 'XAF',
      wallet_type: walletType,
      verification_level: 'basic'
    }, { transaction: t });

    // Create farm if farmer
    if (role === 'farmer' && farm_name) {
      const farmLocationLat = farm_location_lat || location_lat || null;
      const farmLocationLng = farm_location_lng || location_lng || null;
      const farmRegion = region || 'Not specified';
      const farmSize = farm_size_hectares || null;

      const createdFarm = await Farm.create({
        user_id: user.id,
        name: farm_name,
        description: `Farm owned by ${first_name}`,
        location_lat: farmLocationLat,
        location_lng: farmLocationLng,
        address: address || 'Address pending',
        region: farmRegion,
        size: farmSize,
        size_hectares: farmSize,
        soil_type: 'Other',
        irrigation_system: null,
        is_active: true
      }, { transaction: t });

      if (Array.isArray(crops_grown) && crops_grown.length > 0) {
        const numCrops = crops_grown.length;
        const defaultArea = (farmSize && numCrops > 0) ? Math.max((Number(farmSize) / numCrops), 0.1) : 0.1;
        const plantingDate = new Date();
        const expectedHarvestDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        for (const cropName of crops_grown) {
          if (!cropName || typeof cropName !== 'string') continue;
          const [crop] = await Crop.findOrCreate({
            where: { name: cropName },
            defaults: { category: 'general' },
            transaction: t
          });

          await FarmCrop.create({
            farm_id: createdFarm.id,
            crop_id: crop.id,
            area: defaultArea,
            planting_date: plantingDate,
            expected_harvest_date: expectedHarvestDate,
            status: 'planning',
            is_active: true
          }, { transaction: t }).catch(err => {
            requestLogger.warn('Failed to create FarmCrop for registration', { error: err.message, cropName, farmId: createdFarm.id });
          });
        }
      }
    }

    // Commit the transaction - all or nothing
    await t.commit();

    // Send verification email (outside transaction - non-critical)
    if (!autoVerify) {
      try {
        await emailService.sendVerificationEmail(user, verificationToken);
      } catch (emailError) {
        requestLogger.error('Failed to send verification email', { error: emailError.message });
      }
    }

    // Log registration activity (outside transaction - non-critical)
    await auditService.logUserAction({
      userId: user.id,
      userRole: user.role,
      actionType: 'USER_REGISTER',
      actionDescription: `User registered as ${user.role}`,
      req,
      tableName: 'users',
      recordId: user.id,
      metadata: { email: user.email, role: user.role }
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.role,
        region: user.region,
        approval_status: user.approval_status
      }
    });

    } catch (txError) {
      // Rollback transaction on any failure - no partial data left behind
      await t.rollback();
      throw txError;
    }

  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({ error: 'Error registering user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const logger = (req && req.log) ? req.log : console;
    const ip = req.ip || req.connection.remoteAddress;

    logger.info(`[LOGIN] Attempting login for email: ${email}`);

    const user = await User.findOne({
      where: { email },
      include: [{
        model: Farm,
        as: 'farms',
        attributes: ['id', 'name', 'location_lat', 'location_lng']
      }]
    });

    if (!user) {
      logger.info(`[LOGIN] User not found: ${email}`);
      bruteForceProtection.recordFailedAttempt(ip);
      return res.status(401).json({ error: 'Invalid credentials - user not found' });
    }

    logger.info(`[LOGIN] User found: ${email}, role: ${user.role}, email_verified: ${user.email_verified}, is_active: ${user.is_active}, approval_status: ${user.approval_status}`);

    // For farmers: Check approval status first
    // Approved farmers can bypass email verification
    if (user.role === 'farmer') {
      if (user.approval_status !== 'approved') {
        logger.info(`[LOGIN] Farmer account pending approval: ${email}`);
        return res.status(401).json({ error: 'Account pending approval' });
      }
      // Approved farmers don't need email verification
    } else {
      // Non-farmers still need email verification (except admin)
      if (user.role !== 'admin' && !user.email_verified) {
        logger.info(`[LOGIN] Email not verified: ${email}`);
        return res.status(401).json({ error: 'Email not verified' });
      }
    }

    if (!user.is_active) {
      logger.info(`[LOGIN] Account inactive: ${email}`);
      return res.status(401).json({ error: 'Account is inactive' });
    }


    if (!user.password_hash) {
      logger.info(`[LOGIN] No password hash found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials - no password set' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    logger.info(`[LOGIN] Password validation result for ${email}: ${isValid}`);
    
    if (!isValid) {
      logger.info(`[LOGIN] Invalid password for: ${email}`);
      // Record failed attempt for brute force protection
      bruteForceProtection.recordFailedAttempt(ip, user.id);
      
      // Log failed login attempt
      await auditService.logUserAction({
        userId: user.id,
        userRole: user.role,
        actionType: 'USER_LOGIN_FAILED',
        actionDescription: 'Failed login attempt (invalid password)',
        req,
        metadata: { email }
      });
      
      const remaining = bruteForceProtection.getRemainingAttempts(ip);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        remainingAttempts: remaining > 0 ? remaining : undefined
      });
    }

    // Successful login - reset brute force tracking
    bruteForceProtection.resetAttempts(ip, user.id);

    await user.update({ last_login: new Date() });

    // Log successful login
    await auditService.logUserAction({
      userId: user.id,
      userRole: user.role,
      actionType: 'USER_LOGIN',
      actionDescription: 'User logged in successfully',
      req,
      metadata: { email }
    });

    const token = generateToken(user);

    logger.info(`[LOGIN] Login successful for: ${email}, role: ${user.role}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.role,
        region: user.region,
        approval_status: user.approval_status,
        farms: user.farms
      }
    });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('[LOGIN] Error during login:', error);
    logger.error('[LOGIN] Error stack:', error.stack);
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Error during login', details: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Farm,
        as: 'farms',
        attributes: ['id', 'name', 'location_lat', 'location_lng']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error fetching current user details', error);
    res.status(500).json({ error: 'Error fetching user details' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const allowed = ['first_name', 'last_name', 'phone_number', 'region', 'profile_image_url', 'address', 'preferred_language'];
    const updates = {};

    if (req.file) {
      try {
        const { uploadFile } = require('../services/uploadService');
        const fs = require('fs').promises;

        const result = await uploadFile(req.file.path, 'ycd_profiles');
        updates.profile_image_url = result.secure_url;
        await fs.unlink(req.file.path).catch(logger.error);
      } catch (uploadError) {
        logger.error('Error uploading profile image:', uploadError);
        return res.status(500).json({ error: 'Failed to upload profile image' });
      }
    }

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldValues = {};
    Object.keys(updates).forEach(key => {
      oldValues[key] = user[key];
    });

    await user.update(updates);

    // Log profile update
    await auditService.logUserAction({
      userId: user.id,
      userRole: user.role,
      actionType: 'USER_PROFILE_UPDATE',
      actionDescription: 'User updated profile',
      req,
      tableName: 'users',
      recordId: user.id,
      oldValues,
      newValues: updates
    });

    const safeUser = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    res.json({ user: safeUser });
  } catch (error) {
    logger.error('Error updating profile', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  updateProfile
};
