// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
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

            const { usuario, password } = req.body;

            console.log("Llamando AuthService...");

            const resultado = await authService.login(
                usuario,
                password
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
                mensaje: error.message
            });

        }

    }

}

module.exports = new AuthController();