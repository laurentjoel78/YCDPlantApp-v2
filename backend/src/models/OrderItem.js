const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderItem extends Model {
        static associate(models) {
            OrderItem.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'order'
            });
            OrderItem.belongsTo(models.Product, {
                foreignKey: 'product_id',
                as: 'product'
            });
        }
    }

    OrderItem.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        price_at_purchase: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Snapshot of price when order was placed'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'OrderItem',
        tableName: 'order_items',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['order_id']
            },
            {
                fields: ['product_id']
            }
        ]
    });

    return OrderItem;
};
