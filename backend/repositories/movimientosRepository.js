const db = require("../config/db");

class MovimientosRepository {

    // ======================================================
// EJECUTAR CONSULTAS MYSQL
// ======================================================

ejecutar(sql, parametros = []) {

    return new Promise((resolve, reject) => {

        db.query(sql, parametros, (error, resultado) => {

            if (error) {
                return reject(error);
            }

            // ==========================================
            // NORMALIZAR FECHAS MYSQL -> HORA COLOMBIA
            // ==========================================

            const normalizar = (fila) => {

                for (const campo in fila) {

                    if (fila[campo] instanceof Date) {

                        const fecha = fila[campo];

                        fecha.setHours(
                            fecha.getHours() - 5
                        );

                    }

                }

                return fila;

            };

            if (Array.isArray(resultado)) {

                resolve(resultado.map(normalizar));

            } else {

                resolve(resultado);

            }

        });

    });

}

// ======================================================
// OBTENER CONFIGURACIÓN
// ======================================================

async obtenerConfiguracion() {

    const sql = `
        SELECT
            break_max,
            almuerzo_max,
            bano_max,
            capacitacion_max,
            reunion_max
        FROM configuracion
        WHERE id = 1
        LIMIT 1
    `;

    const filas = await this.ejecutar(sql);

    return filas.length
        ? filas[0]
        : null;

}

    // ======================================================
    // OBTENER ASESOR
    // ======================================================

