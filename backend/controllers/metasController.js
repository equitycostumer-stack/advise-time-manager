const service = require("../services/metasService");

module.exports = {
    async listar(req, res) {
        try {
            const { periodo_inicio: inicio, periodo_fin: fin } = req.query;
            return res.json({ ok: true, data: await service.listar(inicio, fin) });
        } catch (error) {
            return res.status(400).json({ ok: false, mensaje: error.message });
        }
    },
    async guardar(req, res) {
        try {
            return res.json({ ok: true, data: await service.guardar(req.body, req.usuario?.id) });
        } catch (error) {
            return res.status(400).json({ ok: false, mensaje: error.message });
        }
    }
};
