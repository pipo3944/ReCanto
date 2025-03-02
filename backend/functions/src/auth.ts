import * as functionsV2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import * as bcrypt from 'bcryptjs';
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
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Helper function to generate JWT
const generateToken = async (uid: string): Promise<string> => {
  return admin.auth().createCustomToken(uid);
};

// Register user
export const register = functionsV2.https.onCall(
  async (request) => {
    try {
      // Validate input
      const { name, email, password } = RegisterSchema.parse(request.data);

      // Check if user already exists
      const existingUser = await admin.auth().getUserByEmail(email).catch(() => null);
      if (existingUser) {
        throw new functionsV2.https.HttpsError('already-exists', 'User already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name
      });

      // Store additional user info in Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        name,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'user'
      });

      // Generate custom token
      const token = await generateToken(userRecord.uid);

      return {
        token,
        user: {
          id: userRecord.uid,
          name,
          email
        }
      };
    } catch (error) {
      logger.error('Registration error', error);
      
      if (isZodError(error)) {
        throw new functionsV2.https.HttpsError('invalid-argument', error.errors[0].message);
      }

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Registration failed');
    }
  }
);

// Login user
export const login = functionsV2.https.onCall(
  async (request) => {
    try {
      // Validate input
      const { email, password } = LoginSchema.parse(request.data);

      // Find user by email
      const userRecord = await admin.auth().getUserByEmail(email);

      // Get user document from Firestore
      const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();

      // Verify password (Note: Firebase Auth doesn't support custom password verification)
      // You might need a separate strategy for password verification
      const isMatch = await bcrypt.compare(password, userRecord.passwordHash || '');
      
      if (!isMatch) {
        throw new functionsV2.https.HttpsError('unauthenticated', 'Invalid credentials');
      }

      // Generate custom token
      const token = await generateToken(userRecord.uid);

      return {
        token,
        user: {
          id: userRecord.uid,
          name: userData?.name,
          email: userRecord.email
        }
      };
    } catch (error) {
      logger.error('Login error', error);
      
      if (isZodError(error)) {
        throw new functionsV2.https.HttpsError('invalid-argument', error.errors[0].message);
      }

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('unauthenticated', 'Login failed');
    }
  }
);

// Get current user
export const getCurrentUser = functionsV2.https.onCall(
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new functionsV2.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const userRecord = await admin.auth().getUser(request.auth.uid);
      const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
      const userData = userDoc.data();

      return {
        id: userRecord.uid,
        name: userData?.name,
        email: userRecord.email
      };
    } catch (error) {
      logger.error('Get current user error', error);

      if (isHttpsError(error)) {
        throw error;
      }

      throw new functionsV2.https.HttpsError('internal', 'Failed to retrieve user');
    }
  }
);
