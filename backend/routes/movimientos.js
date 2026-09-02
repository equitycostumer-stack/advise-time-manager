// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// MOVIMIENTOS ROUTES
// ======================================================

const express = require("express");
const router = express.Router();

const movimientosController = require("../controllers/movimientosController");
const verificarToken = require("../middleware/authMiddleware");
const verificarPropioAsesor = require("../middleware/verificarPropioAsesor");

// ======================================================
// TODAS LAS RUTAS REQUIEREN SESIÓN VÁLIDA
// ======================================================

router.use(verificarToken);

// ======================================================
// REGISTRAR MOVIMIENTO (protegido: solo tu propio asesor)
// ======================================================

router.post(
    "/",
    verificarPropioAsesor,
    movimientosController.registrarMovimiento
);

// ======================================================
// OBTENER ESTADO ACTUAL
// ======================================================

router.get(
    "/estado/:asesorId",
    verificarPropioAsesor,
    movimientosController.obtenerEstadoActual
);

// ======================================================
// OBTENER HISTORIAL
// ======================================================

router.get(
    "/historial/:asesorId",
    verificarPropioAsesor,
    movimientosController.obtenerHistorial
);

// ======================================================
// RESUMEN DEL DÍA (RUTA QUE USA EL FRONTEND)
// ======================================================

router.get(
    "/resumen/:asesorId",
    verificarPropioAsesor,
    movimientosController.obtenerResumen
);

// ======================================================
// RESUMEN DE JORNADA (COMPATIBILIDAD)
// ======================================================

router.get(
    "/resumen-jornada/:asesorId",
    verificarPropioAsesor,
    movimientosController.obtenerResumenJornada
);

module.exports = router;