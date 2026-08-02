// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Usuarios Routes
// ======================================================

const express = require("express");

const router = express.Router();

const usuariosController =
require("../controllers/usuariosController");

const verificarToken =
require("../middleware/authMiddleware");

const verificarRol =
require("../middleware/rolesMiddleware");

// ======================================================
// USUARIOS
// ======================================================

// Listar usuarios
router.get(
    "/",
    verificarToken,
    verificarRol("ADMINISTRADOR"),
    usuariosController.listar.bind(usuariosController)
);

// Crear usuario
router.post(
    "/",
    verificarToken,
    verificarRol("ADMINISTRADOR"),
    usuariosController.crear.bind(usuariosController)
);

// Actualizar usuario
router.put(
    "/:id",
    verificarToken,
    verificarRol("ADMINISTRADOR"),
    usuariosController.actualizar.bind(usuariosController)
);

module.exports = router;