const service = require("../services/metasService");

module.exports = {
    async listar(req, res) {
        try {
            const { periodo_inicio: inicio, periodo_fin: fin } = req.query;
            const esAdministrador = req.usuario?.rol === "ADMINISTRADOR";
            const asesorId = esAdministrador ? null : Number(req.usuario?.asesor_id);

            if (!esAdministrador && (!Number.isInteger(asesorId) || asesorId <= 0)) {
                return res.status(403).json({
                    ok: false,
                    mensaje: "Este usuario no tiene un asesor vinculado."
                });
            }

            return res.json({
                ok: true,
                data: await service.listar(inicio, fin, asesorId)
            });
        } catch (error) {
            console.error("Error listando metas:", error);
            return res.status(400).json({
                ok: false,
                mensaje: error.message || "No fue posible consultar las metas."
            });
        }
    },

    async guardar(req, res) {
        try {
            return res.json({
                ok: true,
                data: await service.guardar(req.body, req.usuario?.id)
            });
        } catch (error) {
            console.error("Error guardando meta:", error);
            return res.status(400).json({
                ok: false,
                mensaje: error.message || "No fue posible guardar la meta."
            });
        }
    }
};
