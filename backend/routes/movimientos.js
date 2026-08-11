// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// MOVIMIENTOS ROUTES
// ======================================================

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
// OBTENER ESTADO ACTUAL
// ======================================================

router.get(
    "/estado/:asesorId",
    movimientosController.obtenerEstadoActual
);

// ======================================================
// OBTENER HISTORIAL
// ======================================================

router.get(
    "/historial/:asesorId",
    movimientosController.obtenerHistorial
);

// ======================================================
// RESUMEN DEL DÍA (RUTA QUE USA EL FRONTEND)
// ======================================================

router.get(
    "/resumen/:asesorId",
    movimientosController.obtenerResumen
);

// ======================================================
// RESUMEN DE JORNADA (COMPATIBILIDAD)
// ======================================================

router.get(
    "/resumen-jornada/:asesorId",
    movimientosController.obtenerResumenJornada
);

module.exports = router;