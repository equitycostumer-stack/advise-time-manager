// ======================================================
// ADVISE SOLUTIONS SERVICES - Reportes Repository
// ======================================================
const db = require("../config/db");

class ReportesRepository {
    async ejecutar(sql, parametros = []) {
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);
        const resultado = await db.query(sqlPostgres, parametros);
        return resultado.rows || resultado;
    }

    async obtenerAsistenciaPorRango(desde, hasta, asesorId = null) {
        return this.ejecutar(`
            SELECT r.id, r.asesor_id, a.nombre AS asesor_nombre,
                   TO_CHAR(r.fecha, 'YYYY-MM-DD') AS fecha,
                   TO_CHAR(r.hora_entrada, 'YYYY-MM-DD HH24:MI:SS') AS hora_entrada,
                   TO_CHAR(r.hora_salida, 'YYYY-MM-DD HH24:MI:SS') AS hora_salida,
                   r.tiempo_trabajado, r.tiempo_break, r.tiempo_almuerzo,
                   r.tiempo_bano, r.tiempo_capacitacion, r.tiempo_reunion,
                   r.tiempo_productivo, r.llego_tarde, r.minutos_retraso
            FROM resumen_jornada r INNER JOIN asesores a ON a.id = r.asesor_id
            WHERE r.fecha >= ?::date AND r.fecha <= ?::date
              AND (?::integer IS NULL OR r.asesor_id = ?::integer)
            ORDER BY r.fecha ASC, a.nombre ASC
            LIMIT 5000
        `, [desde, hasta, asesorId, asesorId]);
    }

    async obtenerVentasPorRango(desde, hasta, asesorId = null) {
        return this.ejecutar(`
            SELECT v.id, v.asesor_id, a.nombre AS asesor_nombre, v.cliente_id,
                   v.valor, v.recaudo,
                   TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                   v.observacion, v.estado
            FROM ventas v INNER JOIN asesores a ON a.id = v.asesor_id
            WHERE v.fecha_hora >= ?::date
              AND v.fecha_hora < (?::date + INTERVAL '1 day')
              AND (?::integer IS NULL OR v.asesor_id = ?::integer)
            ORDER BY v.fecha_hora ASC, v.id ASC
            LIMIT 5000
        `, [desde, hasta, asesorId, asesorId]);
    }
}
module.exports = new ReportesRepository();
