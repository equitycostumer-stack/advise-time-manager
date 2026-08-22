// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// REPORTES CONTROLLER
// ======================================================

const reportesService = require("../services/reportesService");

// ======================================================
// ASISTENCIA POR RANGO
// ======================================================

const obtenerAsistencia = async (req, res) => {

    try {

        const { desde, hasta } = req.query;

        const datos = await reportesService.obtenerAsistencia(desde, hasta);

        return res.status(200).json({
            ok: true,
            data: datos
        });

    } catch (error) {

        console.error(error);

        return res.status(400).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// VENTAS POR RANGO
// ======================================================

const obtenerVentas = async (req, res) => {

    try {

        const { desde, hasta } = req.query;

        const datos = await reportesService.obtenerVentas(desde, hasta);

        return res.status(200).json({
            ok: true,
            data: datos
        });

    } catch (error) {

        console.error(error);

        return res.status(400).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    obtenerAsistencia,
    obtenerVentas
};