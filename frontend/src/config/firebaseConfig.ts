import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator as _connectFirestoreEmulator
} from 'firebase/firestore';
import { isUsingEmulator } from '../utils/env';

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

// Enhanced emulator connection function
function setupFirebaseEmulators() {
  if (!isUsingEmulator) return false;

  try {
    console.log('🔧 Setting up Firebase Emulators');
    
    // Connect Auth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    
    // Connect Firestore Emulator with additional logging
    try {
      _connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Successfully connected to Firestore Emulator');
      return true;
    } catch (firestoreErr) {
      console.error('❌ Failed to connect to Firestore Emulator:', firestoreErr);
      return false;
    }
  } catch (err) {
    console.error('❌ Error setting up Firebase Emulators:', err);
    return false;
  }
}

// Attempt to set up emulators immediately
const isEmulatorConnected = setupFirebaseEmulators();

// Firebase utility functions
const firebaseUtils = {
  // Convert Firestore timestamp to JavaScript Date
  timestampToDate: (timestamp: any) => {
    return timestamp ? timestamp.toDate() : null;
  },

  // Check if emulator is connected
  isEmulatorConnected: () => isEmulatorConnected,

  // Retry emulator connection
  retryEmulatorConnection: setupFirebaseEmulators
};

export { 
  app, 
  auth, 
  db, 
  firebaseUtils,
  isEmulatorConnected 
};
