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

        return await this.ejecutar(sql, [asesorId]);

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