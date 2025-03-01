const Sentence = require("../models/Sentence");
const mongoose = require("mongoose");

// @desc    Get user statistics
// @route   GET /api/stats
// @access  Private
exports.getUserStats = async (req, res) => {
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

    // Get in-progress sentences
    const inProgressSentences = totalSentences - completedSentences;

    // Get total reviews
    const totalReviews = await Sentence.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $project: { reviewCount: { $size: "$reviewHistory" } } },
      { $group: { _id: null, total: { $sum: "$reviewCount" } } },
    ]);

    // Get success rate
    const successRate = await Sentence.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: "$reviewHistory" },
      {
        $group: {
          _id: null,
          remembered: {
            $sum: {
              $cond: [{ $eq: ["$reviewHistory.remembered", true] }, 1, 0],
            },
          },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          rate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $multiply: [{ $divide: ["$remembered", "$total"] }, 100] },
            ],
          },
        },
      },
    ]);

    // Get average days to complete
    const avgDaysToComplete = await Sentence.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          completed: true,
          lastReviewed: { $ne: null },
        },
      },
      {
        $project: {
          daysToComplete: {
            $divide: [
              { $subtract: ["$lastReviewed", "$createdAt"] },
              1000 * 60 * 60 * 24, // Convert ms to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: "$daysToComplete" },
        },
      },
    ]);

    // Get box distribution
    const boxDistribution = await Sentence.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
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

    // Get weekly activity
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const weeklyActivity = await Sentence.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          "reviewHistory.date": { $gte: oneMonthAgo },
        },
      },
      { $unwind: "$reviewHistory" },
      {
        $match: {
          "reviewHistory.date": { $gte: oneMonthAgo },
        },
      },
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
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get upcoming reviews
    const upcomingReviews = await Sentence.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          completed: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$nextReview",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }, // Next 7 days
    ]);

    // Format upcoming reviews
    const formattedUpcomingReviews = [];
    const today = new Date().toISOString().split("T")[0];

    upcomingReviews.forEach((item) => {
      let label = "Future";
      if (item._id === today) {
        label = "Today";
      } else {
        const reviewDate = new Date(item._id);
        const diffTime = reviewDate.getTime() - new Date(today).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          label = "Tomorrow";
        } else if (diffDays > 1 && diffDays <= 7) {
          label = `In ${diffDays} days`;
        }
      }

      formattedUpcomingReviews.push({
        date: item._id,
        label,
        count: item.count,
      });
    });

    res.json({
      totalSentences,
      completedSentences,
      inProgressSentences,
      totalReviews: totalReviews.length > 0 ? totalReviews[0].total : 0,
      successRate: successRate.length > 0 ? Math.round(successRate[0].rate) : 0,
      avgDaysToComplete:
        avgDaysToComplete.length > 0
          ? Math.round(avgDaysToComplete[0].avgDays)
          : 0,
      boxDistribution: formattedBoxDistribution,
      weeklyActivity,
      upcomingReviews: formattedUpcomingReviews,
    });
  } catch (error) {
    console.error("Get user stats error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
