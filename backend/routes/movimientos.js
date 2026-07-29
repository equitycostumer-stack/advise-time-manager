const express = require("express");
const router = express.Router();

const {
    registrarMovimiento,
    obtenerHistorial,
    obtenerEstadoActual
} = require("../controllers/movimientosController");

// Registrar un movimiento
router.post("/", registrarMovimiento);

// Historial de un asesor
router.get("/historial/:asesorId", obtenerHistorial);

// Estado actual del asesor
router.get("/estado/:asesorId", obtenerEstadoActual);

module.exports = router;