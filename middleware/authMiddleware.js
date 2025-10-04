// Cek apakah sudah login
exports.requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// Cek role
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');

    // pastikan role ada
    if (!req.session.user.role || !roles.includes(req.session.user.role)) {
      return res.status(403).send('Akses ditolak.');
    }

    next();
  };
};
