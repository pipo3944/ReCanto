import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'local-project',
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'local-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'localhost',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators if in development mode
if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  console.log('Connecting to Firebase Emulators');
  
  // Connect Auth Emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  
  // Connect Firestore Emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// Firebase utility functions
const firebaseUtils = {
  // Convert Firestore timestamp to JavaScript Date
  timestampToDate: (timestamp: any) => {
    return timestamp ? timestamp.toDate() : null;
  },

  // Optional: Add more utility methods as needed
};

export { 
  app, 
  auth, 
  db, 
  firebaseUtils 
};
