const express = require("express");

const router = express.Router();

const controller = require("../controllers/asesoresController");

const verificarToken = require("../middleware/authMiddleware");

router.use(verificarToken);

// =======================================
// OBTENER ASESORES ACTIVOS
// =======================================

router.get(
    "/",
    controller.obtenerAsesores
);

router.put("/:id/nombre", controller.actualizarNombre);

module.exports = router;
