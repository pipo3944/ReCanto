const express = require("express");
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  authController.login
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, authController.getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [auth, check("name", "Name is required").not().isEmpty()],
  authController.updateProfile
);

module.exports = router;
