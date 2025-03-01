# ReCanto - Efficient English Learning Application

ReCanto is a web application designed to help users learn English vocabulary and phrases efficiently using a spaced repetition system based on the forgetting curve.

## Features

- **User Authentication**: Register, login, and manage your profile using Firebase Authentication
- **Sentence Management**: Add, edit, and delete English sentences or words you want to learn
- **Spaced Repetition System**: Based on the Leitner method with 7 boxes
- **Visual Learning**: Associate images with sentences to enhance memory
- **English Definitions**: Learn with English definitions rather than translations
- **Progress Tracking**: Visualize your learning progress with detailed statistics
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- React.js with TypeScript
- React Router for navigation
- CSS for styling

### Backend
- Node.js with Express
- Firebase Authentication
- Firestore for database
- Firebase Admin SDK
- RESTful API architecture

## Project Structure

```
ReCanto/
├── frontend/           # React frontend application
│   ├── public/         # Static files
│   └── src/            # Source code
│       ├── components/ # Reusable components
│       └── pages/      # Page components
├── backend/            # Node.js backend application
│   ├── src/
│       ├── config/     # Firebase configuration
│       ├── controllers/# Route controllers
│       ├── middleware/ # Custom middleware
│       ├── models/     # Data models
│       └── routes/     # API routes
└── README.md           # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- Firebase Account
- Firebase CLI
- Firebase Emulators

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Firebase Emulators

3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/recanto.git
cd recanto
```

2. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

3. Login to Firebase
```bash
firebase login
```

4. Install backend dependencies
```bash
cd backend
npm install
```

5. Install frontend dependencies
```bash
cd ../frontend
npm install
```

6. Configure environment variables
   - In `backend/.env`, replace placeholders with your Firebase project details
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-auth-domain
   # ... other Firebase config values
   ```

## Running the Application

### Local Development with Firebase Emulators

1. Start Firebase Emulators
```bash
cd backend
npm run emulators
```

2. In another terminal, start the backend and frontend
```bash
npm run dev:emulators
```

### Production Deployment

1. Build frontend
```bash
cd frontend
npm run build
```

2. Deploy backend to your preferred hosting service (Firebase Functions, Heroku, etc.)

## Spaced Repetition System

ReCanto uses the Leitner system with 7 boxes:

1. Box 1: Review after 1 day
2. Box 2: Review after 3 days
3. Box 3: Review after 7 days
4. Box 4: Review after 14 days
5. Box 5: Review after 30 days
6. Box 6: Review after 60 days
7. Box 7: Completed (mastered)

When you remember a sentence, it moves up one box. When you forget, it goes back to Box 1.

## Future Enhancements

- Mobile app versions (iOS and Android)
- Integration with external dictionary APIs
- Social features for collaborative learning
- Gamification elements
- Audio pronunciation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
