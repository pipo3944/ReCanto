import * as functionsV2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { z } from 'zod';

// Ensure Firebase Admin is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Type guard for error handling
function isHttpsError(error: unknown): error is functionsV2.https.HttpsError {
  return error instanceof Error && 'code' in error;
}

// Input validation schemas
const ReviewStatusSchema = z.object({
  remembered: z.boolean()
});

// Helper function to calculate next review date
function calculateNextReviewDate(box: number): Date {
  const now = new Date();
  let daysToAdd = 0;

  switch (box) {
    case 1: daysToAdd = 1; break;
    case 2: daysToAdd = 3; break;
    case 3: daysToAdd = 7; break;
    case 4: daysToAdd = 14; break;
    case 5: daysToAdd = 30; break;
    case 6: daysToAdd = 60; break;
    case 7: daysToAdd = 90; break;
    default: daysToAdd = 1;
  }

  return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

// Get sentences due for quiz
export const getDueQuizItems = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const now = new Date();
      const sentencesSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .where('nextReview', '<=', now)
        .where('completed', '==', false)
        .orderBy('nextReview')
        .get();

      const sentences = sentencesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return sentences;
    } catch (error) {
      logger.error('Get due quiz items error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve due quiz items');
    }
  }
);

// Update sentence review status
export const updateReviewStatus = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const sentenceId = request.data?.id;
    if (!sentenceId) {
      throw new functionsV2.https.HttpsError('invalid-argument', 'Sentence ID is required');
    }

    try {
      // Validate input
      const { remembered } = ReviewStatusSchema.parse(request.data);

      // Get reference to the sentence
      const sentenceRef = admin.firestore().collection('sentences').doc(sentenceId);
      const sentenceDoc = await sentenceRef.get();

      if (!sentenceDoc.exists) {
        throw new functionsV2.https.HttpsError('not-found', 'Sentence not found');
      }

      const sentenceData = sentenceDoc.data()!;
      
      // Verify the sentence belongs to the user
      if (sentenceData.user !== request.auth.uid) {
        throw new functionsV2.https.HttpsError('permission-denied', 'Not authorized to update this sentence');
      }

      // Calculate new box and completion status
      let newBox = sentenceData.box;
      let completed = sentenceData.completed;

      if (remembered) {
        newBox = Math.min(newBox + 1, 7);
        if (newBox === 7) {
          completed = true;
        }
      } else {
        newBox = 1;
        completed = false;
      }

      // Prepare update data
      const updateData = {
        box: newBox,
        completed,
        lastReviewed: admin.firestore.FieldValue.serverTimestamp(),
        nextReview: calculateNextReviewDate(newBox),
        reviewHistory: admin.firestore.FieldValue.arrayUnion({
          date: admin.firestore.FieldValue.serverTimestamp(),
          remembered,
          previousBox: sentenceData.box,
          newBox
        })
      };

      // Update sentence
      await sentenceRef.update(updateData);

      return {
        id: sentenceId,
        ...updateData
      };
    } catch (error) {
      logger.error('Update review status error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to update review status');
    }
  }
);

// Get quiz schedule
export const getQuizSchedule = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get sentences due in the next 7 days
      const sentencesSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .where('nextReview', '>=', now)
        .where('nextReview', '<=', oneWeekLater)
        .where('completed', '==', false)
        .orderBy('nextReview')
        .get();

      // Group sentences by day
      const schedule: Record<string, any[]> = {};
      sentencesSnapshot.docs.forEach((doc) => {
        const sentenceData = doc.data();
        const date = sentenceData.nextReview.toDate().toISOString().split('T')[0];
        
        if (!schedule[date]) {
          schedule[date] = [];
        }
        
        schedule[date].push({
          id: doc.id,
          sentence: sentenceData.sentence,
          box: sentenceData.box
        });
      });

      // Get count of sentences due today
      const dueTodaySnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .where('nextReview', '<=', now)
        .where('completed', '==', false)
        .count()
        .get();

      return {
        dueToday: dueTodaySnapshot.data().count,
        schedule
      };
    } catch (error) {
      logger.error('Get quiz schedule error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve quiz schedule');
    }
  }
);

// Get quiz statistics
export const getQuizStats = functionsV2.https.onCall(
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

      // Get box distribution
      const boxDistributionSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .get();

      const boxDistribution = Array.from({ length: 7 }, (_, i) => ({
        box: i + 1,
        count: 0
      }));

      boxDistributionSnapshot.docs.forEach((doc) => {
        const sentenceData = doc.data();
        const boxIndex = sentenceData.box - 1;
        if (boxIndex >= 0 && boxIndex < 7) {
          boxDistribution[boxIndex].count++;
        }
      });

      // Get review history
      const reviewHistorySnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .get();

      const reviewHistory: Record<string, { remembered: number; forgotten: number }> = {};

      reviewHistorySnapshot.docs.forEach((doc) => {
        const sentenceData = doc.data();
        (sentenceData.reviewHistory || []).forEach((review: any) => {
          const date = review.date.toDate().toISOString().split('T')[0];
          
          if (!reviewHistory[date]) {
            reviewHistory[date] = { remembered: 0, forgotten: 0 };
          }
          
          if (review.remembered) {
            reviewHistory[date].remembered++;
          } else {
            reviewHistory[date].forgotten++;
          }
        });
      });

      // Convert review history to array and sort
      const formattedReviewHistory = Object.entries(reviewHistory)
        .map(([_id, data]) => ({
          _id,
          remembered: data.remembered,
          forgotten: data.forgotten
        }))
        .sort((a, b) => a._id.localeCompare(b._id))
        .slice(-30); // Last 30 days

      return {
        totalSentences: totalSentencesSnapshot.data().count,
        completedSentences: completedSentencesSnapshot.data().count,
        boxDistribution,
        reviewHistory: formattedReviewHistory
      };
    } catch (error) {
      logger.error('Get quiz stats error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve quiz statistics');
    }
  }
);
