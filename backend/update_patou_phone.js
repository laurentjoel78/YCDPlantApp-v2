// Quick script to add phone number to Patou's account
require('dotenv').config();
const { User } = require('./src/models');

async function updatePatouPhone() {
    try {
        const user = await User.findOne({ where: { email: 'patou@gmail.com' } });

        if (!user) {
            console.log('❌ User patou@gmail.com not found');
            process.exit(1);
        }

        // Update phone number
        await user.update({ phone_number: '+237677777777' });

        console.log('✅ Successfully updated phone number for Patou');
        console.log('Email:', user.email);
        console.log('Phone:', user.phone_number);
        console.log('Region:', user.region);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating phone:', error);
        process.exit(1);
    }
}

updatePatouPhone();
