const express = require('express');
const router = express.Router();
const { posts } = require('./posts'); // ambil data dari posts.js

router.get('/', (req, res) => {
  res.render('index', { posts });
});

router.get('/admin', (req, res) => {
  res.render('admin', { posts });
});

router.get('/post/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).send('Post not found');
  res.render('post', { post });
});

module.exports = router;
