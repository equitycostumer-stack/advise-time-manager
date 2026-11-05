// ======================================================
// ADVISE SOLUTIONS SERVICES - Ventas Repository
// ======================================================
const db = require("../config/db");
const { asegurarColumnaGeneroAsesores } = require("../migrations/asesoresGenero");

class VentasRepository {
    async ejecutar(sql, parametros = []) {
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);
        const resultado = await db.query(sqlPostgres, parametros);
        return resultado.rows || resultado;
    }

    async crearVenta(asesorId, clienteId, valor, recaudo, fechaHora, observacion = null, usuario = null, motivoRetroactivo = null) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const resultado = await client.query(`
                INSERT INTO ventas (asesor_id, cliente_id, valor, recaudo, fecha_hora, observacion, estado)
                VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVA')
                RETURNING id, asesor_id, cliente_id, valor, recaudo, fecha_hora, observacion, estado
            `, [asesorId, clienteId, valor, recaudo, fechaHora, observacion]);
            const venta = resultado.rows[0];

            if (motivoRetroactivo) {
                await client.query(`
                    INSERT INTO ventas_cambios_auditoria
                        (venta_id, accion, datos_anteriores, datos_nuevos, motivo, cambiado_por)
                    VALUES ($1, 'EDICION', '{}'::jsonb, $2::jsonb, $3, $4)
                `, [venta.id, JSON.stringify({ ...venta, tipo_evento: "REGISTRO_RETROACTIVO" }), motivoRetroactivo, usuario?.id || null]);
            }

            await client.query("COMMIT");
            return venta.id;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async obtenerVentaPorId(id) {
        const resultado = await this.ejecutar(`
            SELECT v.id, v.asesor_id, v.cliente_id, v.valor, v.recaudo,
                   TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                   v.observacion, v.estado, TO_CHAR(v.creado, 'YYYY-MM-DD HH24:MI:SS') AS creado,
                   a.nombre AS asesor_nombre
            FROM ventas v INNER JOIN asesores a ON a.id = v.asesor_id
            WHERE v.id = ? LIMIT 1
        `, [id]);
        return resultado.length ? resultado[0] : null;
    }

    async obtenerVentasDelDia(asesorId = null) {
        return this.ejecutar(`
            SELECT v.id, v.asesor_id, v.cliente_id, v.valor, v.recaudo,
                   TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                   v.observacion, v.estado, a.nombre AS asesor_nombre
            FROM ventas v INNER JOIN asesores a ON a.id = v.asesor_id
            WHERE v.fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
              AND v.fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
              AND (?::integer IS NULL OR v.asesor_id = ?::integer)
            ORDER BY v.fecha_hora DESC, v.id DESC LIMIT 1000
        `, [asesorId, asesorId]);
    }

    async obtenerVentasPorAsesor(asesorId) {
        return this.ejecutar(`
            SELECT v.id, v.asesor_id, v.cliente_id, v.valor, v.recaudo,
                   TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                   v.observacion, v.estado, a.nombre AS asesor_nombre
            FROM ventas v INNER JOIN asesores a ON a.id = v.asesor_id
            WHERE v.asesor_id = ? ORDER BY v.fecha_hora DESC, v.id DESC LIMIT 2000
        `, [asesorId]);
    }

    async listarVentasAdmin(fechaDesde, fechaHasta, asesorId = null, clienteId = "", estado = "TODAS") {
        const estados = ["ACTIVA", "ANULADA"];
        const estadoFiltro = estados.includes(estado) ? estado : null;
        return this.ejecutar(`
            SELECT v.id, v.asesor_id, v.cliente_id, v.valor, v.recaudo,
                   TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                   v.observacion, v.estado, a.nombre AS asesor_nombre
            FROM ventas v INNER JOIN asesores a ON a.id = v.asesor_id
            WHERE v.fecha_hora >= ?::date
              AND v.fecha_hora < (?::date + INTERVAL '1 day')
              AND (?::integer IS NULL OR v.asesor_id = ?::integer)
              AND (?::text IS NULL OR v.estado = ?::text)
              AND (?::text = '' OR v.cliente_id::text ILIKE ?::text)
            ORDER BY v.fecha_hora DESC, v.id DESC
            LIMIT 2000
        `, [fechaDesde, fechaHasta, asesorId, asesorId, estadoFiltro, estadoFiltro, clienteId ? `%${clienteId}%` : "", clienteId ? `%${clienteId}%` : ""]);
    }

    async actualizarVentaAdmin(id, cambios, usuarioId, motivo) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const actual = await client.query(`
                SELECT id, asesor_id, cliente_id, valor, recaudo, observacion, estado
                FROM ventas WHERE id = $1 FOR UPDATE
            `, [id]);
            if (!actual.rows[0]) { const e = new Error("La venta no existe."); e.status = 404; throw e; }
            if (actual.rows[0].estado !== "ACTIVA") { const e = new Error("Solo se pueden corregir ventas activas."); e.status = 409; throw e; }
            const anterior = actual.rows[0];
            const nuevo = {
                asesor_id: cambios.asesor_id,
                cliente_id: cambios.cliente_id,
                valor: cambios.valor,
                recaudo: cambios.recaudo,
                observacion: cambios.observacion
            };
            const actualizado = await client.query(`
                UPDATE ventas
                SET asesor_id = $1, cliente_id = $2, valor = $3, recaudo = $4, observacion = $5
                WHERE id = $6
                RETURNING id, asesor_id, cliente_id, valor, recaudo, observacion, estado
            `, [nuevo.asesor_id, nuevo.cliente_id, nuevo.valor, nuevo.recaudo, nuevo.observacion, id]);
            await client.query(`
                INSERT INTO ventas_cambios_auditoria
                    (venta_id, accion, datos_anteriores, datos_nuevos, motivo, cambiado_por)
                VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
            `, [id, cambios.accion || "EDICION", JSON.stringify(anterior), JSON.stringify(actualizado.rows[0]), motivo, usuarioId || null]);
            await client.query("COMMIT");
            return actualizado.rows[0];
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally { client.release(); }
    }

    async obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, criterio = "RECAUDO", asesorId = null) {
        return this.ejecutar(`
            SELECT a.id AS asesor_id, a.nombre AS asesor_nombre, COUNT(v.id) AS cantidad_ventas,
                   COALESCE(SUM(v.valor), 0) AS total_vendido, COALESCE(SUM(v.recaudo), 0) AS total_recaudo
            FROM asesores a LEFT JOIN ventas v ON v.asesor_id = a.id
                AND v.estado = 'ACTIVA' AND v.fecha_hora >= ?::date
                AND v.fecha_hora < (?::date + INTERVAL '1 day')
            WHERE a.activo = 1 AND (?::integer IS NULL OR a.id = ?::integer)
            GROUP BY a.id, a.nombre
            ORDER BY CASE WHEN ? = 'RECAUDO' THEN COALESCE(SUM(v.recaudo), 0) ELSE 0 END DESC,
                     CASE WHEN ? = 'VALOR_VENDIDO' THEN COALESCE(SUM(v.valor), 0) ELSE 0 END DESC,
                     CASE WHEN ? = 'CANTIDAD_VENTAS' THEN COUNT(v.id) ELSE 0 END DESC,
                     COALESCE(SUM(v.valor), 0) DESC, a.nombre ASC LIMIT 1000
        `, [fechaDesde, fechaHasta, asesorId, asesorId, criterio, criterio, criterio]);
    }

    async obtenerMejorAsesorPeriodo(fechaDesde, fechaHasta) {
        await asegurarColumnaGeneroAsesores();
        const filas = await this.ejecutar(`
            SELECT a.id AS asesor_id, a.nombre AS asesor_nombre, a.genero,
                   COUNT(v.id) AS cantidad_ventas,
                   COALESCE(SUM(v.valor), 0) AS total_vendido,
                   COALESCE(SUM(v.recaudo), 0) AS total_recaudo
            FROM asesores a
            LEFT JOIN ventas v ON v.asesor_id = a.id
                AND v.estado = 'ACTIVA'
                AND v.fecha_hora >= ?::date
                AND v.fecha_hora < (?::date + INTERVAL '1 day')
            WHERE a.activo = 1
            GROUP BY a.id, a.nombre, a.genero
            HAVING COUNT(v.id) > 0
            ORDER BY COUNT(v.id) DESC,
                     COALESCE(SUM(v.recaudo), 0) DESC,
                     COALESCE(SUM(v.valor), 0) DESC,
                     a.nombre ASC,
                     a.id ASC
            LIMIT 1
        `, [fechaDesde, fechaHasta]);
        return filas[0] || null;
    }

    async anularVenta(id, usuario = null, motivo) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const actual = await client.query(`
                SELECT id, asesor_id, cliente_id, valor, recaudo, fecha_hora, observacion, estado
                FROM ventas WHERE id = $1 FOR UPDATE
            `, [id]);
            if (!actual.rows[0]) {
                const error = new Error("La venta no existe."); error.status = 404; throw error;
            }
            const ventaActual = actual.rows[0];
            if (ventaActual.estado !== "ACTIVA") {
                const error = new Error("La venta ya está anulada."); error.status = 409; throw error;
            }
            const esAdministrador = usuario?.rol === "ADMINISTRADOR";
            const asesorUsuario = Number(usuario?.asesor_id);
            if (!esAdministrador && (!Number.isInteger(asesorUsuario) || asesorUsuario !== Number(ventaActual.asesor_id))) {
                const error = new Error("No tiene permiso para anular ventas de otro asesor."); error.status = 403; throw error;
            }
            const result = await client.query(`
                UPDATE ventas SET estado = 'ANULADA'
                WHERE id = $1 AND estado = 'ACTIVA'
                  AND ($2::boolean IS TRUE OR asesor_id = $3::integer)
                RETURNING id, asesor_id, cliente_id, valor, recaudo, estado
            `, [id, esAdministrador, Number.isInteger(asesorUsuario) ? asesorUsuario : null]);
            if (!result.rows[0]) { const error = new Error("La venta no existe o ya está anulada."); error.status = 409; throw error; }
            const venta = result.rows[0];
            await client.query(`INSERT INTO ventas_anulaciones_auditoria
                (venta_id, asesor_id, cliente_id, valor, recaudo, motivo, anulado_por)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`, [venta.id, venta.asesor_id, venta.cliente_id, venta.valor, venta.recaudo, motivo, usuario?.id || null]);
            await client.query(`INSERT INTO ventas_cambios_auditoria
                (venta_id, accion, datos_anteriores, datos_nuevos, motivo, cambiado_por)
                VALUES ($1, 'ANULACION', $2::jsonb, $3::jsonb, $4, $5)`, [venta.id, JSON.stringify(venta), JSON.stringify({ ...venta, estado: "ANULADA" }), motivo, usuario?.id || null]);
            await client.query("COMMIT");
            return true;
        } catch (error) { await client.query("ROLLBACK"); throw error; }
        finally { client.release(); }
    }

    async obtenerResumenVentasDelDia(asesorId = null) {
        const resultado = await this.ejecutar(`
            SELECT COUNT(*) AS cantidad_ventas, COALESCE(SUM(valor), 0) AS total_vendido,
                   COALESCE(SUM(recaudo), 0) AS total_recaudo FROM ventas
            WHERE estado = 'ACTIVA' AND fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
              AND fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
              AND (?::integer IS NULL OR asesor_id = ?::integer)
        `, [asesorId, asesorId]);
        return resultado[0] || { cantidad_ventas: 0, total_vendido: 0, total_recaudo: 0 };
    }

    async obtenerResumenVentasPorAsesor(asesorId = null) {
        return this.ejecutar(`
            SELECT a.id AS asesor_id, a.nombre AS asesor_nombre, COUNT(v.id) AS cantidad_ventas,
                   COALESCE(SUM(v.valor), 0) AS total_vendido, COALESCE(SUM(v.recaudo), 0) AS total_recaudo
            FROM asesores a LEFT JOIN ventas v ON v.asesor_id = a.id AND v.estado = 'ACTIVA'
              AND v.fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
              AND v.fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
            WHERE a.activo = 1 AND (?::integer IS NULL OR a.id = ?::integer)
            GROUP BY a.id, a.nombre ORDER BY total_vendido DESC, cantidad_ventas DESC LIMIT 1000
        `, [asesorId, asesorId]);
    }
}
module.exports = new VentasRepository();
