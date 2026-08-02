// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Auth Routes
// ======================================================

const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

// ======================================================
// LOGIN
// ======================================================

router.post(
    "/login",
    authController.login
);

module.exports = router;