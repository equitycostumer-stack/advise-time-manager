// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// REPORTES REPOSITORY (histórico multi-día)
// ======================================================

const db = require("../config/db");

class ReportesRepository {

    // ==================================================
    // EJECUTAR CONSULTA (mismo patrón validado del resto
    // del proyecto — db.query() con callback + Promise)
    // ==================================================

    ejecutar(sql, parametros = []) {

        return new Promise((resolve, reject) => {

            db.query(sql, parametros, (error, resultado) => {

                if (error) {
                    return reject(error);
                }

                resolve(resultado);

            });

        });

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

                DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,

                DATE_FORMAT(r.hora_entrada, '%Y-%m-%d %H:%i:%s') AS hora_entrada,

                DATE_FORMAT(r.hora_salida, '%Y-%m-%d %H:%i:%s') AS hora_salida,

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

                r.fecha >= ?
                AND r.fecha <= ?

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

                DATE_FORMAT(v.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora,

                v.observacion,

                v.estado

            FROM ventas v

            INNER JOIN asesores a
                ON a.id = v.asesor_id

            WHERE

                DATE(v.fecha_hora) >= ?
                AND DATE(v.fecha_hora) <= ?

            ORDER BY

                v.fecha_hora ASC

        `;

        return await this.ejecutar(sql, [desde, hasta]);

    }

}

module.exports = new ReportesRepository();