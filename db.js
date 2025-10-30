// db.js
const { Pool } = require('pg');

// Konfigurasi koneksi ke PostgreSQL
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',      // ganti dengan user PostgreSQL kamu
  password: 'postgres',      // ganti dengan password PostgreSQL kamu
  database: 'news_app',  // nama database
  port: 5432,            // default port PostgreSQL
});

module.exports = pool;
