const { db, admin } = require("../config/firebase");

class Sentence {
  constructor(data) {
    this.user = data.user;
    this.sentence = data.sentence;
    this.definition = data.definition;
    this.imageUrl = data.imageUrl || "";
    this.box = data.box || 1;
    this.lastReviewed = data.lastReviewed || null;
    this.nextReview = data.nextReview || new Date();
    this.completed = data.completed || false;
    this.tags = data.tags || [];
    this.reviewHistory = data.reviewHistory || [];
  }

  // Static method to get all sentences for a user
  static async findByUser(userId, options = {}) {
    let query = db.collection("sentences").where("user", "==", userId);

    // Optional sorting
    if (options.sortBy) {
      query = query.orderBy(options.sortBy, options.sortOrder || "asc");
    }

    // Optional filtering
    if (options.box) {
      query = query.where("box", "==", options.box);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Static method to get a single sentence by ID
  static async findById(sentenceId, userId) {
    const doc = await db.collection("sentences").doc(sentenceId).get();

    if (!doc.exists) {
      return null;
    }

    const sentenceData = doc.data();

    // Verify the sentence belongs to the user
    if (sentenceData.user !== userId) {
      throw new Error("Not authorized");
    }

    return {
      id: doc.id,
      ...sentenceData,
    };
  }

  // Static method to create a new sentence
  static async create(sentenceData) {
    const sentenceRef = db.collection("sentences").doc();

    const newSentence = {
      ...sentenceData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewHistory: [],
      box: 1,
      completed: false,
      nextReview: new Date(),
    };

    await sentenceRef.set(newSentence);

    return {
      id: sentenceRef.id,
      ...newSentence,
    };
  }

  // Static method to update a sentence
  static async update(sentenceId, userId, updateData) {
    const sentenceRef = db.collection("sentences").doc(sentenceId);
    const doc = await sentenceRef.get();

    if (!doc.exists) {
      throw new Error("Sentence not found");
    }

    const existingData = doc.data();
    if (existingData.user !== userId) {
      throw new Error("Not authorized");
    }

    const updatedSentence = {
      ...existingData,
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await sentenceRef.update(updatedSentence);

    return {
      id: sentenceId,
      ...updatedSentence,
    };
  }

  // Static method to delete a sentence
  static async delete(sentenceId, userId) {
    const sentenceRef = db.collection("sentences").doc(sentenceId);
    const doc = await sentenceRef.get();

    if (!doc.exists) {
      throw new Error("Sentence not found");
    }

    const existingData = doc.data();
    if (existingData.user !== userId) {
      throw new Error("Not authorized");
    }

    await sentenceRef.delete();
    return { id: sentenceId };
  }

  // Method to update review status
  static async updateReviewStatus(sentenceId, userId, remembered) {
    const sentenceRef = db.collection("sentences").doc(sentenceId);
    const doc = await sentenceRef.get();

    if (!doc.exists) {
      throw new Error("Sentence not found");
    }

    const sentenceData = doc.data();
    if (sentenceData.user !== userId) {
      throw new Error("Not authorized");
    }

    // Calculate new box and next review date based on Leitner system
    let newBox = sentenceData.box;
    let completed = sentenceData.completed;

    if (remembered) {
      newBox = Math.min(newBox + 1, 7);
      if (newBox === 7) {
        completed = true;
      }
    } else {
      newBox = 1;
      completed = false;
    }

    // Calculate next review date
    const now = new Date();
    let daysToAdd = 0;
    switch (newBox) {
      case 1:
        daysToAdd = 1;
        break;
      case 2:
        daysToAdd = 3;
        break;
      case 3:
        daysToAdd = 7;
        break;
      case 4:
        daysToAdd = 14;
        break;
      case 5:
        daysToAdd = 30;
        break;
      case 6:
        daysToAdd = 60;
        break;
      case 7:
        daysToAdd = 90;
        break;
      default:
        daysToAdd = 1;
    }

    const nextReview = new Date(
      now.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );

    // Prepare update
    const update = {
      box: newBox,
      completed,
      lastReviewed: now,
      nextReview,
      reviewHistory: admin.firestore.FieldValue.arrayUnion({
        date: now,
        remembered,
        previousBox: sentenceData.box,
        newBox,
      }),
    };

    await sentenceRef.update(update);

    return {
      id: sentenceId,
      ...sentenceData,
      ...update,
    };
  }

  // Static method to get sentences due for review
  static async getDueSentences(userId) {
    const now = new Date();
    const query = db
      .collection("sentences")
      .where("user", "==", userId)
      .where("nextReview", "<=", now)
      .where("completed", "==", false)
      .orderBy("nextReview", "asc");

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}

module.exports = Sentence;
