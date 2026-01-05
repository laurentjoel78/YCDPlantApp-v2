const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CartItem extends Model {
        static associate(models) {
            CartItem.belongsTo(models.Cart, {
                foreignKey: 'cart_id',
                as: 'cart'
            });
            CartItem.belongsTo(models.Product, {
                foreignKey: 'product_id',
                as: 'product'
            });
        }

        /**
         * Get item subtotal
         */
        getSubtotal() {
            return parseFloat(this.price_at_add) * this.quantity;
        }
    }

    CartItem.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cart_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'carts',
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
        price_at_add: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Lock price when item is added to cart'
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
        modelName: 'CartItem',
        tableName: 'cart_items',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['cart_id']
            },
            {
                fields: ['product_id']
            }
        ]
    });

    return CartItem;
};
