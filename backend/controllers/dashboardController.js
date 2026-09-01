// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// DASHBOARD CONTROLLER (PostgreSQL / Supabase)
// ======================================================

const db = require("../config/db");

const obtenerDashboard = async (req, res) => {
    const sql = `
        SELECT
            a.id,
            a.nombre,
            a.activo,
            COALESCE(e.estado, 'DISPONIBLE') AS estado,
            TO_CHAR(e.inicio_estado, 'YYYY-MM-DD HH24:MI:SS') AS inicio_estado,
            TO_CHAR(COALESCE(r.hora_entrada, e.inicio_jornada, j.inicio_jornada), 'YYYY-MM-DD HH24:MI:SS') AS inicio_jornada,
            COALESCE(r.llego_tarde, false) AS llego_tarde,
            COALESCE(r.minutos_retraso, 0) AS minutos_retraso
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
        ORDER BY a.nombre ASC
    `;

    try {
        const resultado = await db.query(sql);
        const rows = resultado.rows || [];
        const asesores = rows.map((asesor) => ({
            ...asesor,
            llego_tarde: asesor.llego_tarde === true || asesor.llego_tarde === 1,
            minutos_retraso: Number(asesor.minutos_retraso) || 0
        }));

        return res.json({
            ok: true,
            total: asesores.length,
            asesores
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

module.exports = { obtenerDashboard };
