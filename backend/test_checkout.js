const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api'; // Or whatever local port is running

async function testCheckout() {
    // 1. Login to get token
    try {
        console.log('Logging in...');
        // Need a valid user credential. I'll use a likely test user or try to register one if this fails.
        // Assuming 'test@example.com' / 'password123' might exist or I can use the user from previous context logs if available.
        // I will try to use the user ID from the logs: 71ae25a5-8189-4263-a43d-a34f1d2298c6 (Farmer)
        // But I need email/pass. Let's try the one often used in dev or register a new one.

        let token;
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: 'farmer@ycd.local', // Common test email pattern
                password: 'password123'
            });
            token = loginRes.data.token;
        } catch (e) {
            console.log('Login failed, trying registration...');
            const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                email: `testcheckout${Date.now()}@ycd.local`,
                password: 'Pass@word123!',
                first_name: 'Test',
                last_name: 'Checkout',
                role: 'buyer'
            });
            token = regRes.data.token;
        }

        console.log('Got token:', token.substring(0, 20) + '...');

        // 2. Add item to cart
        console.log('Adding item to cart...');
        // Need a product ID. Fetch products first.
        const productsRes = await axios.get(`${BASE_URL}/products`);
        const product = productsRes.data.products.find(p => p.status === 'active' && p.quantity > 0);

        if (!product) {
            console.error('No active products found to buy!');
            return;
        }

        await axios.post(`${BASE_URL}/cart/items`, {
            product_id: product.id,
            quantity: 1
        }, { headers: { Authorization: `Bearer ${token}` } });

        // 3. Checkout
        console.log('Attempting checkout...');
        const checkoutPayload = {
            deliveryAddress: {
                address: '123 Test St',
                city: 'Buea',
                region: 'South-West'
            },
            paymentMethod: 'mtn',
            phoneNumber: '677123456'
        };

        const checkoutRes = await axios.post(`${BASE_URL}/checkout`, checkoutPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Checkout SUCCESS:', JSON.stringify(checkoutRes.data, null, 2));

    } catch (error) {
        console.error('Checkout FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testCheckout();
