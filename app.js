const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// EJS
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

// Global middleware
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

// Homepage
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM posts';
    const conditions = [];
    const params = [];

    // Search
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      conditions.push(`(title ILIKE $${params.length + 1} OR subtitle ILIKE $${params.length + 2} OR content ILIKE $${params.length + 3})`);
      params.push(term, term, term);
    }

    // Category filter
    if (req.query.category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(req.query.category);
    }

    // Tag filter
    if (req.query.tag) {
      conditions.push(`tags ILIKE $${params.length + 1}`);
      params.push(`%${req.query.tag}%`);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const posts = (await db.query(sql, params)).rows;

    // Total pages
    let countSql = 'SELECT COUNT(*) AS total FROM posts';
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ');
    const countRows = (await db.query(countSql, params.slice(0, params.length - 2))).rows;
    const totalPages = Math.ceil(countRows[0].total / limit);

    // Categories
    const categories = (await db.query('SELECT DISTINCT category FROM posts WHERE category IS NOT NULL')).rows.map(r => r.category);

    // Tags
    const allTags = (await db.query('SELECT tags FROM posts WHERE tags IS NOT NULL')).rows;
    let tags = [];
    allTags.forEach(p => {
      if (p.tags) tags.push(...p.tags.split(',').map(t => t.trim()));
    });
    tags = [...new Set(tags)];

    // Trending
    const trending = (await db.query('SELECT * FROM posts ORDER BY views DESC LIMIT 5')).rows;

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

// Detail Post
app.get('/post/:slug', async (req, res) => {
  try {
    const rows = (await db.query('SELECT * FROM posts WHERE slug=$1', [req.params.slug])).rows;
    if (rows.length === 0) return res.send('Post not found');
    const post = rows[0];

    await db.query('UPDATE posts SET views = views + 1 WHERE id = $1', [post.id]);

    let relatedPosts = [];
    if (post.category) {
      relatedPosts = (await db.query(
        'SELECT * FROM posts WHERE category=$1 AND id != $2 ORDER BY created_at DESC LIMIT 4',
        [post.category, post.id]
      )).rows;
    }

    const trending = (await db.query('SELECT * FROM posts ORDER BY views DESC LIMIT 5')).rows;

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

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
