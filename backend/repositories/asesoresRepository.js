const db = require("../config/db");
const { asegurarColumnaGeneroAsesores } = require("../migrations/asesoresGenero");
const { asegurarColumnaFotoAsesores } = require("../migrations/asesoresFoto");

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
        await asegurarColumnaFotoAsesores();
        return this.ejecutar(`
            SELECT id, nombre, activo, genero, foto_data
            FROM asesores
            WHERE activo = 1
            ORDER BY nombre ASC
        `);
    }

    async obtenerFotosActivos() {
        await asegurarColumnaFotoAsesores();
        return this.ejecutar(`
            SELECT id, foto_data
            FROM asesores
            WHERE activo = 1 AND foto_data IS NOT NULL
            ORDER BY id ASC
        `);
    }

    async actualizarFoto(id, fotoData) {
        await asegurarColumnaFotoAsesores();
        const filas = await this.ejecutar(`
            UPDATE asesores
            SET foto_data = ?
            WHERE id = ?
            RETURNING id, nombre, activo, foto_data
        `, [fotoData, id]);
        return filas[0] || null;
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
