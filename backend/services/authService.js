// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Auth Service
// ======================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const usuariosRepository = require("../repositories/usuariosRepository");

class AuthService {

    // ======================================================
    // LOGIN
    // ======================================================

    async login(usuario, password) {

        // ==================================================
        // VALIDACIONES INICIALES
        // ==================================================

        if (!usuario || !usuario.trim()) {
            const error = new Error("Debe ingresar el usuario.");
            error.status = 400;
            throw error;
        }

        if (!password || !password.trim()) {
            const error = new Error("Debe ingresar la contraseña.");
            error.status = 400;
            throw error;
        }

        // ==================================================
        // BUSCAR USUARIO
        // ==================================================

        const usuarioDB = await usuariosRepository.obtenerPorUsuario(
            usuario.trim()
        );

        console.log("====================================");
        console.log("USUARIO ENCONTRADO EN BD:");
        console.log(usuarioDB);
        console.log("====================================");

        if (!usuarioDB) {
            const error = new Error("Usuario o contraseña incorrectos.");
            error.status = 401; // Unauthorized
            throw error;
        }

        // ==================================================
        // USUARIO ACTIVO
        // ==================================================

        if (!usuarioDB.activo) {
            const error = new Error("El usuario está inactivo.");
            error.status = 401; // Unauthorized
            throw error;
        }

        // ==================================================
        // VALIDAR CONTRASEÑA
        // ==================================================

        const passwordCorrecto = await bcrypt.compare(
            password,
            usuarioDB.password
        );

        if (!passwordCorrecto) {
            const error = new Error("Usuario o contraseña incorrectos.");
            error.status = 401; // Unauthorized
            throw error;
        }

        // ==================================================
        // VALIDAR JWT SECRET
        // ==================================================

        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET no configurado en variables de entorno.");
            const error = new Error("Error interno: Variable JWT_SECRET no configurada.");
            error.status = 500; // Internal Server Error
            throw error;
        }

        // ==================================================
        // GENERAR TOKEN
        // ==================================================

        const token = jwt.sign(
            {
                id: usuarioDB.id,
                asesor_id: usuarioDB.asesor_id,
                usuario: usuarioDB.usuario,
                rol: usuarioDB.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "8h"
            }
        );

        // ==================================================
        // ACTUALIZAR ÚLTIMO ACCESO
        // ==================================================

        try {
            await usuariosRepository.actualizarUltimoAcceso(usuarioDB.id);
        } catch (error) {
            console.warn("No fue posible actualizar ultimo_acceso:", error.message);
        }

        // ==================================================
        // RESPUESTA
        // ==================================================

        return {
            ok: true,
            mensaje: "Inicio de sesión correcto.",
            token,
            usuario: {
                id: usuarioDB.id,
                asesor_id: usuarioDB.asesor_id,
                usuario: usuarioDB.usuario,
                email: usuarioDB.email,
                telefono: usuarioDB.telefono,
                rol: usuarioDB.rol,
                activo: usuarioDB.activo,
                debe_cambiar_password: Boolean(usuarioDB.debe_cambiar_password)
            }
        };

    }

    // ======================================================
    // CAMBIAR CONTRASEÑA
    // ======================================================

    async cambiarPassword(usuarioId, passwordActual, passwordNueva) {

        if (!passwordActual || !passwordActual.trim()) {
            const error = new Error("Debe ingresar su contraseña actual.");
            error.status = 400;
            throw error;
        }

        if (!passwordNueva || passwordNueva.trim().length < 6) {
            const error = new Error("La nueva contraseña debe tener al menos 6 caracteres.");
            error.status = 400;
            throw error;
        }

        const usuarioDB = await usuariosRepository.obtenerPorId(usuarioId);

        if (!usuarioDB) {
            const error = new Error("El usuario no existe.");
            error.status = 404;
            throw error;
        }

        const passwordCorrecto = await bcrypt.compare(
            passwordActual,
            usuarioDB.password
        );

        if (!passwordCorrecto) {
            const error = new Error("La contraseña actual es incorrecta.");
            error.status = 401;
            throw error;
        }

        const passwordHash = await bcrypt.hash(passwordNueva, 10);

        await usuariosRepository.actualizarPasswordPropia(
            usuarioId,
            passwordHash
        );

        return {
            ok: true,
            mensaje: "Contraseña actualizada correctamente."
        };

    }

}

module.exports = new AuthService();