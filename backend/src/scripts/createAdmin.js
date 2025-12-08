require('dotenv').config();
const { User } = require('../models');

async function createAdmin() {
    console.log('Creating admin user...\n');

    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({
            where: { email: 'admin@ycd.com' }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists!');
            console.log('\n' + '='.repeat(60));
            console.log('ADMIN CREDENTIALS');
            console.log('='.repeat(60));
            console.log('Email:    admin@ycd.com');
            console.log('Password: Admin@123');
            console.log('Role:     admin');
            console.log('='.repeat(60) + '\n');
            return;
        }

        // Create admin user
        const admin = await User.create({
            email: 'admin@ycd.com',
            password_hash: 'Admin@123', // Will be hashed by the beforeSave hook
            first_name: 'Admin',
            last_name: 'YCD',
            phone_number: '+237600000000',
            role: 'admin',
            email_verified: true,
            approval_status: 'approved',
            is_active: true,
            preferred_language: 'fr',
            region: 'Centre'
        });

        console.log('✅ Admin user created successfully!\n');
        console.log('='.repeat(60));
        console.log('ADMIN CREDENTIALS');
        console.log('='.repeat(60));
        console.log('Email:    admin@ycd.com');
        console.log('Password: Admin@123');
        console.log('Role:     admin');
        console.log('User ID:  ' + admin.id);
        console.log('='.repeat(60));
        console.log('\n✅ You can now login with these credentials!\n');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

createAdmin();
