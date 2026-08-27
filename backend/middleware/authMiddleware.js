// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Middleware de autenticación JWT
// ======================================================

const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({

                ok: false,

                mensaje: "Token no enviado."

            });

        }

        if (!authHeader.startsWith("Bearer ")) {

            return res.status(401).json({

                ok: false,

                mensaje: "Formato de token inválido."

            });

        }

        const token = authHeader.split(" ")[1];

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = payload;

        next();

    } catch (error) {

        return res.status(401).json({

            ok: false,

            mensaje: "Token inválido o expirado."

        });

    }

};

module.exports = verificarToken;