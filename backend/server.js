require('dotenv').config();

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
// Debug check (optional but useful)
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

app.post('/posts', async (req, res) => {
  const { secret } = req.body;

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { title, content, slug } = req.body;

  const post = await Post.create({ title, content, slug });

  res.json(post);
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
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

app.delete('/comments/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/posts/:id', async (req, res) => {
  const { secret } = req.body;

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await Post.findByIdAndDelete(req.params.id);

  res.json({ ok: true });
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