const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");
const controller = require("../controllers/adminController");

router.use(verificarToken, verificarRol("ADMINISTRADOR"));
router.get("/resumen", controller.obtenerResumen);
router.get("/auditoria", controller.obtenerAuditoria);
router.get("/movimientos", controller.obtenerMovimientos);
router.patch("/asesores/:asesorId/estado", controller.cambiarEstadoAsesor);
router.patch("/movimientos/:id", controller.corregirMovimiento);
router.patch("/resumenes/:id", controller.corregirResumen);

module.exports = router;
