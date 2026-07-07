require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id FROM "Project" LIMIT 1');
    console.log("PROJECT_ID=" + res.rows[0].id);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

testConnection();
