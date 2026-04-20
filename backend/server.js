require('dotenv').config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SECRET = process.env.ADMIN_SECRET; // ✅ Added

const rateLimit = require("express-rate-limit");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token" });
  }

  const token = header.split(" ")[1];

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

// Schema
const commentSchema = new mongoose.Schema({
  postId: { type: String, required: true },
  name: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, default: '' }, // ✅ Added for better previews
  type: { type: String, enum: ['writing', 'poetry'], default: 'writing' }, // ✅ Added to separate content types
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }, 
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Routes
app.get('/', (req, res) => {
  res.send("API running");
});

app.post('/comments', async (req, res) => {
  try {
    const { postId, name, message } = req.body;

    if (!postId || !name || !message) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }
    if(!name.trim() || !message.trim()) {
      return res.status(400).json({ok: false, error:"invalid input"});
    }
    if(name.length > 50 || message.length > 500) {
      return res.status(400).json({ok: false, error: "Too long"});
    }
    
    const comment = await Comment.create({
      postId,
      name: name.trim(),
      message: message.trim()
    });

    res.json({ ok: true, id: comment._id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Fixed: Create post with proper auth and optional secret
app.post('/posts', auth, async (req, res) => {
  const { title, content, slug, excerpt, type } = req.body;

  if (!title || !content || !slug) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const post = await Post.create({ 
      title, 
      content, 
      slug, 
      excerpt: excerpt || content.slice(0, 140) + '...',
      type: type || 'writing'
    });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = password === ADMIN_PASSWORD;

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ user: username }, JWT_SECRET, {
    expiresIn: "2h"
  });

  res.json({ token });
});

app.get('/posts', async (req, res) => {
  try {
    const { type, limit, status } = req.query;
    let query = {};
    
    if (type) query.type = type;
    
    // ✅ Check if request is from admin (has auth header)
    const authHeader = req.headers.authorization;
    let isAdmin = false;
    
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, JWT_SECRET);
        isAdmin = true;
      } catch {
        // Invalid token - treat as public
      }
    }
    
    // Public requests only see published posts
    // Admin requests see all (or filtered by status param)
    if (!isAdmin) {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }
    
    let postsQuery = Post.find(query).sort({ createdAt: -1 });
    if (limit) postsQuery = postsQuery.limit(parseInt(limit));
    
    const posts = await postsQuery;
    res.json(posts);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });

    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ EDIT POST - Add this after your POST /posts route

app.put('/posts/:id', auth, async (req, res) => {
  try {
    const { title, content, slug, excerpt, type, status } = req.body;
    
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        content, 
        slug, 
        excerpt: excerpt || content.slice(0, 140) + '...',
        type: type || 'writing',
        status: status || 'draft'
      },
      { new: true, runValidators: true }
    );
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/comments/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({
      postId: req.params.postId
    }).sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Fixed: Delete comment with optional auth for admin
app.delete('/comments/:id', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (header) {
      try {
        const token = header.split(" ")[1];
        jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(403).json({ error: "Invalid token" });
      }
    }
    
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Fixed: Delete post with auth
app.delete('/posts/:id', auth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Added: Update post endpoint
app.put('/posts/:id', auth, async (req, res) => {
  try {
    const { title, content, slug, excerpt, type } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, slug, excerpt, type },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server ONLY after DB connects
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });