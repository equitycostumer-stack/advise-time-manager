// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Reportes Repository (PostgreSQL / Supabase)
// ======================================================

const db = require("../config/db");

class ReportesRepository {

    // ==================================================
    // EJECUTAR CONSULTA POSTGRESQL
    // ==================================================

    async ejecutar(sql, parametros = []) {
        // Convertir signos '?' de MySQL a '$1, $2, $3...' de PostgreSQL
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);

            if (resultado.rows) {
                return resultado.rows;
            }

            return resultado;
        } catch (error) {
            console.error("❌ Error ejecutando SQL en PostgreSQL (Reportes):", error);
            throw error;
        }
    }

    // ==================================================
    // ASISTENCIA POR RANGO DE FECHAS
    // ==================================================

    async obtenerAsistenciaPorRango(desde, hasta) {
        const sql = `
            SELECT
                r.id,
                r.asesor_id,
                a.nombre AS asesor_nombre,
                TO_CHAR(r.fecha, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(r.hora_entrada, 'YYYY-MM-DD HH24:MI:SS') AS hora_entrada,
                TO_CHAR(r.hora_salida, 'YYYY-MM-DD HH24:MI:SS') AS hora_salida,
                r.tiempo_trabajado,
                r.tiempo_break,
                r.tiempo_almuerzo,
                r.tiempo_bano,
                r.tiempo_capacitacion,
                r.tiempo_reunion,
                r.tiempo_productivo,
                r.llego_tarde,
                r.minutos_retraso
            FROM resumen_jornada r
            INNER JOIN asesores a
                ON a.id = r.asesor_id
            WHERE
                r.fecha >= ?::date
                AND r.fecha <= ?::date
            ORDER BY
                r.fecha ASC,
                a.nombre ASC
        `;

        return await this.ejecutar(sql, [desde, hasta]);
    }

    // ==================================================
    // VENTAS DETALLADAS POR RANGO DE FECHAS
    // ==================================================

    async obtenerVentasPorRango(desde, hasta) {
        const sql = `
            SELECT
                v.id,
                v.asesor_id,
                a.nombre AS asesor_nombre,
                v.cliente_id,
                v.valor,
                TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                v.observacion,
                v.estado
            FROM ventas v
            INNER JOIN asesores a
                ON a.id = v.asesor_id
            WHERE
                (v.fecha_hora)::date >= ?::date
                AND (v.fecha_hora)::date <= ?::date
            ORDER BY
                v.fecha_hora ASC
        `;

        return await this.ejecutar(sql, [desde, hasta]);
    }

}

module.exports = new ReportesRepository();