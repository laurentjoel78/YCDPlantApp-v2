require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

async function check() {
    try {
        console.log('Checking for user...');
        const [results, metadata] = await sequelize.query("SELECT * FROM users WHERE id = 'f1be0767-65a5-49b2-b756-ffa9f9960ae2'");
        console.log('User results:', results);

        console.log('\nChecking audit_logs constraints...');
        const [constraints] = await sequelize.query(`
            SELECT conname, confrelid::regclass 
            FROM pg_constraint 
            WHERE conrelid = 'audit_logs'::regclass 
            AND contype = 'f';
        `);
        console.log('Constraints:', constraints);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

check();
