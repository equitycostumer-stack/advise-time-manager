// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Auth Routes
// ======================================================

const express = require("express");
console.log("====================================");
console.log("AUTH ROUTES CARGADAS");
console.log("====================================");
const router = express.Router();
const authController = require("../controllers/authController");
const verificarToken = require("../middleware/authMiddleware");

// ======================================================
// LOGIN
// ======================================================
router.post(
    "/login",
    authController.login
);

// ======================================================
// CAMBIAR CONTRASEÑA (usuario autenticado)
// ======================================================
router.put(
    "/cambiar-password",
    verificarToken,
    authController.cambiarPassword
);

module.exports = router;