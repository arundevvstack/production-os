require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Schema cache reloaded successfully.');
  } catch (error) {
    console.error('Error reloading schema cache:', error);
  } finally {
    await client.end();
  }
}

main();
