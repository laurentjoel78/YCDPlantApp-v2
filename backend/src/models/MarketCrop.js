const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class MarketCrop extends Model {
        static associate(models) {
            // This is a join table, associations are defined in Market and Crop models
        }
    }

    MarketCrop.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        market_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Markets',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        crop_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Crops',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        typical_price_per_kg: {
            type: DataTypes.DECIMAL(10, 2),
            comment: 'Typical price in local currency (XAF) per kg'
        },
        demand_level: {
            type: DataTypes.STRING(20),
            defaultValue: 'medium',
            comment: 'How much this market demands this crop (low/medium/high)'
        },
        notes: {
            type: DataTypes.TEXT,
            comment: 'Any specific requirements or notes for this crop at this market'
        }
    }, {
        sequelize,
        modelName: 'MarketCrop',
        tableName: 'MarketCrops',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['market_id', 'crop_id']
            }
        ]
    });

    return MarketCrop;
};
