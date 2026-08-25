// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
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
        // VALIDACIONES
        // ==================================================

        if (!usuario || !usuario.trim()) {

            throw new Error(
                "Debe ingresar el usuario."
            );

        }

        if (!password || !password.trim()) {

            throw new Error(
                "Debe ingresar la contraseña."
            );

        }

        // ==================================================
// BUSCAR USUARIO
// ==================================================

const usuarioDB =
    await usuariosRepository.obtenerPorUsuario(
        usuario.trim()
    );

console.log("====================================");
console.log("USUARIO ENCONTRADO:");
console.log(usuarioDB);
console.log("====================================");

if (!usuarioDB) {

    throw new Error(
        "Usuario o contraseña incorrectos."
    );

}

        // ==================================================
        // USUARIO ACTIVO
        // ==================================================

        if (!usuarioDB.activo) {

            throw new Error(
                "El usuario está inactivo."
            );

        }

        // ==================================================
        // VALIDAR CONTRASEÑA
        // ==================================================

        const passwordCorrecto =
            await bcrypt.compare(
                password,
                usuarioDB.password
            );

        if (!passwordCorrecto) {

            throw new Error(
                "Usuario o contraseña incorrectos."
            );

        }

        // ==================================================
        // VALIDAR JWT
        // ==================================================

        if (!process.env.JWT_SECRET) {

            console.error(
                "❌ JWT_SECRET no configurado."
            );

            throw new Error(
                "JWT_SECRET no está configurado."
            );

        }

        // ==================================================
        // GENERAR TOKEN
        // ==================================================

        const token = jwt.sign(

            {

                id: usuarioDB.id,

                asesor_id:
                    usuarioDB.asesor_id,

                usuario:
                    usuarioDB.usuario,

                rol:
                    usuarioDB.rol

            },

            process.env.JWT_SECRET,

            {

                expiresIn:
                    process.env.JWT_EXPIRES_IN || "8h"

            }

        );

        // ==================================================
        // ACTUALIZAR ÚLTIMO ACCESO
        // ==================================================

        try {

            await usuariosRepository.actualizarUltimoAcceso(
                usuarioDB.id
            );

        } catch (error) {

            console.warn(
                "No fue posible actualizar ultimo_acceso."
            );

        }

        // ==================================================
        // RESPUESTA
        // ==================================================

        return {

            ok: true,

            mensaje:
                "Inicio de sesión correcto.",

            token,

            usuario: {

                id:
                    usuarioDB.id,

                asesor_id:
                    usuarioDB.asesor_id,

                usuario:
                    usuarioDB.usuario,

                email:
                    usuarioDB.email,

                telefono:
                    usuarioDB.telefono,

                rol:
                    usuarioDB.rol,

                activo:
                    usuarioDB.activo,

                debe_cambiar_password:
                    Boolean(
                        usuarioDB.debe_cambiar_password
                    )

            }

        };

    }

    // ======================================================
    // CAMBIAR CONTRASEÑA (el propio usuario autenticado)
    // ======================================================

    async cambiarPassword(usuarioId, passwordActual, passwordNueva) {

        if (!passwordActual || !passwordActual.trim()) {
            throw new Error("Debe ingresar su contraseña actual.");
        }

        if (!passwordNueva || passwordNueva.trim().length < 6) {
            throw new Error(
                "La nueva contraseña debe tener al menos 6 caracteres."
            );
        }

        const usuarioDB =
            await usuariosRepository.obtenerPorId(usuarioId);

        if (!usuarioDB) {
            throw new Error("El usuario no existe.");
        }

        const passwordCorrecto =
            await bcrypt.compare(
                passwordActual,
                usuarioDB.password
            );

        if (!passwordCorrecto) {
            throw new Error("La contraseña actual es incorrecta.");
        }

        const passwordHash =
            await bcrypt.hash(passwordNueva, 10);

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