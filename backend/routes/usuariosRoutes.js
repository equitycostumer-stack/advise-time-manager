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
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ======================================================

router.use(verificarToken);

// ======================================================
// SOLO ADMINISTRADORES
// ======================================================

router.use(
    verificarRol("ADMINISTRADOR")
);

// ======================================================
// LISTAR USUARIOS
// ======================================================

router.get(

    "/",

    usuariosController
        .listar
        .bind(usuariosController)

);

// ======================================================
// CREAR USUARIO
// ======================================================

router.post(

    "/",

    usuariosController
        .crear
        .bind(usuariosController)

);

// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

router.put(

    "/:id",

    usuariosController
        .actualizar
        .bind(usuariosController)

);

// ======================================================
// RESTABLECER CONTRASEÑA
// ======================================================

router.put(

    "/:id/reset-password",

    usuariosController
        .resetearPassword
        .bind(usuariosController)

);

// ======================================================
// EXPORTAR ROUTER
// ======================================================

module.exports = router;