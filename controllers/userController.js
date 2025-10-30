const bcrypt = require('bcrypt');
const db = require('../db');

// daftar user
exports.list = async (req, res) => {
  try {
    const users = (await db.query('SELECT * FROM users')).rows;
    res.render('admin/users', {
      layout: 'layouts/admin',
      users,
      user: req.session.user,
      active: 'users'
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading users');
  }
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
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, nama_lengkap, role) VALUES ($1, $2, $3, $4)',
      [username, hash, nama_lengkap, role]
    );
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Error adding user');
  }
};

// hapus user
exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Error deleting user');
  }
};

// Halaman Edit User
exports.editPage = async (req, res) => {
  const id = req.params.id;
  try {
    const rows = (await db.query('SELECT * FROM users WHERE id = $1', [id])).rows;
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
      await db.query(
        'UPDATE users SET username = $1, role = $2, password = $3 WHERE id = $4',
        [username, role, hash, id]
      );
    } else {
      // update tanpa mengubah password
      await db.query(
        'UPDATE users SET username = $1, role = $2 WHERE id = $3',
        [username, role, id]
      );
    }
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Error updating user');
  }
};
