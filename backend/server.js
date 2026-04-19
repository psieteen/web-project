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
const feedbackSchema = new mongoose.Schema({
  postId: { type: String, required: true },
  name: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', feedbackSchema);

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