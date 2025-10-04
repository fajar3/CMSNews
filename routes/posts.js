const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');

// Auth middleware
function auth(req,res,next){
  if(req.session.user) next();
  else res.redirect('/login');
}

// Multer
const storage = multer.diskStorage({
  destination:'./public/uploads',
  filename:(req,file,cb)=>cb(null, Date.now()+path.extname(file.originalname))
});
const upload = multer({ storage });

// Dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [posts] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
    const [[stats]] = await db.query(`
      SELECT 
        COUNT(*) AS totalPosts,
        IFNULL(SUM(views), 0) AS totalViews,
        COUNT(DISTINCT author) AS totalAuthors
      FROM posts
    `);

    res.render('admin/dashboard', {
      posts,
      stats,
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// Add Post
router.get('/add', auth, (req,res)=>res.render('admin/add-post',{ user:req.session.user }));
const slugify = require('slugify');

router.post('/add', auth, upload.single('image'), async (req,res)=>{
  const { title, subtitle, content, author, category, tags } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const slug = slugify(title, { lower:true, strict:true });

  try{
    await db.query(
      'INSERT INTO posts(title, subtitle, content, image, author, category, tags, slug) VALUES(?,?,?,?,?,?,?,?)',
      [title, subtitle, content, image, author, category, tags, slug]
    );
    res.redirect('/admin/dashboard');
  }catch(err){ console.error(err); res.send('Error adding post'); }
});


// Edit Post
router.get('/edit/:id', auth, async (req,res)=>{
  const id = req.params.id;
  try{
    const [rows] = await db.query('SELECT * FROM posts WHERE id=?',[id]);
    if(rows.length===0) return res.send('Post not found');
    res.render('admin/edit-post',{ post:rows[0], user:req.session.user });
  }catch(err){ console.error(err); res.send('Error fetching post'); }
});

router.post('/edit/:id', auth, upload.single('image'), async (req,res)=>{
  const id = req.params.id;
  const { title, subtitle, content, author, category, tags } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  try{
    if(image){
      await db.query('UPDATE posts SET title=?, subtitle=?, content=?, image=?, author=?, category=?, tags=? WHERE id=?',
      [title, subtitle, content, image, author, category, tags, id]);
    }else{
      await db.query('UPDATE posts SET title=?, subtitle=?, content=?, author=?, category=?, tags=? WHERE id=?',
      [title, subtitle, content, author, category, tags, id]);
    }
    res.redirect('/admin/dashboard');
  }catch(err){ console.error(err); res.send('Error updating post'); }
});

// Delete Post
router.get('/delete/:id', auth, async (req,res)=>{
  const id = req.params.id;
  try{
    await db.query('DELETE FROM posts WHERE id=?',[id]);
    res.redirect('/admin/dashboard');
  }catch(err){ console.error(err); res.send('Error deleting post'); }
});

module.exports = router;
