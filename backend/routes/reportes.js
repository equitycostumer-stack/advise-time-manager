// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RUTAS DE REPORTES (histórico multi-día)
// ======================================================

const express = require("express");
const router = express.Router();

const reportesController = require("../controllers/reportesController");

router.get("/asistencia", reportesController.obtenerAsistencia);

router.get("/ventas", reportesController.obtenerVentas);

module.exports = router;