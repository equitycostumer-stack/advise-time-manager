const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verificarToken = require("../middleware/authMiddleware");

router.post("/login", authController.login);
router.post("/refresh", verificarToken, authController.renovarToken);
router.put("/cambiar-password", verificarToken, authController.cambiarPassword);

module.exports = router;
