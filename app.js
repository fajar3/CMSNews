const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware dasar
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Session
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

// Middleware global
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.title = 'News CMS';
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const postRoutes = require('./routes/posts');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/posts', postRoutes);
// === Homepage ===
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM posts';
    const conditions = [];
    const params = [];

    // Pencarian
    if (req.query.search) {
      conditions.push('(title LIKE ? OR subtitle LIKE ? OR content LIKE ?)');
      params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
    }

    // Filter kategori
    if (req.query.category) {
      conditions.push('category = ?');
      params.push(req.query.category);
    }

    // Filter tag
    if (req.query.tag) {
      conditions.push('FIND_IN_SET(?, tags)');
      params.push(req.query.tag);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [posts] = await db.query(sql, params);

    // Hitung total post
    let countSql = 'SELECT COUNT(*) as total FROM posts';
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ');
    const [countRows] = await db.query(countSql, params.slice(0, params.length - 2));
    const totalPages = Math.ceil(countRows[0].total / limit);

    // Ambil kategori unik
    const [allCategories] = await db.query('SELECT DISTINCT category FROM posts WHERE category IS NOT NULL');
    const categories = allCategories.map(p => p.category);

    // Ambil tag unik
    const [allTags] = await db.query('SELECT tags FROM posts WHERE tags IS NOT NULL');
    let tags = [];
    allTags.forEach(p => {
      if (p.tags) tags.push(...p.tags.split(',').map(t => t.trim()));
    });
    tags = [...new Set(tags)];

    // Trending (berdasarkan views)
    const [trending] = await db.query('SELECT * FROM posts ORDER BY views DESC LIMIT 5');

    // Render halaman utama
    res.render('index', {
      title: 'Berita Terbaru',
      layout: 'layouts/main',
      posts,
      trending,
      page,
      totalPages,
      search: req.query.search || '',
      selectedCategory: req.query.category || '',
      selectedTag: req.query.tag || '',
      categories,
      tags
    });

  } catch (err) {
    console.error(err);
    res.send('Error loading posts');
  }
});

// === Detail Post ===
// === Detail Post ===
app.get('/post/:slug', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE slug=?', [req.params.slug]);
    if (rows.length === 0) return res.send('Post not found');
    const post = rows[0];

    // Update views
    await db.query('UPDATE posts SET views=views+1 WHERE id=?', [post.id]);

    // Related posts
    let relatedPosts = [];
    if (post.category) {
      const [related] = await db.query(
        'SELECT * FROM posts WHERE category=? AND id!=? ORDER BY created_at DESC LIMIT 4',
        [post.category, post.id]
      );
      relatedPosts = related;
    }

    // ✅ Tambahkan ini biar trending ada juga di halaman post
    const [trending] = await db.query('SELECT * FROM posts ORDER BY views DESC LIMIT 5');

    // Render ke EJS
    res.render('post', { 
      title: post.title,
      layout: 'layouts/main',
      post,
      relatedPosts,
      trending
    });

  } catch (err) {
    console.error('🔥 Error detail post:', err);
    res.status(500).send('Error loading post');
  }
});


// === Jalankan Server ===
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
