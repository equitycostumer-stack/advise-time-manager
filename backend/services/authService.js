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

        if (!usuario) {
            throw new Error("Debe ingresar el usuario.");
        }

        if (!password) {
            throw new Error("Debe ingresar la contraseña.");
        }

        const usuarioDB =
            await usuariosRepository.obtenerPorUsuario(usuario);

        if (!usuarioDB) {
            throw new Error("Usuario o contraseña incorrectos.");
        }

        if (!usuarioDB.activo) {
            throw new Error("El usuario está inactivo.");
        }

        const passwordCorrecto =
            await bcrypt.compare(
                password,
                usuarioDB.password
            );

        if (!passwordCorrecto) {
            throw new Error("Usuario o contraseña incorrectos.");
        }

        const token = jwt.sign(

            {

                id: usuarioDB.id,

                asesor_id: usuarioDB.asesor_id,

                usuario: usuarioDB.usuario,

                rol: usuarioDB.rol

            },

            process.env.JWT_SECRET,

            {

                expiresIn: process.env.JWT_EXPIRES_IN

            }

        );

        return {

            ok: true,

            token,

            usuario: {

                id: usuarioDB.id,

                asesor_id: usuarioDB.asesor_id,

                usuario: usuarioDB.usuario,

                rol: usuarioDB.rol,

                debe_cambiar_password:
                    usuarioDB.debe_cambiar_password

            }

        };

    }

}

module.exports = new AuthService();