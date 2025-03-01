const Sentence = require("../models/Sentence");

// @desc    Get sentences due for quiz
// @route   GET /api/quiz/due
// @access  Private
exports.getDueQuizItems = async (req, res) => {
  try {
    const now = new Date();
    const sentences = await Sentence.find({
      user: req.user.id,
      nextReview: { $lte: now },
      completed: false,
    }).sort({ nextReview: 1 });

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
    // Find sentence by id
    const sentence = await Sentence.findById(req.params.id);

    // Check if sentence exists
    if (!sentence) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    // Check if sentence belongs to user
    if (sentence.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update review status
    sentence.updateReviewStatus(remembered);

    // Save updated sentence
    await sentence.save();

    res.json({
      sentence,
      nextReview: sentence.nextReview,
      box: sentence.box,
      completed: sentence.completed,
    });
  } catch (error) {
    console.error("Update review status error:", error.message);
    if (error.kind === "ObjectId") {
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

    // Get sentences due in the next 7 days
    const sentences = await Sentence.find({
      user: req.user.id,
      nextReview: { $gte: now, $lte: oneWeekLater },
      completed: false,
    }).sort({ nextReview: 1 });

    // Group sentences by day
    const schedule = {};
    sentences.forEach((sentence) => {
      const date = sentence.nextReview.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!schedule[date]) {
        schedule[date] = [];
      }
      schedule[date].push({
        id: sentence._id,
        sentence: sentence.sentence,
        box: sentence.box,
      });
    });

    // Get count of sentences due today
    const today = now.toISOString().split("T")[0];
    const dueToday = await Sentence.countDocuments({
      user: req.user.id,
      nextReview: { $lte: now },
      completed: false,
    });

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
    // Get total sentences
    const totalSentences = await Sentence.countDocuments({
      user: req.user.id,
    });

    // Get completed sentences
    const completedSentences = await Sentence.countDocuments({
      user: req.user.id,
      completed: true,
    });

    // Get sentences by box
    const boxDistribution = await Sentence.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: "$box", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Format box distribution
    const formattedBoxDistribution = Array.from({ length: 7 }, (_, i) => ({
      box: i + 1,
      count: 0,
    }));

    boxDistribution.forEach((item) => {
      if (item._id >= 1 && item._id <= 7) {
        formattedBoxDistribution[item._id - 1].count = item.count;
      }
    });

    // Get review history stats
    const reviewHistory = await Sentence.aggregate([
      { $match: { user: req.user.id } },
      { $unwind: "$reviewHistory" },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$reviewHistory.date",
            },
          },
          remembered: {
            $sum: {
              $cond: [{ $eq: ["$reviewHistory.remembered", true] }, 1, 0],
            },
          },
          forgotten: {
            $sum: {
              $cond: [{ $eq: ["$reviewHistory.remembered", false] }, 1, 0],
            },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }, // Last 30 days
    ]);

    res.json({
      totalSentences,
      completedSentences,
      boxDistribution: formattedBoxDistribution,
      reviewHistory,
    });
  } catch (error) {
    console.error("Get quiz stats error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
