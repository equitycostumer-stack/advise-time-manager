// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Auth Controller
// ======================================================

const authService = require("../services/authService");

class AuthController {

    // ======================================================
    // LOGIN
    // ======================================================

    async login(req, res) {

        try {

            const {

                usuario,

                password

            } = req.body;

            const resultado = await authService.login(

                usuario,

                password

            );

            return res.status(200).json(resultado);

        } catch (error) {

            console.error("====================================");
            console.error("ERROR LOGIN");
            console.error(error);
            console.error("====================================");

            return res.status(400).json({

                ok: false,

                mensaje: error.message

            });

        }

    }

}

module.exports = new AuthController();