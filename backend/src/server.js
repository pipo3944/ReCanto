const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import Firebase configuration
const { db, useEmulator } = require("./config/firebase");

// Import routes
const authRoutes = require("./routes/auth");
const sentenceRoutes = require("./routes/sentences");
const quizRoutes = require("./routes/quiz");
const statsRoutes = require("./routes/stats");

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sentences", sentenceRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/stats", statsRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to ReCanto API",
    usingEmulator: useEmulator,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Firebase Emulator: ${useEmulator ? "Enabled" : "Disabled"}`);
});
