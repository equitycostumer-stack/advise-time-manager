const express = require("express");
const router = express.Router();

const movimientosController = require("../controllers/movimientosController");

// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

router.post(
    "/",
    movimientosController.registrarMovimiento
);

// ======================================================
// ESTADO ACTUAL
// ======================================================

router.get(
    "/estado/:asesorId",
    movimientosController.obtenerEstadoActual
);

// ======================================================
// HISTORIAL
// ======================================================

router.get(
    "/historial/:asesorId",
    movimientosController.obtenerHistorial
);

// ======================================================
// RESUMEN DE JORNADA
// ======================================================

router.get(
    "/resumen-jornada/:asesorId",
    movimientosController.obtenerResumenJornada
);

module.exports = router;