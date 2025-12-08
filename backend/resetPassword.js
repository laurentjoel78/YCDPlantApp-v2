const bcrypt = require('bcryptjs');
const { User } = require('./src/models');
const { sequelize } = require('./src/config/sequelize');

async function resetPassword() {
  try {
    const email = 'laurentjoel52@gmail.com';
    const newPassword = 'Mkounga10#';
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    const password_hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash });
    console.log('Password updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
