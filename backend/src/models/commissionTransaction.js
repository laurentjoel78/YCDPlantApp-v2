const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CommissionTransaction extends Model {
    static associate(models) {
      // define associations here
      CommissionTransaction.belongsTo(models.User, {
        foreignKey: 'expertId',
        as: 'expert'
      });
      CommissionTransaction.belongsTo(models.Consultation, {
        foreignKey: 'consultationId',
        as: 'consultation'
      });
    }
  }

CommissionTransaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  consultationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'consultations',
      key: 'id'
    }
  },
  expertId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'experts',
      key: 'id'
    }
  },
  farmerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  consultationType: {
    type: DataTypes.ENUM('virtual', 'on_site', 'emergency'),
    allowNull: false
  },
  expertFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  commissionRate: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  commissionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'held_in_escrow', 'released_to_expert', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true
  },
  escrowDetails: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  offlineData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
  }, {
    sequelize,
    modelName: 'CommissionTransaction',
    tableName: 'commission_transactions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['consultation_id']
      },
      {
        fields: ['expert_id']
      },
      {
        fields: ['payment_status']
      }
    ]
  });

  return CommissionTransaction;
};