    async obtenerAsesor(id) {

        const sql = `
            SELECT
                id,
                nombre,
                activo
            FROM asesores
            WHERE id = ?
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [id]);

        return filas.length
            ? filas[0]
            : null;

    }

    // ======================================================
    // OBTENER ESTADO ACTUAL
    // ======================================================

    async obtenerEstadoActual(asesorId) {

        const sql = `
            SELECT

                asesor_id,

                estado,

                DATE_FORMAT(
                    inicio_estado,
                    '%Y-%m-%d %H:%i:%s'
                ) AS inicio_estado,

                DATE_FORMAT(
                    inicio_jornada,
                    '%Y-%m-%d %H:%i:%s'
                ) AS inicio_jornada,

                ultima_actualizacion

            FROM estados_actuales

            WHERE asesor_id = ?

            LIMIT 1
        `;

        const filas = await this.ejecutar(
            sql,
            [asesorId]
        );

        return filas.length
            ? filas[0]
            : null;

    }

// ======================================================
// CREAR ESTADO ACTUAL
// ======================================================

async crearEstadoActual(

    asesorId,
    estado,
    inicioEstado,
    inicioJornada

) {

    // --------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------

    if (!asesorId) {

        throw new Error(
            "El asesor es obligatorio para crear el estado actual."
        );

    }

    if (!estado) {

        throw new Error(
            "El estado es obligatorio para crear el estado actual."
        );

    }

    if (!inicioEstado) {

        throw new Error(
            "La fecha de inicio del estado es obligatoria."
        );

    }

    if (!inicioJornada) {

        throw new Error(
            "La fecha de inicio de jornada es obligatoria."
        );

    }

    // --------------------------------------------------
    // SQL
    // --------------------------------------------------

    const sql = `

        INSERT INTO estados_actuales (

            asesor_id,
            estado,
            inicio_estado,
            inicio_jornada,
            ultima_actualizacion

        )

        VALUES (?, ?, ?, ?, ?)

    `;

    // --------------------------------------------------
    // EJECUTAR
    // --------------------------------------------------

    return await this.ejecutar(

        sql,

        [

            asesorId,
            estado,
            inicioEstado,
            inicioJornada,
            inicioEstado

        ]

    );

}
// ======================================================
// CREAR RESUMEN DEL DÍA
// ======================================================

async crearResumenDia(asesorId, fechaHora) {

    const sql = `
        INSERT INTO resumen_jornada (

            asesor_id,
            fecha,
            hora_entrada,

            tiempo_trabajado,
            tiempo_break,
            tiempo_almuerzo,
            tiempo_bano,
            tiempo_capacitacion,
            tiempo_reunion,
            tiempo_productivo,

            llego_tarde,
            minutos_retraso

        )

        VALUES (

            ?,
            DATE(?),
            ?,

            0,
            0,
            0,
            0,
            0,
            0,
            0,

            0,
            0

        )
    `;

    return await this.ejecutar(sql, [
        asesorId,
        fechaHora,
        fechaHora
    ]);

}
// ======================================================
// ACTUALIZAR ESTADO ACTUAL
// ======================================================

async actualizarEstadoActual(
    asesorId,
    estado,
    inicioEstado,
    inicioJornada = null
) {

    // ===========================================
    // VALIDACIONES
    // ===========================================

    if (!asesorId) {
        throw new Error(
            "El asesor es obligatorio para actualizar el estado."
        );
    }

    if (!estado) {
        throw new Error(
            "El estado es obligatorio."
        );
    }

    if (!inicioEstado) {
        throw new Error(
            "La fecha de inicio del estado es obligatoria."
        );
    }

    // ===========================================
    // FORMATEAR FECHAS PARA MYSQL
    // ===========================================

    const formatearFecha = (fecha) => {

        return new Date(
            fecha.getTime() -
            fecha.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

    };

    const inicioEstadoMysql =
        formatearFecha(inicioEstado);

    const inicioJornadaMysql =
        inicioJornada
            ? formatearFecha(inicioJornada)
            : null;

    // ===========================================
    // NUEVA JORNADA
    // ===========================================

    if (inicioJornadaMysql !== null) {

        const sql = `

            UPDATE estados_actuales

            SET
                estado = ?,
                inicio_estado = ?,
                inicio_jornada = ?,
                ultima_actualizacion = ?

            WHERE asesor_id = ?

        `;

        return await this.ejecutar(
            sql,
            [
                estado,
                inicioEstadoMysql,
                inicioJornadaMysql,
                inicioEstadoMysql,
                asesorId
            ]
        );

    }

    // ===========================================
    // CAMBIO DE ESTADO
    // ===========================================

    const sql = `

        UPDATE estados_actuales

        SET
            estado = ?,
            inicio_estado = ?,
            ultima_actualizacion = ?

        WHERE asesor_id = ?

    `;

    return await this.ejecutar(
        sql,
        [
            estado,
            inicioEstadoMysql,
            inicioEstadoMysql,
            asesorId
        ]
    );

}

// ======================================================
// ACTUALIZAR RESUMEN DEL DÍA
// ======================================================

async actualizarResumenDia(id, datos) {

    const sql = `
        UPDATE resumen_jornada
        SET

            hora_entrada = ?,
            hora_salida = ?,

            tiempo_trabajado = ?,
            tiempo_break = ?,
            tiempo_almuerzo = ?,
            tiempo_bano = ?,
            tiempo_capacitacion = ?,
            tiempo_reunion = ?,
            tiempo_productivo = ?,

            llego_tarde = ?,
            minutos_retraso = ?

        WHERE id = ?
    `;

    return await this.ejecutar(sql, [

        datos.hora_entrada,
        datos.hora_salida,

        datos.tiempo_trabajado,
        datos.tiempo_break,
        datos.tiempo_almuerzo,
        datos.tiempo_bano,
        datos.tiempo_capacitacion,
        datos.tiempo_reunion,
        datos.tiempo_productivo,

        datos.llego_tarde,
        datos.minutos_retraso,

        id

    ]);

    }
// ======================================================
// ELIMINAR ESTADO ACTUAL
// ======================================================

async eliminarEstadoActual(asesorId) {

    const sql = `
        DELETE
        FROM estados_actuales
        WHERE asesor_id = ?
    `;

    return await this.ejecutar(sql, [
        asesorId
    ]);

}

// ======================================================
// OBTENER HISTORIAL
// ======================================================

async obtenerHistorial(asesorId) {

    const sql = `
        SELECT
            id,
            tipo,
            fecha_hora,
            observacion
        FROM movimientos
        WHERE asesor_id = ?
        ORDER BY fecha_hora DESC,id DESC
    `;

    return await this.ejecutar(sql, [
        asesorId
    ]);

}

// ======================================================
// OBTENER RESUMEN DE JORNADA
// ======================================================

async obtenerResumenJornada(asesorId) {

    return await this.obtenerResumenDia(
        asesorId
    );

}
    // ======================================================
    // OBTENER ÚLTIMO MOVIMIENTO
    // ======================================================

    async obtenerUltimoMovimiento(asesorId) {

        const sql = `
            SELECT
                id,
                tipo,
                fecha_hora,
                observacion
            FROM movimientos
            WHERE asesor_id = ?
            ORDER BY fecha_hora DESC, id DESC
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [asesorId]);

