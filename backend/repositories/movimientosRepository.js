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

                resolve(resultado);

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

        return filas.length ? filas[0] : null;

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

        return filas.length ? filas[0] : null;

    }

 // ======================================================
    // OBTENER ESTADO ACTUAL
    // ======================================================

    async obtenerEstadoActual(asesorId) {

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

        const filas = await this.ejecutar(sql, [asesorId]);

        return filas.length ? filas[0] : null;

    }

    // ======================================================
    // CREAR ESTADO ACTUAL
    // ======================================================

    async crearEstadoActual(
        asesorId,
        estado,
        inicioEstado = new Date()
    ) {

        const sql = `
            INSERT INTO estados_actuales (
                asesor_id,
                estado,
                inicio_estado
            )
            VALUES (?, ?, ?)
        `;

        return await this.ejecutar(sql, [
            asesorId,
            estado,
            inicioEstado
        ]);

    }

    // ======================================================
    // ACTUALIZAR ESTADO ACTUAL
    // ======================================================

    async actualizarEstadoActual(
        asesorId,
        estado,
        inicioEstado = new Date()
    ) {

        const sql = `
            UPDATE estados_actuales
            SET
                estado = ?,
                inicio_estado = ?,
                ultima_actualizacion = NOW()
            WHERE asesor_id = ?
        `;

        return await this.ejecutar(sql, [
            estado,
            inicioEstado,
            asesorId
        ]);

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
            fechaHora,
            observacion
        ]);

    }

    // ======================================================
// OBTENER MOVIMIENTOS DEL DÍA
// ======================================================

async obtenerMovimientosDelDia(asesorId, fecha = null) {

    const sql = `
        SELECT
            id,
            asesor_id,
            tipo,
            fecha_hora,
            observacion
        FROM movimientos
        WHERE asesor_id = ?
          AND DATE(fecha_hora) = COALESCE(?, CURDATE())
        ORDER BY fecha_hora ASC, id ASC
    `;

    return await this.ejecutar(sql, [
        asesorId,
        fecha
    ]);

}
// ======================================================
// OBTENER ÚLTIMO RESUMEN DEL DÍA
// ======================================================

async obtenerResumenDia(asesorId, fecha = null) {

    const sql = `
        SELECT *
        FROM resumen_jornada
        WHERE asesor_id = ?
          AND fecha = COALESCE(?, CURDATE())
        ORDER BY id DESC
        LIMIT 1
    `;

    const filas = await this.ejecutar(sql, [
        asesorId,
        fecha
    ]);

    return filas.length ? filas[0] : null;

}

// ======================================================
// CREAR RESUMEN DEL DÍA
// ======================================================

async crearResumenDia(datos) {

    const sql = `
        INSERT INTO resumen_jornada (

            asesor_id,
            fecha,
            hora_entrada,
            hora_salida,

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
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    return await this.ejecutar(sql, [

        datos.asesor_id,
        datos.fecha,
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
        datos.minutos_retraso

    ]);

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

}
module.exports = new MovimientosRepository();