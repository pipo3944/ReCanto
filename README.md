# ReCanto - Efficient English Learning Application

ReCanto is a web application designed to help users learn English vocabulary and phrases efficiently using a spaced repetition system based on the forgetting curve.

## Features

- **User Authentication**: Register, login, and manage your profile
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
- MongoDB for database
- JWT for authentication
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
│       ├── config/     # Configuration files
│       ├── controllers/# Route controllers
│       ├── middleware/ # Custom middleware
│       ├── models/     # Database models
│       └── routes/     # API routes
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/recanto.git
cd recanto
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ../frontend
npm install
```

4. Set up environment variables
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/recanto
     JWT_SECRET=your_jwt_secret_key_here
     NODE_ENV=development
     ```

5. Start the backend server
```
cd ../backend
npm run dev
```

6. Start the frontend development server
```
cd ../frontend
npm start
```

7. Open your browser and navigate to `http://localhost:3000`

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
