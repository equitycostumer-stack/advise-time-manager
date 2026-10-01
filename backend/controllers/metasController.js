const service = require("../services/metasService");
function permisos(req) {
    const admin = req.usuario?.rol === "ADMINISTRADOR";
    const propio = admin ? null : Number(req.usuario?.asesor_id);
    if (!admin && (!Number.isInteger(propio) || propio <= 0)) {
        const error = new Error("Este usuario no tiene un asesor vinculado.");
        error.status = 403;
        throw error;
    }
    return { admin, propio };
}
module.exports = {
    async listar(req, res) {
        try {
            const { admin, propio } = permisos(req);
            const asesorId = admin ? null : propio;
            return res.json({ ok: true, data: await service.listar(req.query.periodo_inicio, req.query.periodo_fin, asesorId) });
        } catch (error) {
            console.error("Error listando metas:", error.code || error.message);
            return res.status(error.status || 400).json({ ok: false, mensaje: error.status ? error.message : "No fue posible consultar las metas." });
        }
    },
    async historial(req, res) {
        try {
            const { admin, propio } = permisos(req);
            const asesorId = admin ? (req.query.asesor_id ? Number(req.query.asesor_id) : null) : propio;
            return res.json({ ok: true, data: await service.historial(req.query.periodo_inicio, req.query.periodo_fin, asesorId) });
        } catch (error) {
            console.error("Error consultando historial de metas:", error.code || error.message);
            return res.status(error.status || 400).json({ ok: false, mensaje: error.status ? error.message : "No fue posible consultar el historial." });
        }
    },
    async guardar(req, res) {
        try {
            if (req.usuario?.rol !== "ADMINISTRADOR") return res.status(403).json({ ok: false, mensaje: "Solo un administrador puede modificar metas." });
            return res.json({ ok: true, data: await service.guardar(req.body, req.usuario?.id) });
        } catch (error) {
            console.error("Error guardando meta:", error.code || error.message);
            return res.status(error.status || 400).json({ ok: false, mensaje: error.status ? error.message : "No fue posible guardar la meta." });
        }
    }
};
