// Script to verify phone number in database
require('dotenv').config();
const { User } = require('./src/models');

async function checkPhone() {
    try {
        const user = await User.findOne({
            where: { email: 'patou@gmail.com' },
            attributes: ['id', 'email', 'first_name', 'last_name', 'phone_number', 'region']
        });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('📱 Patou Account Details:');
        console.log('========================');
        console.log('Email:', user.email);
        console.log('Name:', user.first_name, user.last_name);
        console.log('Phone:', user.phone_number || '❌ NOT SET');
        console.log('Region:', user.region);
        console.log('========================');

        if (!user.phone_number) {
            console.log('\n⚠️  Phone number is NULL in database!');
            console.log('The previous update may have failed.');
        } else {
            console.log('\n✅ Phone number IS in database');
            console.log('User needs to log out and log back in to see it.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkPhone();
