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

function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

// Input validation schemas
const SentenceSchema = z.object({
  sentence: z.string().min(1, "Sentence is required"),
  definition: z.string().min(1, "Definition is required"),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Get all sentences for a user
export const getSentences = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const sentencesSnapshot = await admin.firestore()
        .collection('sentences')
        .where('user', '==', request.auth.uid)
        .orderBy('nextReview')
        .get();

      const sentences = sentencesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return sentences;
    } catch (error) {
      logger.error('Get sentences error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve sentences');
    }
  }
);

// Get a single sentence
export const getSentence = functionsV2.https.onCall(
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
      const sentenceDoc = await admin.firestore()
        .collection('sentences')
        .doc(sentenceId)
        .get();

      if (!sentenceDoc.exists) {
        throw new functionsV2.https.HttpsError('not-found', 'Sentence not found');
      }

      const sentenceData = sentenceDoc.data();
      
      // Verify the sentence belongs to the user
      if (sentenceData?.user !== request.auth.uid) {
        throw new functionsV2.https.HttpsError('permission-denied', 'Not authorized to access this sentence');
      }

      return {
        id: sentenceDoc.id,
        ...sentenceData
      };
    } catch (error) {
      logger.error('Get sentence error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve sentence');
    }
  }
);

// Create a new sentence
export const createSentence = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Validate input
      const { sentence, definition, imageUrl, tags } = SentenceSchema.parse(request.data);

      // Prepare sentence data
      const sentenceData = {
        user: request.auth.uid,
        sentence,
        definition,
        imageUrl: imageUrl || '',
        tags: tags || [],
        box: 1,
        completed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        nextReview: admin.firestore.FieldValue.serverTimestamp(),
        reviewHistory: []
      };

      // Save sentence to Firestore
      const sentenceRef = await admin.firestore().collection('sentences').add(sentenceData);

      return {
        id: sentenceRef.id,
        ...sentenceData
      };
    } catch (error) {
      logger.error('Create sentence error', error);

      if (isZodError(error)) {
        throw new functionsV2.https.HttpsError('invalid-argument', error.errors[0].message);
      }

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to create sentence');
    }
  }
);

// Update a sentence
export const updateSentence = functionsV2.https.onCall(
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
      const updateData = SentenceSchema.partial().parse(request.data);

      // Get reference to the sentence
      const sentenceRef = admin.firestore().collection('sentences').doc(sentenceId);
      const sentenceDoc = await sentenceRef.get();

      if (!sentenceDoc.exists) {
        throw new functionsV2.https.HttpsError('not-found', 'Sentence not found');
      }

      const existingData = sentenceDoc.data();
      
      // Verify the sentence belongs to the user
      if (existingData?.user !== request.auth.uid) {
        throw new functionsV2.https.HttpsError('permission-denied', 'Not authorized to update this sentence');
      }

      // Prepare update data
      const updatedSentenceData = {
        ...existingData,
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update sentence
      await sentenceRef.update(updatedSentenceData);

      return {
        id: sentenceId,
        ...updatedSentenceData
      };
    } catch (error) {
      logger.error('Update sentence error', error);

      if (isZodError(error)) {
        throw new functionsV2.https.HttpsError('invalid-argument', error.errors[0].message);
      }

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to update sentence');
    }
  }
);

// Delete a sentence
export const deleteSentence = functionsV2.https.onCall(
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
      // Get reference to the sentence
      const sentenceRef = admin.firestore().collection('sentences').doc(sentenceId);
      const sentenceDoc = await sentenceRef.get();

      if (!sentenceDoc.exists) {
        throw new functionsV2.https.HttpsError('not-found', 'Sentence not found');
      }

      const existingData = sentenceDoc.data();
      
      // Verify the sentence belongs to the user
      if (existingData?.user !== request.auth.uid) {
        throw new functionsV2.https.HttpsError('permission-denied', 'Not authorized to delete this sentence');
      }

      // Delete sentence
      await sentenceRef.delete();

      return { 
        id: sentenceId,
        message: 'Sentence successfully deleted' 
      };
    } catch (error) {
      logger.error('Delete sentence error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to delete sentence');
    }
  }
);

// Get sentences due for review
export const getDueSentences = functionsV2.https.onCall(
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
      logger.error('Get due sentences error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve due sentences');
    }
  }
);
