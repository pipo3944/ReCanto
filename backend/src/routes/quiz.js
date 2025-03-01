const express = require("express");
const quizController = require("../controllers/quizController");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/quiz/due
// @desc    Get sentences due for quiz
// @access  Private
router.get("/due", quizController.getDueQuizItems);

// @route   POST /api/quiz/:id/review
// @desc    Update sentence review status (remembered/forgotten)
// @access  Private
router.post("/:id/review", quizController.updateReviewStatus);

// @route   GET /api/quiz/schedule
// @desc    Get upcoming quiz schedule
// @access  Private
router.get("/schedule", quizController.getQuizSchedule);

// @route   GET /api/quiz/stats
// @desc    Get quiz statistics
// @access  Private
router.get("/stats", quizController.getQuizStats);

module.exports = router;
