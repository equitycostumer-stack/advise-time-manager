const express = require("express");
const router = express.Router();
const controller = require("../controllers/configuracionEmpresaController");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");

// La información institucional puede ser consultada por cualquier usuario autenticado.
router.get("/", verificarToken, controller.obtener);

// Las modificaciones continúan restringidas al rol ADMINISTRADOR.
router.put("/", verificarToken, verificarRol("ADMINISTRADOR"), controller.actualizar);

module.exports = router;
