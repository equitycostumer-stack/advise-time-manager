const db = require("../config/db");

class HorariosRepository {

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
                AND activo = 1

            LIMIT 1

        `;

        return new Promise((resolve, reject) => {

            db.query(
                sql,
                [diaSemana],
                (error, filas) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(
                        filas.length
                            ? filas[0]
                            : null
                    );

                }
            );

        });

    }

}

module.exports =
    new HorariosRepository();