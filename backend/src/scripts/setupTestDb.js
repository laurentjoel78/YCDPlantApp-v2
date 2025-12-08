const { Client } = require('pg');
require('dotenv').config({ path: 'test.env' });

async function setupTestDatabase() {
  const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();

    // Drop test database if it exists
    await client.query(`
      DROP DATABASE IF EXISTS ${process.env.DB_NAME}
    `);

    // Create test database
    await client.query(`
      CREATE DATABASE ${process.env.DB_NAME}
    `);

    console.log('Test database created successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupTestDatabase();