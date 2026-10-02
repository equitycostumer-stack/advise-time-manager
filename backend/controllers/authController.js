const authService = require("../services/authService");

function mensajeSeguro(error, fallback) {
    return error.status && error.status < 500
        ? error.message
        : fallback;
}

class AuthController {
    async login(req, res) {
        try {
            const rawUsuario = req.body.usuario || req.body.email || req.body.username;
            const password = req.body.password || req.body.contrasena;
            if (!rawUsuario || !password) {
                return res.status(400).json({ ok: false, mensaje: "El usuario/correo y la contraseña son requeridos." });
            }
            return res.status(200).json(await authService.login(String(rawUsuario).trim(), password));
        } catch (error) {
            console.error("Error de inicio de sesión:", error.code || error.message);
            const mensajeLower = String(error.message || "").toLowerCase();
            const credenciales = ["incorrect", "inválid", "invalida", "no encontrado", "inactivo"].some((texto) => mensajeLower.includes(texto));
            return res.status(error.status || (credenciales ? 401 : 500)).json({
                ok: false,
                mensaje: mensajeSeguro(error, "No fue posible iniciar sesión. Intenta nuevamente.")
            });
        }
    }

    async renovarToken(req, res) {
        try {
            return res.status(200).json(await authService.renovarToken(req.usuario));
        } catch (error) {
            console.error("Error renovando sesión:", error.code || error.message);
            return res.status(500).json({ ok: false, mensaje: "No fue posible renovar la sesión." });
        }
    }

    async cambiarPassword(req, res) {
        try {
            const { passwordActual, passwordNueva } = req.body;
            if (!passwordActual || !passwordNueva) {
                return res.status(400).json({ ok: false, mensaje: "La contraseña actual y la nueva son requeridas." });
            }
            return res.status(200).json(await authService.cambiarPassword(req.usuario.id, passwordActual, passwordNueva));
        } catch (error) {
            console.error("Error cambiando contraseña:", error.code || error.message);
            return res.status(error.status || 500).json({
                ok: false,
                mensaje: mensajeSeguro(error, "No fue posible cambiar la contraseña.")
            });
        }
    }
}

module.exports = new AuthController();
const authService = require("../services/authService");

function mensajeSeguro(error, fallback) {
    return error.status && error.status < 500
        ? error.message
        : fallback;
}

class AuthController {
    async login(req, res) {
        try {
            const rawUsuario = req.body.usuario || req.body.email || req.body.username;
            const password = req.body.password || req.body.contrasena;
            if (!rawUsuario || !password) {
                return res.status(400).json({ ok: false, mensaje: "El usuario/correo y la contraseña son requeridos." });
            }
            return res.status(200).json(await authService.login(String(rawUsuario).trim(), password));
        } catch (error) {
            console.error("Error de inicio de sesión:", error.code || error.message);
            const mensajeLower = String(error.message || "").toLowerCase();
            const credenciales = ["incorrect", "inválid", "invalida", "no encontrado", "inactivo"].some((texto) => mensajeLower.includes(texto));
            return res.status(error.status || (credenciales ? 401 : 500)).json({
                ok: false,
                mensaje: mensajeSeguro(error, "No fue posible iniciar sesión. Intenta nuevamente.")
            });
        }
    }

    async renovarToken(req, res) {
        try {
            return res.status(200).json(await authService.renovarToken(req.usuario));
        } catch (error) {
            console.error("Error renovando sesión:", error.code || error.message);
            return res.status(500).json({ ok: false, mensaje: "No fue posible renovar la sesión." });
        }
    }

    async cambiarPassword(req, res) {
        try {
            const { passwordActual, passwordNueva } = req.body;
            if (!passwordActual || !passwordNueva) {
                return res.status(400).json({ ok: false, mensaje: "La contraseña actual y la nueva son requeridas." });
            }
            return res.status(200).json(await authService.cambiarPassword(req.usuario.id, passwordActual, passwordNueva));
        } catch (error) {
            console.error("Error cambiando contraseña:", error.code || error.message);
            return res.status(error.status || 500).json({
                ok: false,
                mensaje: mensajeSeguro(error, "No fue posible cambiar la contraseña.")
            });
        }
    }
}

module.exports = new AuthController();
