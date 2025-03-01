const mongoose = require("mongoose");

const SentenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentence: {
      type: String,
      required: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    box: {
      type: Number,
      default: 1,
      min: 1,
      max: 7,
    },
    lastReviewed: {
      type: Date,
      default: null,
    },
    nextReview: {
      type: Date,
      default: Date.now,
    },
    reviewHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        remembered: {
          type: Boolean,
          required: true,
        },
        previousBox: {
          type: Number,
          required: true,
        },
        newBox: {
          type: Number,
          required: true,
        },
      },
    ],
    completed: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to update box and next review date
SentenceSchema.methods.updateReviewStatus = function (remembered) {
  const previousBox = this.box;

  // Update box based on whether the user remembered the sentence
  if (remembered) {
    // Move up one box if remembered (max box is 7)
    this.box = Math.min(this.box + 1, 7);

    // If reached box 7, mark as completed
    if (this.box === 7) {
      this.completed = true;
    }
  } else {
    // Reset to box 1 if not remembered
    this.box = 1;
    this.completed = false;
  }

  // Calculate next review date based on the Leitner system
  const now = new Date();
  let daysToAdd = 0;

  switch (this.box) {
    case 1:
      daysToAdd = 1; // 1 day
      break;
    case 2:
      daysToAdd = 3; // 3 days
      break;
    case 3:
      daysToAdd = 7; // 7 days
      break;
    case 4:
      daysToAdd = 14; // 14 days
      break;
    case 5:
      daysToAdd = 30; // 30 days
      break;
    case 6:
      daysToAdd = 60; // 60 days
      break;
    case 7:
      daysToAdd = 90; // 90 days (for completed items)
      break;
    default:
      daysToAdd = 1;
  }

  // Set next review date
  this.nextReview = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  // Update last reviewed date
  this.lastReviewed = now;

  // Add to review history
  this.reviewHistory.push({
    date: now,
    remembered: remembered,
    previousBox: previousBox,
    newBox: this.box,
  });

  return this;
};

module.exports = mongoose.model("Sentence", SentenceSchema);
