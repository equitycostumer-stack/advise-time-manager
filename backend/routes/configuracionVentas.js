const express = require("express");
const router = express.Router();
const controller = require("../controllers/configuracionVentasController");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");
router.get("/", verificarToken, controller.obtener);
router.put("/", verificarToken, verificarRol("ADMINISTRADOR"), controller.actualizar);
module.exports = router;
