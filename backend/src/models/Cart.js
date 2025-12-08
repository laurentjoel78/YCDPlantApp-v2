const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Cart extends Model {
        static associate(models) {
            Cart.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
            Cart.hasMany(models.CartItem, {
                foreignKey: 'cart_id',
                as: 'items',
                onDelete: 'CASCADE'
            });
        }

        /**
         * Calculate total cart value
         */
        async calculateTotal() {
            const items = await this.getItems({
                include: ['product']
            });

            let subtotal = 0;
            items.forEach(item => {
                subtotal += parseFloat(item.price_at_add) * item.quantity;
            });

            const deliveryFee = 2000; // Flat 2000 XAF delivery
            const total = subtotal + deliveryFee;

            return {
                subtotal,
                deliveryFee,
                total,
                itemCount: items.length,
                totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
            };
        }
    }

    Cart.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'checked_out', 'abandoned'),
            defaultValue: 'active'
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
        modelName: 'Cart',
        tableName: 'carts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['status']
            }
        ]
    });

    return Cart;
};
