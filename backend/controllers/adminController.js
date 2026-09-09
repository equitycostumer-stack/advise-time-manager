const adminRepository = require("../repositories/adminRepository");

const errorResponse = (res, error) => res.status(400).json({ ok: false, mensaje: error.message || "No fue posible completar la operación." });

async function obtenerResumen(req, res) {
    try {
        return res.json({ ok: true, data: await adminRepository.obtenerResumen(req.query.desde, req.query.hasta) });
    } catch (error) { console.error("Error en resumen administrativo:", error); return errorResponse(res, error); }
}

async function obtenerAuditoria(req, res) {
    try { return res.json({ ok: true, data: await adminRepository.obtenerAuditoria(req.query.limite) }); }
    catch (error) { console.error("Error en auditoría:", error); return errorResponse(res, error); }
}

async function obtenerMovimientos(req, res) {
    try {
        const data = await adminRepository.obtenerMovimientos(req.query.desde, req.query.hasta, req.query.asesor_id);
        return res.json({ ok: true, data });
    } catch (error) { console.error("Error en movimientos administrativos:", error); return errorResponse(res, error); }
}

async function cambiarEstadoAsesor(req, res) {
    try {
        const asesorId = Number(req.params.asesorId);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw new Error("Asesor inválido.");
        if (typeof req.body.activo !== "boolean") throw new Error("El campo activo debe ser booleano.");
        if (!req.body.motivo || String(req.body.motivo).trim().length < 5) throw new Error("Debe indicar un motivo de al menos 5 caracteres.");
        const data = await adminRepository.cambiarEstadoAsesor(asesorId, req.body.activo, req.usuario.id, req.body.motivo);
        return res.json({ ok: true, data });
    } catch (error) { console.error("Error cambiando estado del asesor:", error); return errorResponse(res, error); }
}

async function corregirMovimiento(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) throw new Error("Movimiento inválido.");
        const data = await adminRepository.corregirMovimiento(id, req.body, req.usuario.id);
        return res.json({ ok: true, data });
    } catch (error) { console.error("Error corrigiendo movimiento:", error); return errorResponse(res, error); }
}

async function corregirResumen(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) throw new Error("Resumen inválido.");
        const data = await adminRepository.corregirResumen(id, req.body, req.usuario.id);
        return res.json({ ok: true, data });
    } catch (error) { console.error("Error corrigiendo resumen:", error); return errorResponse(res, error); }
}

module.exports = { obtenerResumen, obtenerAuditoria, obtenerMovimientos, cambiarEstadoAsesor, corregirMovimiento, corregirResumen };
