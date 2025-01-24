const { poolPromise, sql } = require('./database');

async function testConnection() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM usuarios');
    console.log('Usuarios:', result.recordset);
  } catch (err) {
    console.error('Error ejecutando la consulta:', err);
  }
}

testConnection();
