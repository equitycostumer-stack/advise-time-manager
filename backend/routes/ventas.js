// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RUTAS DE VENTAS
// ======================================================

const express = require("express");
const router = express.Router();

const ventasController = require("../controllers/ventasController");
const verificarToken = require("../middleware/authMiddleware");
const verificarPropioAsesor = require("../middleware/verificarPropioAsesor");
const verificarRol = require("../middleware/rolesMiddleware");

// ======================================================
// TODAS LAS RUTAS REQUIEREN SESIÓN VÁLIDA
// ======================================================

router.use(verificarToken);

// ======================================================
// IMPORTANTE: las rutas específicas van ANTES que las
// rutas con parámetros (:id, :asesorId), para que
// Express no las confunda entre sí.
// ======================================================

router.get("/dia", ventasController.obtenerVentasDelDia);

router.get("/resumen/dia", ventasController.obtenerResumenVentasDelDia);

router.get("/resumen/asesores", ventasController.obtenerResumenVentasPorAsesor);

router.get("/resumen/asesores/periodo", ventasController.obtenerResumenVentasPorAsesorPeriodo);

// Validación y corrección de ventas: únicamente administradores.
router.get("/admin/validacion", verificarRol("ADMINISTRADOR"), ventasController.listarVentasAdmin);
router.patch("/admin/:id/corregir", verificarRol("ADMINISTRADOR"), ventasController.corregirVentaAdmin);
router.patch("/admin/:id/anular", verificarRol("ADMINISTRADOR"), ventasController.anularVenta);

router.get("/asesor/:asesorId", verificarPropioAsesor, ventasController.obtenerVentasPorAsesor);

router.post("/", verificarPropioAsesor, ventasController.registrarVenta);

router.patch("/:id/anular", ventasController.anularVenta);

module.exports = router;
