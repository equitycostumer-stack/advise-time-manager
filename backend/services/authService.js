// Servicio de autenticación JWT.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usuariosRepository = require("../repositories/usuariosRepository");

// Evita el cierre diario heredado de 8 horas. Un valor personalizado distinto
// de 8h sigue siendo respetado para instalaciones que lo necesiten.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN !== "8h"
    ? process.env.JWT_EXPIRES_IN
    : "24h";

function exigirSecret() {
    if (!process.env.JWT_SECRET) {
        const error = new Error("Error interno de autenticación.");
        error.status = 500;
        throw error;
    }
}

function crearToken(usuario) {
    exigirSecret();
    return jwt.sign({
        id: usuario.id,
        asesor_id: usuario.asesor_id,
        usuario: usuario.usuario,
        rol: usuario.rol
    }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

class AuthService {
    async login(usuario, password) {
        if (!usuario || !String(usuario).trim()) {
            const error = new Error("Debe ingresar el usuario.");
            error.status = 400;
            throw error;
        }
        if (!password || !String(password).trim()) {
            const error = new Error("Debe ingresar la contraseña.");
            error.status = 400;
            throw error;
        }

        const usuarioDB = await usuariosRepository.obtenerPorUsuario(String(usuario).trim());
        if (!usuarioDB) {
            const error = new Error("Usuario o contraseña incorrectos.");
            error.status = 401;
            throw error;
        }
        if (!usuarioDB.activo) {
            const error = new Error("El usuario está inactivo.");
            error.status = 401;
            throw error;
        }
        const passwordCorrecto = await bcrypt.compare(password, usuarioDB.password);
        if (!passwordCorrecto) {
            const error = new Error("Usuario o contraseña incorrectos.");
            error.status = 401;
            throw error;
        }

        const token = crearToken(usuarioDB);
        try {
            await usuariosRepository.actualizarUltimoAcceso(usuarioDB.id);
        } catch (error) {
            console.warn("No fue posible actualizar el último acceso:", error.code || error.message);
        }

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

    renovarToken(payload) {
        return { ok: true, token: crearToken(payload) };
    }

    async cambiarPassword(usuarioId, passwordActual, passwordNueva) {
        if (!passwordActual || !String(passwordActual).trim()) {
            const error = new Error("Debe ingresar su contraseña actual.");
            error.status = 400;
            throw error;
        }
        if (!passwordNueva || String(passwordNueva).trim().length < 6) {
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
        const passwordCorrecto = await bcrypt.compare(passwordActual, usuarioDB.password);
        if (!passwordCorrecto) {
            const error = new Error("La contraseña actual es incorrecta.");
            error.status = 401;
            throw error;
        }
        await usuariosRepository.actualizarPasswordPropia(usuarioId, await bcrypt.hash(passwordNueva, 10));
        return { ok: true, mensaje: "Contraseña actualizada correctamente." };
    }
}

module.exports = new AuthService();
