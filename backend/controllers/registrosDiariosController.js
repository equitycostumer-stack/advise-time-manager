const service = require("../services/registrosDiariosService");

function esAdministrador(req) {
    return req.usuario?.rol === "ADMINISTRADOR";
}

function asesorPropio(req) {
    const asesorId = Number(req.usuario?.asesor_id);
    if (!Number.isInteger(asesorId) || asesorId <= 0) {
        const error = new Error("Este usuario no tiene un asesor vinculado.");
        error.status = 403;
        throw error;
    }
    return asesorId;
}

module.exports = {
    async listar(req, res) {
        try {
            const admin = esAdministrador(req);
            const asesorId = admin
                ? (req.query.asesor_id ? Number(req.query.asesor_id) : null)
                : asesorPropio(req);
            const data = await service.listar(req.query.fecha_desde, req.query.fecha_hasta, asesorId);
            return res.json({ ok: true, data });
        } catch (error) {
            console.error("Error listando registros diarios:", error.code || error.message);
            return res.status(error.status || 400).json({
                ok: false,
                mensaje: error.status ? error.message : "No fue posible consultar los registros diarios."
            });
        }
    },

    async guardar(req, res) {
        try {
            const admin = esAdministrador(req);
            const datos = { ...req.body };
            if (!admin) datos.asesor_id = asesorPropio(req);
            const data = await service.guardar(datos, req.usuario?.id);
            return res.json({ ok: true, data });
        } catch (error) {
            console.error("Error guardando registro diario:", error.code || error.message);
            return res.status(error.status || 400).json({
                ok: false,
                mensaje: error.status ? error.message : "No fue posible guardar el registro diario."
            });
        }
    }
};
