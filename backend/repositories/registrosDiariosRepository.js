const db = require("../config/db");

class RegistrosDiariosRepository {
    async listar({ fechaDesde, fechaHasta, asesorId = null }) {
        const result = await db.query(`
            SELECT r.id, r.asesor_id, a.nombre AS asesor_nombre, r.fecha,
                   r.datos_cantidad, r.datos_ids,
                   r.analisis_cantidad, r.analisis_ids,
                   r.creado_por, r.actualizado_por,
                   r.created_at, r.updated_at
            FROM registros_diarios_analistas r
            INNER JOIN asesores a ON a.id = r.asesor_id
            WHERE r.fecha BETWEEN $1::date AND $2::date
              AND ($3::integer IS NULL OR r.asesor_id = $3::integer)
            ORDER BY r.fecha DESC, a.nombre ASC
        `, [fechaDesde, fechaHasta, asesorId]);
        return result.rows;
    }

    async guardar(datos, usuarioId) {
        const result = await db.query(`
            INSERT INTO registros_diarios_analistas
                (asesor_id, fecha, datos_cantidad, datos_ids,
                 analisis_cantidad, analisis_ids, creado_por, actualizado_por)
            VALUES ($1, $2::date, $3, $4, $5, $6, $7, $7)
            ON CONFLICT (asesor_id, fecha)
            DO UPDATE SET
                datos_cantidad = EXCLUDED.datos_cantidad,
                datos_ids = EXCLUDED.datos_ids,
                analisis_cantidad = EXCLUDED.analisis_cantidad,
                analisis_ids = EXCLUDED.analisis_ids,
                actualizado_por = EXCLUDED.actualizado_por,
                updated_at = NOW()
            RETURNING id, asesor_id, fecha, datos_cantidad, datos_ids,
                      analisis_cantidad, analisis_ids, created_at, updated_at
        `, [
            datos.asesor_id,
            datos.fecha,
            datos.datos_cantidad,
            datos.datos_ids,
            datos.analisis_cantidad,
            datos.analisis_ids,
            usuarioId || null
        ]);
        return result.rows[0];
    }
}

module.exports = new RegistrosDiariosRepository();
