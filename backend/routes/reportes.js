// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RUTAS DE REPORTES (histórico multi-día)
// ======================================================

const express = require("express");
const router = express.Router();

const reportesController = require("../controllers/reportesController");

const verificarToken = require("../middleware/authMiddleware");

router.use(verificarToken);

router.get("/asistencia", reportesController.obtenerAsistencia);

router.get("/ventas", reportesController.obtenerVentas);

module.exports = router;