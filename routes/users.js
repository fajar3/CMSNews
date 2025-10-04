const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireLogin, requireRole } = require('../middleware/authMiddleware');

// hanya superadmin yang boleh
router.get('/', requireLogin, requireRole(['superadmin']), userController.list);
router.get('/add', requireLogin, requireRole(['superadmin']), userController.addPage);
router.post('/add', requireLogin, requireRole(['superadmin']), userController.addUser);
router.get('/delete/:id', requireLogin, requireRole(['superadmin']), userController.deleteUser);

module.exports = router;
