// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES - VENTAS CONTROLLER
// ======================================================
const ventasService = require("../services/ventasService");

function responderError(res, error, fallback, defecto = 500) {
    const status = Number(error.status) || defecto;
    return res.status(status).json({
        ok: false,
        mensaje: status < 500 ? error.message : fallback
    });
}

const registrarVenta = async (req, res) => {
    try {
        return res.status(201).json(await ventasService.registrarVenta({ ...req.body, usuario: req.usuario }));
    } catch (error) {
        console.error("Error registrando venta:", error.code || error.message);
        return responderError(res, error, "No fue posible registrar la venta.", 400);
    }
};

const obtenerVentasDelDia = async (req, res) => {
    try { return res.json({ ok: true, data: await ventasService.obtenerVentasDelDia(req.usuario) }); }
    catch (error) { console.error("Error consultando ventas del día:", error.code || error.message); return responderError(res, error, "No fue posible consultar las ventas del día."); }
};

const obtenerVentasPorAsesor = async (req, res) => {
    try {
        const asesorId = Number(req.params.asesorId);
        if (!Number.isInteger(asesorId) || asesorId <= 0) return res.status(400).json({ ok: false, mensaje: "El asesor indicado no es válido." });
        return res.json({ ok: true, data: await ventasService.obtenerVentasPorAsesor(asesorId) });
    } catch (error) { console.error("Error consultando ventas por asesor:", error.code || error.message); return responderError(res, error, "No fue posible consultar las ventas.", 400); }
};

const obtenerResumenVentasDelDia = async (req, res) => {
    try { return res.json({ ok: true, data: await ventasService.obtenerResumenVentasDelDia(req.usuario) }); }
    catch (error) { console.error("Error consultando resumen de ventas:", error.code || error.message); return responderError(res, error, "No fue posible consultar el resumen de ventas."); }
};

const obtenerResumenVentasPorAsesorPeriodo = async (req, res) => {
    try {
        const { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = req.query;
        return res.json({ ok: true, data: await ventasService.obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, req.usuario) });
    } catch (error) { console.error("Error consultando ranking de ventas:", error.code || error.message); return responderError(res, error, "No fue posible consultar el ranking de ventas.", 400); }
};

const obtenerResumenVentasPorAsesor = async (req, res) => {
    try { return res.json({ ok: true, data: await ventasService.obtenerResumenVentasPorAsesor(req.usuario) }); }
    catch (error) { console.error("Error consultando resumen por asesor:", error.code || error.message); return responderError(res, error, "No fue posible consultar el resumen por asesor."); }
};

const anularVenta = async (req, res) => {
    try { return res.json(await ventasService.anularVenta(Number(req.params.id), req.usuario, req.body?.motivo)); }
    catch (error) { console.error("Error anulando venta:", error.code || error.message); return responderError(res, error, "No fue posible anular la venta.", 400); }
};

const listarVentasAdmin = async (req, res) => {
    try {
        const { fecha_desde: desde, fecha_hasta: hasta, asesor_id: asesorId, cliente_id: clienteId, estado } = req.query;
        return res.json({ ok: true, data: await ventasService.listarVentasAdmin(desde, hasta, asesorId, clienteId, estado) });
    } catch (error) {
        console.error("Error validando ventas:", error.code || error.message);
        return responderError(res, error, "No fue posible consultar las ventas.", 400);
    }
};

const corregirVentaAdmin = async (req, res) => {
    try {
        const data = await ventasService.corregirVenta(Number(req.params.id), req.body, req.usuario);
        return res.json({ ok: true, mensaje: "Venta corregida y auditada correctamente.", data });
    } catch (error) {
        console.error("Error corrigiendo venta:", error.code || error.message);
        return responderError(res, error, "No fue posible corregir la venta.", 400);
    }
};

module.exports = { registrarVenta, obtenerVentasDelDia, obtenerVentasPorAsesor, obtenerResumenVentasDelDia, obtenerResumenVentasPorAsesor, obtenerResumenVentasPorAsesorPeriodo, anularVenta, listarVentasAdmin, corregirVentaAdmin };
