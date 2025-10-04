const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',       // ganti sesuai user mysql
  password: 'hexa',       // ganti sesuai password mysql
  database: 'news_app'
});

module.exports = pool;
