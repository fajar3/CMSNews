const path = require('path');
const slugify = require('slugify');
const db = require('../db');

// ========== Dashboard ==========
exports.dashboard = async (req, res) => {
  try {
    // Semua post + join author
    const posts = (await db.query(`
      SELECT p.*, u.username AS author_name 
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `)).rows;

    // Statistik umum
    const stats = (await db.query(`
      SELECT 
        COUNT(*) AS "totalPosts",
        COALESCE(SUM(views), 0) AS "totalViews",
        COUNT(DISTINCT author_id) AS "totalAuthors"
      FROM posts
    `)).rows[0];

    // 5 artikel paling banyak dilihat
    const popularPosts = (await db.query(`
      SELECT p.title, p.views, p.created_at, u.username AS author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.views DESC
      LIMIT 5
    `)).rows;

    // 5 artikel terbaru
    const recentPosts = (await db.query(`
      SELECT p.title, p.created_at, u.username AS author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `)).rows;

    // Data kunjungan per hari (dummy)
    const visitData = {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      values: [120, 150, 180, 200, 220, 170, 190]
    };

    res.render('admin/dashboard', {
      layout: 'layouts/admin',
      user: req.session.user,
      stats,
      posts,
      popularPosts,
      recentPosts,
      visitData,
      active: 'dashboard'
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
};

// ========== Kelola Artikel ==========
exports.manageArticles = async (req, res) => {
  try {
    const posts = (await db.query(`
      SELECT p.*, u.username AS author_name 
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `)).rows;

    res.render('admin/manage-articles', {
      layout: 'layouts/admin',
      user: req.session.user,
      posts,
      active: 'articles'
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading articles');
  }
};

// ========== Halaman Tambah ==========
exports.addPage = (req, res) => {
  res.render('admin/add-post', {
    layout: 'layouts/admin',
    user: req.session.user,
    active: 'add'
  });
};

// ========== Simpan Post Baru ==========
exports.addPost = async (req, res) => {
  const { title, subtitle, content, category, tags } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const slug = slugify(title, { lower: true, strict: true });
  const authorId = req.session.user.id;

  try {
    await db.query(
      `INSERT INTO posts(title, subtitle, content, image, author_id, category, tags, slug, created_at)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [title, subtitle, content, image, authorId, category, tags, slug]
    );
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error adding post');
  }
};

// ========== Edit Post ==========
exports.editPage = async (req, res) => {
  const id = req.params.id;
  try {
    const post = (await db.query(`
      SELECT p.*, u.username AS author_name 
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = $1
    `, [id])).rows[0];

    if (!post) return res.send('Post not found');

    res.render('admin/edit-post', {
      layout: 'layouts/admin',
      post,
      user: req.session.user,
      active: 'edit'
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading post');
  }
};

// ========== Update Post ==========
exports.updatePost = async (req, res) => {
  const id = req.params.id;
  const { title, subtitle, content, category, tags } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    if (image) {
      await db.query(
        `UPDATE posts 
         SET title=$1, subtitle=$2, content=$3, image=$4, category=$5, tags=$6, updated_at=CURRENT_TIMESTAMP 
         WHERE id=$7`,
        [title, subtitle, content, image, category, tags, id]
      );
    } else {
      await db.query(
        `UPDATE posts 
         SET title=$1, subtitle=$2, content=$3, category=$4, tags=$5, updated_at=CURRENT_TIMESTAMP 
         WHERE id=$6`,
        [title, subtitle, content, category, tags, id]
      );
    }
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error updating post');
  }
};

// ========== Hapus Post ==========
exports.deletePost = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM posts WHERE id=$1', [id]);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error deleting post');
  }
};
