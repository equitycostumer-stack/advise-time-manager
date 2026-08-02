// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Middleware de autorización por roles
// ======================================================

const verificarRol = (...rolesPermitidos) => {

    return (req, res, next) => {

        if (!req.usuario) {

            return res.status(401).json({

                ok: false,

                mensaje: "Usuario no autenticado."

            });

        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {

            return res.status(403).json({

                ok: false,

                mensaje: "No tiene permisos para realizar esta acción."

            });

        }

        next();

    };

};

module.exports = verificarRol;