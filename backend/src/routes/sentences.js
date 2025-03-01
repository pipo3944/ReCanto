const express = require("express");
const { check } = require("express-validator");
const sentenceController = require("../controllers/sentenceController");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/sentences
// @desc    Get all sentences for a user
// @access  Private
router.get("/", sentenceController.getSentences);

// @route   GET /api/sentences/due
// @desc    Get sentences due for review
// @access  Private
router.get("/due", sentenceController.getDueSentences);

// @route   GET /api/sentences/:id
// @desc    Get a single sentence
// @access  Private
router.get("/:id", sentenceController.getSentence);

// @route   POST /api/sentences
// @desc    Create a new sentence
// @access  Private
router.post(
  "/",
  [
    check("sentence", "Sentence is required").not().isEmpty(),
    check("definition", "Definition is required").not().isEmpty(),
  ],
  sentenceController.createSentence
);

// @route   PUT /api/sentences/:id
// @desc    Update a sentence
// @access  Private
router.put(
  "/:id",
  [
    check("sentence", "Sentence is required").not().isEmpty(),
    check("definition", "Definition is required").not().isEmpty(),
  ],
  sentenceController.updateSentence
);

// @route   DELETE /api/sentences/:id
// @desc    Delete a sentence
// @access  Private
router.delete("/:id", sentenceController.deleteSentence);

module.exports = router;
