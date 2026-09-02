const service = require("../services/configuracionEmpresaService");

module.exports = {
    async obtener(req, res) {
        try {
            return res.json({ ok: true, data: await service.obtener() });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ ok: false, mensaje: error.message });
        }
    },
    async actualizar(req, res) {
        try {
            return res.json({ ok: true, data: await service.actualizar(req.body, req.usuario?.id) });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ ok: false, mensaje: error.message });
        }
    }
};
