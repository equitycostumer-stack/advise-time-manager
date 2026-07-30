const db = require("../config/db");

// ==============================================
// REGISTRAR INCIDENCIA
// ==============================================

const registrarIncidencia = (
    asesorId,
    tipo,
    nivel,
    detalle
) => {

    // Primero revisar si ya existe una incidencia igual SIN revisar

    const verificar = `
        SELECT id
        FROM incidencias
        WHERE asesor_id = ?
        AND tipo = ?
        AND revisada = 0
        LIMIT 1
    `;

    db.query(verificar, [asesorId, tipo], (err, rows) => {

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
                detalle
            )
            VALUES (?, ?, ?, ?)
        `;

        db.query(

            sql,

            [
                asesorId,
                tipo,
                nivel,
                detalle
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