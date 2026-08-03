// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Auth Service
// ======================================================

const bcrypt = require("bcrypt");
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

}

module.exports = new AuthService();