const db = require("../config/db");

class NotificacionesRepository {

    async ejecutar(sql, parametros = []) {
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);
            return resultado.rows || resultado;
        } catch (error) {
            console.error("❌ Error ejecutando SQL en PostgreSQL (Notificaciones):", error);
            throw error;
        }
    }

    async crear(asesorId, titulo, mensaje, tipo = "GENERAL") {
        const sql = `
            INSERT INTO notificaciones (asesor_id, titulo, mensaje, tipo)
            VALUES (?, ?, ?, ?)
        `;
        return await this.ejecutar(sql, [asesorId, titulo, mensaje, tipo]);
    }

    async obtenerPorAsesor(asesorId) {
        const sql = `
            SELECT id, titulo, mensaje, tipo, leida, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora
            FROM notificaciones
            WHERE asesor_id = ?
            ORDER BY fecha_hora DESC
            LIMIT 20
        `;
        return await this.ejecutar(sql, [asesorId]);
    }

    async marcarLeida(id, asesorId) {
        const sql = `
            UPDATE notificaciones
            SET leida = true
            WHERE id = ? AND asesor_id = ?
        `;
        return await this.ejecutar(sql, [id, asesorId]);
    }

    async marcarTodasLeidas(asesorId) {
        const sql = `
            UPDATE notificaciones
            SET leida = true
            WHERE asesor_id = ? AND leida = false
        `;
        return await this.ejecutar(sql, [asesorId]);
    }

}

module.exports = new NotificacionesRepository();