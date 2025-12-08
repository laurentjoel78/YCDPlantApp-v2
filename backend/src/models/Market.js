const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Market extends Model {
    static associate(models) {
      // Many-to-many relationship with Crops
      Market.belongsToMany(models.Crop, {
        through: 'MarketCrops',
        foreignKey: 'market_id',
        otherKey: 'crop_id',
        as: 'acceptedCrops'
      });

      // One-to-many relationship with MarketReviews
      Market.hasMany(models.MarketReview, {
        foreignKey: 'market_id',
        as: 'reviews'
      });
    }
  }

  Market.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    location_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    location_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    region: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'Cameroon'
    },
    market_type: {
      type: DataTypes.STRING,
      // Traditional Market, Supermarket, Farm Shop, Cooperative, etc.
    },
    operating_hours: {
      type: DataTypes.JSON,
      // { monday: "8:00-18:00", tuesday: "8:00-18:00", ... }
    },
    market_days: {
      type: DataTypes.JSON,
      // ["Monday", "Wednesday", "Friday"]
    },
    contact_phone: {
      type: DataTypes.STRING
    },
    contact_email: {
      type: DataTypes.STRING
    },
    website: {
      type: DataTypes.STRING
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    osm_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    data_source: {
      type: DataTypes.STRING,
      // 'manual', 'osm', 'government', 'user_submitted'
    },
    additional_info: {
      type: DataTypes.JSON,
      // Any extra metadata
    }
  }, {
    sequelize,
    modelName: 'Market',
    tableName: 'Markets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['location_lat', 'location_lng']
      },
      {
        fields: ['city', 'region']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['osm_id'],
        where: {
          osm_id: { [sequelize.Sequelize.Op.ne]: null }
        }
      }
    ]
  });

  return Market;
};