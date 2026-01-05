require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

async function checkColumns() {
  try {
    const [rows] = await seq.query(`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'Products' ORDER BY ordinal_position`);
    console.log('Columns in Products table:');
    rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type} (${r.udt_name})`));
    await seq.close();
  } catch (err) {
    console.error('Error:', err.message);
    await seq.close();
  }
}

checkColumns();
