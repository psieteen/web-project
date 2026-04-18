// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection (Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema
const Feedback = mongoose.model('Feedback', {
  name: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

// Routes

// Test route
app.get('/', (req, res) => {
  res.send("API running");
});

// Save feedback
app.post('/feedback', async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const newFeedback = await Feedback.create({ name, message });

    res.json({ ok: true, id: newFeedback._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});