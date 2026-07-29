const express = require("express");

const router = express.Router();

const controller = require("../controllers/asesoresController");

// =======================================
// OBTENER ASESORES
// =======================================

router.get(
    "/",
    controller.obtenerAsesores
);

// =======================================
// OBTENER ESTADO ACTUAL
// =======================================

router.get(
    "/:id/estado",
    controller.obtenerEstado
);

// =======================================
// REGISTRAR MOVIMIENTO
// =======================================

router.post(
    "/movimiento",
    controller.registrarMovimiento
);

module.exports = router;