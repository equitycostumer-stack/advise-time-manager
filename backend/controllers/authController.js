// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Auth Controller
// ======================================================

const authService = require("../services/authService");

class AuthController {

    async login(req, res) {

        console.log("====================================");
        console.log("ENTRÓ AL LOGIN");
        console.log(req.body);
        console.log("====================================");

        try {
            // Acepta flexibilización de campos (usuario, email o username)
            const usuarioParam = req.body.usuario || req.body.email || req.body.username;
            const passwordParam = req.body.password || req.body.contrasena;

            if (!usuarioParam || !passwordParam) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "El usuario/correo y la contraseña son requeridos."
                });
            }

            console.log("Llamando AuthService para:", usuarioParam);

            const resultado = await authService.login(
                usuarioParam,
                passwordParam
            );

            console.log("Login correcto.");

            return res.status(200).json(resultado);

        } catch (error) {

            console.error("====================================");
            console.error("ERROR LOGIN");
            console.error(error);
            console.error(error.stack);
            console.error("====================================");

            return res.status(400).json({
                ok: false,
                mensaje: error.message || "Error al iniciar sesión."
            });

        }

    }

    async cambiarPassword(req, res) {

        try {

            const { passwordActual, passwordNueva } = req.body;

            const usuarioId = req.usuario.id;

            const resultado = await authService.cambiarPassword(
                usuarioId,
                passwordActual,
                passwordNueva
            );

            return res.status(200).json(resultado);

        } catch (error) {

            console.error(error);

            return res.status(400).json({
                ok: false,
                mensaje: error.message || "Error al cambiar contraseña."
            });

        }

    }

}

module.exports = new AuthController();