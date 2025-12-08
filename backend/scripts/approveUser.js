const { User } = require('../src/models');

async function approveUser(email) {
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            return;
        }

        if (user.approval_status === 'approved') {
            console.log(`User ${email} is already approved.`);
            return;
        }

        user.approval_status = 'approved';
        user.approved_at = new Date();
        await user.save();

        console.log(`Successfully approved user: ${email}`);
    } catch (error) {
        console.error('Error approving user:', error);
    }
}

// Execute if run directly
if (require.main === module) {
    const email = process.argv[2] || 'patou@gmail.com'; // Default to the requested email
    approveUser(email).then(() => {
        console.log('Done');
        process.exit(0);
    });
}

module.exports = approveUser;
