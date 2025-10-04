const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const { requireLogin, requireRole } = require('../middleware/authMiddleware');

// ==========================
// Upload Gambar
// ==========================
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==========================
// Dashboard & Artikel
// ==========================
router.get('/dashboard', requireLogin, adminController.dashboard);
router.get('/articles', requireLogin, requireRole(['superadmin', 'admin', 'penulis']), adminController.dashboard);
router.get('/add', requireLogin, requireRole(['superadmin', 'admin', 'penulis']), adminController.addPage);
router.post('/add', requireLogin, requireRole(['superadmin','admin','penulis']), upload.single('image'), adminController.addPost);
router.get('/edit/:id', requireLogin, requireRole(['superadmin','admin','penulis']), adminController.editPage);
router.post('/edit/:id', requireLogin, requireRole(['superadmin','admin','penulis']), upload.single('image'), adminController.updatePost);
router.get('/delete/:id', requireLogin, requireRole(['superadmin','admin']), adminController.deletePost);
// Halaman Kelola Artikel
router.get('/articles-list', requireLogin, requireRole(['superadmin', 'admin', 'penulis']), adminController.manageArticles);

// ==========================
// Kelola Pengguna (SuperAdmin Only)
// ==========================
router.get('/users', requireLogin, requireRole(['superadmin']), userController.list);
router.get('/users/add', requireLogin, requireRole(['superadmin']), userController.addPage);
router.post('/users/add', requireLogin, requireRole(['superadmin']), userController.addUser);
router.get('/users/delete/:id', requireLogin, requireRole(['superadmin']), userController.deleteUser);
// Edit User (SuperAdmin Only)
router.get('/users/edit/:id', requireLogin, requireRole(['superadmin']), userController.editPage);
router.post('/users/edit/:id', requireLogin, requireRole(['superadmin']), userController.updateUser);

module.exports = router;
