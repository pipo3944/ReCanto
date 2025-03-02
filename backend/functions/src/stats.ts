import * as functionsV2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Ensure Firebase Admin is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Type guard for error handling
function isHttpsError(error: unknown): error is functionsV2.https.HttpsError {
  return error instanceof Error && 'code' in error;
}

// Get comprehensive user statistics
export const getUserStats = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Get total sentences
      const totalSentencesSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .count()
        .get();

      // Get completed sentences
      const completedSentencesSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .where('completed', '==', true)
        .count()
        .get();

      // Calculate in-progress sentences
      const inProgressSentences = totalSentencesSnapshot.data().count - completedSentencesSnapshot.data().count;

      // Get total reviews
      const sentencesSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .get();

      const totalReviews = sentencesSnapshot.docs.reduce((total, doc) => {
        const sentenceData = doc.data();
        return total + (sentenceData.reviewHistory?.length || 0);
      }, 0);

      // Calculate success rate
      let rememberedReviews = 0;
      sentencesSnapshot.docs.forEach((doc) => {
        const sentenceData = doc.data();
        rememberedReviews += (sentenceData.reviewHistory || [])
          .filter((review: any) => review.remembered).length;
      });

      const successRate = totalReviews > 0 
        ? Math.round((rememberedReviews / totalReviews) * 100) 
        : 0;

      // Calculate average days to complete
      const completedSentences = sentencesSnapshot.docs.filter((doc) => {
        const sentenceData = doc.data();
        return sentenceData.completed && 
               sentenceData.createdAt && 
               sentenceData.lastReviewed;
      });

      const avgDaysToComplete = completedSentences.length > 0
        ? Math.round(
            completedSentences.reduce((total, doc) => {
              const sentenceData = doc.data();
              const createdAt = sentenceData.createdAt.toDate();
              const lastReviewed = sentenceData.lastReviewed.toDate();
              return total + ((lastReviewed - createdAt) / (1000 * 60 * 60 * 24));
            }, 0) / completedSentences.length
          )
        : 0;

      // Box distribution
      const boxDistribution = Array.from({ length: 7 }, (_, i) => ({
        box: i + 1,
        count: sentencesSnapshot.docs.filter((doc) => {
          const sentenceData = doc.data();
          return sentenceData.box === i + 1;
        }).length
      }));

      // Weekly activity (last month)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const weeklyActivity: Record<string, { remembered: number; forgotten: number }> = {};

      sentencesSnapshot.docs.forEach((doc) => {
        const sentenceData = doc.data();
        (sentenceData.reviewHistory || [])
          .filter((review: any) => review.date.toDate() >= oneMonthAgo)
          .forEach((review: any) => {
            const date = review.date.toDate().toISOString().split('T')[0];
            
            if (!weeklyActivity[date]) {
              weeklyActivity[date] = { remembered: 0, forgotten: 0 };
            }
            
            if (review.remembered) {
              weeklyActivity[date].remembered++;
            } else {
              weeklyActivity[date].forgotten++;
            }
          });
      });

      // Convert weekly activity to sorted array
      const formattedWeeklyActivity = Object.entries(weeklyActivity)
        .map(([_id, data]) => ({
          _id,
          remembered: data.remembered,
          forgotten: data.forgotten
        }))
        .sort((a, b) => a._id.localeCompare(b._id))
        .slice(-30); // Last 30 days

      // Upcoming reviews
      const now = new Date();
      const upcomingReviewsSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .where('completed', '==', false)
        .get();

      const upcomingReviews: Record<string, number> = {};
      upcomingReviewsSnapshot.docs.forEach((doc) => {
        const sentenceData = doc.data();
        const nextReviewDate = sentenceData.nextReview.toDate().toISOString().split('T')[0];
        
        if (!upcomingReviews[nextReviewDate]) {
          upcomingReviews[nextReviewDate] = 0;
        }
        upcomingReviews[nextReviewDate]++;
      });

      // Format upcoming reviews
      const formattedUpcomingReviews = Object.entries(upcomingReviews)
        .map(([date, count]) => {
          let label = "Future";
          const today = new Date().toISOString().split('T')[0];
          
          if (date === today) {
            label = "Today";
          } else {
            const reviewDate = new Date(date);
            const diffTime = reviewDate.getTime() - new Date(today).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              label = "Tomorrow";
            } else if (diffDays > 1 && diffDays <= 7) {
              label = `In ${diffDays} days`;
            }
          }

          return {
            date,
            label,
            count
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 7); // Next 7 days

      return {
        totalSentences: totalSentencesSnapshot.data().count,
        completedSentences: completedSentencesSnapshot.data().count,
        inProgressSentences,
        totalReviews,
        successRate,
        avgDaysToComplete,
        boxDistribution,
        weeklyActivity: formattedWeeklyActivity,
        upcomingReviews: formattedUpcomingReviews
      };
    } catch (error) {
      logger.error('Get user stats error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve user statistics');
    }
  }
);
