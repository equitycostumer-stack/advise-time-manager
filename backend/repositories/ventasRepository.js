// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Ventas Repository (PostgreSQL / Supabase)
// ======================================================

const db = require("../config/db");

class VentasRepository {

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
            console.error("❌ Error ejecutando SQL en PostgreSQL (Ventas):", error);
            throw error;
        }
    }

    // ==================================================
    // CREAR VENTA
    // ==================================================

    async crearVenta(
        asesorId,
        clienteId,
        valor,
        fechaHora,
        observacion = null
    ) {
        const sql = `
            INSERT INTO ventas (
                asesor_id,
                cliente_id,
                valor,
                fecha_hora,
                observacion,
                estado
            )
            VALUES (?, ?, ?, ?, ?, 'ACTIVA')
            RETURNING id
        `;

        const filas = await this.ejecutar(sql, [
            asesorId,
            clienteId,
            valor,
            fechaHora,
            observacion
        ]);

        return filas[0].id;
    }

    // ==================================================
    // OBTENER VENTA POR ID
    // ==================================================

    async obtenerVentaPorId(id) {
        const sql = `
            SELECT
                v.id,
                v.asesor_id,
                v.cliente_id,
                v.valor,
                TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                v.observacion,
                v.estado,
                TO_CHAR(v.creado, 'YYYY-MM-DD HH24:MI:SS') AS creado,
                a.nombre AS asesor_nombre
            FROM ventas v
            INNER JOIN asesores a
                ON a.id = v.asesor_id
            WHERE v.id = ?
            LIMIT 1
        `;

        const resultado = await this.ejecutar(sql, [id]);

        return resultado.length ? resultado[0] : null;
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
                v.cliente_id,
                v.valor,
                TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
                v.observacion,
                v.estado,
                a.nombre AS asesor_nombre
            FROM ventas v
            INNER JOIN asesores a
                ON a.id = v.asesor_id
            WHERE
                v.fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
                AND v.fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
            ORDER BY
                v.fecha_hora DESC,
                v.id DESC
        `;

        return await this.ejecutar(sql);
    }

    // ==================================================
    // OBTENER VENTAS DE UN ASESOR
    // ==================================================

    async obtenerVentasPorAsesor(asesorId) {
        const sql = `
            SELECT
                v.id,
                v.asesor_id,
                v.cliente_id,
                v.valor,
                TO_CHAR(v.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
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

        return await this.ejecutar(sql, [asesorId]);
    }

    // ==================================================
    // ANULAR VENTA
    // ==================================================

    async anularVenta(id) {
        const sql = `
            UPDATE ventas
            SET estado = 'ANULADA'
            WHERE
                id = ?
                AND estado = 'ACTIVA'
        `;

        await this.ejecutar(sql, [id]);
        return true;
    }

    // ==================================================
    // RESUMEN DE VENTAS DEL DÍA
    // ==================================================

    async obtenerResumenVentasDelDia() {
        const sql = `
            SELECT
                COUNT(*) AS cantidad_ventas,
                COALESCE(SUM(valor), 0) AS total_vendido
            FROM ventas
            WHERE
                estado = 'ACTIVA'
                AND fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
                AND fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
        `;

        const resultado = await this.ejecutar(sql);

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
                COALESCE(SUM(v.valor), 0) AS total_vendido
            FROM asesores a
            LEFT JOIN ventas v
                ON v.asesor_id = a.id
                AND v.estado = 'ACTIVA'
                AND v.fecha_hora >= (NOW() AT TIME ZONE 'America/Bogota')::date
                AND v.fecha_hora < (NOW() AT TIME ZONE 'America/Bogota')::date + INTERVAL '1 day'
            WHERE
                a.activo = true
            GROUP BY
                a.id,
                a.nombre
            ORDER BY
                total_vendido DESC,
                cantidad_ventas DESC
        `;

        return await this.ejecutar(sql);
    }

}

// ======================================================
// EXPORTAR
// ======================================================

module.exports = new VentasRepository();