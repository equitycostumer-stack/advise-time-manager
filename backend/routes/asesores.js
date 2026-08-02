const express = require("express");

const router = express.Router();

const controller = require("../controllers/asesoresController");

// =======================================
// OBTENER ASESORES ACTIVOS
// =======================================

router.get(
    "/",
    controller.obtenerAsesores
);

module.exports = router;