require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

main();
