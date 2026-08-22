const db = require("../config/db");

// ==============================================
// REGISTRAR INCIDENCIA
// ==============================================

// ==============================================
// GENERAR FECHA EN HORA COLOMBIA
// (mismo patrón ya validado en insertarMovimiento()
// y en ventasService.generarFechaColombia())
// ==============================================

function generarFechaColombia() {

    return new Intl.DateTimeFormat(
        "sv-SE",
        {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    )
        .format(new Date())
        .replace(",", "");

}

const registrarIncidencia = (
    asesorId,
    tipo,
    nivel,
    detalle
) => {

    const fechaHora = generarFechaColombia();

    // Primero revisar si ya existe una incidencia igual SIN revisar
    // (comparamos contra la fecha de HOY en Colombia, no CURDATE()
    // del servidor, que está en UTC)

    const verificar = `
    SELECT id
    FROM incidencias
    WHERE asesor_id = ?
    AND tipo = ?
    AND revisada = 0
    AND DATE(fecha_hora) = DATE(?)
    LIMIT 1
`;

    db.query(
    verificar,
    [asesorId, tipo, fechaHora],
    (err, rows) => {

        if (err) {

            console.error(err);

            return;

        }

        // Ya existe

        if (rows.length > 0) {

            return;

        }

        // Registrar

        const sql = `
            INSERT INTO incidencias
            (
                asesor_id,
                tipo,
                nivel,
                detalle,
                fecha_hora
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(

            sql,

            [
                asesorId,
                tipo,
                nivel,
                detalle,
                fechaHora
            ],

            (err) => {

                if (err) {

                    console.error(err);

                }

            }

        );

    });

};

// ==============================================
// REVISAR INCIDENCIA
// ==============================================

const revisarIncidencia = (req, res) => {

    const { id } = req.params;

    const {

        coach,

        comentario

    } = req.body;

    const sql = `
        UPDATE incidencias
        SET

            revisada = 1,

            revisada_por = ?,

            comentario = ?,

            fecha_revision = NOW()

        WHERE id = ?
    `;

    db.query(

        sql,

        [

            coach,

            comentario,

            id

        ],

        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    ok: false,

                    error: "No fue posible revisar la incidencia."

                });

            }

            res.json({

                ok: true,

                mensaje: "Incidencia revisada correctamente."

            });

        }

    );

};

module.exports = {

    registrarIncidencia,

    revisarIncidencia

};