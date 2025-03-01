const Sentence = require("../models/Sentence");
const { db, firebaseUtils } = require("../config/firebase");

// @desc    Get user statistics
// @route   GET /api/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    // Get all sentences for the user
    const sentencesSnapshot = await db
      .collection("sentences")
      .where("user", "==", req.user.id)
      .get();

    const sentences = sentencesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate total and completed sentences
    const totalSentences = sentences.length;
    const completedSentences = sentences.filter((s) => s.completed).length;
    const inProgressSentences = totalSentences - completedSentences;

    // Calculate total reviews
    const totalReviews = sentences.reduce(
      (total, sentence) =>
        total + (sentence.reviewHistory ? sentence.reviewHistory.length : 0),
      0
    );

    // Calculate success rate
    const rememberedReviews = sentences.reduce(
      (total, sentence) =>
        total +
        (sentence.reviewHistory
          ? sentence.reviewHistory.filter((r) => r.remembered).length
          : 0),
      0
    );
    const successRate =
      totalReviews > 0
        ? Math.round((rememberedReviews / totalReviews) * 100)
        : 0;

    // Calculate average days to complete
    const completedSentencesDays = sentences
      .filter((s) => s.completed && s.createdAt && s.lastReviewed)
      .map((s) => {
        const createdAt = firebaseUtils.timestampToDate(s.createdAt);
        const lastReviewed = firebaseUtils.timestampToDate(s.lastReviewed);
        return (lastReviewed - createdAt) / (1000 * 60 * 60 * 24);
      });
    const avgDaysToComplete =
      completedSentencesDays.length > 0
        ? Math.round(
            completedSentencesDays.reduce((a, b) => a + b, 0) /
              completedSentencesDays.length
          )
        : 0;

    // Box distribution
    const boxDistribution = Array.from({ length: 7 }, (_, i) => ({
      box: i + 1,
      count: sentences.filter((s) => s.box === i + 1).length,
    }));

    // Weekly activity (last month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const weeklyActivity = sentences.flatMap((sentence) =>
      (sentence.reviewHistory || [])
        .filter(
          (review) => firebaseUtils.timestampToDate(review.date) >= oneMonthAgo
        )
        .map((review) => ({
          date: firebaseUtils
            .timestampToDate(review.date)
            .toISOString()
            .split("T")[0],
          remembered: review.remembered,
          forgotten: !review.remembered,
        }))
    );

    // Group weekly activity
    const groupedWeeklyActivity = weeklyActivity
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
      .sort((a, b) => a._id.localeCompare(b._id));

    // Upcoming reviews
    const now = new Date();
    const upcomingReviews = sentences
      .filter(
        (s) => !s.completed && firebaseUtils.timestampToDate(s.nextReview) > now
      )
      .reduce((acc, sentence) => {
        const nextReviewDate = firebaseUtils
          .timestampToDate(sentence.nextReview)
          .toISOString()
          .split("T")[0];

        const existing = acc.find((r) => r._id === nextReviewDate);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ _id: nextReviewDate, count: 1 });
        }
        return acc;
      }, [])
      .sort((a, b) => a._id.localeCompare(b._id))
      .slice(0, 7)
      .map((item) => {
        const today = new Date().toISOString().split("T")[0];
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

        return {
          date: item._id,
          label,
          count: item.count,
        };
      });

    res.json({
      totalSentences,
      completedSentences,
      inProgressSentences,
      totalReviews,
      successRate,
      avgDaysToComplete,
      boxDistribution,
      weeklyActivity: groupedWeeklyActivity,
      upcomingReviews,
    });
  } catch (error) {
    console.error("Get user stats error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
