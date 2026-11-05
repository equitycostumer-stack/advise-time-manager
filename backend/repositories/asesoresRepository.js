const db = require("../config/db");
const { asegurarColumnaGeneroAsesores } = require("../migrations/asesoresGenero");

class AsesoresRepository {
    async ejecutar(sql, parametros = []) {
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);
            if (resultado.rows) return resultado.rows;
            return resultado;
        } catch (error) {
            console.error("❌ Error ejecutando SQL en PostgreSQL (Asesores):", error);
            throw error;
        }
    }

    async obtenerActivos() {
        const sql = `
            SELECT id, nombre, activo
            FROM asesores
            WHERE activo = 1
            ORDER BY nombre ASC
        `;
        return this.ejecutar(sql);
    }

    async obtenerActivosParaAdministracion() {
        await asegurarColumnaGeneroAsesores();
        return this.ejecutar(`
            SELECT id, nombre, activo, genero
            FROM asesores
            WHERE activo = 1
            ORDER BY nombre ASC
        `);
    }

    async actualizarGenero(id, genero) {
        await asegurarColumnaGeneroAsesores();
        const filas = await this.ejecutar(`
            UPDATE asesores
            SET genero = ?
            WHERE id = ?
            RETURNING id, nombre, activo, genero
        `, [genero, id]);
        return filas[0] || null;
    }
}

module.exports = new AsesoresRepository();
