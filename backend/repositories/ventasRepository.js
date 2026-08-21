// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// VENTAS REPOSITORY
// ======================================================

const db = require("../config/db");

class VentasRepository {

    // ==================================================
    // EJECUTAR CONSULTA
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
    // CREAR VENTA
    // ==================================================

    async crearVenta(
        asesorId,
        valor,
        fechaHora,
        observacion = null
    ) {

        const sql = `

            INSERT INTO ventas (

                asesor_id,

                valor,

                fecha_hora,

                observacion,

                estado

            )

            VALUES (?, ?, ?, ?, 'ACTIVA')

        `;


        return await this.ejecutar(
            sql,
            [

                asesorId,

                valor,

                fechaHora,

                observacion

            ]
        );

    }


    // ==================================================
    // OBTENER VENTA POR ID
    // ==================================================

    async obtenerVentaPorId(
        id
    ) {

        const sql = `

            SELECT

                v.id,

                v.asesor_id,

                v.valor,

                DATE_FORMAT(
                    v.fecha_hora,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fecha_hora,

                v.observacion,

                v.estado,

                DATE_FORMAT(
                    v.creado,
                    '%Y-%m-%d %H:%i:%s'
                ) AS creado,

                a.nombre AS asesor_nombre

            FROM ventas v

            INNER JOIN asesores a
                ON a.id = v.asesor_id

            WHERE v.id = ?

            LIMIT 1

        `;


        const resultado =
            await this.ejecutar(
                sql,
                [id]
            );


        return resultado.length
            ? resultado[0]
            : null;

    }


    // ==================================================
    // OBTENER VENTAS DEL DÍA
    // COLOMBIA UTC-05:00
    // ==================================================

    async obtenerVentasDelDia() {

        const sql = `

            SELECT

                v.id,

                v.asesor_id,

                v.valor,

                DATE_FORMAT(
                    v.fecha_hora,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fecha_hora,

                v.observacion,

                v.estado,

                a.nombre AS asesor_nombre

            FROM ventas v

            INNER JOIN asesores a
                ON a.id = v.asesor_id

            WHERE

                v.fecha_hora >= DATE(
                    CONVERT_TZ(
                        UTC_TIMESTAMP(),
                        '+00:00',
                        '-05:00'
                    )
                )

                AND v.fecha_hora < DATE(
                    CONVERT_TZ(
                        UTC_TIMESTAMP(),
                        '+00:00',
                        '-05:00'
                    )
                ) + INTERVAL 1 DAY

            ORDER BY

                v.fecha_hora DESC,

                v.id DESC

        `;


        return await this.ejecutar(
            sql
        );

    }


    // ==================================================
    // OBTENER VENTAS DE UN ASESOR
    // ==================================================

    async obtenerVentasPorAsesor(
        asesorId
    ) {

        const sql = `

            SELECT

                v.id,

                v.asesor_id,

                v.valor,

                DATE_FORMAT(
                    v.fecha_hora,
                    '%Y-%m-%d %H:%i:%s'
                ) AS fecha_hora,

                v.observacion,

                v.estado,

                a.nombre AS asesor_nombre

            FROM ventas v

            INNER JOIN asesores a
                ON a.id = v.asesor_id

            WHERE

                v.asesor_id = ?

            ORDER BY

                v.fecha_hora DESC,

                v.id DESC

        `;


        return await this.ejecutar(
            sql,
            [asesorId]
        );

    }


    // ==================================================
    // ANULAR VENTA
    // ==================================================

    async anularVenta(
        id
    ) {

        const sql = `

            UPDATE ventas

            SET

                estado = 'ANULADA'

            WHERE

                id = ?

                AND estado = 'ACTIVA'

        `;


        return await this.ejecutar(
            sql,
            [id]
        );

    }


    // ==================================================
    // RESUMEN DE VENTAS DEL DÍA
    // ==================================================

    async obtenerResumenVentasDelDia() {

        const sql = `

            SELECT

                COUNT(*) AS cantidad_ventas,

                COALESCE(
                    SUM(valor),
                    0
                ) AS total_vendido

            FROM ventas

            WHERE

                estado = 'ACTIVA'

                AND fecha_hora >= DATE(
                    CONVERT_TZ(
                        UTC_TIMESTAMP(),
                        '+00:00',
                        '-05:00'
                    )
                )

                AND fecha_hora < DATE(
                    CONVERT_TZ(
                        UTC_TIMESTAMP(),
                        '+00:00',
                        '-05:00'
                    )
                ) + INTERVAL 1 DAY

        `;


        const resultado =
            await this.ejecutar(
                sql
            );


        return resultado[0] || {

            cantidad_ventas: 0,

            total_vendido: 0

        };

    }


    // ==================================================
    // RESUMEN DE VENTAS POR ASESOR
    // ==================================================

    async obtenerResumenVentasPorAsesor() {

        const sql = `

            SELECT

                a.id AS asesor_id,

                a.nombre AS asesor_nombre,

                COUNT(v.id) AS cantidad_ventas,

                COALESCE(
                    SUM(v.valor),
                    0
                ) AS total_vendido

            FROM asesores a

            LEFT JOIN ventas v

                ON v.asesor_id = a.id

                AND v.estado = 'ACTIVA'

                AND v.fecha_hora >= DATE(
                    CONVERT_TZ(
                        UTC_TIMESTAMP(),
                        '+00:00',
                        '-05:00'
                    )
                )

                AND v.fecha_hora < DATE(
                    CONVERT_TZ(
                        UTC_TIMESTAMP(),
                        '+00:00',
                        '-05:00'
                    )
                ) + INTERVAL 1 DAY

            WHERE

                a.activo = 1

            GROUP BY

                a.id,

                a.nombre

            ORDER BY

                total_vendido DESC,

                cantidad_ventas DESC

        `;


        return await this.ejecutar(
            sql
        );

    }

}


// ======================================================
// EXPORTAR
// ======================================================

module.exports =
    new VentasRepository();