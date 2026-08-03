// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Usuarios Controller
// ======================================================

const usuariosService = require("../services/usuariosService");

class UsuariosController {

    // ======================================================
    // LISTAR USUARIOS
    // ======================================================

    async listar(req, res) {

        try {

            const respuesta =
                await usuariosService.listarUsuarios();

            return res.status(200).json(respuesta);

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                ok: false,

                mensaje: error.message

            });

        }

    }

    // ======================================================
    // CREAR USUARIO
    // ======================================================

    async crear(req, res) {

        try {

            const respuesta =
                await usuariosService.crearUsuario(
                    req.body
                );

            return res.status(201).json(respuesta);

        } catch (error) {

            console.error(error);

            return res.status(400).json({

                ok: false,

                mensaje: error.message

            });

        }

    }

    // ======================================================
    // ACTUALIZAR USUARIO
    // ======================================================

    async actualizar(req, res) {

        try {

            const { id } = req.params;

            const respuesta =
                await usuariosService.actualizarUsuario(

                    Number(id),

                    req.body

                );

            return res.status(200).json(respuesta);

        } catch (error) {

            console.error(error);

            return res.status(400).json({

                ok: false,

                mensaje: error.message

            });

        }

    }

    // ======================================================
    // RESTABLECER CONTRASEÑA
    // ======================================================

    async resetearPassword(req, res) {

        try {

            const { id } = req.params;

            const respuesta =
                await usuariosService.resetearPassword(

                    Number(id)

                );

            return res.status(200).json(respuesta);

        } catch (error) {

            console.error(error);

            return res.status(400).json({

                ok: false,

                mensaje: error.message

            });

        }

    }

}

module.exports = new UsuariosController();