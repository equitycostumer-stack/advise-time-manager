const express = require("express");
const router = express.Router();

const {
    registrarMovimiento,
    obtenerHistorial,
    obtenerEstadoActual,
    obtenerResumenJornada,
    obtenerResumen
} = require("../controllers/movimientosController");

// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

router.post("/", registrarMovimiento);

// ======================================================
// ESTADO ACTUAL
// ======================================================

router.get("/estado/:asesorId", obtenerEstadoActual);

// ======================================================
// HISTORIAL DEL DÍA
// ======================================================

router.get("/historial/:asesorId", obtenerHistorial);

// ======================================================
// RESUMEN DE JORNADA (LEGACY)
// ======================================================

router.get("/resumen-jornada/:asesorId", obtenerResumenJornada);

// ======================================================
// RESUMEN AUTOMÁTICO DEL DÍA
// ======================================================

router.get("/resumen/:asesorId", obtenerResumen);

module.exports = router;