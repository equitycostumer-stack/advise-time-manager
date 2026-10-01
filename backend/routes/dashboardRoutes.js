const express = require("express");

const router = express.Router();

const {
    obtenerDashboard,
    obtenerPanelEjecutivo
} = require("../controllers/dashboardController");

const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");

router.use(verificarToken);

router.get("/", obtenerDashboard);
router.get("/ejecutivo", verificarRol("ADMINISTRADOR"), obtenerPanelEjecutivo);

module.exports = router;