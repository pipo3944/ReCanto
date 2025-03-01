const { validationResult } = require("express-validator");
const Sentence = require("../models/Sentence");

// @desc    Get all sentences for a user
// @route   GET /api/sentences
// @access  Private
exports.getSentences = async (req, res) => {
  try {
    const sentences = await Sentence.findByUser(req.user.id, {
      sortBy: "nextReview",
      sortOrder: "asc",
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
    const sentence = await Sentence.findById(req.params.id, req.user.id);
    res.json(sentence);
  } catch (error) {
    console.error("Get sentence error:", error.message);
    if (error.message === "Not authorized") {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (error.message === "Sentence not found") {
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
    const newSentence = await Sentence.create({
      user: req.user.id,
      sentence,
      definition,
      imageUrl: imageUrl || "",
      tags: tags || [],
    });

    res.status(201).json(newSentence);
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
    // Update sentence
    const updatedSentence = await Sentence.update(req.params.id, req.user.id, {
      ...(sentence && { sentence }),
      ...(definition && { definition }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(tags && { tags }),
    });

    res.json(updatedSentence);
  } catch (error) {
    console.error("Update sentence error:", error.message);
    if (error.message === "Not authorized") {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (error.message === "Sentence not found") {
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
    // Delete sentence
    await Sentence.delete(req.params.id, req.user.id);

    res.json({ message: "Sentence removed" });
  } catch (error) {
    console.error("Delete sentence error:", error.message);
    if (error.message === "Not authorized") {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (error.message === "Sentence not found") {
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
    const sentences = await Sentence.getDueSentences(req.user.id);
    res.json(sentences);
  } catch (error) {
    console.error("Get due sentences error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
