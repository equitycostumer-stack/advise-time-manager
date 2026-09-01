const db = require("../config/db");

class AsesoresRepository {

    async ejecutar(sql, parametros = []) {
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);
            if (resultado.rows) {
                return resultado.rows;
            }
            return resultado;
        } catch (error) {
            console.error("❌ Error ejecutando SQL en PostgreSQL (Asesores):", error);
            throw error;
        }
    }

    async obtenerActivos() {
        // Consulta simplificada para evitar errores de columnas faltantes
        const sql = `
    SELECT
        id,
        nombre,
        activo
    FROM asesores
    WHERE activo = 1
    ORDER BY nombre ASC
`;

        try {
            return await this.ejecutar(sql);
        } catch (error) {
            console.error("❌ Detalle exacto en obtenerActivos:", error.message);
            throw error;
        }
    }

    async actualizarNombre(id, nombre) {
        const sql = `
            UPDATE asesores
            SET nombre = ?
            WHERE id = ?
            RETURNING id, nombre, activo
        `;
        const filas = await this.ejecutar(sql, [nombre, id]);
        return filas[0] || null;
    }

}

module.exports = new AsesoresRepository();
