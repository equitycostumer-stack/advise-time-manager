const express = require("express");
const router = express.Router();
const controller = require("../controllers/configuracionEmpresaController");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");

router.use(verificarToken);
router.use(verificarRol("ADMINISTRADOR"));
router.get("/", controller.obtener);
router.put("/", controller.actualizar);

module.exports = router;
