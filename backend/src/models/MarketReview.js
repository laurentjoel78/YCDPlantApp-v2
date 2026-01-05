const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class MarketReview extends Model {
        static associate(models) {
            MarketReview.belongsTo(models.Market, {
                foreignKey: 'market_id',
                as: 'market'
            });

            MarketReview.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
        }
    }

    MarketReview.init({
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
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        comment: {
            type: DataTypes.TEXT
        },
        price_fairness: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 5
            },
            comment: 'Rating for price fairness'
        },
        accessibility: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 5
            },
            comment: 'Rating for how easy it is to access'
        },
        payment_speed: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 5
            },
            comment: 'How quickly farmers get paid'
        },
        verified_purchase: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this review is from a verified transaction'
        }
    }, {
        sequelize,
        modelName: 'MarketReview',
        tableName: 'MarketReviews',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['market_id']
            },
            {
                fields: ['user_id']
            }
        ]
    });

    return MarketReview;
};
