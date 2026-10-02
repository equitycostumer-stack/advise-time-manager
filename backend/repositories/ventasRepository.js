// ======================================================
// ADVISE SOLUTIONS SERVICES - Ventas Repository
// ======================================================
const db = require("../config/db");

class VentasRepository {
    async ejecutar(sql, parametros = []) {
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);
        try {
            const resultado = await db.query(sqlPostgres, parametros);
            return resultado.rows || resultado;
        } catch (error) {
            console.error("Error ejecutando SQL en PostgreSQL (Ventas):", error.code || error.message);
            throw error;
        }
    }

    async crearVenta(asesorId, clienteId, valor, recaudo, fechaHora, observacion = null) {
        const filas = await this.ejecutar(`
            INSERT INTO ventas (asesor_id, cliente_id, valor, recaudo, fecha_hora, observacion, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVA') RETURNING id
        `, [asesorId, clienteId, valor, recaudo, fechaHora, observacion]);
        return filas[0].id;
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
            ORDER BY v.fecha_hora DESC, v.id DESC
            LIMIT 1000
        `, [asesorId, asesorId]);
    }

    async obtenerVentasPorAsesor(asesorId) {
        return this.ejecutar(`
            SELECT v.id, v.asesor_id, v.cliente_id, v.valor, v.recaudo,
                   TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                   v.observacion, v.estado, a.nombre AS asesor_nombre
            FROM ventas v INNER JOIN asesores a ON a.id = v.asesor_id
            WHERE v.asesor_id = ?
            ORDER BY v.fecha_hora DESC, v.id DESC
            LIMIT 2000
        `, [asesorId]);
    }

    async obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, criterio = "RECAUDO", asesorId = null) {
        return this.ejecutar(`
            SELECT a.id AS asesor_id, a.nombre AS asesor_nombre,
                   COUNT(v.id) AS cantidad_ventas,
                   COALESCE(SUM(v.valor), 0) AS total_vendido,
                   COALESCE(SUM(v.recaudo), 0) AS total_recaudo
            FROM asesores a
            LEFT JOIN ventas v ON v.asesor_id = a.id
                AND v.estado = 'ACTIVA'
                AND v.fecha_hora >= ?::date
                AND v.fecha_hora < (?::date + INTERVAL '1 day')
            WHERE a.activo = 1
              AND (?::integer IS NULL OR a.id = ?::integer)
            GROUP BY a.id, a.nombre
            ORDER BY
                CASE WHEN ? = 'RECAUDO' THEN COALESCE(SUM(v.recaudo), 0) ELSE 0 END DESC,
                CASE WHEN ? = 'VALOR_VENDIDO' THEN COALESCE(SUM(v.valor), 0) ELSE 0 END DESC,
                CASE WHEN ? = 'CANTIDAD_VENTAS' THEN COUNT(v.id) ELSE 0 END DESC,
                COALESCE(SUM(v.valor), 0) DESC, a.nombre ASC
            LIMIT 1000
        `, [fechaDesde, fechaHasta, asesorId, asesorId, criterio, criterio, criterio]);
    }

    async anularVenta(id, usuario = null, motivo) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query(`
                UPDATE ventas SET estado = 'ANULADA'
                WHERE id = $1 AND estado = 'ACTIVA'
                RETURNING id, asesor_id, cliente_id, valor, recaudo, estado
            `, [id]);
            if (!result.rows[0]) {
                const error = new Error("La venta no existe o ya está anulada."); error.status = 409; throw error;
            }
            const venta = result.rows[0];
            await client.query(`
                INSERT INTO ventas_anulaciones_auditoria
                    (venta_id, asesor_id, cliente_id, valor, recaudo, motivo, anulado_por)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [venta.id, venta.asesor_id, venta.cliente_id, venta.valor, venta.recaudo, motivo, usuario?.id || null]);
            await client.query("COMMIT");
            return true;
        } catch (error) {
            await client.query("ROLLBACK"); throw error;
        } finally { client.release(); }
    }

    async obtenerResumenVentasDelDia(asesorId = null) {
        const resultado = await this.ejecutar(`
            SELECT COUNT(*) AS cantidad_ventas,
                   COALESCE(SUM(valor), 0) AS total_vendido,
                   COALESCE(SUM(recaudo), 0) AS total_recaudo
            FROM ventas
            WHERE estado = 'ACTIVA'
              AND fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
              AND fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
              AND (?::integer IS NULL OR asesor_id = ?::integer)
        `, [asesorId, asesorId]);
        return resultado[0] || { cantidad_ventas: 0, total_vendido: 0, total_recaudo: 0 };
    }

    async obtenerResumenVentasPorAsesor(asesorId = null) {
        return this.ejecutar(`
            SELECT a.id AS asesor_id, a.nombre AS asesor_nombre,
                   COUNT(v.id) AS cantidad_ventas,
                   COALESCE(SUM(v.valor), 0) AS total_vendido,
                   COALESCE(SUM(v.recaudo), 0) AS total_recaudo
            FROM asesores a
            LEFT JOIN ventas v ON v.asesor_id = a.id
                AND v.estado = 'ACTIVA'
                AND v.fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
                AND v.fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
            WHERE a.activo = 1
              AND (?::integer IS NULL OR a.id = ?::integer)
            GROUP BY a.id, a.nombre
            ORDER BY total_vendido DESC, cantidad_ventas DESC
            LIMIT 1000
        `, [asesorId, asesorId]);
    }
}
module.exports = new VentasRepository();
