const Sentence = require("../models/Sentence");
const { firebaseUtils } = require("../config/firebase");

// @desc    Get sentences due for quiz
// @route   GET /api/quiz/due
// @access  Private
exports.getDueQuizItems = async (req, res) => {
  try {
    const sentences = await Sentence.getDueSentences(req.user.id);
    res.json(sentences);
  } catch (error) {
    console.error("Get due quiz items error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update sentence review status (remembered/forgotten)
// @route   POST /api/quiz/:id/review
// @access  Private
exports.updateReviewStatus = async (req, res) => {
  const { remembered } = req.body;

  // Validate input
  if (remembered === undefined) {
    return res.status(400).json({ message: "Remembered status is required" });
  }

  try {
    // Update review status
    const updatedSentence = await Sentence.updateReviewStatus(
      req.params.id,
      req.user.id,
      remembered
    );

    res.json({
      sentence: updatedSentence,
      nextReview: updatedSentence.nextReview,
      box: updatedSentence.box,
      completed: updatedSentence.completed,
    });
  } catch (error) {
    console.error("Update review status error:", error.message);
    if (error.message === "Not authorized") {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (error.message === "Sentence not found") {
      return res.status(404).json({ message: "Sentence not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get upcoming quiz schedule
// @route   GET /api/quiz/schedule
// @access  Private
exports.getQuizSchedule = async (req, res) => {
  try {
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all sentences for the user
    const sentences = await Sentence.findByUser(req.user.id, {
      sortBy: "nextReview",
      sortOrder: "asc",
    });

    // Filter sentences due in the next 7 days
    const upcomingSentences = sentences.filter((sentence) => {
      const nextReview = firebaseUtils.timestampToDate(sentence.nextReview);
      return (
        !sentence.completed && nextReview >= now && nextReview <= oneWeekLater
      );
    });

    // Group sentences by day
    const schedule = {};
    upcomingSentences.forEach((sentence) => {
      const date = firebaseUtils
        .timestampToDate(sentence.nextReview)
        .toISOString()
        .split("T")[0]; // YYYY-MM-DD

      if (!schedule[date]) {
        schedule[date] = [];
      }
      schedule[date].push({
        id: sentence.id,
        sentence: sentence.sentence,
        box: sentence.box,
      });
    });

    // Get count of sentences due today
    const dueToday = sentences.filter(
      (sentence) =>
        !sentence.completed &&
        firebaseUtils.timestampToDate(sentence.nextReview) <= now
    ).length;

    res.json({
      dueToday,
      schedule,
    });
  } catch (error) {
    console.error("Get quiz schedule error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get quiz statistics
// @route   GET /api/quiz/stats
// @access  Private
exports.getQuizStats = async (req, res) => {
  try {
    // Get all sentences for the user
    const sentences = await Sentence.findByUser(req.user.id);

    // Calculate total and completed sentences
    const totalSentences = sentences.length;
    const completedSentences = sentences.filter((s) => s.completed).length;

    // Calculate box distribution
    const boxDistribution = Array.from({ length: 7 }, (_, i) => ({
      box: i + 1,
      count: sentences.filter((s) => s.box === i + 1).length,
    }));

    // Calculate review history
    const reviewHistory = sentences.flatMap((sentence) =>
      (sentence.reviewHistory || []).map((review) => ({
        date: firebaseUtils
          .timestampToDate(review.date)
          .toISOString()
          .split("T")[0],
        remembered: review.remembered,
        forgotten: !review.remembered,
      }))
    );

    // Group review history
    const groupedReviewHistory = reviewHistory
      .reduce((acc, item) => {
        const existing = acc.find((a) => a._id === item.date);
        if (existing) {
          existing.remembered += item.remembered ? 1 : 0;
          existing.forgotten += item.forgotten ? 1 : 0;
        } else {
          acc.push({
            _id: item.date,
            remembered: item.remembered ? 1 : 0,
            forgotten: item.forgotten ? 1 : 0,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a._id.localeCompare(b._id))
      .slice(-30); // Last 30 days

    res.json({
      totalSentences,
      completedSentences,
      boxDistribution,
      reviewHistory: groupedReviewHistory,
    });
  } catch (error) {
    console.error("Get quiz stats error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
