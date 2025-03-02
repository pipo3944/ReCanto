# ReCanto Firebase Cloud Functions

## Overview
This project contains Firebase Cloud Functions for the ReCanto application, a spaced repetition learning platform for English language learning.

## Project Structure
- `src/`
  - `index.ts`: Main entry point, exports all cloud functions
  - `auth.ts`: Authentication-related functions
  - `sentences.ts`: Sentence management functions
  - `quiz.ts`: Quiz and review-related functions
  - `stats.ts`: User statistics and progress tracking functions

## Functions Categories

### Authentication Functions
- `register`: Create a new user account
- `login`: Authenticate user credentials
- `getCurrentUser`: Retrieve current user information

### Sentence Management Functions
- `getSentences`: Retrieve all sentences for a user
- `getSentence`: Get a specific sentence by ID
- `createSentence`: Add a new sentence to learn
- `updateSentence`: Modify an existing sentence
- `deleteSentence`: Remove a sentence
- `getDueSentences`: Get sentences ready for review

### Quiz Functions
- `getDueQuizItems`: Retrieve sentences due for review
- `updateReviewStatus`: Update a sentence's review status
- `getQuizSchedule`: Get upcoming review schedule
- `getQuizStats`: Retrieve detailed quiz statistics

### Statistics Functions
- `getUserStats`: Comprehensive user learning statistics

## Local Development

### Prerequisites
- Node.js 22+
- Firebase CLI
- Firebase project

### Setup
1. Install dependencies
```bash
npm install
```

2. Set up Firebase configuration
```bash
firebase login
firebase use [YOUR_PROJECT_ID]
```

3. Run local emulators
```bash
npm run serve
```

## Deployment
```bash
firebase deploy --only functions
```

## Environment Variables
Configure in `.env`:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_API_KEY`
- Other Firebase configuration details

## Error Handling
Functions use Firebase HttpsError for consistent error responses.

## Spaced Repetition Algorithm
Implements Leitner system with 7 boxes:
- Box 1: 1 day
- Box 2: 3 days
- Box 3: 7 days
- Box 4: 14 days
- Box 5: 30 days
- Box 6: 60 days
- Box 7: 90 days (completion)

## Security
- All functions require authentication
- User-specific data access
- Input validation with Zod
- Firestore security rules

## Logging
Uses Firebase Functions logger for structured logging

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push and create a pull request
