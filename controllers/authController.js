const bcrypt = require('bcrypt');
const db = require('../db');

// Halaman Login
exports.loginPage = (req, res) => {
  res.render('login', { title: 'Login - News CMS', error: null });
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.render('login', { title: 'Login - News CMS', error: 'Username atau password salah' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { title: 'Login - News CMS', error: 'Username atau password salah' });
    }

    // ✅ Simpan data penting di session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,           // wajib untuk middleware role
      nama_lengkap: user.nama_lengkap
    };

    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error(err);
    res.render('login', { title: 'Login - News CMS', error: 'Terjadi kesalahan server' });
  }
};

// Register Page
exports.registerPage = (req, res) => {
  res.render('register', { title: 'Register - News CMS', error: null });
};

// Register
exports.register = async (req, res) => {
  const { username, password, role, nama_lengkap } = req.body;
  try {
    const [exists] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (exists.length > 0) {
      return res.render('register', { title: 'Register - News CMS', error: 'Username sudah digunakan' });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, role, nama_lengkap) VALUES (?, ?, ?, ?)',
      [username, hash, role, nama_lengkap]
    );

    res.redirect('/login');

  } catch (err) {
    console.error(err);
    res.render('register', { title: 'Register - News CMS', error: 'Terjadi kesalahan server' });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};
