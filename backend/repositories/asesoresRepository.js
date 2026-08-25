const db = require("../config/db");

class AsesoresRepository {

    async ejecutar(sql, parametros = []) {
        // Convertir signos '?' de MySQL a '$1, $2, $3...' de PostgreSQL
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);

            // Retornar las filas si la consulta devuelve un conjunto de datos
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
        const sql = `
            SELECT
                id,
                nombre
            FROM asesores
            WHERE activo = true
            ORDER BY nombre ASC
        `;

        return await this.ejecutar(sql);
    }

}

module.exports = new AsesoresRepository();