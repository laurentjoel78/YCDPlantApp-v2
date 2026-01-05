/**
 * Script to update admin credentials
 * Run with: node scripts/updateAdmin.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL;

const sequelize = new Sequelize(DATABASE_URL, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function updateAdmin() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // New admin credentials
    const newEmail = 'admin@ycd.com';
    const newPassword = 'Admin@123';
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // First, check if admin@ycd.com already exists
    const [existingNew] = await sequelize.query(`
      SELECT id, email FROM "Users" WHERE email = '${newEmail}'
    `);
    
    if (existingNew.length > 0) {
      console.log('Admin with email admin@ycd.com already exists. Updating password...');
      await sequelize.query(`
        UPDATE "Users" 
        SET password_hash = '${hashedPassword}',
            email_verified = true,
            is_active = true,
            role = 'admin',
            approval_status = 'approved'
        WHERE email = '${newEmail}'
      `);
      console.log('✅ Admin password updated!');
    } else {
      // Update the existing admin
      const [existingAdmin] = await sequelize.query(`
        SELECT id, email FROM "Users" WHERE role = 'admin' LIMIT 1
      `);
      
      if (existingAdmin.length > 0) {
        console.log(`Found existing admin: ${existingAdmin[0].email}`);
        console.log(`Updating to new email: ${newEmail}`);
        
        await sequelize.query(`
          UPDATE "Users" 
          SET email = '${newEmail}',
              password_hash = '${hashedPassword}',
              email_verified = true,
              is_active = true,
              approval_status = 'approved'
          WHERE id = '${existingAdmin[0].id}'
        `);
        console.log('✅ Admin credentials updated!');
      } else {
        console.log('No admin found. Creating new admin...');
        const { v4: uuidv4 } = require('uuid');
        const adminId = uuidv4();
        
        await sequelize.query(`
          INSERT INTO "Users" (id, email, password_hash, first_name, last_name, role, email_verified, is_active, approval_status, created_at, updated_at)
          VALUES ('${adminId}', '${newEmail}', '${hashedPassword}', 'System', 'Administrator', 'admin', true, true, 'approved', NOW(), NOW())
        `);
        
        // Create wallet for admin
        await sequelize.query(`
          INSERT INTO "Wallets" (id, user_id, balance, currency, created_at, updated_at)
          VALUES ('${uuidv4()}', '${adminId}', 0, 'XAF', NOW(), NOW())
        `);
        
        console.log('✅ New admin created!');
      }
    }
    
    // Verify the update
    const [admin] = await sequelize.query(`
      SELECT id, email, first_name, last_name, role, email_verified, is_active, approval_status
      FROM "Users" 
      WHERE email = '${newEmail}'
    `);
    
    console.log('\n--- Admin Details ---');
    console.log('Email:', admin[0].email);
    console.log('Name:', admin[0].first_name, admin[0].last_name);
    console.log('Role:', admin[0].role);
    console.log('Email Verified:', admin[0].email_verified);
    console.log('Is Active:', admin[0].is_active);
    console.log('Approval Status:', admin[0].approval_status);
    console.log('\n✅ You can now login with:');
    console.log('   Email: admin@ycd.com');
    console.log('   Password: Admin@123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

updateAdmin();
