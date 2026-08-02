const db = require("../config/db");

class MovimientosRepository {
    // ======================================================
// EJECUTAR CONSULTAS MYSQL
// ======================================================

async ejecutar(sql, parametros = []) {

    return new Promise((resolve, reject) => {

        db.query(

            sql,

            parametros,

            (error, resultado) => {

                if (error) {
                    return reject(error);
                }

                resolve(resultado);

            }

        );

    });

}
// ======================================================
// OBTENER CONFIGURACIÓN DEL SISTEMA
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

    return filas.length ? filas[0] : null;

}
// ======================================================
// OBTENER ASESOR POR ID
// ======================================================

async obtenerAsesor(id) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                id,
                nombre,
                activo
            FROM asesores
            WHERE id = ?
            LIMIT 1
        `;

        db.query(sql, [id], (error, rows) => {

            if (error) {
                return reject(error);
            }

            if (!rows || rows.length === 0) {
                return resolve(null);
            }

            resolve(rows[0]);

        });

    });

}

}

// ======================================================
// OBTENER ESTADO ACTUAL DEL ASESOR
// ======================================================

async obtenerEstadoActual(asesorId) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                asesor_id,
                estado,
                inicio_estado,
                ultima_actualizacion
            FROM estados_actuales
            WHERE asesor_id = ?
            LIMIT 1
        `;

        db.query(sql, [asesorId], (error, rows) => {

            if (error) {
                return reject(error);
            }

            if (!rows || rows.length === 0) {
                return resolve(null);
            }

            resolve(rows[0]);

        });

    });

}
// ======================================================
// CREAR ESTADO ACTUAL DEL ASESOR
// ======================================================

async crearEstadoActual(asesorId, estado, inicioEstado = null) {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO estados_actuales (
                asesor_id,
                estado,
                inicio_estado
            )
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                asesorId,
                estado,
                inicioEstado
            ],
            (error, result) => {

                if (error) {
                    return reject(error);
                }

                resolve(result);

            }
        );

    });

}
// ======================================================
// ACTUALIZAR ESTADO ACTUAL DEL ASESOR
// ======================================================

async actualizarEstadoActual(
    asesorId,
    estado,
    inicioEstado = null
) {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE estados_actuales
            SET
                estado = ?,
                inicio_estado = ?,
                ultima_actualizacion = NOW()
            WHERE asesor_id = ?
        `;

        db.query(
            sql,
            [
                estado,
                inicioEstado,
                asesorId
            ],
            (error, result) => {

                if (error) {
                    return reject(error);
                }

                resolve(result);

            }
        );

    });

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

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO movimientos (
                asesor_id,
                tipo,
                fecha_hora,
                observacion
            )
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                asesorId,
                tipo,
                fechaHora,
                observacion
            ],
            (error, result) => {

                if (error) {
                    return reject(error);
                }

                resolve({
                    id: result.insertId,
                    affectedRows: result.affectedRows
                });

            }
        );

    });

}
// ======================================================
// OBTENER ÚLTIMO INICIO DE MOVIMIENTO
// ======================================================

async obtenerInicioMovimiento(
    asesorId,
    tipoInicio
) {

    const sql = `
        SELECT
            id,
            asesor_id,
            tipo,
            fecha_hora,
            observacion
        FROM movimientos
        WHERE asesor_id = ?
        AND tipo = ?
        AND DATE(fecha_hora) = CURDATE()
        ORDER BY
            fecha_hora DESC,
            id DESC
        LIMIT 1
    `;

    const filas = await this.ejecutar(

        sql,

        [
            asesorId,
            tipoInicio
        ]

    );

    return filas.length ? filas[0] : null;

}
// ======================================================
// OBTENER MOVIMIENTOS DEL DÍA
// ======================================================

async obtenerMovimientosDelDia(asesorId) {

    const sql = `
        SELECT
            id,
            tipo,
            fecha_hora,
            observacion
        FROM movimientos
        WHERE asesor_id = ?
        AND DATE(fecha_hora) = CURDATE()
        ORDER BY fecha_hora ASC
    `;

    return await this.ejecutar(

        sql,

        [asesorId]

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
        ORDER BY
            fecha_hora DESC,
            id DESC
        LIMIT 1
    `;

    const filas = await this.ejecutar(

        sql,

        [asesorId]

    );

    return filas.length ? filas[0] : null;

}
module.exports = new MovimientosRepository();