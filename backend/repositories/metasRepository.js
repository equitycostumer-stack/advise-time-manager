const db = require("../config/db");
class MetasRepository {
    async listar(periodoInicio, periodoFin, asesorId = null) {
        const result = await db.query(`
            SELECT m.id, m.asesor_id, a.nombre AS asesor_nombre, m.periodo_tipo,
                   m.periodo_inicio, m.periodo_fin, m.meta_ventas, m.meta_recaudo,
                   COALESCE(v.cantidad_ventas, 0) AS ventas_actuales,
                   COALESCE(v.total_recaudo, 0) AS recaudo_actual,
                   COALESCE(v.total_vendido, 0) AS vendido_actual, m.updated_at
            FROM metas_asesores m
            INNER JOIN asesores a ON a.id = m.asesor_id
            LEFT JOIN (
                SELECT asesor_id, COUNT(*) AS cantidad_ventas,
                       COALESCE(SUM(valor), 0) AS total_vendido,
                       COALESCE(SUM(recaudo), 0) AS total_recaudo
                FROM ventas
                WHERE estado = 'ACTIVA'
                  AND fecha_hora >= $1::date
                  AND fecha_hora < ($2::date + INTERVAL '1 day')
                GROUP BY asesor_id
            ) v ON v.asesor_id = m.asesor_id
            WHERE m.periodo_inicio = $1::date AND m.periodo_fin = $2::date
              AND ($3::integer IS NULL OR m.asesor_id = $3::integer)
            ORDER BY a.nombre ASC
        `, [periodoInicio, periodoFin, asesorId]);
        return result.rows;
    }
    async guardar(datos, usuarioId) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query(`
                INSERT INTO metas_asesores
                    (asesor_id, periodo_tipo, periodo_inicio, periodo_fin, meta_ventas, meta_recaudo, updated_by)
                VALUES ($1, $2, $3::date, $4::date, $5, $6, $7)
                ON CONFLICT (asesor_id, periodo_tipo, periodo_inicio, periodo_fin)
                DO UPDATE SET meta_ventas = EXCLUDED.meta_ventas,
                              meta_recaudo = EXCLUDED.meta_recaudo,
                              updated_at = NOW(), updated_by = EXCLUDED.updated_by
                RETURNING *
            `, [datos.asesor_id, datos.periodo_tipo, datos.periodo_inicio, datos.periodo_fin, datos.meta_ventas, datos.meta_recaudo, usuarioId || null]);
            const meta = result.rows[0];
            await client.query(`
                INSERT INTO metas_asesores_auditoria
                    (meta_id, asesor_id, periodo_tipo, periodo_inicio, periodo_fin,
                     meta_ventas, meta_recaudo, cambiado_por)
                VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8)
            `, [meta.id, meta.asesor_id, meta.periodo_tipo, meta.periodo_inicio, meta.periodo_fin, meta.meta_ventas, meta.meta_recaudo, usuarioId || null]);
            await client.query("COMMIT");
            return meta;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
    async historial(periodoInicio, periodoFin, asesorId = null) {
        const result = await db.query(`
            SELECT h.id, h.meta_id, h.asesor_id, a.nombre AS asesor_nombre,
                   h.periodo_tipo, h.periodo_inicio, h.periodo_fin, h.meta_ventas,
                   h.meta_recaudo, h.cambiado_por, u.usuario AS cambiado_por_usuario,
                   h.cambiado_at
            FROM metas_asesores_auditoria h
            INNER JOIN asesores a ON a.id = h.asesor_id
            LEFT JOIN usuarios u ON u.id = h.cambiado_por
            WHERE h.periodo_inicio = $1::date AND h.periodo_fin = $2::date
              AND ($3::integer IS NULL OR h.asesor_id = $3::integer)
            ORDER BY h.cambiado_at DESC LIMIT 200
        `, [periodoInicio, periodoFin, asesorId]);
        return result.rows;
    }
}
module.exports = new MetasRepository();
