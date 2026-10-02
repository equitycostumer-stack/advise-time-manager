// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES - REPORTES CONTROLLER
// ======================================================
const reportesService = require("../services/reportesService");

function responderError(res, error) {
    const status = Number(error.status) || 400;
    return res.status(status).json({
        ok: false,
        mensaje: status < 500 ? error.message : "No fue posible consultar el reporte."
    });
}

const obtenerAsistencia = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        return res.json({ ok: true, data: await reportesService.obtenerAsistencia(desde, hasta, req.usuario) });
    } catch (error) {
        console.error("Error consultando asistencia:", error.code || error.message);
        return responderError(res, error);
    }
};

const obtenerVentas = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        return res.json({ ok: true, data: await reportesService.obtenerVentas(desde, hasta, req.usuario) });
    } catch (error) {
        console.error("Error consultando ventas históricas:", error.code || error.message);
        return responderError(res, error);
    }
};

module.exports = { obtenerAsistencia, obtenerVentas };
