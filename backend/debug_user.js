require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

async function check() {
    try {
        console.log('Checking for user by email...');
        const [results] = await sequelize.query("SELECT * FROM users WHERE email = 'admin@ycd.com'");
        console.log('User results by email:', results);

        console.log('\nAll users count:');
        const [count] = await sequelize.query("SELECT count(*) FROM users");
        console.log('Count:', count);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

check();
