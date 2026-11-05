const express = require("express");
const router = express.Router();
const controller = require("../controllers/asesoresController");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");

router.use(verificarToken);

router.get("/administracion", verificarRol("ADMINISTRADOR"), controller.obtenerActivosParaAdministracion.bind(controller));
router.put("/:id/genero", verificarRol("ADMINISTRADOR"), controller.actualizarGenero.bind(controller));
router.get("/", controller.obtenerAsesores.bind(controller));

module.exports = router;
