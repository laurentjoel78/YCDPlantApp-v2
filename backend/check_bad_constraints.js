require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

async function check() {
    try {
        console.log('Checking for bad constraints pointing to "Users"...');
        const [results] = await sequelize.query(`
            SELECT conname, conrelid::regclass 
            FROM pg_constraint 
            WHERE confrelid = '"Users"'::regclass
        `);
        console.log('Bad constraints:', results);
    } catch (error) {
        if (error.message.includes('relation "Users" does not exist')) {
            console.log('Good: "Users" relation does not exist, so no constraints can point to it.');
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await sequelize.close();
    }
}

check();
