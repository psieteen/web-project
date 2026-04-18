require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Debug check (optional but useful)
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

// Schema
const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Routes
app.get('/', (req, res) => {
  res.send("API running");
});

app.post('/feedback', async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const newFeedback = await Feedback.create({ name, message });

    res.json({ ok: true, id: newFeedback._id });
  } catch (err) {
    console.error("FEEDBACK ERROR:", err);
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