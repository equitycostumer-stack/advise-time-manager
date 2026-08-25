// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Horarios Repository (PostgreSQL / Supabase)
// ======================================================

const db = require("../config/db");

class HorariosRepository {

    // ======================================================
    // EJECUTAR CONSULTA POSTGRESQL
    // ======================================================

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
            console.error("❌ Error ejecutando SQL en PostgreSQL (Horarios):", error);
            throw error;
        }
    }

    // ======================================================
    // OBTENER HORARIO DEL DÍA
    // ======================================================

    async obtenerHorarioDia(diaSemana) {
        const sql = `
            SELECT
                id,
                dia_semana,
                hora_entrada,
                hora_salida,
                minutos_break,
                minutos_almuerzo,
                activo
            FROM horarios
            WHERE
                dia_semana = ?
                AND activo = true
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [diaSemana]);

        return filas.length ? filas[0] : null;
    }

}

module.exports = new HorariosRepository();