        return filas.length ? filas[0] : null;

    }
// ======================================================
// INSERTAR MOVIMIENTO
// ======================================================

async insertarMovimiento(
    asesorId,
    tipo,
    fechaHora = new Date(),
    observacion = null
) {

    // ===========================================
    // FORMATEAR FECHA PARA MYSQL
    // ===========================================

    const fechaMysql = new Date(
        fechaHora.getTime() -
        fechaHora.getTimezoneOffset() * 60000
    )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    const sql = `

        INSERT INTO movimientos (

            asesor_id,

            tipo,

            fecha_hora,

            observacion

        )

        VALUES (?, ?, ?, ?)

    `;

    return await this.ejecutar(sql, [

        asesorId,

        tipo,

        fechaMysql,

        observacion

    ]);

}

// ======================================================
// OBTENER MOVIMIENTOS DEL DÍA ACTUAL
// ======================================================

async obtenerMovimientosDelDia(asesorId) {

    // --------------------------------------------------
    // VALIDACIÓN
    // --------------------------------------------------

    if (!asesorId) {

        throw new Error(
            "El asesor es obligatorio."
        );

    }

    // --------------------------------------------------
    // MOVIMIENTOS DEL DÍA
    // --------------------------------------------------

    const sql = `

        SELECT

            id,

            tipo,

            DATE_FORMAT(
                fecha_hora,
                '%Y-%m-%d %H:%i:%s'
            ) AS fecha_hora,

            observacion

        FROM movimientos

        WHERE

            asesor_id = ?

            AND DATE(fecha_hora) = CURDATE()

        ORDER BY

            fecha_hora ASC,

            id ASC

    `;

    return await this.ejecutar(

        sql,

        [asesorId]

    );

}
// ======================================================
// OBTENER RESUMEN DEL DÍA
// ======================================================

async obtenerResumenDia(asesorId) {

    const resumenSQL = `
SELECT

    id,
    asesor_id,

    DATE_FORMAT(
        fecha,
        '%Y-%m-%d'
    ) AS fecha,

    DATE_FORMAT(
        hora_entrada,
        '%Y-%m-%d %H:%i:%s'
    ) AS hora_entrada,

    DATE_FORMAT(
        hora_salida,
        '%Y-%m-%d %H:%i:%s'
    ) AS hora_salida,

    tiempo_trabajado,
    tiempo_break,
    tiempo_almuerzo,
    tiempo_bano,
    tiempo_capacitacion,
    tiempo_reunion,
    tiempo_productivo,
    llego_tarde,
    minutos_retraso,
    created_at

FROM resumen_jornada

WHERE

    asesor_id = ?

    AND fecha = DATE(
        CONVERT_TZ(
            UTC_TIMESTAMP(),
            '+00:00',
            '-05:00'
        )
    )

LIMIT 1
`;

    const asesorSQL = `
        SELECT
            id,
            nombre
        FROM asesores
        WHERE id = ?
        LIMIT 1
    `;

    const estadoSQL = `
    SELECT
        estado,

        DATE_FORMAT(
            inicio_estado,
            '%Y-%m-%d %H:%i:%s'
        ) AS inicio_estado,

        DATE_FORMAT(
            inicio_jornada,
            '%Y-%m-%d %H:%i:%s'
        ) AS inicio_jornada

    FROM estados_actuales

    WHERE asesor_id = ?

    LIMIT 1
`;

    const movimientosSQL = `
    SELECT
        tipo,

        DATE_FORMAT(
            fecha_hora,
            '%Y-%m-%d %H:%i:%s'
        ) AS fecha_hora

    FROM movimientos

    WHERE asesor_id = ?

    ORDER BY fecha_hora ASC
`;

    const resumen =
        await this.ejecutar(resumenSQL,[asesorId]);

    if (!resumen.length)
        return null;

    const asesor =
        await this.ejecutar(asesorSQL,[asesorId]);

    const estado =
        await this.ejecutar(estadoSQL,[asesorId]);

    const movimientos =
        await this.ejecutar(movimientosSQL,[asesorId]);

    return {

        ...resumen[0],

        asesor: asesor[0] || null,

        jornada: estado[0] || null,

        movimientos

    };

}

}
module.exports = new MovimientosRepository();