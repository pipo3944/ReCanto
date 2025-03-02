import * as functionsV2 from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';

// Import function modules
import { register, login, getCurrentUser } from './auth';
import { 
  getSentences, 
  getSentence, 
  createSentence, 
  updateSentence, 
  deleteSentence, 
  getDueSentences 
} from './sentences';
import {
  getDueQuizItems,
  updateReviewStatus,
  getQuizSchedule,
  getQuizStats
} from './quiz';
import {
  getUserStats
} from './stats';

// Export auth functions
export { 
  register, 
  login, 
  getCurrentUser 
};

// Export sentences functions
export {
  getSentences,
  getSentence,
  createSentence,
  updateSentence,
  deleteSentence,
  getDueSentences
};

// Export quiz functions
export {
  getDueQuizItems,
  updateReviewStatus,
  getQuizSchedule,
  getQuizStats
};

// Export stats functions
export {
  getUserStats
};

// Optional: Add a simple health check function
export const healthCheck = functionsV2.https.onRequest((req, res) => {
  logger.info('Health check performed', { structuredData: true });
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});
