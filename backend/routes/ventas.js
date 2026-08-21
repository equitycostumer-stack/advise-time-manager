// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RUTAS DE VENTAS
// ======================================================

const express = require("express");
const router = express.Router();

const ventasController = require("../controllers/ventasController");

// ======================================================
// IMPORTANTE: las rutas específicas van ANTES que las
// rutas con parámetros (:id, :asesorId), para que
// Express no las confunda entre sí.
// ======================================================

router.get("/dia", ventasController.obtenerVentasDelDia);

router.get("/resumen/dia", ventasController.obtenerResumenVentasDelDia);

router.get("/resumen/asesores", ventasController.obtenerResumenVentasPorAsesor);

router.get("/asesor/:asesorId", ventasController.obtenerVentasPorAsesor);

router.post("/", ventasController.registrarVenta);

router.patch("/:id/anular", ventasController.anularVenta);

module.exports = router;