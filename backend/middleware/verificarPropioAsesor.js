// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// Middleware: un ASESOR solo puede operar su propio asesor_id
// Un ADMINISTRADOR puede operar cualquiera.
// ======================================================

const verificarPropioAsesor = (req, res, next) => {

    if (!req.usuario) {
        return res.status(401).json({
            ok: false,
            mensaje: "Usuario no autenticado."
        });
    }

    if (req.usuario.rol === "ADMINISTRADOR") {
        return next();
    }

    const asesorIdSolicitado = Number(
        req.body.asesor_id ?? req.params.asesorId
    );
    const asesorIdPropio = Number(req.usuario.asesor_id);

    if (!asesorIdPropio) {
        return res.status(403).json({
            ok: false,
            mensaje: "Este usuario no tiene un asesor vinculado."
        });
    }

    if (asesorIdSolicitado !== asesorIdPropio) {
        return res.status(403).json({
            ok: false,
            mensaje: "No tiene permiso para registrar movimientos o ventas a nombre de otro asesor."
        });
    }

    next();

};

module.exports = verificarPropioAsesor;