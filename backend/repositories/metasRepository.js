const db = require("../config/db");

class MetasRepository {
    async listar(periodoInicio, periodoFin, asesorId = null) {
        const result = await db.query(`
            SELECT
                m.id,
                m.asesor_id,
                a.nombre AS asesor_nombre,
                m.periodo_tipo,
                m.periodo_inicio,
                m.periodo_fin,
                m.meta_ventas,
                m.meta_recaudo,
                COALESCE(v.cantidad_ventas, 0) AS ventas_actuales,
                COALESCE(v.total_recaudo, 0) AS recaudo_actual,
                COALESCE(v.total_vendido, 0) AS vendido_actual
            FROM metas_asesores m
            INNER JOIN asesores a ON a.id = m.asesor_id
            LEFT JOIN (
                SELECT asesor_id,
                       COUNT(*) AS cantidad_ventas,
                       COALESCE(SUM(valor), 0) AS total_vendido,
                       COALESCE(SUM(recaudo), 0) AS total_recaudo
                FROM ventas
                WHERE estado = 'ACTIVA'
                  AND fecha_hora >= $1::date
                  AND fecha_hora < ($2::date + INTERVAL '1 day')
                GROUP BY asesor_id
            ) v ON v.asesor_id = m.asesor_id
            WHERE m.periodo_inicio = $1::date
              AND m.periodo_fin = $2::date
              AND ($3::integer IS NULL OR m.asesor_id = $3::integer)
            ORDER BY a.nombre ASC
        `, [periodoInicio, periodoFin, asesorId]);
        return result.rows;
    }

    async guardar(datos, usuarioId) {
        const result = await db.query(`
            INSERT INTO metas_asesores
                (asesor_id, periodo_tipo, periodo_inicio, periodo_fin, meta_ventas, meta_recaudo, updated_by)
            VALUES ($1, $2, $3::date, $4::date, $5, $6, $7)
            ON CONFLICT (asesor_id, periodo_tipo, periodo_inicio, periodo_fin)
            DO UPDATE SET
                meta_ventas = EXCLUDED.meta_ventas,
                meta_recaudo = EXCLUDED.meta_recaudo,
                updated_at = NOW(),
                updated_by = EXCLUDED.updated_by
            RETURNING *
        `, [datos.asesor_id, datos.periodo_tipo, datos.periodo_inicio, datos.periodo_fin, datos.meta_ventas, datos.meta_recaudo, usuarioId || null]);
        return result.rows[0];
    }
}

module.exports = new MetasRepository();
