// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// VENTAS CONTROLLER
// ======================================================

const ventasService = require("../services/ventasService");

// ======================================================
// REGISTRAR VENTA
// ======================================================

const registrarVenta = async (req, res) => {

    try {

        const resultado =
            await ventasService.registrarVenta(req.body);

        return res.status(200).json(resultado);

    } catch (error) {

        console.error(error);

        return res.status(400).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// OBTENER VENTAS DEL DÍA
// ======================================================

const obtenerVentasDelDia = async (req, res) => {

    try {

        const ventas =
            await ventasService.obtenerVentasDelDia();

        return res.status(200).json({
            ok: true,
            data: ventas
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// OBTENER VENTAS DE UN ASESOR
// ======================================================

const obtenerVentasPorAsesor = async (req, res) => {

    try {

        const asesorId = Number(req.params.asesorId);

        const ventas =
            await ventasService.obtenerVentasPorAsesor(asesorId);

        return res.status(200).json({
            ok: true,
            data: ventas
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
// RESUMEN DEL DÍA
// ======================================================

const obtenerResumenVentasDelDia = async (req, res) => {

    try {

        const resumen =
            await ventasService.obtenerResumenVentasDelDia();

        return res.status(200).json({
            ok: true,
            data: resumen
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// RESUMEN POR ASESOR
// ======================================================

const obtenerResumenVentasPorAsesorPeriodo = async (req, res) => {
    try {
        const { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = req.query;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde || "") || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHasta || "") || fechaDesde > fechaHasta) {
            return res.status(400).json({ ok: false, mensaje: "El rango de fechas no es válido." });
        }
        const resumen = await ventasService.obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta);
        return res.status(200).json({ ok: true, data: resumen });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, mensaje: error.message });
    }
};

const obtenerResumenVentasPorAsesor = async (req, res) => {

    try {

        const resumen =
            await ventasService.obtenerResumenVentasPorAsesor();

        return res.status(200).json({
            ok: true,
            data: resumen
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// ANULAR VENTA
// ======================================================

const anularVenta = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const resultado =
            await ventasService.anularVenta(id, req.usuario);

        return res.status(200).json(resultado);

    } catch (error) {

        console.error(error);

        const statusCode = error.status || 400;

        return res.status(statusCode).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    registrarVenta,
    obtenerVentasDelDia,
    obtenerVentasPorAsesor,
    obtenerResumenVentasDelDia,
    obtenerResumenVentasPorAsesor,
    obtenerResumenVentasPorAsesorPeriodo,
    anularVenta
};
