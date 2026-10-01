// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// DASHBOARD CONTROLLER (PostgreSQL / Supabase)
// ======================================================

const db = require("../config/db");

const obtenerDashboard = async (req, res) => {
    const esAdministrador = req.usuario?.rol === "ADMINISTRADOR";
    const asesorIdPropio = Number(req.usuario?.asesor_id);

    if (!esAdministrador && (!Number.isInteger(asesorIdPropio) || asesorIdPropio <= 0)) {
        return res.status(403).json({
            ok: false,
            mensaje: "Este usuario no tiene un asesor vinculado."
        });
    }

    const parametros = esAdministrador ? [] : [asesorIdPropio];
    const filtroAsesor = esAdministrador ? "" : "AND a.id = $1";

    const sql = `
        SELECT
            a.id,
            a.nombre,
            a.activo,
            COALESCE(e.estado, 'DISPONIBLE') AS estado,
            TO_CHAR(e.inicio_estado, 'YYYY-MM-DD HH24:MI:SS') AS inicio_estado,
            TO_CHAR(COALESCE(r.hora_entrada, e.inicio_jornada, j.inicio_jornada), 'YYYY-MM-DD HH24:MI:SS') AS inicio_jornada,
            COALESCE(r.llego_tarde, false) AS llego_tarde,
            COALESCE(r.minutos_retraso, 0) AS minutos_retraso,
            COALESCE(r.tiempo_trabajado, 0) AS tiempo_trabajado,
            COALESCE(r.tiempo_productivo, 0) AS tiempo_productivo,
            COALESCE(r.tiempo_break, 0) AS tiempo_break,
            COALESCE(r.tiempo_almuerzo, 0) AS tiempo_almuerzo,
            COALESCE(r.tiempo_bano, 0) AS tiempo_bano
        FROM asesores a
        LEFT JOIN estados_actuales e
            ON a.id = e.asesor_id
            AND e.inicio_jornada::date = (NOW() AT TIME ZONE 'America/Bogota')::date
        LEFT JOIN resumen_jornada r
            ON a.id = r.asesor_id
            AND r.fecha = (NOW() AT TIME ZONE 'America/Bogota')::date
        LEFT JOIN (
            SELECT asesor_id, MIN(fecha_hora) AS inicio_jornada
            FROM movimientos
            WHERE tipo = 'ENTRADA'
              AND fecha_hora::date = (NOW() AT TIME ZONE 'America/Bogota')::date
            GROUP BY asesor_id
        ) j ON j.asesor_id = a.id
        WHERE a.activo = 1
          ${filtroAsesor}
        ORDER BY a.nombre ASC
    `;

    try {
        const resultado = await db.query(sql, parametros);
        const rows = resultado.rows || [];
        const asesores = rows.map((asesor) => ({
            ...asesor,
            llego_tarde: asesor.llego_tarde === true || asesor.llego_tarde === 1,
            minutos_retraso: Number(asesor.minutos_retraso) || 0,
            tiempo_trabajado: Number(asesor.tiempo_trabajado) || 0,
            tiempo_productivo: Number(asesor.tiempo_productivo) || 0,
            tiempo_break: Number(asesor.tiempo_break) || 0,
            tiempo_almuerzo: Number(asesor.tiempo_almuerzo) || 0,
            tiempo_bano: Number(asesor.tiempo_bano) || 0
        }));

        const productividad = asesores.reduce((total, asesor) => ({
            tiempo_trabajado: total.tiempo_trabajado + asesor.tiempo_trabajado,
            tiempo_productivo: total.tiempo_productivo + asesor.tiempo_productivo,
            tiempo_break: total.tiempo_break + asesor.tiempo_break,
            tiempo_almuerzo: total.tiempo_almuerzo + asesor.tiempo_almuerzo,
            tiempo_bano: total.tiempo_bano + asesor.tiempo_bano
        }), {
            tiempo_trabajado: 0,
            tiempo_productivo: 0,
            tiempo_break: 0,
            tiempo_almuerzo: 0,
            tiempo_bano: 0
        });
        productividad.porcentaje = productividad.tiempo_trabajado > 0
            ? Math.round(productividad.tiempo_productivo / productividad.tiempo_trabajado * 100)
            : 0;

        return res.json({
            ok: true,
            total: asesores.length,
            asesores,
            productividad
        });
    } catch (error) {
        console.error("Error obteniendo Dashboard:", error);
        return res.status(500).json({
            ok: false,
            error: error.message,
            code: error.code
        });
    }
};


const obtenerPanelEjecutivo = async (req, res) => {
    try {
        const fecha = `(NOW() AT TIME ZONE 'America/Bogota')::date`;
        const [operacion, ventas, incidencias] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE a.activo = 1) AS total_asesores,
                    COUNT(*) FILTER (WHERE a.activo = 1 AND COALESCE(e.estado, 'DISPONIBLE') = 'TRABAJANDO') AS trabajando,
                    COUNT(*) FILTER (WHERE a.activo = 1 AND COALESCE(e.estado, 'DISPONIBLE') IN ('BREAK','ALMUERZO','BANO','CAPACITACION','REUNION')) AS en_pausa,
                    COUNT(*) FILTER (WHERE a.activo = 1 AND COALESCE(r.llego_tarde, false) = true) AS llegadas_tarde,
                    COALESCE(SUM(r.tiempo_trabajado), 0) AS tiempo_trabajado,
                    COALESCE(SUM(r.tiempo_productivo), 0) AS tiempo_productivo
                FROM asesores a
                LEFT JOIN estados_actuales e ON e.asesor_id = a.id AND e.inicio_jornada::date = ${fecha}
                LEFT JOIN resumen_jornada r ON r.asesor_id = a.id AND r.fecha = ${fecha}
            `),
            db.query(`
                SELECT COUNT(*) AS cantidad_ventas,
                       COALESCE(SUM(valor), 0) AS total_vendido,
                       COALESCE(SUM(recaudo), 0) AS total_recaudo
                FROM ventas
                WHERE estado = 'ACTIVA'
                  AND fecha_hora >= ${fecha}
                  AND fecha_hora < (${fecha} + INTERVAL '1 day')
            `),
            db.query(`
                SELECT COUNT(*) AS pendientes
                FROM incidencias
                WHERE COALESCE(revisada, false) = false
            `)
        ]);
        const op=operacion.rows[0] || {}, ven=ventas.rows[0] || {}, inc=incidencias.rows[0] || {};
        const trabajado=Number(op.tiempo_trabajado)||0;
        const productivo=Number(op.tiempo_productivo)||0;
        return res.json({ ok:true, data:{
            fecha: new Date().toISOString().slice(0,10),
            asesores: { total:Number(op.total_asesores)||0, trabajando:Number(op.trabajando)||0, en_pausa:Number(op.en_pausa)||0, llegadas_tarde:Number(op.llegadas_tarde)||0 },
            productividad: { tiempo_trabajado:trabajado, tiempo_productivo:productivo, porcentaje:trabajado ? Math.round(productivo/trabajado*100) : 0 },
            ventas: { cantidad:Number(ven.cantidad_ventas)||0, total_vendido:Number(ven.total_vendido)||0, total_recaudo:Number(ven.total_recaudo)||0 },
            incidencias_pendientes:Number(inc.pendientes)||0
        }});
    } catch (error) {
        console.error("Error obteniendo panel ejecutivo:", error);
        return res.status(500).json({ ok:false, mensaje:error.message });
    }
};

module.exports = { obtenerDashboard, obtenerPanelEjecutivo };