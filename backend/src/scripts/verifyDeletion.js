const axios = require('axios');
const { User, Farm, Expert, ForumTopic, ForumMember } = require('../models');
const { sequelize } = require('../models');

const API_URL = 'http://localhost:3000/api';
const TEST_ADMIN_EMAIL = 'testadmin_deletion@example.com';
const TEST_PASSWORD = 'password123';

async function runTests() {
    let adminToken;
    let adminUserId;

    try {
        console.log('--- Starting Deletion Verification Tests ---');

        // 0. Setup: Create Admin User
        console.log('0. Creating Test Admin User...');
        // Clean up if exists
        await User.destroy({ where: { email: TEST_ADMIN_EMAIL }, force: true });

        const admin = await User.create({
            first_name: 'Test',
            last_name: 'Admin',
            email: TEST_ADMIN_EMAIL,
            password_hash: TEST_PASSWORD, // Model hooks should hash this
            role: 'admin',
            is_active: true,
            email_verified: true
        });

        // Explicitly update to ensure it sticks (sometime create might ignore if not in attributes, though it is)
        await admin.update({ email_verified: true });

        adminUserId = admin.id;

        // Login to get token
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_ADMIN_EMAIL,
            password: TEST_PASSWORD
        });
        adminToken = loginRes.data.token;
        console.log('   Logged in as Admin. Token received.');


        // TEST 1: User Deletion Cascades to Farm
        console.log('\n--- Test 1: User Deletion Cascades to Farm ---');
        const farmerRes = await axios.post(`${API_URL}/auth/register`, {
            first_name: 'Test',
            last_name: 'Farmer',
            email: 'testfarmer_del@example.com',
            password: 'password123',
            role: 'farmer'
        });
        const farmerId = farmerRes.data.user.id;
        const farmerToken = farmerRes.data.token;
        console.log(`   Created Farmer: ${farmerId}`);

        // Create Farm (using farmer token)
        const farmRes = await axios.post(`${API_URL}/farms`, {
            name: 'Test Farm Deletion',
            location: { latitude: 0, longitude: 0, address: 'Test Address' },
            size: 10,
            sizeUnit: 'hectares'
        }, { headers: { Authorization: `Bearer ${farmerToken}` } });
        const farmId = farmRes.data.data.id;
        console.log(`   Created Farm: ${farmId}`);

        // Verify Farm exists in DB
        let farmCheck = await Farm.findByPk(farmId);
        if (!farmCheck) throw new Error('Farm creation failed verification');

        // Delete User (as Admin)
        console.log('   Deleting Farmer...');
        await axios.delete(`${API_URL}/users/${farmerId}`, {
            data: { permanent: true },
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Verify Farm is deleted
        farmCheck = await Farm.findByPk(farmId);
        if (farmCheck) {
            console.error('FAILED: Farm still exists after user deletion!');
        } else {
            console.log('   SUCCESS: Farm deleted via cascade.');
            // Also verify User is gone
            const userCheck = await User.findByPk(farmerId);
            if (!userCheck) console.log('   SUCCESS: User deleted.');
        }


        // TEST 2: User Deletion Cascades to Expert Profile
        console.log('\n--- Test 2: User Deletion Cascades to Expert Profile ---');
        // Create User who will become expert
        // We need to create an expert profile. Usually this is done via Admin or application.
        // Let's create a User, then use Admin to create Expert profile for them?
        // Or just register directly if allowed? No, Expert creation is admin restricted or application based.
        // I'll use simple Admin Create Expert endpoint.
        const expertUserRes = await axios.post(`${API_URL}/experts`, {
            email: 'testexpert_del@example.com',
            firstName: 'Test',
            lastName: 'Expert',
            phone: '1234567890',
            specializations: ['General'],
            certifications: [],
            experience: 5,
            languages: ['English'],
            hourlyRate: 50,
            location: { latitude: 0, longitude: 0 },
            password: 'password123' // Often not required if auto-generated, but let's see controller
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // The endpoint creates both User and Expert
        // Check response structure. expertController.createExpert returns `expert` object which has `userId`.
        const expertId = expertUserRes.data.id;
        const expertUserId = expertUserRes.data.userId;
        console.log(`   Created Expert: ${expertId} (User: ${expertUserId})`);

        // Verify DB
        let expertCheck = await Expert.findByPk(expertId);
        if (!expertCheck) throw new Error('Expert creation failed verification');

        // Delete User (Permanent)
        console.log('   Deleting Expert User...');
        await axios.delete(`${API_URL}/users/${expertUserId}`, {
            data: { permanent: true },
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Verify Expert Profile is deleted
        expertCheck = await Expert.findByPk(expertId);
        if (expertCheck) {
            console.error('FAILED: Expert profile still exists after user deletion!');
        } else {
            console.log('   SUCCESS: Expert profile deleted via cascade.');
        }


        // TEST 3: Delete Expert Profile Only (Demotion)
        console.log('\n--- Test 3: Delete Expert Profile Only (Demotion) ---');
        const expertUser2Res = await axios.post(`${API_URL}/experts`, {
            email: 'testexpert_demote@example.com',
            firstName: 'Test',
            lastName: 'Expert2',
            phone: '1234567890',
            specializations: ['General'],
            hourlyRate: 50,
            location: { latitude: 0, longitude: 0 }
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const expertId2 = expertUser2Res.data.id;
        const expertUserId2 = expertUser2Res.data.userId;
        console.log(`   Created Expert 2: ${expertId2} (User: ${expertUserId2})`);

        // Delete Expert Profile
        console.log('   Deleting Expert Profile (Demotion)...');
        await axios.delete(`${API_URL}/admin/experts/${expertId2}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Verify Expert Profile is deleted
        const expertCheck2 = await Expert.findByPk(expertId2);
        if (expertCheck2) {
            console.error('FAILED: Expert profile still exists!');
        } else {
            console.log('   SUCCESS: Expert profile deleted.');
        }

        // Verify User Still Exists
        const userCheck2 = await User.findByPk(expertUserId2);
        if (userCheck2) {
            console.log('   SUCCESS: User still exists (Demotion successful).');
            // Cleanup
            await userCheck2.destroy({ force: true });
        } else {
            console.error('FAILED: User was deleted along with expert profile (Unexpected cascade)!');
        }


        // TEST 4: Leave Forum
        console.log('\n--- Test 4: Leave Forum ---');
        // Create new user for Forum test
        const forumUserRes = await axios.post(`${API_URL}/auth/register`, {
            first_name: 'Forum',
            last_name: 'User',
            email: 'forum_user@example.com',
            password: 'password123',
            role: 'farmer'
        });
        const forumUserId = forumUserRes.data.user.id;
        const forumUserToken = forumUserRes.data.token;
        console.log(`   Created Forum User: ${forumUserId}`);

        // Create Topic (as Admin for simplicity, or User)
        const topicRes = await axios.post(`${API_URL}/forums/topics`, {
            title: 'Test Topic Leave',
            description: 'Testing leave',
            category: 'General'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const topicId = topicRes.data.data.id;
        console.log(`   Created Topic: ${topicId}`);

        // Join Forum (User)
        await axios.post(`${API_URL}/forums/topics/${topicId}/join`, {}, {
            headers: { Authorization: `Bearer ${forumUserToken}` }
        });
        console.log('   User Joined Forum.');

        // Verify Membership
        let memberCheck = await ForumMember.findOne({ where: { user_id: forumUserId, forum_id: topicId } });
        if (!memberCheck) throw new Error('Join failed');

        // Leave Forum
        console.log('   User Leaving Forum...');
        await axios.post(`${API_URL}/forums/topics/${topicId}/leave`, {}, {
            headers: { Authorization: `Bearer ${forumUserToken}` }
        });

        // Verify Membership Gone
        memberCheck = await ForumMember.findOne({ where: { user_id: forumUserId, forum_id: topicId } });
        if (memberCheck) {
            console.error('FAILED: User still member after leaving!');
        } else {
            console.log('   SUCCESS: User left forum.');
        }

        // Cleanup Forum User & Topic
        await User.destroy({ where: { id: forumUserId }, force: true });
        await ForumTopic.destroy({ where: { id: topicId }, force: true });


        console.log('\n--- ALL TESTS COMPLETED ---');

    } catch (error) {
        console.error('TEST ERROR:', error.response?.data || error.message);
    } finally {
        // Cleanup Admin
        if (adminUserId) {
            // await User.destroy({ where: { id: adminUserId }, force: true });
            console.log('Admin user kept for potential manual inspection: ' + TEST_ADMIN_EMAIL);
        }
        // Close DB connection
        // await sequelize.close(); // Keep open if script ends process anyway? 
        // Usually good practice to close if running in long process, but this is script.
        process.exit(0);
    }
}

runTests();
