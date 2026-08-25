const db = require("../config/db");

class MovimientosRepository {

    // ======================================================
    // EJECUTAR CONSULTAS POSTGRESQL (SUPABASE)
    // ======================================================

    async ejecutar(sql, parametros = []) {
        // Convertir signos '?' de MySQL a '$1, $2, $3...' de PostgreSQL
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);

            // Si es un SELECT o consulta que retorna filas
            if (resultado.rows) {
                return resultado.rows;
            }

            return resultado;
        } catch (error) {
            console.error("❌ Error ejecutando SQL en PostgreSQL:", error);
            throw error;
        }
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
                TO_CHAR(inicio_estado, 'YYYY-MM-DD HH24:MI:SS') AS inicio_estado,
                TO_CHAR(inicio_jornada, 'YYYY-MM-DD HH24:MI:SS') AS inicio_jornada,
                TO_CHAR(ultima_actualizacion, 'YYYY-MM-DD HH24:MI:SS') AS ultima_actualizacion
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

    async crearEstadoActual(asesorId, estado, inicioEstado, inicioJornada) {
        if (!asesorId) throw new Error("El asesor es obligatorio para crear el estado actual.");
        if (!estado) throw new Error("El estado es obligatorio para crear el estado actual.");
        if (!inicioEstado) throw new Error("La fecha de inicio del estado es obligatoria.");
        if (!inicioJornada) throw new Error("La fecha de inicio de jornada es obligatoria.");

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

        const formatearFecha = (fecha) => {
            return new Intl.DateTimeFormat("sv-SE", {
                timeZone: "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).format(fecha).replace(",", "");
        };

        const inicioEstadoMysql = formatearFecha(inicioEstado);
        const inicioJornadaMysql = formatearFecha(inicioJornada);

        return await this.ejecutar(sql, [
            asesorId,
            estado,
            inicioEstadoMysql,
            inicioJornadaMysql,
            inicioEstadoMysql
        ]);
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
                ?::date,
                ?,
                0, 0, 0, 0, 0, 0, 0, 0, 0
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

    async actualizarEstadoActual(asesorId, estado, inicioEstado, inicioJornada = null) {
        if (!asesorId) throw new Error("El asesor es obligatorio para actualizar el estado.");
        if (!estado) throw new Error("El estado es obligatorio.");
        if (!inicioEstado) throw new Error("La fecha de inicio del estado es obligatoria.");

        const formatearFecha = (fecha) => {
            return new Intl.DateTimeFormat("sv-SE", {
                timeZone: "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).format(fecha).replace(",", "");
        };

        const inicioEstadoMysql = formatearFecha(inicioEstado);
        const inicioJornadaMysql = inicioJornada ? formatearFecha(inicioJornada) : null;

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

            return await this.ejecutar(sql, [
                estado,
                inicioEstadoMysql,
                inicioJornadaMysql,
                inicioEstadoMysql,
                asesorId
            ]);
        }

        const sql = `
            UPDATE estados_actuales
            SET
                estado = ?,
                inicio_estado = ?,
                ultima_actualizacion = ?
            WHERE asesor_id = ?
        `;

        return await this.ejecutar(sql, [
            estado,
            inicioEstadoMysql,
            inicioEstadoMysql,
            asesorId
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
    // ELIMINAR ESTADO ACTUAL
    // ======================================================

    async eliminarEstadoActual(asesorId) {
        const sql = `
            DELETE FROM estados_actuales
            WHERE asesor_id = ?
        `;

        return await this.ejecutar(sql, [asesorId]);
    }

    // ======================================================
    // OBTENER HISTORIAL
    // ======================================================

    async obtenerHistorial(asesorId) {
        const sql = `
            SELECT
                id,
                tipo,
                TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                observacion
            FROM movimientos
            WHERE asesor_id = ?
            ORDER BY fecha_hora DESC, id DESC
        `;

        return await this.ejecutar(sql, [asesorId]);
    }

    // ======================================================
    // OBTENER RESUMEN DE JORNADA
    // ======================================================

    async obtenerResumenJornada(asesorId) {
        return await this.obtenerResumenDia(asesorId);
    }

    // ======================================================
    // OBTENER ÚLTIMO MOVIMIENTO
    // ======================================================

    async obtenerUltimoMovimiento(asesorId) {
        const sql = `
            SELECT
                id,
                tipo,
                TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
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

    async insertarMovimiento(asesorId, tipo, fechaHora = new Date(), observacion = null) {
        const fechaMysql = new Intl.DateTimeFormat("sv-SE", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(fechaHora).replace(",", "");

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
    // OBTENER MOVIMIENTOS DEL DÍA ACTUAL - COLOMBIA
    // ======================================================

    async obtenerMovimientosDelDia(asesorId) {
        if (!asesorId) throw new Error("El asesor es obligatorio.");

        const sql = `
            SELECT
                id,
                tipo,
                TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                observacion
            FROM movimientos
            WHERE
                asesor_id = ?
                AND fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
                AND fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
                AND fecha_hora <= (NOW() AT TIME ZONE 'America/Bogota')
            ORDER BY
                fecha_hora ASC,
                id ASC
        `;

        return await this.ejecutar(sql, [asesorId]);
    }

    // ======================================================
    // OBTENER RESUMEN DEL DÍA
    // ======================================================

    async obtenerResumenDia(asesorId) {
        if (!asesorId) throw new Error("El asesor es obligatorio.");

        const resumenSQL = `
            SELECT
                id,
                asesor_id,
                TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(hora_entrada, 'YYYY-MM-DD HH24:MI:SS') AS hora_entrada,
                TO_CHAR(hora_salida, 'YYYY-MM-DD HH24:MI:SS') AS hora_salida,
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
                AND fecha = (NOW() AT TIME ZONE 'America/Bogota')::date
            ORDER BY id DESC
            LIMIT 1
        `;

        const asesorSQL = `
            SELECT id, nombre
            FROM asesores
            WHERE id = ?
            LIMIT 1
        `;

        const estadoSQL = `
            SELECT
                estado,
                TO_CHAR(inicio_estado, 'YYYY-MM-DD HH24:MI:SS') AS inicio_estado,
                TO_CHAR(inicio_jornada, 'YYYY-MM-DD HH24:MI:SS') AS inicio_jornada
            FROM estados_actuales
            WHERE asesor_id = ?
            LIMIT 1
        `;

        const movimientosSQL = `
            SELECT
                id,
                tipo,
                TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                observacion
            FROM movimientos
            WHERE
                asesor_id = ?
                AND fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
                AND fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
            ORDER BY
                fecha_hora ASC,
                id ASC
        `;

        const resumen = await this.ejecutar(resumenSQL, [asesorId]);
        if (!resumen.length) return null;

        const asesor = await this.ejecutar(asesorSQL, [asesorId]);
        const estado = await this.ejecutar(estadoSQL, [asesorId]);
        const movimientos = await this.ejecutar(movimientosSQL, [asesorId]);

        return {
            ...resumen[0],
            asesor: asesor[0] || null,
            jornada: estado[0] || null,
            movimientos
        };
    }
}

module.exports = new MovimientosRepository();