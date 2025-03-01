const express = require("express");
const statsController = require("../controllers/statsController");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/stats
// @desc    Get user statistics
// @access  Private
router.get("/", statsController.getUserStats);

module.exports = router;
