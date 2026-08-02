const db = require("../config/db");

class AsesoresRepository {

    ejecutar(sql, parametros = []) {

        return new Promise((resolve, reject) => {

            db.query(sql, parametros, (error, resultado) => {

                if (error) {
                    return reject(error);
                }

                resolve(resultado);

            });

        });

    }

    async obtenerActivos() {

        const sql = `
            SELECT
                id,
                nombre
            FROM asesores
            WHERE activo = 1
            ORDER BY nombre ASC
        `;

        return await this.ejecutar(sql);

    }

}

module.exports = new AsesoresRepository();