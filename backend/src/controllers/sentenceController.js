const { validationResult } = require("express-validator");
const Sentence = require("../models/Sentence");

// @desc    Get all sentences for a user
// @route   GET /api/sentences
// @access  Private
exports.getSentences = async (req, res) => {
  try {
    const sentences = await Sentence.find({ user: req.user.id }).sort({
      nextReview: 1,
    });
    res.json(sentences);
  } catch (error) {
    console.error("Get sentences error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single sentence
// @route   GET /api/sentences/:id
// @access  Private
exports.getSentence = async (req, res) => {
  try {
    const sentence = await Sentence.findById(req.params.id);

    // Check if sentence exists
    if (!sentence) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    // Check if sentence belongs to user
    if (sentence.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(sentence);
  } catch (error) {
    console.error("Get sentence error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Sentence not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new sentence
// @route   POST /api/sentences
// @access  Private
exports.createSentence = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sentence, definition, imageUrl, tags } = req.body;

  try {
    // Create new sentence
    const newSentence = new Sentence({
      user: req.user.id,
      sentence,
      definition,
      imageUrl: imageUrl || "",
      tags: tags || [],
    });

    // Save sentence to database
    const savedSentence = await newSentence.save();

    res.status(201).json(savedSentence);
  } catch (error) {
    console.error("Create sentence error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a sentence
// @route   PUT /api/sentences/:id
// @access  Private
exports.updateSentence = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sentence, definition, imageUrl, tags } = req.body;

  try {
    let sentenceObj = await Sentence.findById(req.params.id);

    // Check if sentence exists
    if (!sentenceObj) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    // Check if sentence belongs to user
    if (sentenceObj.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update sentence fields
    sentenceObj.sentence = sentence || sentenceObj.sentence;
    sentenceObj.definition = definition || sentenceObj.definition;
    sentenceObj.imageUrl =
      imageUrl !== undefined ? imageUrl : sentenceObj.imageUrl;
    sentenceObj.tags = tags || sentenceObj.tags;

    // Save updated sentence
    const updatedSentence = await sentenceObj.save();

    res.json(updatedSentence);
  } catch (error) {
    console.error("Update sentence error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Sentence not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a sentence
// @route   DELETE /api/sentences/:id
// @access  Private
exports.deleteSentence = async (req, res) => {
  try {
    const sentence = await Sentence.findById(req.params.id);

    // Check if sentence exists
    if (!sentence) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    // Check if sentence belongs to user
    if (sentence.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Delete sentence
    await sentence.remove();

    res.json({ message: "Sentence removed" });
  } catch (error) {
    console.error("Delete sentence error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Sentence not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get sentences due for review
// @route   GET /api/sentences/due
// @access  Private
exports.getDueSentences = async (req, res) => {
  try {
    const now = new Date();
    const sentences = await Sentence.find({
      user: req.user.id,
      nextReview: { $lte: now },
      completed: false,
    }).sort({ nextReview: 1 });

    res.json(sentences);
  } catch (error) {
    console.error("Get due sentences error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
