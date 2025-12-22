const db = require('./src/models');
const checkoutController = require('./src/controllers/checkoutController');

// Mock Express Request/Response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function reproduce() {
    console.log('--- Starting Reproduction Script ---');

    try {
        // 1. Create Users
        const buyer = await db.User.create({
            email: `buyer_${Date.now()}@test.com`,
            password: 'password123',
            full_name: 'Test Buyer',
            role: 'farmer',
            phone_number: '+237699999999'
        });

        const seller1 = await db.User.create({
            email: `seller1_${Date.now()}@test.com`,
            password: 'password123',
            full_name: 'Test Seller 1',
            role: 'expert', // or whatever role can sell
            phone_number: '+237699999998'
        });

        const seller2 = await db.User.create({
            email: `seller2_${Date.now()}@test.com`,
            password: 'password123',
            full_name: 'Test Seller 2',
            role: 'expert',
            phone_number: '+237699999997'
        });

        console.log('Created users:', { buyer: buyer.id, seller1: seller1.id, seller2: seller2.id });

        // 2. Create Products
        const product1 = await db.Product.create({
            name: 'Product 1',
            price: 1000,
            seller_id: seller1.id,
            quantity: 10,
            status: 'active'
        });

        const product2 = await db.Product.create({
            name: 'Product 2',
            price: 2000,
            seller_id: seller2.id, // Different seller!
            quantity: 10,
            status: 'active'
        });

        console.log('Created products:', { p1: product1.id, p2: product2.id });

        // 3. Create Cart
        const cart = await db.Cart.create({
            user_id: buyer.id,
            status: 'active'
        });

        await db.CartItem.create({
            cart_id: cart.id,
            product_id: product1.id,
            quantity: 1,
            price_at_add: 1000
        });

        await db.CartItem.create({
            cart_id: cart.id,
            product_id: product2.id,
            quantity: 1,
            price_at_add: 2000
        });

        console.log('Created cart with items from MIXED sellers');

        // 4. Attempt Checkout
        const req = {
            user: { id: buyer.id, phone_number: buyer.phone_number },
            body: {
                deliveryAddress: {
                    address: '123 Test St',
                    city: 'Douala',
                    region: 'Littoral'
                },
                paymentMethod: 'cash_on_delivery',
                phoneNumber: buyer.phone_number
            }
        };

        const res = mockRes();

        console.log('Calling checkoutController.checkout...');
        await checkoutController.checkout(req, res);

        console.log('Checkout Response Code:', res.statusCode);
        console.log('Checkout Response Data:', JSON.stringify(res.data, null, 2));

        if (res.statusCode === 201) {
            const orderId = res.data.data.order.id;
            const order = await db.Order.findByPk(orderId);
            console.log('Created Order Seller ID:', order.seller_id);

            if (order.seller_id === seller1.id) {
                console.log('⚠️  ISSUE: Order assigned to Seller 1, but contains items from Seller 2!');
            } else if (order.seller_id === seller2.id) {
                console.log('⚠️  ISSUE: Order assigned to Seller 2, but contains items from Seller 1!');
            }

            // Check for OrderItems (which we know don't exist, but good to verify lack of link)
            // Since OrderItem model doesn't exist, we can't query it directly easily unless we check raw DB or associations
            // But verify if Order has any links
            const orderWithTrans = await db.Order.findByPk(orderId, { include: ['transactions'] });
            console.log('Order Transactions:', orderWithTrans.transactions.length);
        }

    } catch (error) {
        console.error('Reproduction Error:', error);
    } finally {
        await db.sequelize.close();
    }
}

reproduce();
