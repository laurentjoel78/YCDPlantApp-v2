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

async function reproduceSingle() {
    console.log('--- Starting Single Product Reproduction ---');

    try {
        // 1. Create Users
        const buyer = await db.User.create({
            email: `buyer_single_${Date.now()}@test.com`,
            password: 'password123',
            full_name: 'Test Buyer Single',
            role: 'farmer',
            phone_number: '+237699999999'
        });

        const seller = await db.User.create({
            email: `seller_single_${Date.now()}@test.com`,
            password: 'password123',
            full_name: 'Test Seller Single',
            role: 'expert',
            phone_number: '+237699999998'
        });

        // 2. Create Product
        const product = await db.Product.create({
            name: 'Single Product',
            price: 5000,
            seller_id: seller.id,
            quantity: 100,
            status: 'active'
        });

        // 3. Create Cart
        const cart = await db.Cart.create({
            user_id: buyer.id,
            status: 'active'
        });

        // 4. Add Item
        await db.CartItem.create({
            cart_id: cart.id,
            product_id: product.id,
            quantity: 1,
            price_at_add: 5000
        });

        console.log('Created cart with 1 item');

        // 5. Attempt Checkout (Cash on Delivery)
        console.log('\n--- Attempting COD Checkout ---');
        const reqCOD = {
            user: { id: buyer.id, phone_number: buyer.phone_number },
            body: {
                deliveryAddress: {
                    address: 'Single St',
                    city: 'Douala',
                    region: 'Littoral'
                },
                paymentMethod: 'cash_on_delivery',
                phoneNumber: buyer.phone_number
            }
        };

        const resCOD = mockRes();
        await checkoutController.checkout(reqCOD, resCOD);
        console.log('COD Response:', resCOD.statusCode, resCOD.data ? JSON.stringify(resCOD.data).substring(0, 200) + '...' : 'No Data');

        if (resCOD.statusCode !== 201) {
            console.error('❌ COD Checkout Failed!');
            console.error('Error Details:', resCOD.data);
        } else {
            console.log('✅ COD Checkout Success');
        }

    } catch (error) {
        console.error('Reproduction Error:', error);
    } finally {
        await db.sequelize.close();
    }
}

reproduceSingle();
