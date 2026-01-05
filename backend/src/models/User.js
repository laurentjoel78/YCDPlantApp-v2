'use strict';

const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Define associations
      this.hasMany(models.Farm, {
        foreignKey: 'user_id',
        as: 'farms'
      });

      this.hasMany(models.Order, {
        foreignKey: 'user_id',
        as: 'orders'
      });

      this.hasMany(models.Advisory, {
        foreignKey: 'farmer_id',
        as: 'advisoryRequestsAsFarmer'
      });

      this.hasMany(models.Advisory, {
        foreignKey: 'expert_id',
        as: 'advisoryResponsesAsExpert'
      });

      this.hasMany(models.Product, {
        foreignKey: 'seller_id',
        as: 'products'
      });

      this.hasMany(models.AuditLog, {
        foreignKey: 'userId',
        as: 'auditLogs'
      });

      this.hasMany(models.UserActivityLog, {
        foreignKey: 'userId',
        as: 'activityLogs'
      });

      this.hasOne(models.Expert, {
        foreignKey: 'user_id',
        as: 'expertProfile'
      });

      this.hasOne(models.Wallet, {
        foreignKey: 'user_id',
        as: 'wallet'
      });
    }

    // Instance method to check if password matches
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password_hash);
    }

    // Virtual field for isAdmin
    get isAdmin() {
      return this.role === 'admin';
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING(100),
      unique: true
    },
    email_verification_expires: {
      type: DataTypes.DATE
    },
    password_reset_token: {
      type: DataTypes.STRING(100),
      unique: true
    },
    password_reset_expires: {
      type: DataTypes.DATE
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20)
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['farmer', 'expert', 'buyer', 'admin', 'general']]
      }
    },
    location_lat: {
      type: DataTypes.DECIMAL(10, 8)
    },
    location_lng: {
      type: DataTypes.DECIMAL(11, 8)
    },
    address: {
      type: DataTypes.TEXT
    },
    region: {
      type: DataTypes.STRING(100)
    },
    preferred_language: {
      type: DataTypes.STRING(10),
      defaultValue: 'fr'
    },
    created_by_admin_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approval_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    },
    approved_at: {
      type: DataTypes.DATE
    },
    last_login: {
      type: DataTypes.DATE
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    profile_image_url: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password_hash')) {
          // Use consistent salt rounds of 12 across the application
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      }
    }
  });

  return User;
};