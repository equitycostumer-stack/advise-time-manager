// ======================================================
// ADVISE SOLUTIONS SERVICES - TIME MANAGER
// RUTAS DE INCIDENCIAS (POSTGRESQL / SUPABASE)
// ======================================================

const express = require("express");
const router = express.Router();
const db = require("../config/db");

const {
    revisarIncidencia,
    registrarPausaLlamadas,
    finalizarPausaLlamadas,
    obtenerPausaActiva
} = require("../controllers/incidenciasController");

const verificarToken = require("../middleware/authMiddleware");
const verificarPropioAsesor = require("../middleware/verificarPropioAsesor");
const verificarRol = require("../middleware/rolesMiddleware");

router.use(verificarToken);

// ======================================================
// INCIDENCIAS PENDIENTES DEL DÍA (Dashboard)
// ======================================================

router.get("/", async (req, res) => {
    const esAdministrador = req.usuario?.rol === "ADMINISTRADOR";
    const asesorIdPropio = Number(req.usuario?.asesor_id);

    if (!esAdministrador && (!Number.isInteger(asesorIdPropio) || asesorIdPropio <= 0)) {
        return res.status(403).json({
            ok: false,
            mensaje: "Este usuario no tiene un asesor vinculado."
        });
    }

    const parametros = esAdministrador ? [] : [asesorIdPropio];
    const filtroAsesor = esAdministrador ? "" : "AND i.asesor_id = $1";

    const sql = `
        SELECT
            i.id,
            i.asesor_id,
            i.tipo,
            i.nivel,
            i.detalle,
            i.fecha_hora,
            i.revisada,
            i.revisada_por,
            i.comentario,
            i.fecha_revision,
            i.fecha_fin,
            a.nombre
        FROM incidencias i
        INNER JOIN asesores a ON a.id = i.asesor_id
            WHERE i.revisada = 0
          ${filtroAsesor}
          AND DATE(i.fecha_hora) = CURRENT_DATE
        ORDER BY i.fecha_hora DESC
    `;

    try {
        const { rows } = await db.query(sql, parametros);
        return res.json(rows);
    } catch (err) {
        console.error("❌ Error obteniendo incidencias pendientes:", err);
        return res.status(500).json({
            ok: false,
            mensaje: "Error obteniendo incidencias."
        });
    }
});

// ======================================================
// HISTORIAL DEL DÍA POR ASESOR
// ======================================================

router.get("/asesor/:asesorId", verificarPropioAsesor, async (req, res) => {
    const sql = `
        SELECT
            id,
            tipo,
            nivel,
            detalle AS descripcion,
            fecha_hora,
            revisada,
            revisada_por,
            comentario,
            fecha_revision,
            fecha_fin
        FROM incidencias
        WHERE asesor_id = $1
          AND DATE(fecha_hora) = CURRENT_DATE
        ORDER BY fecha_hora DESC
    `;

    try {
        const { rows } = await db.query(sql, [req.params.asesorId]);
        return res.json({ ok: true, incidencias: rows });
    } catch (err) {
        console.error("❌ Error obteniendo historial por asesor:", err);
        return res.status(500).json({
            ok: false,
            mensaje: "Error obteniendo historial."
        });
    }
});

// ======================================================
// REVISAR INCIDENCIA
// ======================================================

router.put("/:id/revisar", verificarRol("ADMINISTRADOR"), revisarIncidencia);

// ======================================================
// PAUSA DE LLAMADAS
// ======================================================

router.post("/pausa", verificarPropioAsesor, registrarPausaLlamadas);
router.put("/pausa/:id/fin", finalizarPausaLlamadas);
router.get("/pausa/activa/:asesorId", verificarPropioAsesor, obtenerPausaActiva);

// ======================================================
// HISTORIAL CON FILTROS
// GET /api/incidencias/historial
//
// Parámetros opcionales:
// fecha=YYYY-MM-DD                  (compatibilidad con la versión anterior)
// fecha_desde=YYYY-MM-DD
// fecha_hasta=YYYY-MM-DD
// asesor_id=ID
// tipo=TIPO DE INCIDENCIA
// nivel=NIVEL DE INCIDENCIA
// ======================================================

router.get("/historial", async (req, res) => {
    const {
        fecha,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        asesor_id: asesorIdSolicitado,
        tipo,
        nivel
    } = req.query;

    const esAdministrador = req.usuario?.rol === "ADMINISTRADOR";
    const asesorIdFiltro = esAdministrador
        ? asesorIdSolicitado
        : req.usuario?.asesor_id;

    if (!esAdministrador && (!asesorIdFiltro || !Number.isInteger(Number(asesorIdFiltro)))) {
        return res.status(403).json({
            ok: false,
            mensaje: "No tiene permiso para consultar incidencias de otros asesores."
        });
    }

    const desde = fechaDesde || fecha || null;
    const hasta = fechaHasta || fecha || desde;
    const condiciones = [];
    const valores = [];

    if (desde) {
        valores.push(desde);
        condiciones.push(`DATE(i.fecha_hora) >= $${valores.length}`);
    }

    if (hasta) {
        valores.push(hasta);
        condiciones.push(`DATE(i.fecha_hora) <= $${valores.length}`);
    }

    if (asesorIdFiltro) {
        const id = Number(asesorIdFiltro);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "El asesor seleccionado no es válido."
            });
        }

        valores.push(id);
        condiciones.push(`i.asesor_id = $${valores.length}`);
    }

    if (tipo && String(tipo).trim()) {
        valores.push(String(tipo).trim());
        condiciones.push(`i.tipo = $${valores.length}`);
    }

    if (nivel && String(nivel).trim()) {
        valores.push(String(nivel).trim());
        condiciones.push(`i.nivel = $${valores.length}`);
    }

    const where = condiciones.length
        ? `WHERE ${condiciones.join(" AND ")}`
        : "";

    const sql = `
        SELECT
            i.id,
            i.asesor_id,
            i.tipo,
            i.nivel,
            i.detalle,
            i.fecha_hora,
            i.revisada,
            i.revisada_por,
            i.comentario,
            i.fecha_revision,
            i.fecha_fin,
            a.nombre
        FROM incidencias i
        INNER JOIN asesores a ON a.id = i.asesor_id
        ${where}
        ORDER BY i.fecha_hora DESC
    `;

    try {
        const { rows } = await db.query(sql, valores);
        return res.json({ ok: true, incidencias: rows });
    } catch (err) {
        console.error("❌ Error obteniendo historial filtrado:", err);
        return res.status(500).json({
            ok: false,
            mensaje: "Error obteniendo historial de incidencias."
        });
    }
});

module.exports = router;
