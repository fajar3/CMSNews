const bcrypt = require('bcrypt');
const db = require('../db');

// daftar user
exports.list = async (req, res) => {
  const [users] = await db.query('SELECT * FROM users');
  res.render('admin/users', {
    layout: 'layouts/admin',
    users,
    user: req.session.user,
    active: 'users'
  });
};

// form tambah user
exports.addPage = (req, res) => {
  res.render('admin/add-user', {
    layout: 'layouts/admin',
    user: req.session.user,
    active: 'add-user'
  });
};

// simpan user baru
exports.addUser = async (req, res) => {
  const { username, password, nama_lengkap, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)',
    [username, hash, nama_lengkap, role]);
  res.redirect('/admin/users');
};

// hapus user
exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  await db.query('DELETE FROM users WHERE id = ?', [id]);
  res.redirect('/admin/users');
};
// Halaman Edit User

// Edit User Page
exports.editPage = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.send('User tidak ditemukan');

    res.render('admin/edit-user', {
      layout: 'layouts/admin',
      user: req.session.user, // user yang login
      editUser: rows[0],
      active: 'edit-users'
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading user');
  }
};

// Update User (username, role, dan password opsional)
exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const { username, role, password } = req.body;

  try {
    if (password && password.trim() !== '') {
      // hash password baru
      const hash = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?', [username, role, hash, id]);
    } else {
      // update tanpa mengubah password
      await db.query('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, id]);
    }
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Error updating user');
  }
};
