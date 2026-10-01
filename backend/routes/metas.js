const express = require("express");
const router = express.Router();
const controller = require("../controllers/metasController");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");

router.use(verificarToken, verificarRol("ADMINISTRADOR"));
router.get("/", controller.listar);
router.put("/", controller.guardar);

module.exports = router;
