const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// Check if we're running in emulator mode
const useEmulator = process.env.USE_FIREBASE_EMULATOR === "true";

// Firebase configuration object
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase Admin SDK
let adminConfig;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use service account from environment variable (for production)
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminConfig = {
      credential: admin.credential.cert(serviceAccount),
      ...firebaseConfig,
    };
  } catch (error) {
    console.error("Error parsing Firebase service account:", error);
    process.exit(1);
  }
} else {
  // Use default credentials for local development
  adminConfig = {
    credential: admin.credential.applicationDefault(),
    ...firebaseConfig,
  };
}

// Initialize the app
admin.initializeApp(adminConfig);

// Get Firestore and Auth instances
const db = admin.firestore();
const auth = admin.auth();

// Connect to emulators if in development mode
if (useEmulator) {
  console.log("Using Firebase Emulators");

  // Firestore emulator
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
  db.settings({
    host: firestoreHost,
    ssl: false,
  });

  // Auth emulator
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
}

// Optional: Add some utility methods
const firebaseUtils = {
  // Convert Firestore timestamp to JavaScript Date
  timestampToDate: (timestamp) => {
    return timestamp ? timestamp.toDate() : null;
  },

  // Convert JavaScript Date to Firestore timestamp
  dateToTimestamp: (date) => {
    return admin.firestore.Timestamp.fromDate(date);
  },

  // Create a server timestamp field value
  serverTimestamp: () => {
    return admin.firestore.FieldValue.serverTimestamp();
  },

  // Increment a numeric field
  increment: (value) => {
    return admin.firestore.FieldValue.increment(value);
  },

  // Array operations
  arrayUnion: (...elements) => {
    return admin.firestore.FieldValue.arrayUnion(...elements);
  },

  arrayRemove: (...elements) => {
    return admin.firestore.FieldValue.arrayRemove(...elements);
  },
};

module.exports = {
  admin,
  db,
  auth,
  useEmulator,
  firebaseConfig,
  firebaseUtils,
};
