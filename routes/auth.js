const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) return res.redirect('/admin/dashboard');
  next();
}

router.get('/login', redirectIfLoggedIn, authController.loginPage);
router.post('/login', authController.login);
router.get('/register', redirectIfLoggedIn, authController.registerPage);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

module.exports = router;
