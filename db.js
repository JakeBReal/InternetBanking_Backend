const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'internet_banking',
  port: process.env.DB_PORT || 5432
});

pool.on('connect', () => {
  console.log('Conectado exitosamente a la Base de Datos');
});

pool.on('error', (err) => {
  console.error('Error en la conexión de la Base de Datos:', err);
});

module.exports = pool;
