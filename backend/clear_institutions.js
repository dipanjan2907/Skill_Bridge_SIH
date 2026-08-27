require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearInstitutions() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'skillbridge'
    });
    
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM institutions');
    console.log('Current institutions count:', rows[0].count);
    
    await conn.query('DELETE FROM institutions');
    
    const [after] = await conn.query('SELECT COUNT(*) as count FROM institutions');
    console.log('After delete:', after[0].count);
    
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing institutions:', error);
    process.exit(1);
  }
}

clearInstitutions();
