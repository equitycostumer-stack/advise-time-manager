const express = require("express");
const router = express.Router();

const notificacionesController = require("../controllers/notificacionesController");
const verificarToken = require("../middleware/authMiddleware");

router.use(verificarToken);

router.get("/", notificacionesController.obtenerMisNotificaciones);

router.patch("/leer-todas", notificacionesController.marcarTodasLeidas);

router.patch("/:id/leer", notificacionesController.marcarLeida);

module.exports = router;