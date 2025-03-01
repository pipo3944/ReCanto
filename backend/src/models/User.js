const { db, admin } = require("../config/firebase");
const bcrypt = require("bcryptjs");

class User {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.avatar = data.avatar || "";
    this.role = data.role || "user";
  }

  // Static method to create a new user
  static async create(userData) {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
    });

    // Create user document in Firestore
    const userRef = db.collection("users").doc(userRecord.uid);
    await userRef.set({
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || "",
      role: userData.role || "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      id: userRecord.uid,
      name: userData.name,
      email: userData.email,
    };
  }

  // Static method to find user by email
  static async findByEmail(email) {
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const userData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...userData,
    };
  }

  // Static method to find user by ID
  static async findById(id) {
    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  // Method to compare passwords
  static async comparePassword(email, candidatePassword) {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }

    try {
      // Verify password using Firebase Auth
      await admin.auth().getUserByEmail(email);
      return await bcrypt.compare(candidatePassword, user.password);
    } catch (error) {
      return false;
    }
  }

  // Method to update user profile
  static async updateProfile(userId, updateData) {
    const userRef = db.collection("users").doc(userId);

    // Update Firestore document
    await userRef.update({
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.avatar && { avatar: updateData.avatar }),
    });

    // If name is updated, also update Firebase Auth
    if (updateData.name) {
      await admin.auth().updateUser(userId, {
        displayName: updateData.name,
      });
    }

    // Fetch and return updated user
    const updatedDoc = await userRef.get();
    return {
      id: userId,
      ...updatedDoc.data(),
    };
  }
}

module.exports = User;
